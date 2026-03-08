"""
Application Constants
Constantes da Aplicação

Centralized location for all application constants, paths,
and configuration defaults.

Local centralizado para todas as constantes da aplicação,
caminhos e padrões de configuração.
"""

import os
from pathlib import Path

# Paths / Caminhos
HOME_DIR = Path.home()
CONFIG_DIR = HOME_DIR / '.hexagent-gui'
WORKSPACE_DIR = CONFIG_DIR
TMP_DIR = CONFIG_DIR / 'tmp'

# Config Files / Arquivos de Configuração
SYSTEM_CONFIG_FILE = CONFIG_DIR / 'system-config.json'
AI_CONFIG_FILE = CONFIG_DIR / 'ai-config.json'
LEGACY_CONFIG_FILE = CONFIG_DIR / 'config.json'

# Default Ports / Portas Padrão
DEFAULT_FLASK_PORT = 5001
DEFAULT_HEXSTRIKE_PORT = 8888

# Default Config Values / Valores Padrão de Configuração
DEFAULT_SYSTEM_CONFIG = {
    "system": {
        "theme": "dark",
        "auto_save_session": True,
        "debug_mode": False,
        "cleanup_on_exit": False,
        "shell_type": "auto",
        "language": "auto"
    },
    "services": {
        "flask_port": 5001,
        "hexstrike_port": DEFAULT_HEXSTRIKE_PORT,
        "backend_host": "127.0.0.1"
    },
    "ui": {
        "custom_colors": {},
        "animations_enabled": True,
        "compact_mode": False,
        "show_iteration_markers": True
    },
    "terminal": {
        "shell_type": "auto",
        "history_path": "",
        "terminal_theme": "kali-zsh"
    }
}

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

# HTTP Status Codes / Códigos de Status HTTP
HTTP_OK = 200
HTTP_CREATED = 201
HTTP_BAD_REQUEST = 400
HTTP_UNAUTHORIZED = 401
HTTP_FORBIDDEN = 403
HTTP_NOT_FOUND = 404
HTTP_INTERNAL_ERROR = 500
HTTP_SERVICE_UNAVAILABLE = 503
