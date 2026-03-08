from services.agent_config_service import AgentConfigService
import sys

service = AgentConfigService()
prompt = service.get_system_prompt('hexagent')
print("--- START PROMPT ---")
print(prompt)
print("--- END PROMPT ---")
if "[INSTRUCTIONS]" in prompt:
    print("SUCCESS")
    sys.exit(0)
else:
    print("FAILED")
    sys.exit(1)
