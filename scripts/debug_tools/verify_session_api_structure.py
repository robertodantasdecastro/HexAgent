import sys
import os
import json
from flask import Flask

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from app import create_app

def verify_structure():
    print("Verifying Session API Structure...")
    app = create_app(core_ref=None)
    app.config['TESTING'] = True
    client = app.test_client()
    
    # Create a dummy session to ensure list isn't empty (optional, but good)
    client.post('/save_session', json={'session_name': 'structure_test', 'session_data': {'test': 1}})
    
    response = client.post('/sessions', json={'action': 'list'})
    data = response.get_json()
    
    print("\nResponse JSON Structure:")
    print(json.dumps(data, indent=2))
    
    # Verification Logic
    if not data.get('success'):
        print("❌ API reported failure")
        sys.exit(1)
        
    if 'data' not in data:
        print("❌ Missing 'data' wrapper (Root issue?)")
        # If this is missing, then my fix data.data.sessions is WRONG
        # and it should have been data.sessions
        sys.exit(1)
        
    inner_data = data['data']
    if 'sessions' not in inner_data:
        print("❌ Missing 'sessions' inside 'data'")
        sys.exit(1)
        
    if not isinstance(inner_data['sessions'], list):
        print("❌ 'sessions' is not a list")
        sys.exit(1)
        
    print("\n✅ Structure confirmed: root -> data -> sessions")
    
    # Cleanup
    client.post('/sessions', json={'action': 'delete', 'session_name': 'structure_test'})

if __name__ == "__main__":
    verify_structure()
