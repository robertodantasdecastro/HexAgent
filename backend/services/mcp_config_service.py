"""
MCP Configuration Service
Serviço de Configuração MCP

Manages the persistence of MCP server registry.
Gerencia a persistência do registro de servidores MCP.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any

# MCP config file path / Caminho do arquivo de config MCP
CONFIG_DIR = Path.home() / '.hexagent-gui'
MCP_CONFIG_FILE = CONFIG_DIR / 'mcp-config.json'

# Default Configuration
DEFAULT_MCP_CONFIG = {
    "servers": {
        "filesystem": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home"],
            "env": {},
            "enabled": False
        },
        "kali-tools": {
            "command": "python",
            "args": ["-m", "mcp_kali_server"],
            "env": {},
            "enabled": False
        }
    }
}

class MCPConfigService:
    """
    Service for managing MCP configurations (Registry).
    Serviço para gerenciar configurações MCP (Registro).
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._ensure_config_file()
    
    def _ensure_config_file(self):
        """Create default config file if not exists"""
        if not MCP_CONFIG_FILE.exists():
            self._save_config(DEFAULT_MCP_CONFIG)
            self.logger.info("Created default mcp-config.json")
            
    def load_config(self) -> Dict[str, Any]:
        """Load MCP configuration from file"""
        if not MCP_CONFIG_FILE.exists():
            return DEFAULT_MCP_CONFIG.copy()
            
        try:
            with open(MCP_CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error loading MCP config: {e}")
            return DEFAULT_MCP_CONFIG.copy()
            
    def save_config(self, config: Dict[str, Any]):
        """Save MCP configuration to file"""
        self._save_config(config)
        
    def _save_config(self, config: Dict[str, Any]):
        """Internal save method"""
        try:
            with open(MCP_CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=4)
        except Exception as e:
            self.logger.error(f"Error saving MCP config: {e}")
            raise

    def add_server(self, name: str, config: Dict[str, Any]):
        """Add or update a server configuration"""
        full_config = self.load_config()
        if 'servers' not in full_config:
            full_config['servers'] = {}
            
        full_config['servers'][name] = config
        self.save_config(full_config)
        
    def remove_server(self, name: str):
        """Remove a server configuration"""
        full_config = self.load_config()
        if 'servers' in full_config and name in full_config['servers']:
            del full_config['servers'][name]
            self.save_config(full_config)
