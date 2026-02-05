"""
MCP Controller
Controlador MCP

Exposes Endpoints to manage MCP Servers and Tools.
Expõe Endpoints para gerenciar Servidores MCP e Ferramentas.

@author: Antigravity AI
"""
from flask import request, jsonify
from core.base_controller import BaseController



class MCPController(BaseController):
    """
    Controller for Model Context Protocol management.
    Controlador para gerenciamento do Protocolo de Contexto de Modelo.
    """

    def __init__(self, agent_core=None):
        """
        Initialize MCP Controller.
        Inicializar Controlador MCP.
        """
        self.core = agent_core
        super().__init__(name='mcp', import_name=__name__, url_prefix='/api/mcp')


    def _register_routes(self):
        """
        Register routes.
        Registrar rotas.
        """
        
        @self.blueprint.route('/config', methods=['GET'])
        def get_config():
            """
            Get current MCP configuration.
            Obter configuração MCP atual.
            """
            try:
                config = self.core.mcp_manager.config_service.load_config()
                return jsonify(config)
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route('/config', methods=['POST'])
        def save_config():
            """
            Save MCP configuration.
            Salvar configuração MCP.
            """
            try:
                config = request.json
                if not config:
                    return jsonify({"error": "No config provided"}), 400
                    
                self.core.mcp_manager.config_service.save_config(config)
                return jsonify({"status": "success", "message": "Configuration saved"})
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route('/restart', methods=['POST'])
        def restart_manager():
            """
            Restart MCP Manager (Reload servers).
            Reiniciar Gerenciador MCP (Recarregar servidores).
            """
            try:
                self.core.mcp_manager.restart_sync()
                return jsonify({"status": "success", "message": "MCP Manager restarted"})
            except Exception as e:
                return jsonify({"error": str(e)}), 500

        @self.blueprint.route('/tools', methods=['GET'])
        def list_tools():
            """
            List all available tools from all connected servers.
            Listar todas ferramentas disponíveis de todos servidores conectados.
            """
            try:
                tools = self.core.mcp_manager.get_all_tools_sync()
                return jsonify(tools)
            except Exception as e:
                return jsonify({"error": str(e)}), 500
