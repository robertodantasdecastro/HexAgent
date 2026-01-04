#!/usr/bin/env python3
"""
Centralized Config Loader for HexAgentGUI Backend
Loads configuration from ~/.hexagent-gui/config/ structure
Falls back to backend/config.json if new structure not available
"""

import json
import os
from pathlib import Path

def load_config():
    """
    Load configuration from centralized structure or fallback to legacy
    Returns: dict with ai, services, ui, system sections
    """
    home = Path.home()
    config_dir = home / ".hexagent-gui" / "config"
    legacy_config = Path(__file__).parent / "config.json"
    
    # Initialize empty config
    config = {
        "ai": {},
        "services": {},
        "ui": {},
        "system": {}
    }
    
    # Try to load from new centralized structure
    if config_dir.exists():
        try:
            # Load AI configs
            if (config_dir / "ai" / "brain.json").exists():
                with open(config_dir / "ai" / "brain.json") as f:
                    brain = json.load(f)
                    config["ai"]["max_iterations"] = brain.get("max_iterations", 6)
                    config["ai"]["unlimited_iterations"] = brain.get("unlimited_iterations", False)
                    config["ai"]["language"] = brain.get("language", "auto")
                    config["ai"]["web_search_enabled"] = brain.get("use_web_search", False)
            
            if (config_dir / "ai" / "models.json").exists():
                with open(config_dir / "ai" / "models.json") as f:
                    models = json.load(f)
                    config["ai"]["model"] = models.get("default_model", "openai/gpt-4-turbo")
                    config["ai"]["temperature"] = models.get("temperature", 0.7)
            
            if (config_dir / "core" / "api_keys.json").exists():
                with open(config_dir / "core" / "api_keys.json") as f:
                    keys = json.load(f)
                    config["ai"]["api_key"] = keys.get("openai", "")
            
            if (config_dir / "ai" / "providers.json").exists():
                with open(config_dir / "ai" / "providers.json") as f:
                    providers = json.load(f)
                    # Determine default provider
                    for name, provider in providers.items():
                        if provider.get("enabled", False) and name != "custom":
                            config["ai"]["provider"] = name
                            break
            
            # Load Services configs
            if (config_dir / "core" / "servers.json").exists():
                with open(config_dir / "core" / "servers.json") as f:
                    servers = json.load(f)
                    config["services"]["flask_port"] = servers.get("flask_port", 5000)
                    config["services"]["hexstrike_port"] = servers.get("hexstrike_port", 8888)
                    config["services"]["backend_host"] = servers.get("backend_host", "127.0.0.1")
            
            # Load UI configs
            if (config_dir / "ui" / "colors.json").exists():
                with open(config_dir / "ui" / "colors.json") as f:
                    colors = json.load(f)
                    config["ui"]["custom_ansi"] = colors.get("ansi", {})
            
            if (config_dir / "preferences" / "user.json").exists():
                with open(config_dir / "preferences" / "user.json") as f:
                    prefs = json.load(f)
                    config["ui"]["theme"] = prefs.get("theme_name", "dark")
                    config["ui"]["show_iteration_markers"] = prefs.get("show_iteration_markers", True)
            
            # Load System configs
            if (config_dir / "core" / "general.json").exists():
                with open(config_dir / "core" / "general.json") as f:
                    general = json.load(f)
                    config["system"]["cleanup_on_exit"] = general.get("cleanup_on_exit", False)
                    config["system"]["auto_save_session"] = general.get("auto_save", True)
            
            if (config_dir / "terminal" / "shell.json").exists():
                with open(config_dir / "terminal" / "shell.json") as f:
                    shell = json.load(f)
                    config["system"]["shell_type"] = shell.get("shell_type", "auto")
                    config["system"]["shell_history_path"] = shell.get("shell_history_path", "")
                    config["system"]["terminal_theme"] = shell.get("color_scheme", "kali-zsh")
            
            print("[Config] Loaded from centralized structure: ~/.hexagent-gui/config/")
            return config
            
        except Exception as e:
            print(f"[Config] Error loading centralized config: {e}")
            print("[Config] Falling back to legacy config.json")
    
    # Fallback to legacy config.json
    if legacy_config.exists():
        with open(legacy_config) as f:
            config = json.load(f)
            print("[Config] Loaded from legacy: backend/config.json")
            return config
    
    print("[Config] WARNING: No config found, using hardcoded defaults")
    return config

if __name__ == "__main__":
    # Test the loader
    cfg = load_config()
    print(json.dumps(cfg, indent=2))
