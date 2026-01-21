#!/usr/bin/env python3
"""
Config Verification & Merge Utility
Utilitário de Verificação e Merge de Configuração

Merges template configuration into user configuration, ensuring all new keys/fields
from the template are present in the user config while PRESERVING user values.
"""

import json
import sys
import os
import shutil
from pathlib import Path

def load_json(path):
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return None

def merge_configs(user_conf, template_conf):
    """
    Recursively merge template into user_conf.
    Only adds missing keys. Does NOT overwrite existing values.
    """
    changes_made = False
    
    for key, value in template_conf.items():
        if key not in user_conf:
            # key missing in user config -> add it from template
            user_conf[key] = value
            changes_made = True
            print(f"  [+] Added missing key: {key}")
        elif isinstance(value, dict) and isinstance(user_conf[key], dict):
            # both are dicts -> recurse
            child_changes = merge_configs(user_conf[key], value)
            if child_changes:
                changes_made = True
        # else: user has value, preserve it.
        
    return changes_made

def main():
    if len(sys.argv) != 3:
        print("Usage: verify_config.py <user_config_path> <template_config_path>")
        sys.exit(1)

    user_path = Path(sys.argv[1])
    template_path = Path(sys.argv[2])

    print(f"Verifying config: {user_path.name}...")

    if not template_path.exists():
        print(f"Error: Template not found at {template_path}")
        sys.exit(1)

    # 1. If user file doesn't exist, just copy template
    if not user_path.exists():
        print(f"  User config not found. Creating from template...")
        try:
            os.makedirs(user_path.parent, exist_ok=True)
            shutil.copy2(template_path, user_path)
            print(f"  [✓] Created {user_path}")
        except Exception as e:
            print(f"  [X] Failed to create config: {e}")
            sys.exit(1)
        return

    # 2. If exists, load and merge
    user_conf = load_json(user_path)
    template_conf = load_json(template_path)

    if user_conf is None or template_conf is None:
        print("  [X] Failed to parse JSON files. Skipping merge.")
        sys.exit(1)

    print("  Checking for updates...")
    if merge_configs(user_conf, template_conf):
        try:
            # Atomic write
            temp_path = user_path.with_suffix('.tmp')
            with open(temp_path, 'w') as f:
                json.dump(user_conf, f, indent=2)
            temp_path.replace(user_path)
            print("  [✓] Config updated with new fields (User values preserved).")
        except Exception as e:
            print(f"  [X] Failed to save updates: {e}")
            sys.exit(1)
    else:
        print("  [✓] Config is up to date.")

if __name__ == "__main__":
    main()
