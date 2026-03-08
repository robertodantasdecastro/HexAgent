# Core module initialization
# Inicialização do módulo core

# Re-export for backward compatibility after base_controller relocation
# Re-exportar para compatibilidade reversa após relocação do base_controller
from controllers.base_controller import BaseController
from .errors import *

# New core modules for AI and command execution
# Novos módulos core para IA e execução de comandos
from .hex_strike_client import HexStrikeClient
from .agent_core import AgentCore

__all__ = [
    'BaseController', 'HexAgentError', 'ConfigError', 'ValidationError',
    'HexStrikeClient', 'AgentCore'
]
