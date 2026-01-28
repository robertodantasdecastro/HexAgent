
import requests
import time
import sys
import json
from threading import Thread

BASE_URL = "http://127.0.0.1:5000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def test_health():
    try:
        log("Testing /health endpoint...")
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        if resp.status_code == 200:
            log("Backend is HEALTHY", "SUCCESS")
            return True
        else:
            log(f"Backend returned {resp.status_code}", "FAIL")
            return False
    except Exception as e:
        log(f"Connection failed: {e}", "FAIL")
        return False

def test_workflows():
    log("Testing /api/workflow endpoint...")
    try:
        resp = requests.get(f"{BASE_URL}/api/workflow/")
        if resp.status_code == 200:
            json_data = resp.json()
            workflows = json_data.get('data', [])
            names = [w['name'] for w in workflows]
            log(f"Found {len(workflows)} workflows: {names}", "SUCCESS")
            if "Full Penetration Test" in names:
                 return True
            else:
                 log("New workflows not found!", "FAIL")
                 return False
        else:
            log(f"Failed to list workflows: {resp.text}", "FAIL")
            return False
    except Exception as e:
        log(f"Workflow test failed: {e}", "FAIL")
        return False

def test_chat_abort():
    log("Testing Chat & Abort logic...")
    
    # 1. Start a long running request (simulated via infinite loop prompt)
    # We'll use a thread to send the requests so we can abort it
    
    def send_chat():
        try:
             # Streaming request
             resp = requests.post(f"{BASE_URL}/chat", json={
                 "prompt": "Count to 1000 slowly",
                 "stream": True,
                 "options": {"auto_execute": False}
             }, stream=True)
             
             for line in resp.iter_lines():
                 if line:
                     print(f"Chat Stream: {line[:50]}...")
        except Exception as e:
            print(f"Chat thread ended: {e}")

    # Start chat
    t = Thread(target=send_chat)
    t.start()
    
    time.sleep(2)
    
    # 2. Send Abort
    log("Sending Abort signal...", "ACTION")
    try:
        resp = requests.post(f"{BASE_URL}/chat/abort")
        if resp.status_code == 200:
            log("Abort signal sent successfully", "SUCCESS")
        else:
            log(f"Abort failed: {resp.text}", "FAIL")
    except Exception as e:
        log(f"Abort request failed: {e}", "FAIL")

    t.join(timeout=3)
    if t.is_alive():
        log("Chat thread is still alive (Abort didn't kill it immediately locally, but check backend logs)", "WARNING")
    else:
        log("Chat thread terminated", "SUCCESS")

def main():
    log("Starting Post-Deployment Verification Demo...")
    
    # Wait for server to be ready
    retries = 5
    while retries > 0:
        if test_health():
            break
        retries -= 1
        time.sleep(2)
        
    if retries == 0:
        log("Server did not start in time. Aborting.", "CRITICAL")
        sys.exit(1)
        
    if test_workflows():
        test_chat_abort()
        
    log("Demo Complete.", "DONE")

if __name__ == "__main__":
    main()
