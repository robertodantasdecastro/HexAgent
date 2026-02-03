
import requests
import time
import sys
import json
import os

BASE_URL = "http://127.0.0.1:5000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def check_backend():
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        return resp.status_code == 200
    except:
        return False

def configure_openrouter():
    log("Configuring OpenRouter as active provider...", "ACTION")
    
    # We need the API Key to be present. Assuming it's in env or user must provide it.
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        # Try to read from existing config if not in env
        try:
             with open("/home/d4r13n/.hexagent-gui/ai-config.json", "r") as f:
                 data = json.load(f)
                 # Try to find OpenRouter specific key
                 candidates = [
                     data.get("api_key"),
                     data.get("ai", {}).get("api_key")
                 ]
                 for key in candidates:
                     if key and key.startswith("sk-or-v1"):
                         api_key = key
                         break
                 
                 # Fallback to whatever is in ai.api_key if no OR key found
                 if not api_key:
                     api_key = data.get("ai", {}).get("api_key")
        except:
            pass
            
    if not api_key:
        log("No API Key found for OpenRouter! Please set OPENROUTER_API_KEY env or config.", "FAIL")
        return False

    payload = {
        "config": {
            "ai": {
                "engine": "openrouter",
                "model": "microsoft/phi-3-mini-128k-instruct:free", # Using working free model
                "api_key": api_key,
                "temperature": 0.7
            }
        }
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/config/ai", json=payload)
        if resp.status_code == 200:
            log("Switched to OpenRouter successfully", "SUCCESS")
            return True
        else:
            log(f"Failed to switch provider: {resp.text}", "FAIL")
            return False
    except Exception as e:
        log(f"Config request failed: {e}", "FAIL")
        return False

def test_inference():
    log("Testing Inference via OpenRouter...", "ACTION")
    
    payload = {
        "prompt": "Hello via OpenRouter! What is 2+2?",
        "stream": False,
        "options": {"auto_execute": False}
    }
    
    try:
        start_time = time.time()
        resp = requests.post(f"{BASE_URL}/chat", json=payload, timeout=30)
        duration = time.time() - start_time
        
        if resp.status_code == 200:
            data = resp.json().get('data', {})
            content = data.get('response', '')
            log(f"Inference Successful ({duration:.2f}s)", "SUCCESS")
            print(f"\nResponse: {content}\n")
            return True
        else:
            log(f"Inference Failed: {resp.text}", "FAIL")
            return False
            
    except Exception as e:
        log(f"Inference Error: {e}", "FAIL")
        return False

def main():
    log("Starting OpenRouter Verification...", "INIT")
    
    if not check_backend():
        log("Backend is OFFLINE. Please start it.", "FAIL")
        sys.exit(1)
        
    if configure_openrouter():
        time.sleep(1) # Wait for reload
        test_inference()

if __name__ == "__main__":
    main()
