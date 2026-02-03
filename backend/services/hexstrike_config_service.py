"""
HexStrike Configuration Service
Serviço de Configuração HexStrike

Manages HexStrike Agent objectives, tools, and execution parameters.
Gerencia objetivos, ferramentas e parâmetros de execução do Agente HexStrike.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from typing import Dict, Any
from .base_config_service import BaseConfigService

class HexStrikeConfigService(BaseConfigService):
    """
    Manages 'hexstrike.json' configuration.
    Gerencia configuração 'hexstrike.json'.
    """
    
    def __init__(self):
        super().__init__('hexstrike.json')
        
    def _get_default_config(self) -> Dict[str, Any]:
        return {
            "server": {
                "host": "127.0.0.1",
                "port": 8888,
                "auto_start": True,
                "venv_path": "~/iatools/hexstrike-ai/venv"
            },
            "agent": {
                "objective": "general_assistant", # pentest, blue_team, osint, general_assistant
                "custom_instructions": "",
                "safety_level": "high", # high (no destruct), medium, low (full output)
                "allowed_tools": ["nmap", "whois", "curl"], # Allowlist
                "blocked_tools": ["rm", "dd", "mkfs"]      # Blocklist
            },
            "execution": {
                "timeout": 300,
                "max_concurrency": 1
            }
        }
    
    def get_objective_prompt(self) -> str:
        """
        Get the specific objective instructions for the AI.
        Obtém as instruções de objetivo específicas para a IA.
        """
        config = self.load_config()
        agent = config.get('agent', {})
        obj_type = agent.get('objective', 'general_assistant')
        custom = agent.get('custom_instructions', '')
        
        prompts = {
            "pentest": "You are a Red Team specialist. Focus on identifying vulnerabilities and exploitation paths.",
            "blue_team": "You are a Blue Team analyst. Focus on log analysis, defense, and mitigation.",
            "osint": "You are an Intelligence Analyst. Focus on information gathering and data correlation.",
            "general_assistant": "You are a versatile Cybersecurity Assistant."
        }
        
        base_prompt = prompts.get(obj_type, prompts["general_assistant"])
        if custom:
            base_prompt += f"\nAdditional Instructions: {custom}"
            
        return base_prompt
