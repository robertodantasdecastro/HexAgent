#!/usr/bin/env python3
"""
Test AI Config Validation
Teste de Validação de Configuração de IA

Verifies that the backend rejects invalid configurations (e.g. OpenAI without API key).
Verifica se o backend rejeita configurações inválidas.
"""

import requests
import sys
import json

BASE_URL = "http://localhost:5000"

def test_validation():
    print("[-] Testing Strict Validation...")
    
    # 1. Test Valid Local Config (Should Pass)
    # 1. Testar Config Local Válida (Deve Passar)
    valid_local = {
        "config": {
            "ai": {
                "engine": "lmstudio",
                "model": "mistral",
                "host": "http://localhost",
                "port": 1234
            }
        }
    }
    
    try:
        res = requests.post(f"{BASE_URL}/config/ai", json=valid_local)
        if res.status_code == 200:
            print(f"[PASS] Valid Local Config accepted")
        else:
            print(f"[FAIL] Valid Local Config rejected: {res.text}")
            return False
            
        # 2. Test Invalid Online Config (Missing Key - Should Fail)
        # 2. Testar Config Online Inválida (Sem Chave - Deve Falhar)
        invalid_online = {
            "config": {
                "ai": {
                    "engine": "openai",
                    "model": "gpt-4",
                    "api_key": "" # Empty key
                }
            }
        }
        
        res = requests.post(f"{BASE_URL}/config/ai", json=invalid_online)
        if res.status_code == 400: # Expected Bad Request or similar
            print(f"[PASS] Invalid Online Config correctly rejected (400)")
            print(f"       Message: {res.json().get('message')}")
        else:
            print(f"[FAIL] Invalid Config was NOT rejected! Status: {res.status_code}")
            return False

        # 3. Test Invalid Local Config (Bad Host - Should Log Warning but Might Pass based on logic, checking service)
        # Actually my service code only warns for Host, so this might pass. Clean OOP separation implies we trust the user for local networks unless it's malformed.
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Connection failed: {e}")
        return False

if __name__ == "__main__":
    if test_validation():
        print("\nAll Validation Tests Passed!")
        sys.exit(0)
    else:
        print("\nValidation Tests Failed!")
        sys.exit(1)
