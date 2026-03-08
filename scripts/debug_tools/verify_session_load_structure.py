import sys
import os
import json
from flask import Flask

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import create_app

def verify_load_structure():
    print("Verifying Session Load API Structure...")
    app = create_app(core_ref=None)
    app.config['TESTING'] = True
    client = app.test_client()
    
    # 1. Save a valid session
    session_name = 'load_test_verification'
    blocks = [{'id': '1', 'type': 'user', 'content': 'hello'}, {'id': '2', 'type': 'assistant', 'content': 'hi'}]
    
    print(f"Saving session '{session_name}'...")
    save_resp = client.post('/save_session', json={
        'session_name': session_name,
        'session_data': {'blocks': blocks}
    })
    
    if save_resp.status_code != 200:
        print(f"❌ Save failed: {save_resp.get_json()}")
        sys.exit(1)
        
    # 2. Load the session
    print(f"Loading session '{session_name}'...")
    load_resp = client.get(f'/load_session?session_name={session_name}')
    data = load_resp.get_json()
    
    print("\nResponse JSON Structure:")
    print(json.dumps(data, indent=2))
    
    # 3. Analyze Structure
    if not data.get('success'):
        print("❌ Load reported failure")
        sys.exit(1)
        
    # Check nesting
    if 'data' in data and 'session_data' in data['data']:
        session_data = data['data']['session_data']
        print("✅ Found data.session_data")
    elif 'session_data' in data:
        session_data = data['session_data']
        print("✅ Found root.session_data")
    else:
        print("❌ Could not find session_data in response")
        sys.exit(1)
        
    if 'blocks' not in session_data:
        print("❌ 'blocks' missing in session_data")
        # Check if Metadata is there
        if 'metadata' in session_data:
             print("ℹ️ Metadata found, but blocks missing?")
        sys.exit(1)
        
    loaded_blocks = session_data['blocks']
    if len(loaded_blocks) != 2:
        print(f"❌ Block count mismatch. Expected 2, got {len(loaded_blocks)}")
        sys.exit(1)
        
    print("\n✅ Structure confirmed! Backend returns: data -> session_data -> { blocks: [...] }")
    
    # Cleanup
    client.post('/sessions', json={'action': 'delete', 'session_name': session_name})

if __name__ == "__main__":
    verify_load_structure()
