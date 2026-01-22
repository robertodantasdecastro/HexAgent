"""
MCP Manager - Model Context Protocol Registry
Gerenciador MCP - Registro do Protocolo de Contexto de Modelo

Manages MCP server connections and tool discovery.
Gerencia conexões de servidores MCP e descoberta de ferramentas.

@author: Roberto Dantas de Castro
"""

import asyncio
import json
import logging
import os
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

try:
    from mcp import StdioServerParameters
    from mcp.client.stdio import stdio_client
    from mcp.client.session import ClientSession
    HAS_MCP = True
except ImportError:
    HAS_MCP = False

class MCPManager:
    """
    Manages connections to MCP Servers.
    Gerencia conexões com Servidores MCP.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        self.config_path = Path(config_path) if config_path else Path.home() / '.hexagent-gui' / 'mcp_config.json'
        self.servers: Dict[str, Any] = {} # Active server sessions (if kept open)
        self.tools_cache: Dict[str, List[Dict]] = {}
        
        if not HAS_MCP:
            self.logger.warning("MCP SDK not installed. MCP features disabled.")

    def load_config(self) -> Dict[str, Any]:
        """Load MCP configuration / Carregar configuração MCP"""
        if not self.config_path.exists():
            return {"mcpServers": {}}
        
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Failed to load MCP config: {e}")
            return {"mcpServers": {}}
            
    def get_server_params(self, server_name: str) -> Optional[Any]:
        """
        Get StdioServerParameters for a named server.
        Obter StdioServerParameters para um servidor nomeado.
        """
        if not HAS_MCP: 
            return None
            
        config = self.load_config()
        servers = config.get("mcpServers", {})
        srv_conf = servers.get(server_name)
        
        if not srv_conf:
            return None
            
        # Check if enabled (default true if not specified, unless explicit false)
        if srv_conf.get('enabled') is False:
            return None

        command = srv_conf.get("command")
        args = srv_conf.get("args", [])
        env = srv_conf.get("env", None)
        
        # Merge current env with config env
        full_env = os.environ.copy()
        if env:
            full_env.update(env)
            
        return StdioServerParameters(
            command=command,
            args=args,
            env=full_env
        )

    def list_configured_servers(self) -> List[str]:
        """List names of configured servers / Listar nomes de servidores configurados"""
        config = self.load_config()
        return list(config.get("mcpServers", {}).keys())

    def save_config(self, config: Dict[str, Any]) -> bool:
        """Save MCP configuration / Salvar configuração MCP"""
        try:
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(config, f, indent=2)
            return True
        except Exception as e:
            self.logger.error(f"Failed to save MCP config: {e}")
            return False

    def add_server(self, name: str, command: str, args: List[str], env: Optional[Dict] = None) -> bool:
        """Add or update an MCP server / Adicionar ou atualizar um servidor MCP"""
        config = self.load_config()
        if "mcpServers" not in config:
            config["mcpServers"] = {}
            
        config["mcpServers"][name] = {
            "command": command,
            "args": args,
            "env": env or {},
            "enabled": True
        }
        return self.save_config(config)

    def remove_server(self, name: str) -> bool:
        """Remove an MCP server / Remover um servidor MCP"""
        config = self.load_config()
        if "mcpServers" in config and name in config["mcpServers"]:
            del config["mcpServers"][name]
            return self.save_config(config)
        return False
        
    async def _get_tools_from_server(self, name: str, params: StdioServerParameters) -> List[Dict]:
        """
        Fetch tools from a single server (async)
        Buscar ferramentas de um único servidor (assíncrono)
        """
        tools_list = []
        try:
            async with stdio_client(params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.list_tools()
                    # Convert MCP tools to OpenAI/Native format
                    # result.tools is a list of Tool objects
                    for tool in result.tools:
                        tools_list.append({
                            "name": tool.name,
                            "description": tool.description,
                            "input_schema": tool.inputSchema,
                            "server": name # Internal tracking
                        })
        except Exception as e:
            self.logger.error(f"Error fetching tools from {name}: {e}")
        return tools_list

    async def _call_tool_on_server(self, name: str, tool_name: str, arguments: dict) -> Any:
        """
        Call a tool on a single server (async)
        Chamar uma ferramenta em um único servidor (assíncrono)
        """
        params = self.get_server_params(name)
        if not params:
            raise ValueError(f"Server {name} not found or disabled")
            
        async with stdio_client(params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments)
                return result

    def get_tools(self) -> List[Dict]:
        """
        Get all available tools from all enabled servers
        Obter todas as ferramentas disponíveis de todos os servidores habilitados
        """
        if not HAS_MCP:
            return []
            
        all_tools = []
        enabled_servers = self.list_configured_servers()
        
        # Sequentially fetch for now (could be parallelized)
        for name in enabled_servers:
            # Check if enabled logic is handled in get_server_params or list
            # get_server_params returns None if disabled
            params = self.get_server_params(name)
            if params:
                try:
                    # Run async function in sync context
                    server_tools = asyncio.run(self._get_tools_from_server(name, params))
                    all_tools.extend(server_tools)
                except Exception as e:
                    self.logger.error(f"Failed to get tools from {name}: {e}")
                    
        self.tools_cache = {t['name']: t for t in all_tools}
        return all_tools

    def call_tool(self, tool_name: str, arguments: dict) -> Any:
        """
        Find server for tool and execute
        Encontrar servidor para ferramenta e executar
        """
        # Find which server has this tool
        tool_info = self.tools_cache.get(tool_name)
        if not tool_info:
            # Refresh cache?
            self.get_tools()
            tool_info = self.tools_cache.get(tool_name)
            
        if not tool_info:
            raise ValueError(f"Tool {tool_name} not found")
            
        server_name = tool_info.get('server')
        if not server_name:
             raise ValueError(f"Server for tool {tool_name} is unknown")
             
        try:
             result = asyncio.run(self._call_tool_on_server(server_name, tool_name, arguments))
             return result
        except Exception as e:
             self.logger.error(f"Tool execution failed: {e}")
             raise e
