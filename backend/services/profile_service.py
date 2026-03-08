"""
Profile Service - User Personalization Manager
Serviço de Perfil - Gerenciador de Personalização do Usuário

Manages the `user_profile.json` file, allowing retrieval and update
of user identity, preferences, and environment notes.

Gerencia o arquivo `user_profile.json`, permitindo recuperação e atualização
da identidade do usuário, preferências e notas de ambiente.

@author: Roberto Dantas de Castro
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

# Constants / Constantes
CONFIG_DIR = Path.home() / '.hexagent-gui'
PROFILE_FILE = CONFIG_DIR / 'user_profile.json'

class ProfileService:
    """
    Singleton Service for User Profile Management
    Serviço Singleton para Gerenciamento de Perfil de Usuário
    """
    
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ProfileService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.logger = logging.getLogger(__name__)
        self._ensure_config_dir()
        self._initialized = True

    def _ensure_config_dir(self):
        """Ensure config directory exists / Garantir que diretório de config existe"""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    def load_profile(self) -> Dict[str, Any]:
        """
        Load user profile from file
        Carregar perfil de usuário do arquivo
        """
        if not PROFILE_FILE.exists():
            self.logger.warning("Profile file not found, returning empty default")
            return self._get_default_profile()
            
        try:
            with open(PROFILE_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Failed to load profile: {e}")
            return self._get_default_profile()

    def save_profile(self, profile_data: Dict[str, Any]) -> bool:
        """
        Save user profile to file
        Salvar perfil de usuário no arquivo
        """
        try:
            with open(PROFILE_FILE, 'w') as f:
                json.dump(profile_data, f, indent=2)
            self.logger.info("User profile saved successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to save profile: {e}")
            return False

    def get_system_prompt_context(self) -> str:
        """
        Generate context string for AI System Prompt
        Gerar string de contexto para Prompt de Sistema da IA
        """
        profile = self.load_profile()
        user = profile.get('user', {})
        persona = profile.get('persona', {})
        env = profile.get('environment', {})
        custom = profile.get('custom_instructions', "")

        context = []
        
        # User Identity
        name = user.get('name', 'Operator')
        role = user.get('role', 'Analyst')
        context.append(f"User Info: You are assisting {name} ({role}).")
            
        # Persona / Tone
        if persona:
            tone = persona.get('tone', 'professional')
            verbosity = persona.get('verbosity', 'balanced')
            context.append(f"Persona: Adopt a {tone} tone. Be {verbosity}.")
            
        # Environment
        if env.get('notes'):
            context.append(f"Environment Notes: {env['notes']}")
        if env.get('forbidden_scopes'):
            context.append(f"FORBIDDEN Scopes: {', '.join(env['forbidden_scopes'])}")
            
        # Custom Instructions
        if custom:
            context.append(f"Custom Constraints: {custom}")

        return "\n".join(context)

    def _get_default_profile(self) -> Dict[str, Any]:
        """Return default structure / Retornar estrutura padrão"""
        return {
            "user": {"name": "User", "role": "Analyst"},
            "persona": {
                "name": "HexAgent",
                "tone": "professional",   # professional, cyberpunk, friendly, concise
                "verbosity": "balanced",  # verbose, balanced, concise
            },
            "preferences": {
                "auto_approval": False,
                "notifications": True
            },
            "environment": {},
            "custom_instructions": ""
        }
