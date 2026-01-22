"""
MCP Controller - API for MCP Registry
Controlador MCP - API para Registro MCP

Exposes routes to manage MCP servers.
Expõe rotas para gerenciar servidores MCP.

@author: Roberto Dantas de Castro
"""

from core.base_controller import BaseController
from core.mcp_manager import MCPManager
from flask import request


class MCPController(BaseController):
    """Controller for MCP operations / Controlador para operações MCP"""
    
    def __init__(self):
        super().__init__(name='mcp', import_name=__name__, url_prefix='/config/mcp')
        self.manager = MCPManager()
    
    def _register_routes(self):
        """Register MCP routes / Registra rotas MCP"""
        
        @self.blueprint.route('/servers', methods=['GET'])
        def list_servers():
            """List all configured servers / Listar todos os servidores configurados"""
            try:
                config = self.manager.load_config()
                return self.success_response(data={'servers': config.get('mcpServers', {})})
            except Exception as e:
                self.log_error('list_servers', e)
                return self.error_response(str(e), 500)

        @self.blueprint.route('/servers', methods=['POST'])
        def add_server():
            """Add or update a server / Adicionar ou atualizar um servidor"""
            try:
                data = request.json
                if not data or 'name' not in data or 'command' not in data:
                     return self.error_response("Missing name or command", 400)
                
                success = self.manager.add_server(
                    name=data['name'],
                    command=data['command'],
                    args=data.get('args', []),
                    env=data.get('env', {})
                )
                
                if success:
                    return self.success_response(message=f"Server {data['name']} saved")
                else:
                    return self.error_response("Failed to save server", 500)
                    
            except Exception as e:
                self.log_error('add_server', e)
                return self.error_response(str(e), 500)

        @self.blueprint.route('/servers/<name>', methods=['DELETE'])
        def delete_server(name):
            """Delete a server / Deletar um servidor"""
            try:
                if self.manager.remove_server(name):
                    return self.success_response(message=f"Server {name} removed")
                else:
                    return self.error_response(f"Failed to remove server {name}", 404)
            except Exception as e:
                self.log_error('delete_server', e)
                return self.error_response(str(e), 500)
