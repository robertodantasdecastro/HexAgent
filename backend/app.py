"""
HexAgentGUI Backend - Flask Application Factory
HexAgentGUI Backend - Fábrica de Aplicação Flask

Main application factory for creating and configuring the Flask app
with AgentCore integration and all controllers registered as blueprints.

Fábrica principal da aplicação para criar e configurar a app Flask
com integração Agent Core e todos os controladores registrados como blueprints.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (AgentCore Integration)
"""


from flask import Flask, jsonify
from flask_cors import CORS
import logging
import sys
import os
import json
from pathlib import Path

# Import all controllers / Importar todos os controladores
from controllers.config_controller import ConfigController
from controllers.system_controller import SystemController
from controllers.chat_controller import ChatController
from controllers.session_controller import SessionController
from controllers.file_controller import FileController
from controllers.service_controller import ServiceController
from controllers.history_controller import HistoryController
from controllers.project_controller import ProjectController
from controllers.workflow_controller import WorkflowController
from controllers.profile_controller import ProfileController  # Import Profile Controller
from controllers.mcp_controller import MCPController


def create_app(core_ref=None, hexstrike_ref=None):
    """
    Create and configure Flask application with AgentCore integration
    Cria e configura aplicação Flask com integração AgentCore
    
    Args:
        core_ref: Reference to AgentCore instance (if None, will try to initialize)
                 Referência à instância AgentCore (se None, tentará inicializar)
        hexstrike_ref: DEPRECATED - Use AgentCore.hexstrike instead
                      DEPRECATED - Use AgentCore.hexstrike no lugar
    
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
    
    # ========================================================================
    # Initialize AgentCore (HexBrain + HexStrike integration)
    # Inicializa AgentCore (integração HexBrain + HexStrike)
    # ========================================================================
    
    agent_core = core_ref
    
    if agent_core is None:
        try:
            from core.agent_core import AgentCore
            
            app.logger.info("=" * 70)
            app.logger.info("Initializing AgentCore...")
            
            # Load configuration via Services (Single Source of Truth)
            # Carregar configuração via Serviços (Fonte Única da Verdade)
            from services.ai_config_service import AIConfigService
            ai_service = AIConfigService()
            ai_config_full = ai_service.load_ai_config()
            ai_config = ai_config_full.get('ai', {})
            
            # Extract credentials and settings
            # Extrair credenciais e configurações
            api_key = ai_config.get('api_key')
            
            # Fallback to environment variable
            if not api_key:
                api_key = os.environ.get('OPENROUTER_API_KEY') or os.environ.get('API_KEY')
                if api_key:
                    app.logger.info("✓ API key loaded from environment variable")
            
            # Load active configuration (flattened and ready)
            # Carregar configuração ativa (achatada e pronta)
            # Load System Config for HexStrike URL
            from services.system_config_service import SystemConfigService
            system_service = SystemConfigService()
            sys_conf = system_service.load_system_config()
            
            # Default to env var if set (docker/container), else config
            hexstrike_url = os.getenv('HEXSTRIKE_URL') or sys_conf.get('services', {}).get('hexstrike_host', 'http://127.0.0.1:8888')
            
            # Formatting correction if needed (ensure http prefix and port)
            if not hexstrike_url.startswith('http'):
                hexstrike_url = f"http://{hexstrike_url}"
             
            # If config has separate host/port, construct it
            if 'services' in sys_conf:
                host = sys_conf['services'].get('hexstrike_host', '127.0.0.1')
                port = sys_conf['services'].get('hexstrike_port', 8888)
                hexstrike_url = f"http://{host}:{port}"
            engine, provider_config = ai_service.get_active_provider_config()
            
            # Check if we can proceed (API key present OR local engine)
            # Verificar se podemos prosseguir (Chave API presente OU motor local)
            # Logic is handled inside get_active_provider_config/validate, but we double check for init
            
            # If provider config is empty/invalid, skip init
            if not engine:
                 app.logger.warning("⚠️  No active engine configured - AgentCore not initialized")
                 agent_core = None
            else:
                # Initialize AgentCore
                # Inicializa AgentCore
                
                # Extract api_key, model from flattened config
                api_key = provider_config.get('api_key')
                model = provider_config.get('model')
                
                # Pass remainder as kwargs
                # provider_config already has host/port etc
                
                agent_core = AgentCore(
                    api_key=api_key,
                    hexstrike_url=hexstrike_url,
                    engine=engine,
                    model=model,
                    provider_kwargs=provider_config 
                )

                # Initialize Profile Service (Personalization)
                try:
                    from services.profile_service import ProfileService
                    profile_service = ProfileService()
                    
                    # Inject Profile Context into AI System Prompt
                    # Injetar Contexto de Perfil no Prompt de Sistema da IA
                    profile_context = profile_service.get_system_prompt_context()
                    
                    if profile_context:
                        app.logger.info("Injecting User Profile Context into AgentCore")
                        # We append it to the base system prompt via provider
                        # Adicionamos ao prompt de sistema base via provedor
                        # Note: This depends on the Provider implementation allowing prompt updates
                        # or we pass it during chat_step as a system message override
                        # For now, we assume simple appendage if supported, or logic in AgentCore
                        agent_core.set_profile_context(profile_context)

                except Exception as e:
                    app.logger.warning(f"Failed to load User Profile: {e}")

                
                app.logger.info("✅ AgentCore initialized successfully")
                app.logger.info(f"   - AI Engine: {agent_core.engine}")
                app.logger.info(f"   - AI Provider: {agent_core.provider.get_provider_name()}")
                app.logger.info(f"   - AI Model: {agent_core.provider.get_default_model()}")
                app.logger.info(f"   - HexStrike: {'✓ Available' if agent_core.hexstrike_available else '✗ Unavailable'}")

                
        except ImportError as e:
            app.logger.error(f"Failed to import AgentCore modules: {e}")
            agent_core = None
        except Exception as e:
            app.logger.error(f"Failed to initialize AgentCore: {e}", exc_info=False)
            agent_core = None
    
    # ========================================================================
    # Initialize controllers with AgentCore reference
    # Inicializa controladores com referência AgentCore
    # ========================================================================
    
    controllers = [
        ConfigController(core_ref=agent_core),
        SystemController(core_ref=agent_core, hexstrike_ref=None),
        ChatController(core_ref=agent_core),  # AgentCore integration!
        SessionController(),
        FileController(),
        ServiceController(hexstrike_ref=None),
        HistoryController(),
        ProjectController(),
        WorkflowController(core_ref=agent_core),
        ProfileController(),  # Personalization API
        MCPController()      # MCP Registry API
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
            "error": "Internal server error"
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
    
    # Health check endpoint / Endpoint de verificação de saúde
    @app.route('/health', methods=['GET'])
    def health_check():
        """
        Application health check with AgentCore status
        Verificação de saúde da aplicação com status do AgentCore
        """
        health = {
            "status": "healthy",
            "components": {
                "flask": "ok"
            }
        }
        
        # Add AgentCore health if available
        # Adiciona saúde do AgentCore se disponível
        if agent_core:
            try:
                agent_health = agent_core.health_check()
                health["components"]["agent_core"] = agent_health
                
                if agent_health.get("overall") != "healthy":
                    health["status"] = "degraded"
            except Exception as e:
                health["components"]["agent_core"] = {"status": "error", "error": str(e)}
                health["status"] = "degraded"
        else:
            health["components"]["agent_core"] = "not_initialized"
            health["status"] = "degraded"
        
        status_code = 200 if health["status"] == "healthy" else 503
        return jsonify(health), status_code
    
    # Root endpoint with API info / Endpoint raiz com info da API
    @app.route('/')
    def root():
        """Root endpoint with API info / Endpoint raiz com info da API"""
        return jsonify({
            "name": "HexAgentGUI Backend",
            "version": "2.0.0",
            "status": "operational",
            "architecture": "OOP with Flask Blueprints + AgentCore",
            "controllers": len(controllers),
            "agent_core": agent_core is not None
        })
    
    app.logger.info("=" * 70)
    app.logger.info("HexAgentGUI Backend v2.0.0 - AgentCore Architecture")
    app.logger.info(f"Registered {len(controllers)} controllers")
    app.logger.info(f"AgentCore: {'✓ Enabled' if agent_core else '✗ Disabled (standalone mode)'}")
    app.logger.info("=" * 70)
    
    return app


if __name__ == '__main__':
    """
    Main entry point / Ponto de entrada principal
    Run Flask development server / Executar servidor de desenvolvimento Flask
    """
    # Check for setup-only mode (used by install.sh)
    # Verifica modo setup-only (usado por install.sh)
    if os.environ.get('HEXAGENT_SETUP_ONLY'):
        print("[Setup] Initializing configuration...")
        app = create_app()
        print("[Setup] Configuration initialized. Exiting setup mode.")
        sys.exit(0)

    # Start Parent PID Watchdog / Iniciar monitoramento do processo pai
    # This prevents orphaned python processes if Electron crashes
    try:
        import threading
        import time
        import psutil
        
        def parent_watchdog():
            ppid = os.getppid()
            print(f"[Watchdog] Monitoring parent process {ppid}")
            while True:
                try:
                    # Check if parent is alive / Verificar se pai está vivo
                    if not psutil.pid_exists(ppid):
                        print("[Watchdog] Parent process died. Exiting...")
                        os._exit(0)
                    
                    # Check for adoption by init (PID 1) - Linux specific
                    # Verificar adoção pelo init (PID 1) - Específico Linux
                    current_ppid = os.getppid()
                    if current_ppid != ppid and current_ppid == 1:
                        print("[Watchdog] Process orphaned (adopted by init). Exiting...")
                        os._exit(0)
                        
                    time.sleep(2)
                except Exception as e:
                    print(f"[Watchdog] Error: {e}")
                    time.sleep(5)

        # Start daemon thread / Iniciar thread daemon
        if not os.environ.get('HEXAGENT_SETUP_ONLY'):
            t = threading.Thread(target=parent_watchdog, daemon=True)
            t.start()
            
    except ImportError:
        print("[Watchdog] psutil not found. Process monitoring disabled.")

    app = create_app()
    app.run(
        host='127.0.0.1',  # Localhost only / Somente local (Firewall Security)
        port=5000,
        debug=False,
        threaded=True
    )
