"""
NEW Configuration Service - Simplified OOP Approach
Novo Serviço de Configuração - Abordagem POO Simplificada

CRITICAL: NO MERGE LOGIC - Direct file read/write only!
CRÍTICO: SEM LÓGICA DE MERGE - Apenas leitura/escrita direta do arquivo!
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any
from core.errors import ConfigError


# Simplified paths / Caminhos simplificados
CONFIG_DIR = Path.home() / '.hexagent-gui'
SYSTEM_CONFIG_FILE = CONFIG_DIR / 'system-config.json'
AI_CONFIG_FILE = CONFIG_DIR / 'ai-config.json'


class ConfigService:
    """
    SIMPLIFIED Configuration Service - Direct file operations only
    Serviço de Configuração SIMPLIFICADO - Apenas operações diretas em arquivo
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._ensure_config_dir()
    
    def _ensure_config_dir(self):
        """Create config directory if not exists / Criar diretório se não existe"""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    
    # =================================================================
    # LOAD OPERATIONS - Direct file read, minimal defaults
    # OPERAÇÕES DE CARREGAMENTO - Leitura direta, defaults mínimos
    # =================================================================
    
    def load_full_config(self) -> Dict[str, Any]:
        """
        Load complete configuration from files
        Carrega configuração completa dos arquivos
        
        Returns file contents DIRECTLY with minimal defaults
        Retorna conteúdo do arquivo DIRETAMENTE com defaults mínimos
        """
        self.logger.info("[NEW-SERVICE] load_full_config called")
        
        system = self._load_json_file(SYSTEM_CONFIG_FILE)
        ai = self._load_json_file(AI_CONFIG_FILE)
        
        # Merge sections
        result = {**system, **ai}
        
        # Log what we're returning
        if 'system' in result:
            debug_val = result.get('system', {}).get('debug_mode', 'NOT_FOUND')
            self.logger.info(f"[NEW-SERVICE] Returning debug_mode = {debug_val}")
        
        return result
    
    def load_system_config(self) -> Dict[str, Any]:
        """Load system config from file / Carrega config do sistema do arquivo"""
        return self._load_json_file(SYSTEM_CONFIG_FILE)
    
    def load_ai_config(self) -> Dict[str, Any]:
        """Load AI config from file / Carrega config de IA do arquivo"""
        return self._load_json_file(AI_CONFIG_FILE)
    
    # =================================================================
    # SAVE OPERATIONS - Direct file write
    # OPERAÇÕES DE SALVAMENTO - Escrita direta no arquivo
    # =================================================================
    
    def save_full_config(self, config: Dict[str, Any]):
        """
        Save complete configuration - splits into system/AI files
        Salva configuração completa - divide em arquivos sistema/IA
        """
        self.logger.info(f"[NEW-SERVICE] save_full_config called with keys: {list(config.keys())}")
        
        # Extract system config
        system_config = {
            k: v for k, v in config.items()
            if k in ['system', 'services', 'ui', 'terminal']
        }
        
        if 'system' in system_config:
            debug_val = system_config.get('system', {}).get('debug_mode', 'NOT_FOUND')
            self.logger.info(f"[NEW-SERVICE] Saving system debug_mode = {debug_val}")
        
        if system_config:
            self._save_json_file(SYSTEM_CONFIG_FILE, system_config)
        
        # Extract AI config
        ai_config = {k: v for k, v in config.items() if k in ['ai']}
        if ai_config:
            self._save_json_file(AI_CONFIG_FILE, ai_config)
        
        self.logger.info("[NEW-SERVICE] Config saved successfully")
    
    def save_system_config(self, config: Dict[str, Any]):
        """Save system config to file / Salva config do sistema no arquivo"""
        self._save_json_file(SYSTEM_CONFIG_FILE, config)
        self.logger.info("System configuration saved")
    
    def save_ai_config(self, config: Dict[str, Any]):
        """Save AI config to file / Salva config de IA no arquivo"""
        self._save_json_file(AI_CONFIG_FILE, config)
        self.logger.info("AI configuration saved")
    
    # =================================================================
    # PRIVATE HELPERS - Ultra simple file I/O
    # FUNÇÕES PRIVADAS - I/O de arquivo ultra simples
    # =================================================================
    
    def _load_json_file(self, filepath: Path) -> Dict[str, Any]:
        """
        Load JSON file - returns EXACT contents or EMPTY dict
        Carrega arquivo JSON - retorna conteúdo EXATO ou dict VAZIO
        
        NO DEFAULT MERGING!
        SEM MERGE COM DEFAULTS!
        """
        if not filepath.exists():
            self.logger.warning(f"[NEW-SERVICE] File not found: {filepath}, returning empty dict")
            return {}
        
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            self.logger.info(f"[NEW-SERVICE] Loaded {len(data)} keys from {filepath.name}")
            return data
            
        except json.JSONDecodeError as e:
            self.logger.error(f"[NEW-SERVICE] Invalid JSON in {filepath}: {e}")
            raise ConfigError(f"Invalid configuration file: {filepath.name}")
        except Exception as e:
            self.logger.error(f"[NEW-SERVICE] Error reading {filepath}: {e}")
            return {}
    
    def _save_json_file(self, filepath: Path, data: Dict[str, Any]):
        """
        Save JSON file - writes EXACT data provided
        Salva arquivo JSON - escreve dados EXATOS fornecidos
        """
        try:
            # Atomic write using temp file
            temp_path = filepath.with_suffix('.tmp')
            
            with open(temp_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            # Atomic rename
            temp_path.replace(filepath)
            
            self.logger.info(f"[NEW-SERVICE] Saved {len(data)} keys to {filepath.name}")
            
        except Exception as e:
            self.logger.error(f"[NEW-SERVICE] Error writing {filepath}: {e}")
            raise ConfigError(f"Failed to save configuration: {e}")
