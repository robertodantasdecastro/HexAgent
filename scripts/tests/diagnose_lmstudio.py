#!/usr/bin/env python3
"""
LM Studio Connection Diagnostic Tool
Ferramenta de Diagnóstico de Conexão LM Studio

Tests connectivity and validates configuration for HexAgentGUI
Testa conectividade e valida configuração para HexAgentGUI

@author: Antigravity (Omega Cognition Architect)
@version: 1.0.0
"""

import json
import sys
import requests
from pathlib import Path
from typing import Dict, Any, Tuple

# ANSI Colors for output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
BOLD = '\033[1m'
RESET = '\033[0m'

CONFIG_FILE = Path.home() / '.hexagent-gui' / 'ai-config.json'


def print_header(text: str):
    """Print formatted header"""
    print(f"\n{BLUE}{BOLD}{'='*70}{RESET}")
    print(f"{BLUE}{BOLD}{text:^70}{RESET}")
    print(f"{BLUE}{BOLD}{'='*70}{RESET}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{GREEN}✓{RESET} {text}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{YELLOW}⚠{RESET} {text}")


def print_error(text: str):
    """Print error message"""
    print(f"{RED}✗{RESET} {text}")


def print_info(key: str, value: Any):
    """Print key-value info"""
    print(f"  {BOLD}{key}:{RESET} {value}")


def load_config() -> Tuple[bool, Dict[str, Any]]:
    """
    Load AI configuration from ~/.hexagent-gui/ai-config.json
    Carregar configuração IA de ~/.hexagent-gui/ai-config.json
    
    Returns: (success, config_dict)
    """
    if not CONFIG_FILE.exists():
        return False, {}
    
    try:
        with open(CONFIG_FILE, 'r') as f:
            return True, json.load(f)
    except Exception as e:
        print_error(f"Failed to parse config: {e}")
        return False, {}


def build_base_url(config: Dict[str, Any]) -> str:
    """
    Build base_url using same logic as backend helper
    Construir base_url usando mesma lógica do helper backend
    
    Mimics: InferenceStrategy._build_base_url()
    """
    ai_conf = config.get('ai', {})
    
    # Priority 1: base_url
    if 'base_url' in ai_conf and ai_conf['base_url']:
        return ai_conf['base_url'].rstrip('/')
    
    # Priority 2: host + port
    if 'host' in ai_conf and ai_conf['host']:
        host = ai_conf['host'].rstrip('/')
        port = ai_conf.get('port')
        
        if port:
            base_url = f"{host}:{port}"
        else:
            base_url = host
        
        # OpenAI-compatible APIs need /v1 suffix
        # APIs compatíveis com OpenAI precisam de sufixo /v1
        if ai_conf.get('engine', '').lower() in ['openai', 'lmstudio']:
            base_url = f"{base_url}/v1"
        
        return base_url
    
    # Priority 3: Default
    return "https://api.openai.com/v1"


def test_connection(base_url: str, api_key: str, timeout: int = 5) -> Tuple[bool, str, Any]:
    """
    Test connection to AI engine
    Testar conexão com motor IA
    
    Returns: (success, message, response_data)
    """
    # Try models endpoint (OpenAI-compatible)
    models_url = f"{base_url}/models"
    
    headers = {}
    if api_key and api_key.startswith('sk-'):
        headers['Authorization'] = f"Bearer {api_key}"
    
    try:
        response = requests.get(models_url, headers=headers, timeout=timeout)
        
        if response.status_code == 200:
            data = response.json()
            model_count = len(data.get('data', []))
            return True, f"Connected! Found {model_count} models", data
        elif response.status_code == 401:
            return False, "Authentication failed (invalid API key)", None
        elif response.status_code == 404:
            return False, f"Endpoint not found (tried {models_url})", None
        else:
            return False, f"HTTP {response.status_code}: {response.text[:100]}", None
            
    except requests.exceptions.ConnectionError as e:
        return False, f"Connection refused - Server is offline or unreachable", None
    except requests.exceptions.Timeout:
        return False, f"Connection timeout after {timeout}s", None
    except Exception as e:
        return False, f"Unexpected error: {str(e)}", None


def main():
    """Main diagnostic routine"""
    print_header("HexAgentGUI - LM Studio Connection Diagnostic")
    
    # Step 1: Load Configuration
    print(f"{BOLD}[1] Loading Configuration from {CONFIG_FILE}{RESET}")
    success, config = load_config()
    
    if not success or not config:
        print_error("Configuration file not found or invalid")
        print_info("Expected location", str(CONFIG_FILE))
        sys.exit(1)
    
    print_success("Configuration loaded")
    
    # Extract AI config
    ai_conf = config.get('ai', {})
    if not ai_conf:
        print_error("No 'ai' section found in configuration")
        sys.exit(1)
    
    # Display configuration
    print(f"\n{BOLD}Configuration Details:{RESET}")
    print_info("Engine", ai_conf.get('engine', 'N/A'))
    print_info("Model", ai_conf.get('model', 'N/A'))
    print_info("Host", ai_conf.get('host', 'N/A'))
    print_info("Port", ai_conf.get('port', 'N/A'))
    print_info("API Key", f"{ai_conf.get('api_key', '')[:10]}..." if ai_conf.get('api_key') else 'N/A')
    
    # Step 2: Build base_url
    print(f"\n{BOLD}[2] Building base_url{RESET}")
    base_url = build_base_url(config)
    print_info("Constructed base_url", base_url)
    
    # Step 3: Test Connection
    print(f"\n{BOLD}[3] Testing Connection{RESET}")
    print(f"    Target: {base_url}/models")
    print("    Timeout: 5s")
    print("    Testing...")
    
    success, message, data = test_connection(
        base_url,
        ai_conf.get('api_key', ''),
        timeout=5
    )
    
    if success:
        print_success(message)
        
        # Display available models
        if data and 'data' in data:
            print(f"\n{BOLD}Available Models:{RESET}")
            for idx, model in enumerate(data['data'][:10], 1):  # Show first 10
                model_id = model.get('id', 'unknown')
                print(f"  {idx}. {model_id}")
            
            if len(data['data']) > 10:
                remaining = len(data['data']) - 10
                print(f"  ... and {remaining} more")
        
        print(f"\n{GREEN}{BOLD}✓ DIAGNOSIS: Connection OK - LM Studio is running{RESET}")
        sys.exit(0)
    else:
        print_error(message)
        
        # Provide troubleshooting steps
        print(f"\n{YELLOW}{BOLD}⚠ DIAGNOSIS: LM Studio is NOT running{RESET}")
        print(f"\n{BOLD}Troubleshooting Steps:{RESET}")
        print("  1. Verify LM Studio is running on the target machine")
        print(f"     • Target: {ai_conf.get('host', 'N/A')}:{ai_conf.get('port', 'N/A')}")
        print("     • Check if LM Studio server is started")
        print("     • Verify firewall allows port 1234")
        print("")
        print("  2. Test connectivity manually:")
        print(f"     curl {base_url}/models")
        print("")
        print("  3. If using remote server:")
        print("     • Check network connectivity")
        print("     • Verify IP address is correct")
        print("     • Test with: ping 192.168.0.111")
        print("")
        print("  4. Try changing to local LM Studio:")
        print("     • Host: http://localhost")
        print("     • Port: 1234")
        
        sys.exit(1)


if __name__ == "__main__":
    main()
