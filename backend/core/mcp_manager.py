"""
MCP Manager - Core orchestration for Model Context Protocol interactions.
Gerenciador MCP - Orquestração central para interações do Model Context Protocol.

Handles connections to multiple MCP servers, tool discovery, and routing.
Gerencia conexões com múltiplos servidores MCP, descoberta de ferramentas e roteamento.
"""

import asyncio
import logging
import json
import shutil
from typing import Dict, Any, List, Optional
from contextlib import AsyncExitStack

# MCP SDK Imports
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Local Imports
from services.mcp_config_service import MCPConfigService

logger = logging.getLogger(__name__)

class MCPManager:
    """
    Manages connections to MCP servers and aggregates tools/resources.
    Gerencia conexões com servidores MCP e agrega ferramentas/recursos.
    """
    
    def __init__(self):
        self.sessions: Dict[str, ClientSession] = {}
        self.exit_stack = AsyncExitStack()
        self.config_service = MCPConfigService()
        self.tools_cache: Dict[str, List[Dict]] = {}
        
        # Thread-safe event loop handling for Flask
        self._loop = asyncio.new_event_loop()
        self._thread = None
        
        # Skip initialization in setup mode / Pular inicialização em modo de setup
        import os
        if not os.environ.get('HEXAGENT_SETUP_ONLY'):
            self._start_background_loop()
        else:
            logger.info("MCP Manager: Setup mode detected, skipping background loop.")

    def _start_background_loop(self):
        """Start the asyncio loop in a separate thread"""
        import threading
        def run_loop():
            asyncio.set_event_loop(self._loop)
            self._loop.run_forever()
            
        self._thread = threading.Thread(target=run_loop, daemon=True)
        self._thread.start()
        
        # Schedule initialization
        asyncio.run_coroutine_threadsafe(self.initialize(), self._loop)

    def run_sync(self, coroutine):
        """Run an async method synchronously (thread-safe)"""
        future = asyncio.run_coroutine_threadsafe(coroutine, self._loop)
        return future.result()

    async def initialize(self):
        """
        Initialize connections to all enabled MCP servers.
        """
        # ... logic unchanged ...
        config = self.config_service.load_config()
        servers = config.get('servers', {})
        logger.info(f"Initializing MCP Manager with {len(servers)} servers configured")
        for name, server_config in servers.items():
            if server_config.get('enabled', True):
                try:
                    await self.connect_server(name, server_config)
                except Exception as e:
                    logger.error(f"Failed to connect to MCP server {name}: {e}")

    # ... (rest of async methods) ...

    def call_tool_sync(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Synchronous wrapper for call_tool"""
        return self.run_sync(self.call_tool(tool_name, arguments))
        
    def get_all_tools_sync(self) -> List[Dict[str, Any]]:
        """Synchronous wrapper to get tools (cache is sync access safe-ish, but better via loop if updates happen)"""
        # Since cache is a dict, simple read is fine, but for correctness let's assume it's just local property access
        return self.tools_cache # Accessing local property is fine


    async def connect_server(self, name: str, config: Dict[str, Any]):
        """
        Connect to a specific MCP server.
        Conectar a um servidor MCP específico.
        """
        command = config.get('command')
        args = config.get('args', [])
        env = config.get('env', {})
        
        # Security: Only allow whitelisted commands or strict path validation?
        # For Milestone 2, we trust config but should be careful.
        # Check if executable exists
        executable = shutil.which(command)
        if not executable:
             logger.error(f"Executable {command} not found for server {name}")
             return

        logger.info(f"Connecting to MCP server: {name} ({command})")
        
        server_params = StdioServerParameters(
            command=executable,
            args=args,
            env=env
        )
        
        try:
            # We use the stdio_client context manager
            # Since we need to keep sessions alive, we use AsyncExitStack
            # Usamos o context manager stdio_client
            # Como precisamos manter sessões vivas, usamos AsyncExitStack
            
            read, write = await self.exit_stack.enter_async_context(stdio_client(server_params))
            session = await self.exit_stack.enter_async_context(ClientSession(read, write))
            
            await session.initialize()
            
            self.sessions[name] = session
            logger.info(f"Connected to MCP server {name}")
            
            # Cache tools immediately
            await self._refresh_tools(name)
            
        except Exception as e:
            logger.error(f"Error connecting to {name}: {e}")
            raise

    async def _refresh_tools(self, server_name: str):
        """
        Fetch and cache tools from a connected server.
        Buscar e cachear ferramentas de um servidor conectado.
        """
        session = self.sessions.get(server_name)
        if not session:
            return
            
        try:
            result = await session.list_tools()
            # Convert generic objects to dicts if necessary, or store as is
            # Result.tools is a list of Tool objects
            
            tools_list = []
            for tool in result.tools:
                tools_list.append({
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.inputSchema,
                    "server": server_name # Tag with source server
                })
            
            self.tools_cache[server_name] = tools_list
            logger.debug(f"Cached {len(tools_list)} tools from {server_name}")
            
        except Exception as e:
            logger.error(f"Failed to list tools for {server_name}: {e}")

    def get_all_tools(self) -> List[Dict[str, Any]]:
        """
        Get flattened list of all available tools from all servers.
        Obter lista achatada de todas ferramentas disponíveis.
        """
        all_tools = []
        for server_tools in self.tools_cache.values():
            all_tools.extend(server_tools)
        return all_tools

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Execute a tool by name (finding the right server).
        Executar uma ferramenta pelo nome (encontrando o servidor certo).
        """
        # Find which server has this tool
        target_server = None
        for server_name, tools in self.tools_cache.items():
            for tool in tools:
                if tool['name'] == tool_name:
                    target_server = server_name
                    break
            if target_server:
                break
        
        if not target_server:
            raise ValueError(f"Tool {tool_name} not found in any connected MCP server")
            
        session = self.sessions.get(target_server)
        if not session:
             raise ValueError(f"Server {target_server} is disconnected")
             
        logger.info(f"Calling tool {tool_name} on server {target_server}")
        result = await session.call_tool(tool_name, arguments)
        
        # Return content (TextContent or ImageContent)
        # Assuming simplified text return for now
        # Retorna conteúdo (TextContent ou ImageContent)
        # Assumindo retorno de texto simplificado por enquanto
        output = []
        if hasattr(result, 'content'):
            for item in result.content:
                if item.type == 'text':
                    output.append(item.text)
                elif item.type == 'image':
                    output.append(f"[Image: {item.mimeType}]") # Placeholder
                    
        return "\n".join(output)

    async def shutdown(self):
        """
        Close all sessions and cleanup.
        Fechar todas sessões e limpar.
        """
        logger.info("Shutting down MCP Manager...")
        await self.exit_stack.aclose()
        self.sessions.clear()
        self.tools_cache.clear()

    async def restart(self):
        """
        Restart all MCP connections (Reload config).
        Reiniciar todas conexões MCP (Recarregar config).
        """
        logger.info("Restarting MCP Manager...")
        await self.shutdown()
        # Re-create stack for new context
        self.exit_stack = AsyncExitStack()
        await self.initialize()

    def restart_sync(self):
        """Synchronous wrapper for restart"""
        return self.run_sync(self.restart())
