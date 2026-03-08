"""
MCP Service - Manages Model Context Protocol servers
Serviço MCP - Gerencia servidores do Protocolo de Contexto de Modelo

Handles loading configuration and connecting to MCP servers.
Gerencia o carregamento de configurações e conexão com servidores MCP.
"""

import json
import logging
import shutil
import os
from pathlib import Path
from typing import Dict, Any, List

# Try to import mcp, but handle if it's not installed yet
try:
    from mcp import ClientSession, StdioServerParameters
    # Depending on mcp library version, imports might vary.
    # We will assume standard mcp usage or generic stdio interaction for now if complex.
    HAS_MCP = True
except ImportError:
    HAS_MCP = False

class McpService:
    """
    Service for managing MCP integrations
    Serviço para gerenciar integrações MCP
    """
    
    def __init__(self, agent_core=None):
        self.logger = logging.getLogger(__name__)
        self.core = agent_core
        self.config_dir = Path.home() / ".hexagent-gui"
        self.config_file = self.config_dir / "mcp_config.json"
        
        # In-memory storage of active connections
        self.active_servers = {} 
        
        self._ensure_config()
        
    def _ensure_config(self):
        """Ensure config file exists / Garante que arquivo de config existe"""
        self.config_dir.mkdir(parents=True, exist_ok=True)
        if not self.config_file.exists():
            # Copy template if available, else create empty
            template = Path("config_templates/mcp_config.json")
            if template.exists():
                shutil.copy2(template, self.config_file)
            else:
                with open(self.config_file, 'w') as f:
                    json.dump({"mcpServers": {}}, f, indent=4)
                    
    def load_config(self) -> Dict[str, Any]:
        """Load MCP configuration"""
        try:
            with open(self.config_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Failed to load MCP config: {e}")
            return {"mcpServers": {}}

    def save_config(self, config: Dict[str, Any]):
        """Save MCP configuration"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=4)
        except Exception as e:
            self.logger.error(f"Failed to save MCP config: {e}")

    def list_servers(self) -> List[Dict[str, Any]]:
        """List configured servers and their status"""
        config = self.load_config()
        servers = []
        for name, details in config.get("mcpServers", {}).items():
            servers.append({
                "name": name,
                "command": details.get("command", ""),
                "enabled": details.get("enabled", False),
                "status": "connected" if name in self.active_servers else "disconnected" if details.get("enabled") else "disabled"
            })
        return servers

    def add_server(self, name: str, command: str, args: List[str] = None, env: Dict[str, str] = None) -> bool:
        """Add a new MCP server to config"""
        config = self.load_config()
        config.setdefault("mcpServers", {})[name] = {
            "command": command,
            "args": args or [],
            "env": env or {},
            "enabled": True
        }
        self.save_config(config)
        return True

    def remove_server(self, name: str) -> bool:
        """Remove an MCP server"""
        config = self.load_config()
        if name in config.get("mcpServers", {}):
            del config["mcpServers"][name]
            self.save_config(config)
            return True
        return False
    
    def toggle_server(self, name: str, enabled: bool) -> bool:
        """Toggle server enabled state"""
        config = self.load_config()
        if name in config.get("mcpServers", {}):
            config["mcpServers"][name]["enabled"] = enabled
            self.save_config(config)
            return True
        return False

    def get_server_tools(self, server_name: str) -> List[Dict[str, Any]]:
        """
        Get tools provided by a specific server
        (Placeholder: In real implementation, this would query the connected MCP client)
        """
        if server_name not in self.active_servers:
            return []
        
        # Mock for now until we implement actual MCP Client logic
        return []
