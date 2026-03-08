import sys
import os

# Add backend to path
sys.path.append('/home/d4r13n/iatools/HexAgentGUI/backend')

try:
    from core.agent_core import AgentCore
    print("AgentCore imported successfully.")
    
    if hasattr(AgentCore, 'shutdown'):
        print("SUCCESS: AgentCore class has 'shutdown' method.")
    else:
        print("FAILURE: AgentCore class does NOT have 'shutdown' method.")
        
    # Check instance
    try:
        core = AgentCore(engine='test_mock', provider_kwargs={'api_key': 'mock', 'model': 'mock'})
        if hasattr(core, 'shutdown'):
             print("SUCCESS: AgentCore instance has 'shutdown' method.")
        else:
             print("FAILURE: AgentCore instance does NOT have 'shutdown' method.")
    except Exception as e:
        print(f"Instance creation failed (expected with mock): {e}")
        # Even if init fails, we checked the class. 

except Exception as e:
    print(f"Import failed: {e}")
