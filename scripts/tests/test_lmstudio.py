#!/usr/bin/env python3
import requests
import sys
import json
import os

# CONFIG
CONFIG_FILE = os.path.expanduser("~/.hexagent-gui/ai-config.json")

def load_config():
    if not os.path.exists(CONFIG_FILE):
        print(f"[WARN] Config file not found at {CONFIG_FILE}. Using defaults.")
        return {"ai": {"engine": "lmstudio", "host": "http://127.0.0.1", "port": 1234}}
    
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load config: {e}")
        sys.exit(1)

def check_lmstudio():
    config = load_config()
    ai_conf = config.get('ai', {})
    
    base_url = f"{ai_conf.get('host', 'http://127.0.0.1')}:{ai_conf.get('port', 1234)}"
    # Normalize URL
    if not base_url.startswith('http'):
        base_url = 'http://' + base_url
        
    print(f"[*] Testing AI Engine Connection at {base_url}...")
    print(f"[*] Engine Config: {ai_conf.get('engine', 'unknown')}")
    
    try:
        # Try generic OpenAI-compatible 'models' endpoint
        url = f"{base_url}/v1/models"
        response = requests.get(url, timeout=3.0)
        
        if response.status_code == 200:
            print(f"[SUCCESS] Connected to AI Engine!")
            models = response.json()
            print(f"[INFO] Available Models: {len(models.get('data', []))}")
            return True
        else:
            print(f"[FAIL] AI Engine returned status code: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"[FAIL] Could not connect to {base_url}. Is the service running?")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = check_lmstudio()
    sys.exit(0 if success else 1)
