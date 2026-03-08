
import requests
import json
import sseclient

BASE_URL = "http://127.0.0.1:5001"

def test_execution_cycle():
    print("Testing /execute_and_analyze endpoint...")
    
    payload = {
        "command": "echo 'HexAgent Cycle Test'",
        "context": [],
        "options": {
            "auto_execute": False,
            "max_iterations": 1
        }
    }
    
    try:
        print("Sending request...")
        response = requests.post(
            f"{BASE_URL}/execute_and_analyze", 
            json=payload, 
            stream=True,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print("Error:", response.text)
            return

        print("Connected! Reading stream...")
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                print(f"Raw Line: {decoded_line}", flush=True)
                
        print("\n\n--- Test Complete ---")
        
    except Exception as e:
        print(f"Test Failed: {e}")

if __name__ == "__main__":
    test_execution_cycle()
