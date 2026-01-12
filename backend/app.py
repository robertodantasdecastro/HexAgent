"""
HexAgentGUI Backend - Flask Application Factory
HexAgentGUI Backend - Fá

brica de Aplicação Flask

Main application factory for creating and configuring the Flask app
with all controllers registered as blueprints.

Fábrica principal da aplicação para criar e configurar a app Flask
com todos os controladores registrados como blueprints.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (OOP Refactored)
"""

from flask import Flask, jsonify
from flask_cors import CORS
import logging
import sys
import os

# Import all controllers / Importar todos os controladores
from controllers.config_controller import ConfigController
from controllers.system_controller import SystemController
from controllers.chat_controller import ChatController
from controllers.session_controller import SessionController
from controllers.file_controller import FileController
from controllers.service_controller import ServiceController
from controllers.history_controller import HistoryController
from controllers.project_controller import ProjectController


def create_app(core_ref=None, hexstrike_ref=None):
    """
    Create and configure Flask application
    Cria e configura aplicação Flask
    
    Args:
        core_ref: Reference to AgentCore instance (if available)
                 Referência à instância AgentCore (se disponível)
        hexstrike_ref: Reference to HexStrike service (if available)
                      Referência ao serviço HexStrike (se disponível)
    
    Returns:
        Configured Flask application / Aplicação Flask configurada
    """
    # Create Flask app / Criar app Flask
    app = Flask(__name__)
    
    # Configure app / Configurar app
    app.config['JSON_SORT_KEYS'] = False
    app.config['JSON_AS_ASCII'] = False
    
    # Enable CORS / Habilitar CORS
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Setup logging / Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='[%(name)s] %(levelname)s: %(message)s',
        stream=sys.stdout
    )
    
    # Initialize controllers with references / Inicializar controladores com referências
    controllers = [
        ConfigController(),
        SystemController(core_ref=core_ref, hexstrike_ref=hexstrike_ref),
        ChatController(core_ref=core_ref),
        SessionController(),
        FileController(),
        ServiceController(hexstrike_ref=hexstrike_ref),
        HistoryController(),
        ProjectController()
    ]
    
    # Register all blueprints / Registrar todos os blueprints
    for controller in controllers:
        app.register_blueprint(controller.blueprint)
        app.logger.info(f"Registered blueprint: {controller.blueprint.name}")
    
    # Global error handlers / Tratadores de erro globais
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors / Trata erros 404"""
        return jsonify({
            "success": False,
            "error": "Endpoint not found",
            "path": error.description
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors / Trata erros 500"""
        app.logger.error(f"Internal error: {error}")
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "message": str(error) if app.debug else "An error occurred"
        }), 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """Handle all uncaught exceptions / Trata todas as exceções não capturadas"""
        app.logger.error(f"Unhandled exception: {error}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Unexpected error occurred",
            "type": type(error).__name__
        }), 500
    
    # Health check at root / Verificação de saúde na raiz
    @app.route('/')
    def root():
        """Root endpoint with API info / Endpoint raiz com info da API"""
        return jsonify({
            "name": "HexAgentGUI Backend",
            "version": "2.0.0",
            "status": "operational",
            "architecture": "OOP with Flask Blueprints",
            "controllers": len(controllers),
            "endpoints": sum(len(c.blueprint.deferred_functions) for c in controllers if hasattr(c, 'blueprint'))
        })
    
    app.logger.info("=" * 70)
    app.logger.info("HexAgentGUI Backend v2.0.0 - OOP Architecture")
    app.logger.info(f"Registered {len(controllers)} controllers")
    app.logger.info(f"Standalone mode: {core_ref is None}")
    app.logger.info("=" * 70)
    
    return app


# Main entry point / Ponto de entrada principal
if __name__ == '__main__':
    # For standalone testing / Para teste standalone
    # In production, core and hexstrike will be initialized externally
    # Em produção, core e hexstrike serão inicializados externamente
    
    app = create_app(core_ref=None, hexstrike_ref=None)
    
    # Get port from environment or default
    # Obtém porta do ambiente ou padrão
    port = int(os.environ.get('FLASK_PORT', 5000))
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    
    print(f"\n🚀 Starting HexAgentGUI Backend (OOP) on {host}:{port}\n")
    
    app.run(
        host=host,
        port=port,
        debug=False,  # DISABLED: prevents auto-reload crashes in production
        threaded=True
    )
