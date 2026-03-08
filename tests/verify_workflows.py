
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.workflow_service import WorkflowService

def verify_workflows():
    service = WorkflowService()
    workflows = service.list_workflows()
    
    print(f"Found {len(workflows)} workflows.")
    
    expected = [
        "Full Penetration Test",
        "OSINT Domain Analysis",
        "Reverse Engineering"
    ]
    
    found_names = [w['name'] for w in workflows]
    
    all_found = True
    for name in expected:
        if name in found_names:
            print(f"✅ Found: {name}")
        else:
            print(f"❌ Missing: {name}")
            all_found = False
            
    if all_found:
        print("\nSUCCESS: All new workflows are active.")
    else:
        print("\nFAILURE: Some workflows are missing.")
        sys.exit(1)

if __name__ == "__main__":
    verify_workflows()
