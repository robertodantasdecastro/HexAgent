
import json
import sys
import os
from pathlib import Path

CONFIG_PATH = Path.home() / ".hexagent-gui" / "system-config.json"

def toggle_debug(enable=True):
    if not CONFIG_PATH.exists():
        print(f"Config file not found: {CONFIG_PATH}")
        return

    try:
        with open(CONFIG_PATH, 'r') as f:
            config = json.load(f)
        
        # Ensure 'system' key exists
        if 'system' not in config:
            config['system'] = {}
            
        config['system']['debug_mode'] = enable
        print(f"Debug mode set to: {enable}")
        
        with open(CONFIG_PATH, 'w') as f:
            json.dump(config, f, indent=4)
            
    except Exception as e:
        print(f"Error modifying config: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--enable":
        toggle_debug(True)
    elif len(sys.argv) > 1 and sys.argv[1] == "--disable":
        toggle_debug(False)
    else:
        print("Usage: python3 debug_tools.py --enable | --disable")
