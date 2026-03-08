"""
Configuration Service - Business logic for configuration management
Serviço de Configuração - Lógica de negócio para gerenciamento de configuração

Handles loading, saving, validation, and migration of configuration files.
Gerencia carregamento, salvamento, validação e migração de arquivos de configuração.
"""

import json
import os
from typing import Dict, Any
from pathlib import Path
from utils.constants import (
    CONFIG_DIR, SYSTEM_CONFIG_FILE, AI_CONFIG_FILE, LEGACY_CONFIG_FILE,
    DEFAULT_SYSTEM_CONFIG, DEFAULT_AI_CONFIG
)
from core.errors import ConfigError
import logging


class ConfigService:
    """
    Service class for configuration management
    Classe de serviço para gerenciamento de configuração
    """
    
    def __init__(self):
        """Initialize config service / Inicializa serviço de config"""
        self.logger = logging.getLogger(self.__class__.__name__)
        self._ensure_config_dir()
        self._migrate_legacy_config()
    
    def _ensure_config_dir(self):
        """Ensure config directory exists / Garante que diretório de config existe"""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    def _migrate_legacy_config(self):
        """
        Migrate old single config.json to new dual config system
        Migra config.json antigo para novo sistema dual de config
        """
        if LEGACY_CONFIG_FILE.exists() and not (SYSTEM_CONFIG_FILE.exists() and AI_CONFIG_FILE.exists()):
            try:
                with open(LEGACY_CONFIG_FILE, 'r') as f:
                    legacy = json.load(f)
                
                # Extract system config
                system_config = {
                    k: v for k, v in legacy.items()
                    if k in ['system', 'services', 'ui', 'terminal']
                }
                
                # Extract AI config  
                ai_config = {k: v for k, v in legacy.items() if k in ['ai']}
                
                # Save to new files
                if system_config:
                    self._save_config_file(SYSTEM_CONFIG_FILE, system_config)
                if ai_config:
                    self._save_config_file(AI_CONFIG_FILE, ai_config)
                
                # Rename legacy file
                LEGACY_CONFIG_FILE.rename(CONFIG_DIR / 'config.json.migrated')
                self.logger.info("Legacy config migrated successfully")
            except Exception as e:
                self.logger.error(f"Failed to migrate legacy config: {e}")
    
    def load_full_config(self) -> Dict[str, Any]:
        """
        Load complete configuration (system + AI)
        Carrega configuração completa (sistema + IA)
        """
        self.logger.info("[AUDIT-E] load_full_config called")
        system = self.load_system_config()
        ai = self.load_ai_config()
        
        full_config = {**system, **ai}
        if 'system' in full_config:
            debug_mode = full_config.get('system', {}).get('debug_mode')
            self.logger.info(f"[AUDIT-F] Loaded debug_mode = {debug_mode}")
        
        return full_config
    
    def load_system_config(self) -> Dict[str, Any]:
        """
        Load system configuration
        Carrega configuração do sistema
        """
        return self._load_config_file(SYSTEM_CONFIG_FILE, DEFAULT_SYSTEM_CONFIG)
    
    def load_ai_config(self) -> Dict[str, Any]:
        """
        Load AI configuration
        Carrega configuração de IA
        """
        return self._load_config_file(AI_CONFIG_FILE, DEFAULT_AI_CONFIG)
    
    def save_full_config(self, config: Dict[str, Any]):
        """
        Save complete configuration (splits into system/AI)
        Salva configuração completa (divide em sistema/IA)
        """
        self.logger.info(f"[AUDIT-A] save_full_config called with keys: {list(config.keys())}")
        
        # Extract and save system config
        system_config = {
            k: v for k, v in config.items()
            if k in ['system', 'services', 'ui', 'terminal']
        }
        
        if 'system' in system_config:
            debug_mode = system_config.get('system', {}).get('debug_mode')
            self.logger.info(f"[AUDIT-B] System config debug_mode = {debug_mode}")
        
        if system_config:
            self.save_system_config(system_config)
            self.logger.info("[AUDIT-C] System config saved to file")
        
        # Extract and save AI config
        ai_config = {k: v for k, v in config.items() if k in ['ai']}
        if ai_config:
            self.save_ai_config(ai_config)
            self.logger.info("[AUDIT-D] AI config saved to file")
    
    def save_system_config(self, config: Dict[str, Any]):
        """
        Save system configuration
        Salva configuração do sistema
        """
        self._save_config_file(SYSTEM_CONFIG_FILE, config)
        self.logger.info("System configuration saved")
    
    def save_ai_config(self, config: Dict[str, Any]):
        """
        Save AI configuration (API key protected in logs)
        Salva configuração de IA (chave API protegida nos logs)
        """
        self._save_config_file(AI_CONFIG_FILE, config)
        self.logger.info("AI configuration saved (API key protected)")
    
    def _load_config_file(self, filepath: Path, defaults: Dict) -> Dict:
        """
        Load config file with fallback to defaults
        Carrega arquivo de config com fallback para padrões
        """
        # CRITICAL FIX: Start with defaults, then override with saved values
        # CORREÇÃO CRÍTICA: Começar com defaults, depois sobrescrever com valores salvos
        result = defaults.copy()
        
        if filepath.exists():
            try:
                with open(filepath, 'r') as f:
                    saved = json.load(f)
                
                # Deep merge - saved values OVERRIDE defaults
                # Mescla profunda - valores salvos SOBRESCREVEM defaults
                for key in saved:
                    if key in result and isinstance(result[key], dict) and isinstance(saved[key], dict):
                        # Merge dict values, saved takes priority
                        result[key] = {**result[key], **saved[key]}
                    else:
                        # Direct override
                        result[key] = saved[key]
                
                self.logger.debug(f"Loaded config from {filepath}, saved values override defaults")
            except json.JSONDecodeError as e:
                self.logger.error(f"Invalid JSON in {filepath}: {e}")
                raise ConfigError(f"Invalid configuration file: {filepath.name}")
            except Exception as e:
                self.logger.error(f"Error loading {filepath}: {e}")
        
        return result
    
    def _save_config_file(self, filepath: Path, config: Dict):
        """
        Save configuration to file
        Salva configuração em arquivo
        """
        try:
            with open(filepath, 'w') as f:
                json.dump(config, f, indent=2)
            self.logger.debug(f"Saved config to {filepath}")
        except Exception as e:
            self.logger.error(f"Error saving config to {filepath}: {e}")
            raise ConfigError(f"Failed to save configuration: {str(e)}")
