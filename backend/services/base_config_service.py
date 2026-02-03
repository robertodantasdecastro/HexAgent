"""
Base Configuration Service
Serviço Base de Configuração

Abstract base class for all configuration services to ensure consistency,
file locking, and error handling.
Classe base abstrata para todos os serviços de configuração para garantir consistência,
bloqueio de arquivo e tratamento de erro.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

import os
import json
import fcntl
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pathlib import Path
import logging

from core.errors import ConfigError

logger = logging.getLogger(__name__)

class BaseConfigService(ABC):
    """
    Abstract Base Class for Config Services
    Classe Base Abstrata para Serviços de Configuração
    """
    
    def __init__(self, config_filename: str):
        """
        Initialize with config filename
        Inicializa com nome do arquivo de configuração
        
        Args:
            config_filename: Name of the JSON file (e.g. 'profile.json')
        """
        self.config_dir = self._ensure_config_dir()
        self.config_file = self.config_dir / config_filename
        self._default_config = self._get_default_config()

    @abstractmethod
    def _get_default_config(self) -> Dict[str, Any]:
        """
        Return the default configuration dictionary
        Retorna o dicionário de configuração padrão
        """
        pass

    def _ensure_config_dir(self) -> Path:
        """
        Ensure configuration directory exists
        Garante que o diretório de configuração existe
        """
        home = Path.home()
        config_dir = home / '.hexagent-gui'
        config_dir.mkdir(parents=True, exist_ok=True)
        return config_dir

    def load_config(self) -> Dict[str, Any]:
        """
        Load configuration from file with fallback to default
        Carrega configuração do arquivo com fallback para padrão
        """
        if not self.config_file.exists():
            logger.info(f"Config file {self.config_file} not found, creating default.")
            self.save_config(self._default_config)
            return self._default_config

        try:
            with open(self.config_file, 'r') as f:
                # File locking for read safety
                fcntl.flock(f, fcntl.LOCK_SH)
                try:
                    data = json.load(f)
                    # Merge with defaults to ensure new keys exist
                    # Mesclar com padrões para garantir que novas chaves existam
                    return self._deep_merge(self._default_config.copy(), data)
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)
                    
        except json.JSONDecodeError:
            logger.error(f"Corrupted config file: {self.config_file}. Using defaults.")
            return self._default_config
        except Exception as e:
            logger.error(f"Failed to load config {self.config_file}: {e}")
            raise ConfigError(f"Failed to load config: {e}")

    def save_config(self, config: Dict[str, Any]) -> None:
        """
        Save configuration to file with atomic write and locking
        Salva configuração em arquivo com escrita atômica e bloqueio
        """
        try:
            # Atomic write pattern: write to temp, then rename
            # Padrão de escrita atômica: escrever em temp, depois renomear
            temp_file = self.config_file.with_suffix('.tmp')
            
            with open(temp_file, 'w') as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                try:
                    json.dump(config, f, indent=2)
                    f.flush()
                    os.fsync(f.fileno())
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)
            
            # Atomic rename / Renomeação atômica
            temp_file.replace(self.config_file)
            logger.info(f"Configuration saved to {self.config_file}")
            
        except Exception as e:
            logger.error(f"Failed to save config {self.config_file}: {e}")
            raise ConfigError(f"Failed to save config: {e}")

    def _deep_merge(self, base: Dict, update: Dict) -> Dict:
        """
        Recursive merge of dictionaries
        Mesclagem recursiva de dicionários
        """
        for k, v in update.items():
            if k in base and isinstance(base[k], dict) and isinstance(v, dict):
                self._deep_merge(base[k], v)
            else:
                base[k] = v
        return base
