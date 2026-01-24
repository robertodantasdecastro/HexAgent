"""
MCP Controller
Controlador MCP

API endpoints for managing MCP servers and tools.
Endpoints da API para gerenciar servidores e ferramentas MCP.
"""

from core.base_controller import BaseController
from services.mcp_config_service import MCPConfigService
from core.agent_core import AgentCore
from flask import request

class MCPController(BaseController):
    """
    Controller for MCP management.
    Checks agent_core.mcp_manager for runtime state.
    """
    
    def __init__(self, agent_core: AgentCore):
        self.agent_core = agent_core
        self.config_service = MCPConfigService()
        
        super().__init__(
            name='mcp',
            import_name=__name__,
            url_prefix='/mcp'
        )
        
    def _register_routes(self):
        
        @self.blueprint.route('/servers', methods=['GET'])
        def list_servers():
            """
            List all configured MCP servers.
            Listar todos os servidores MCP configurados.
            """
            try:
                self.log_request('GET /mcp/servers')
                config = self.config_service.load_config()
                servers = config.get('servers', {})
                
                # Enrich with connection status if possible
                response_servers = []
                for name, cfg in servers.items():
                    is_connected = False
                    tools_count = 0
                    if self.agent_core and self.agent_core.mcp_manager:
                        is_connected = name in self.agent_core.mcp_manager.sessions
                        tools = self.agent_core.mcp_manager.tools_cache.get(name, [])
                        tools_count = len(tools)
                    
                    response_servers.append({
                        "name": name,
                        "enabled": cfg.get('enabled', True),
                        "command": cfg.get('command'),
                        "args": cfg.get('args', []),
                        "status": "connected" if is_connected else "disconnected",
                        "tools_count": tools_count
                    })
                    
                return self.success_response(data={"servers": response_servers})
            except Exception as e:
                self.log_error('GET /mcp/servers', e)
                return self.error_response("Failed to list MCP servers", 500)

        @self.blueprint.route('/servers', methods=['POST'])
        def add_server():
            """
            Add or update an MCP server.
            Adicionar ou atualizar um servidor MCP.
            """
            try:
                self.log_request('POST /mcp/servers')
                data = self.validate_request(['name', 'command', 'args'])
                
                name = data['name']
                config = {
                    "command": data['command'],
                    "args": data['args'],
                    "env": data.get('env', {}),
                    "enabled": data.get('enabled', True)
                }
                
                self.config_service.add_server(name, config)
                
                # Attempt to connect immediately if enabled
                if config['enabled'] and self.agent_core and self.agent_core.mcp_manager:
                    # We need to run this async, but this is a sync endpoint.
                    # We can use the manager's loop to schedule it?
                    # Ideally, we trigger a reload or specific connect.
                    # For now, we just save config. The user might need to restart or we add a connect endpoint.
                    pass
                
                return self.success_response(message=f"Server {name} added")
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /mcp/servers', e)
                return self.error_response("Failed to add server", 500)

        @self.blueprint.route('/servers/<name>', methods=['DELETE'])
        def remove_server(name):
            """
            Remove an MCP server.
            Remover um servidor MCP.
            """
            try:
                self.log_request(f'DELETE /mcp/servers/{name}')
                self.config_service.remove_server(name)
                return self.success_response(message=f"Server {name} removed")
            except Exception as e:
                self.log_error(f'DELETE /mcp/servers/{name}', e)
                return self.error_response("Failed to remove server", 500)

        @self.blueprint.route('/tools', methods=['GET'])
        def list_tools():
            """
            List all available tools from connected servers.
            Listar todas ferramentas disponíveis.
            """
            try:
                self.log_request('GET /mcp/tools')
                tools = []
                if self.agent_core and self.agent_core.mcp_manager:
                    # Sync access to cache
                    tools = self.agent_core.mcp_manager.get_all_tools_sync()
                
                return self.success_response(data={"tools": tools})
            except Exception as e:
                self.log_error('GET /mcp/tools', e)
                return self.error_response("Failed to list tools", 500)
