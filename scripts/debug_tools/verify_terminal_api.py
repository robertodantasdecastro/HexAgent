import sys
import os
import time
import json
import threading

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import create_app

def test_terminal_controller():
    print("Testing TerminalController...")
    
    # Initialize App (Mocking AgentCore as None)
    app = create_app(core_ref=None)
    app.config['TESTING'] = True
    client = app.test_client()
    
    # 1. Test Input (Should start PTY implicitely)
    print("\n1. Testing Write Input...")
    response = client.post('/terminal/input', json={'data': 'echo Hello_API\n'})
    assert response.status_code == 200
    print("✓ Input accepted")
    
    # 2. Test Resize
    print("\n2. Testing Resize...")
    response = client.post('/terminal/resize', json={'cols': 100, 'rows': 30})
    assert response.status_code == 200
    print("✓ Resize successful")
    
    # 3. Test Stream (SSE)
    print("\n3. Testing Output Stream...")
    
    # We can't easily consume infinite stream in blocking test client, 
    # but we can check if it returns valid initial headers.
    response = client.get('/terminal/stream')
    assert response.status_code == 200
    assert 'text/event-stream' in response.content_type
    print("✓ Stream endpoint accessible")
    
    # Optional: Read a few bytes from stream to ensure it doesn't crash
    # Warning: Iterating response in test client might block if no data
    # We skip deep stream verification here as pty_service verified the logic
    
    print("\nALL API TESTS PASSED")

if __name__ == "__main__":
    try:
        test_terminal_controller()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        # sys.exit(1) # Don't exit on error to allow viewing output, but here we want strict check
        sys.exit(1)
