"""
System Configuration Service - Handles ONLY system, services, UI, and terminal settings
Serviço de Configuração do Sistema - Gerencia APENAS configurações de sistema, serviços, UI e terminal

Part of clean OOP separation between System and AI configurations
Parte da separação limpa POO entre configurações de Sistema e IA
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any
from core.errors import ConfigError


# System config file path / Caminho do arquivo de config do sistema
CONFIG_DIR = Path.home() / '.hexagent-gui'
SYSTEM_CONFIG_FILE = CONFIG_DIR / 'system-config.json'


# Default system configuration / Configuração padrão do sistema
DEFAULT_SYSTEM_CONFIG = {
    "system": {
        "theme": "dark",
        "language": "auto",
        "auto_save_session": True,
        "debug_mode": False,
        "allow_infinite_mode": False
    },
    "services": {
        "flask_port": 5001,
        "hexstrike_port": 8888,
        "backend_host": "127.0.0.1",
        "hexstrike_host": "127.0.0.1",
        "hexstrike_app_path": "/home/d4r13n/iatools/hexstrike-ai"
    },
    "environment": {
        "venv_path": "/home/d4r13n/iatools/HexAgentGUI/venv"
    },
    "ui": {
        "custom_colors": {},
        "animations_enabled": True,
        "compact_mode": False,
        "block_rules": {
            "text": { "actions": ["copy", "save"], "syntax_highlight": False },
            "code": { "actions": ["copy", "save", "edit"], "syntax_highlight": True },
            "shell": { "actions": ["copy", "execute", "save"], "syntax_highlight": True, "auto_execute_hides_button": True },
            "thinking": { "actions": [], "syntax_highlight": False, "collapsed_by_default": True, "opacity": 0.6, "font_size": "0.7rem" },
            "log": { "actions": ["copy", "save"], "syntax_highlight": False },
            "readme": { "actions": ["copy", "save"], "syntax_highlight": True },
            "error": { "actions": ["copy", "save"], "syntax_highlight": False }
        }
    },
    "terminal": {
        "shell_type": "auto",
        "history_path": ""
    }
}


class SystemConfigService:
    """
    Service for managing ONLY system configuration
    Serviço para gerenciar APENAS configuração do sistema
    
    Responsibilities / Responsabilidades:
    - Load/Save system settings
    - Validate system settings
    - NO AI configuration handling!
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._ensure_config_dir()
        self._ensure_config_file()
    
    def _ensure_config_dir(self):
        """Create config directory if not exists / Criar diretório se não existir"""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        self.logger.info(f"Config directory ensured: {CONFIG_DIR}")
    
    def _ensure_config_file(self):
        """Create default config file if not exists / Criar arquivo padrão se não existir"""
        if not SYSTEM_CONFIG_FILE.exists():
            self._save_config(DEFAULT_SYSTEM_CONFIG)
            self.logger.info("Created default system-config.json")
    
    def load_system_config(self) -> Dict[str, Any]:
        """
        Load system configuration from file
        Carregar configuração do sistema do arquivo
        
        Returns EXACT file contents (no defaults merge!)
        Retorna conteúdo EXATO do arquivo (sem merge com defaults!)
        """
        self.logger.info("[SYSTEM-SERVICE] Loading system config")
        
        if not SYSTEM_CONFIG_FILE.exists():
            self.logger.warning("[SYSTEM-SERVICE] File not found, using defaults")
            return DEFAULT_SYSTEM_CONFIG.copy()
        
        try:
            with open(SYSTEM_CONFIG_FILE, 'r') as f:
                config = json.load(f)
            
            # Log what we loaded
            if 'system' in config:
                debug_val = config.get('system', {}).get('debug_mode', 'NOT_FOUND')
                self.logger.info(f"[SYSTEM-SERVICE] Loaded debug_mode = {debug_val}")
            
            return config
            
        except json.JSONDecodeError as e:
            self.logger.error(f"[SYSTEM-SERVICE] Invalid JSON: {e}")
            raise ConfigError(f"Invalid system configuration file: {e}")
        except Exception as e:
            self.logger.error(f"[SYSTEM-SERVICE] Error loading: {e}")
            # SECURITY ENFORCEMENT: Always force HexStrike to localhost on startup
            # APLICAÇÃO DE SEGURANÇA: Sempre forçar HexStrike para localhost na inicialização
            if 'services' in config:
                config['services']['hexstrike_host'] = '127.0.0.1'
                self.logger.info("[SYSTEM-SERVICE] SECURITY: Enforced HexStrike host to 127.0.0.1")

            return config
    
    def save_system_config(self, config: Dict[str, Any]):
        """
        Save system configuration to file with Deep Merge
        Salvar configuração do sistema no arquivo com Merge Profundo
        
        Merges provided config with existing one to prevent data loss on partial updates.
        Mescla config fornecida com a existente para prevenir perda de dados em atualizações parciais.
        """
        self.logger.info("[SYSTEM-SERVICE] Saving system config")
        
        try:
            # 1. Load existing config
            current_config = self.load_system_config()
            
            # 2. Deep Merge
            def deep_merge(target, source):
                for key, value in source.items():
                    if isinstance(value, dict) and key in target and isinstance(target[key], dict):
                        deep_merge(target[key], value)
                    else:
                        target[key] = value
                return target

            new_config = deep_merge(current_config, config)

            # 3. Log debug mode change
            if 'system' in new_config:
                debug_val = new_config.get('system', {}).get('debug_mode', 'NOT_FOUND')
                self.logger.info(f"[SYSTEM-SERVICE] New debug_mode = {debug_val}")
            
            # 4. Save merged config
            self._save_config(new_config)
            self.logger.info("[SYSTEM-SERVICE] System config saved successfully (Merged)")
            
        except Exception as e:
            self.logger.error(f"[SYSTEM-SERVICE] Error merging/saving config: {e}")
            raise ConfigError(f"Failed to save system config: {e}")
    
    def validate_system_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate system configuration structure
        Validar estrutura da configuração do sistema
        """
        required_keys = ['system', 'services', 'ui', 'terminal']
        
        for key in required_keys:
            if key not in config:
                self.logger.error(f"[SYSTEM-SERVICE] Missing required key: {key}")
                return False
        
        # Validate system section
        if 'debug_mode' not in config.get('system', {}):
            self.logger.error("[SYSTEM-SERVICE] Missing system.debug_mode")
            return False
        
        self.logger.info("[SYSTEM-SERVICE] Config validation passed")
        return True
    
    def _save_config(self, config: Dict[str, Any]):
        """
        Internal method to write config to file (atomic operation)
        Método interno para escrever config no arquivo (operação atômica)
        """
        try:
            # Atomic write using temp file
            temp_path = SYSTEM_CONFIG_FILE.with_suffix('.tmp')
            
            with open(temp_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            # Atomic rename
            temp_path.replace(SYSTEM_CONFIG_FILE)
            
            self.logger.debug(f"[SYSTEM-SERVICE] Wrote {len(config)} keys to file")
            
        except Exception as e:
            self.logger.error(f"[SYSTEM-SERVICE] Error writing file: {e}")
            raise ConfigError(f"Failed to save system configuration: {e}")
