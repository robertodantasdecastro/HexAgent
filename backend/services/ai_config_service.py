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
            has_key = bool(config.get('ai', {}).get('api_key', ''))
            model = config.get('ai', {}).get('model', 'NOT_FOUND')
            self.logger.info(f"[AI-SERVICE] Saving model={model}, has_api_key={has_key}")
        
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
        required_fields = ['model', 'api_key', 'api_url', 'max_iterations']
        
        for field in required_fields:
            if field not in ai:
                self.logger.error(f"[AI-SERVICE] Missing ai.{field}")
                return False
        
        self.logger.info("[AI-SERVICE] Config validation passed")
        return True
    
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
