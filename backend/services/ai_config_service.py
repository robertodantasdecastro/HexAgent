"""
AI Configuration Service - Handles ONLY AI engine and API settings
Serviço de Configuração de IA - Gerencia APENAS configurações de IA e API

Part of clean OOP separation between System and AI configurations
Parte da separação limpa POO entre configurações de Sistema e IA
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List
from core.errors import ConfigError


# AI config file path / Caminho do arquivo de config de IA
CONFIG_DIR = Path.home() / '.hexagent-gui'
AI_CONFIG_FILE = CONFIG_DIR / 'ai-config.json'


# Default AI configuration / Configuração padrão de IA
DEFAULT_AI_CONFIG = {
    "ai": {
        "engine": "lmstudio",
        "language": "auto",
        "auto_execute": False,
        "web_search_enabled": False,
        "stream_responses": True,
        "max_iterations": 10,
        "unlimited_iterations": False,
        "debug_mode": False,
        "profiles": {
            "openai": {
                "api_key": "",
                "model": "gpt-4o",
                "base_url": "https://api.openai.com/v1"
            },
            "lmstudio": {
                "host": "http://localhost",
                "port": 1234,
                "model": "mistralai/ministral-3-3b",
                "timeout": 60,
                "max_tokens": 4096,
                "temperature": 0.7,
                "system_prompt": ""
            },
            "ollama": {
                "host": "http://localhost",
                "port": 11434,
                "model": "llama3",
                "timeout": 60
            }
        }
    }
}


class AIConfigService:
    """
    Service for managing ONLY AI configuration
    Serviço para gerenciar APENAS configuração de IA
    
    Responsibilities / Responsabilidades:
    - Load/Save AI settings
    - Validate AI settings  
    - Handle API key security
    - NO system configuration handling!
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._ensure_config_file()
    
    def _ensure_config_file(self):
        """Create default config file if not exists / Criar arquivo padrão se não existir"""
        if not AI_CONFIG_FILE.exists():
            self._save_config(DEFAULT_AI_CONFIG)
            self.logger.info("Created default ai-config.json")
    
    def load_ai_config(self) -> Dict[str, Any]:
        """
        Load AI configuration from file
        Carregar configuração de IA do arquivo
        
        Returns EXACT file contents (no defaults merge!)
        Retorna conteúdo EXATO do arquivo (sem merge com defaults!)
        """
        self.logger.info("[AI-SERVICE] Loading AI config")
        
        if not AI_CONFIG_FILE.exists():
            self.logger.warning("[AI-SERVICE] File not found, using defaults")
            return DEFAULT_AI_CONFIG.copy()
        
        try:
            with open(AI_CONFIG_FILE, 'r') as f:
                config = json.load(f)
            
            # 1. ROOT MIGRATION: Check for root-level legacy keys and merge into 'ai'
            # 1. MIGRAÇÃO RAIZ: Verificar chaves legadas na raiz e mesclar em 'ai'
            changed = False
            if 'ai' not in config:
                config['ai'] = {}
                changed = True
            
            legacy_keys = ['api_key', 'engine', 'model', 'host', 'port']
            for key in legacy_keys:
                if key in config and key not in config['ai']:
                    config['ai'][key] = config[key]
                    self.logger.info(f"[AI-SERVICE] Migrated root key '{key}' to 'ai' section")
                    changed = True
            
            # 2. PROFILE MIGRATION: Convert Flat structure to Profiles
            # 2. MIGRAÇÃO DE PERFIL: Converter estrutura Plana para Perfis
            if 'profiles' not in config['ai']:
                self.logger.info("[AI-SERVICE] converting flat config to profiles...")
                config = self._migrate_to_profiles(config)
                changed = True
                
            # If we migrated, save the structure back to normalize the file
            if changed:
                 self.logger.info("[AI-SERVICE] Saving migrated config structure...")
                 self._save_config(config)

             # Sanitization Check on Load (Force cleanup of bad legacy values)
            # Verificação de sanitização ao carregar (Forçar limpeza de valores legados ruins)
            sanitized_config = self._sanitize_config(config)
            
            if sanitized_config != config:
                self.logger.warning("[AI-SERVICE] Loaded config required sanitization. Saving clean version...")
                self._save_config(sanitized_config)
                return sanitized_config

            return config
            
        except json.JSONDecodeError as e:
            self.logger.error(f"[AI-SERVICE] Invalid JSON: {e}")
            raise ConfigError(f"Invalid AI configuration file: {e}")
        except Exception as e:
            self.logger.warning(f"[AI-SERVICE] Error loading config ({e}), using internal defaults")
            return DEFAULT_AI_CONFIG.copy()
    
    def _migrate_to_profiles(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Migrate flat configuration to profile-based architecture
        Migrar configuração plana para arquitetura baseada em perfis
        """
        ai = config.get('ai', {})
        active_engine = ai.get('engine', 'openai')
        
        # Start with default profiles to ensure we have a baseline
        # Começar com perfis padrão para garantir linha de base
        profiles = DEFAULT_AI_CONFIG['ai']['profiles'].copy()
        
        # Data to move to active profile
        # Dados para mover para o perfil ativo
        flat_data = {
            'api_key': ai.get('api_key'),
            'host': ai.get('host'),
            'port': ai.get('port'),
            'model': ai.get('model'),
            'base_url': ai.get('base_url'),
            'organization': ai.get('organization'),
            'timeout': ai.get('timeout'),
            'max_tokens': ai.get('max_tokens'),
            'temperature': ai.get('temperature'),
            'system_prompt': ai.get('system_prompt')
        }
        
        # Clean None/Empty values
        flat_data = {k: v for k, v in flat_data.items() if v is not None}
        
        # Merge into the active engine's profile
        # Mesclar no perfil do motor ativo
        if active_engine in profiles:
            profiles[active_engine].update(flat_data)
        else:
            # If unknown engine, create new profile
            profiles[active_engine] = flat_data
            
        # Update config structure
        config['ai']['profiles'] = profiles
        
        # Remove migrated keys from 'ai' root (Keep global keys like engine, auto_execute)
        keys_to_remove = ['api_key', 'host', 'port', 'model', 'base_url', 'organization', 'system_prompt']
        for k in keys_to_remove:
            config['ai'].pop(k, None)
            
        return config

    def _sanitize_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize configuration (Profiles Aware)
        Saneamento de configuração (Ciente de Perfis)
        """
        try:
            if 'ai' not in config:
                return config
                
            ai = config['ai']
            
            # 1. Sanitize Global Keys
            allowed_global = {
                'engine', 'profiles', 'last_updated', 'language', 
                'web_search_enabled', 'auto_execute', 'stream_responses',
                'max_iterations', 'unlimited_iterations', 'debug_mode'
            }
            
            sanitized_ai = {k: v for k, v in ai.items() if k in allowed_global}
            
            # 2. Sanitize Profiles
            if 'profiles' in ai and isinstance(ai['profiles'], dict):
                sanitized_profiles = {}
                
                for engine, profile_data in ai['profiles'].items():
                    # Apply specific validation per engine
                    if engine == 'openai':
                        profile_data = self._validate_openai_base_url(profile_data)
                    
                    sanitized_profiles[engine] = profile_data
                
                sanitized_ai['profiles'] = sanitized_profiles
            
            config['ai'] = sanitized_ai
            return config
            
        except Exception as e:
            self.logger.error(f"[AI-SERVICE] Sanitization failed: {e}")
            return config

    def _validate_openai_base_url(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure OpenAI profile does not use local/private IPs
        Garante que perfil OpenAI não use IPs locais/privados
        """
        suspicious_patterns = ['localhost', '127.', '192.168.', '10.', '172.16.', '0.0.0.0']
        is_suspicious = False
        
        # Check base_url
        base_url = profile_data.get('base_url', '').lower()
        if base_url and any(p in base_url for p in suspicious_patterns):
            self.logger.warning("[AI-SERVICE] Suspicious base_url for OpenAI check.")
            is_suspicious = True
            
        # Check host if base_url didn't trigger
        if not is_suspicious:
            host = profile_data.get('host', '').lower()
            if host and any(p in host for p in suspicious_patterns):
                self.logger.warning("[AI-SERVICE] Suspicious host for OpenAI check.")
                is_suspicious = True
        
        if is_suspicious:
            self.logger.warning(
                "[AI-SERVICE] DETECTED SUSPICIOUS/LOCAL CONNECTION SETTINGS FOR OPENAI. "
                "Resetting to default in profile (Official API)."
            )
            profile_data.pop('base_url', None)
            profile_data.pop('host', None)
            profile_data.pop('port', None)
            
        return profile_data

    def save_ai_config(self, config: Dict[str, Any]):
        """
        Save AI configuration
        Salvar configuração de IA
        """
        self.logger.info("[AI-SERVICE] Saving AI config")
        
        # --- CRITICAL FIX D2.2 (API Key Protection) ---
        # The frontend does not receive the api_key for security reasons (it receives has_api_key).
        # When saving config (e.g., toggling Auto-Exec), it sends back an empty api_key.
        # We must preserve the existing api_key from disk if the incoming is empty but the disk has it.
        try:
            existing_full_config = self.load_ai_config()
            existing_profiles = existing_full_config.get('ai', {}).get('profiles', {})
            
            if 'ai' in config and 'profiles' in config['ai']:
                new_profiles = config['ai']['profiles']
                for engine, new_profile in new_profiles.items():
                    existing_profile_data = existing_profiles.get(engine, {})
                    
                    # If incoming is missing api_key, but we have one on disk, inject it back
                    if not new_profile.get('api_key') and existing_profile_data.get('api_key'):
                        new_profile['api_key'] = existing_profile_data['api_key']
                        self.logger.info(f"[AI-SERVICE] Preserved existing api_key for engine '{engine}'")
        except Exception as e:
            self.logger.warning(f"[AI-SERVICE] Failed to merge existing api_key: {e}")
        # ----------------------------------------------
        
        # OOP: Sanitize config before validation and saving
        config = self._sanitize_config(config)

        if not self.validate_ai_config(config):
            self.logger.error("[AI-SERVICE] Validation failed, aborting save")
            raise ConfigError("Invalid AI configuration")

        self._save_config(config)
        self.logger.info("[AI-SERVICE] AI config saved successfully")
    
    def validate_ai_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate AI configuration structure (Profiles Aware)
        Validar estrutura da configuração de IA (Ciente de Perfis)
        """
        if 'ai' not in config:
             return False
        
        ai = config['ai']
        engine = ai.get('engine', '').lower()
        
        if 'profiles' not in ai:
            # Should have been migrated/created by load/sanitize, but check anyway
            return False
            
        profiles = ai['profiles']
        active_profile = profiles.get(engine, {})
        
        # Validation checks on the ACTIVE profile
        # Verificações de validação no perfil ATIVO
        
        if 'model' not in active_profile and engine != 'lmstudio': 
            # LM Studio model can be auto-detected, others usually need it
            # But technically LM Studio usually needs non-empty string too?
            # Let's keep it loose for now, models are strings
            pass

        # Check API Key for online services
        online_engines = ['openai', 'anthropic', 'mistral', 'groq', 'gemini']
        if engine in online_engines:
            if not active_profile.get('api_key'):
                 self.logger.error(f"[AI-SERVICE] Online engine {engine} missing required API key in profile.")
                 return False

        return True
    
    def get_active_provider_config(self) -> tuple[str, Dict[str, Any]]:
        """
        Get flattened, ready-to-use configuration for ProviderFactory
        Obtém configuração achatada e pronta para ProviderFactory
        
        Combines Global Settings + Active Profile
        Combina Configurações Globais + Perfil Ativo
        """
        full_config = self.load_ai_config() # Already migrated & sanitized
        
        ai_config = full_config.get('ai', {})
        engine = ai_config.get('engine', 'openai').lower()
        profiles = ai_config.get('profiles', {})
        
        # Base: Global defaults/settings that apply to provider
        # Base: Padrões globais/configurações que se aplicam ao provedor
        provider_config = {
             'timeout': 60, # Default
             'max_iterations': ai_config.get('max_iterations', 10),
             'auto_execute': ai_config.get('auto_execute', False),
             'web_search': ai_config.get('web_search_enabled', False)
        }
        
        # Merge Active Profile
        # Mesclar Perfil Ativo
        active_profile = profiles.get(engine, {})
        provider_config.update(active_profile)
        
        # Construct base_url from host/port if missing (Backward/Local Compat)
        if not provider_config.get('base_url') and provider_config.get('host'):
             host = provider_config.get('host').rstrip('/')
             port = provider_config.get('port')
             if port:
                 provider_config['base_url'] = f"{host}:{port}/v1"
             else:
                 provider_config['base_url'] = f"{host}/v1"
        
        # Clean None values
        provider_config = {k: v for k, v in provider_config.items() if v is not None}
        
        return engine, provider_config

    def _save_config(self, config: Dict[str, Any]):
        """
        Internal method to write config to file (atomic operation)
        Método interno para escrever config no arquivo (operação atômica)
        """
        try:
            import time
            if 'ai' in config:
                config['ai']['last_updated'] = time.time()
            
            temp_path = AI_CONFIG_FILE.with_suffix('.tmp')
            with open(temp_path, 'w') as f:
                json.dump(config, f, indent=2)
            temp_path.replace(AI_CONFIG_FILE)
            
            self.logger.debug(f"[AI-SERVICE] Wrote config to {AI_CONFIG_FILE}")
            
        except Exception as e:
            self.logger.error(f"[AI-SERVICE] Error writing file: {e}")
            raise ConfigError(f"Failed to save AI configuration: {e}")
