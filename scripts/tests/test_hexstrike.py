#!/usr/bin/env python3
import socket
import sys
import json
import os

# CONFIG
CONFIG_FILE = os.path.expanduser("~/.hexagent-gui/system-config.json")

def load_config():
    if not os.path.exists(CONFIG_FILE):
        print(f"[WARN] Config file not found at {CONFIG_FILE}. Using defaults.")
        return {"services": {"hexstrike_port": 8888, "hexstrike_host": "127.0.0.1"}}
    
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load config: {e}")
        return {"services": {"hexstrike_port": 8888, "hexstrike_host": "127.0.0.1"}}

def check_hexstrike():
    config = load_config()
    port = config.get('services', {}).get('hexstrike_port', 8888)
    host = config.get('services', {}).get('hexstrike_host', '127.0.0.1')
    
    print(f"[*] Testing HexStrike Connection on {host}:{port}...")
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2.0)
    try:
        result = sock.connect_ex((host, port))
        if result == 0:
            print(f"[SUCCESS] HexStrike is RUNNING and LISTENING on port {port}.")
            return True
        else:
            print(f"[FAIL] Port {port} is closed. HexStrike is NOT running or firewalled.")
            return False
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return False
    finally:
        sock.close()

if __name__ == "__main__":
    success = check_hexstrike()
    sys.exit(0 if success else 1)
