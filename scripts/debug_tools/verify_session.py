import sys
import os
from pathlib import Path
import json

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.session_service import SessionService

def test_session_service():
    print("Testing SessionService...")
    
    # Use a temporary directory for tests
    test_dir = Path("./temp_sessions")
    service = SessionService(test_dir)
    
    # 1. Save Session
    print("\n1. Testing Save Session...")
    data = {"foo": "bar", "test": True}
    result = service.save_session(data, "test_session_01")
    assert result['success']
    assert result['name'] == "test_session_01"
    print("✓ Save successful")
    
    # 2. Load Session
    print("\n2. Testing Load Session...")
    loaded = service.load_session("test_session_01")
    assert loaded['foo'] == "bar"
    print("✓ Load successful")
    
    # 3. List Sessions
    print("\n3. Testing List Sessions...")
    sessions = service.list_sessions()
    assert len(sessions) > 0
    assert any(s['name'] == 'test_session_01' for s in sessions)
    print(f"✓ List successful (found {len(sessions)} sessions)")
    
    # 4. Rename Session
    print("\n4. Testing Rename Session...")
    service.rename_session("test_session_01", "renamed_session")
    sessions = service.list_sessions()
    assert any(s['name'] == 'renamed_session' for s in sessions)
    print("✓ Rename successful")
    
    # 5. Delete Session
    print("\n5. Testing Delete Session...")
    service.delete_session("renamed_session")
    sessions = service.list_sessions()
    assert not any(s['name'] == 'renamed_session' for s in sessions)
    print("✓ Delete successful")
    
    # Cleanup
    import shutil
    if test_dir.exists():
        shutil.rmtree(test_dir)
    print("\nCleanup complete.")
    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    try:
        test_session_service()
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
