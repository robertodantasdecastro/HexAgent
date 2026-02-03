"""
Profile Configuration Service
Serviço de Configuração de Perfil

Manages user personalization, persona, and preferences.
Gerencia personalização do usuário, persona e preferências.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from typing import Dict, Any
from .base_config_service import BaseConfigService

class ProfileConfigService(BaseConfigService):
    """
    Manages 'profile.json' configuration.
    Gerencia configuração 'profile.json'.
    """
    
    def __init__(self):
        super().__init__('profile.json')
        
    def _get_default_config(self) -> Dict[str, Any]:
        return {
            "user": {
                "name": "Operator",
                "role": "Admin",
                "avatar": "default",
                "language": "auto"
            },
            "persona": {
                "name": "HexAgent",
                "tone": "professional",   # professional, cyberpunk, friendly, concise
                "verbosity": "balanced",  # verbose, balanced, concise
                "emoji_usage": "moderate" # none, moderate, high
            },
            "preferences": {
                "auto_approval_threshold": "low", # low (ask frequent), high (auto-run safe)
                "notifications": True,
                "sound_effects": True
            }
        }
    
    def get_system_context(self) -> str:
        """
        Generates a system prompt context snippet based on profile.
        Gera um trecho de contexto de prompt de sistema baseado no perfil.
        """
        config = self.load_config()
        persona = config.get('persona', {})
        user = config.get('user', {})
        
        context = (
            f"User Info: You are assisting {user.get('name', 'Operator')}. "
            f"Role: {user.get('role', 'Admin')}.\n"
            f"Persona: Adopt a {persona.get('tone', 'professional')} tone. "
            f"Be {persona.get('verbosity', 'balanced')}."
        )
        return context
