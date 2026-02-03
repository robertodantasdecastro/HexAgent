"""
Moltbot Configuration Service
Serviço de Configuração Moltbot

Manages Moltbot resources, skills, and app integrations.
Gerencia recursos, habilidades e integrações de aplicativos do Moltbot.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from typing import Dict, Any
from .base_config_service import BaseConfigService

class MoltbotConfigService(BaseConfigService):
    """
    Manages 'moltbot.json' configuration.
    Gerencia configuração 'moltbot.json'.
    """
    
    def __init__(self):
        super().__init__('moltbot.json')
        
    def _get_default_config(self) -> Dict[str, Any]:
        return {
            "core": {
                "enabled": False,
                "node_path": "node",
                "app_path": "~/iatools/moltbot"
            },
            "resources": {
                "max_memory_mb": 512,
                "log_level": "info"
            },
            "skills": {
                "web_search": {"enabled": True},
                "browser": {"enabled": True},
                "code_interpreter": {"enabled": True}
            },
            "integrations": {
                "discord": {"enabled": False, "token": ""},
                "telegram": {"enabled": False, "token": ""}
            }
        }
