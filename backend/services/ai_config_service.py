"""
AI Configuration Service - Handles ONLY AI engine and API settings
Serviço de Configuração de IA - Gerencia APENAS configurações de IA e API

Part of clean OOP separation between System and AI configurations
Parte da separação limpa POO entre configurações de Sistema e IA
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any
from core.errors import ConfigError


# AI config file path / Caminho do arquivo de config de IA
CONFIG_DIR = Path.home() / '.hexagent-gui'
AI_CONFIG_FILE = CONFIG_DIR / 'ai-config.json'


# Default AI configuration / Configuração padrão de IA
DEFAULT_AI_CONFIG = {
    "ai": {
        "language": "auto",
        "model": "openai/gpt-4-turbo",
        "api_key": "",
        "api_url": "",
        "max_iterations": 10,
        "unlimited_iterations": False,
        "temperature": 0.7,
        "web_search_enabled": False,
        "streaming_enabled": True
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
            
            # Log (protect API key!)
            if 'ai' in config:
                has_key = bool(config.get('ai', {}).get('api_key', ''))
                model = config.get('ai', {}).get('model', 'NOT_FOUND')
                self.logger.info(f"[AI-SERVICE] Loaded model={model}, has_api_key={has_key}")
            
            return config
            
        except json.JSONDecodeError as e:
            self.logger.error(f"[AI-SERVICE] Invalid JSON: {e}")
            raise ConfigError(f"Invalid AI configuration file: {e}")
        except Exception as e:
            self.logger.error(f"[AI-SERVICE] Error loading: {e}")
            return DEFAULT_AI_CONFIG.copy()
    
    def save_ai_config(self, config: Dict[str, Any]):
        """
        Save AI configuration to file
        Salvar configuração de IA no arquivo
        
        Saves EXACT config provided (no modification!)
        Salva config EXATO fornecido (sem modificação!)
        """
        self.logger.info("[AI-SERVICE] Saving AI config")
        
        # Log (protect API key!)
        if 'ai' in config:
            ai_conf = config.get('ai', {})
            engine = ai_conf.get('engine', '').lower()
            model = ai_conf.get('model', 'NOT_FOUND')
            has_key = bool(ai_conf.get('api_key', ''))
            
            # Check if local engine
            local_engines = ['lmstudio', 'ollama', 'localai', '5ire', 'text-generation-webui']
            is_local = engine in local_engines
            
            status = "Local Mode" if is_local else f"has_key={has_key}"
            self.logger.info(f"[AI-SERVICE] Saving model={model}, engine={engine}, {status}")
        
        self._save_config(config)
        self.logger.info("[AI-SERVICE] AI config saved successfully")
    
    def validate_ai_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate AI configuration structure
        Validar estrutura da configuração de IA
        """
        if 'ai' not in config:
            self.logger.error("[AI-SERVICE] Missing 'ai' key")
            return False
        
        ai = config['ai']
        engine = ai.get('engine', '').lower()
        
        # REQUIRED fields for ALL
        # Campos OBRIGATÓRIOS para TODOS
        if 'model' not in ai:
             self.logger.error("[AI-SERVICE] Missing ai.model")
             return False
             
        # Local Engines Check
        # Verificação de Motores Locais
        local_engines = ['lmstudio', 'ollama', 'localai', '5ire', 'text-generation-webui']
        is_local = engine in local_engines
        
        if is_local:
            # For local, Host is critical, API Key is optional
            # Para local, Host é crítico, Chave API é opcional
            host = ai.get('host', '')
            if not host.startswith('http'):
                 self.logger.warning(f"[AI-SERVICE] Local engine {engine} missing valid host (http/https). Defaulting to localhost in strategy.")
        else:
            # For online, API Key is critical
            # Para online, Chave API é crítica
            if not ai.get('api_key'):
                # Allow empty key if user really intends it (e.g. proxy), but warn
                self.logger.warning(f"[AI-SERVICE] Online engine {engine} has no API key.")

        self.logger.info("[AI-SERVICE] Config validation passed")
        return True
    
    def get_active_provider_config(self) -> tuple[str, Dict[str, Any]]:
        """
        Get flattened, ready-to-use configuration for ProviderFactory
        Obtém configuração achatada e pronta para ProviderFactory
        
        Returns:
            (engine_name, config_dict)
        """
        full_config = self.load_ai_config()
        ai_config = full_config.get('ai', {})
        
        engine = ai_config.get('engine', 'hexsecgpt').lower()
        
        # Flattened config for Strategy Init
        # Configuração achatada para Init da Estratégia
        provider_config = {
            'api_key': ai_config.get('api_key'),
            'model': ai_config.get('model'),
            'system_prompt': ai_config.get('system_prompt'),
            'host': ai_config.get('host'),
            'port': ai_config.get('port'),
            'timeout': ai_config.get('timeout'),
            # Legacy/Compatibility keys
            'base_url': f"{ai_config.get('host')}:{ai_config.get('port')}/v1" if ai_config.get('host') and ai_config.get('port') else None
        }
        
        # Clean None values
        provider_config = {k: v for k, v in provider_config.items() if v is not None}
        
        return engine, provider_config

    def _save_config(self, config: Dict[str, Any]):
        """
        Internal method to write config to file (atomic operation)
        Método interno para escrever config no arquivo (operação atômica)
        """
        try:
            # Atomic write using temp file
            temp_path = AI_CONFIG_FILE.with_suffix('.tmp')
            
            with open(temp_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            # Atomic rename
            temp_path.replace(AI_CONFIG_FILE)
            
            self.logger.debug(f"[AI-SERVICE] Wrote {len(config)} keys to file")
            
        except Exception as e:
            self.logger.error(f"[AI-SERVICE] Error writing file: {e}")
            raise ConfigError(f"Failed to save AI configuration: {e}")
