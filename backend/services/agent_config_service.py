"""
Agent Configuration Service
Serviço de Configuração do Agente

Handles loading and saving of Agent Personas and System Prompts.
Gerencia carregamento e salvamento de Personas do Agente e Prompts do Sistema.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any

# Paths
CONFIG_DIR = Path.home() / '.hexagent-gui'
AGENTS_DIR = CONFIG_DIR / 'agents'
DEFAULT_AGENT_FILE = AGENTS_DIR / 'hexagent.json'
TEMPLATE_DIR = Path(__file__).parent.parent.parent / 'config_templates' / 'agents'

class AgentConfigService:
    """
    Service for managing Agent Personality/Configuration
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._ensure_agents_dir()
        
    def _ensure_agents_dir(self):
        """Ensure agents directory and default persona exist"""
        if not AGENTS_DIR.exists():
            AGENTS_DIR.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"Created agents directory: {AGENTS_DIR}")
            
        if not DEFAULT_AGENT_FILE.exists():
            # Try to copy from template if available
            template_path = TEMPLATE_DIR / 'hexagent.json'
            if template_path.exists():
                try:
                    with open(template_path, 'r') as src:
                        content = src.read()
                    with open(DEFAULT_AGENT_FILE, 'w') as dst:
                        dst.write(content)
                    self.logger.info("Initialized default hexagent.json from template")
                except Exception as e:
                    self.logger.error(f"Failed to copy agent template: {e}")
                    self._create_fallback_agent()
            else:
                self._create_fallback_agent()
                
    def _create_fallback_agent(self):
        """Create a basic fallback agent config"""
        fallback = {
            "agent": {
                "name": "HexAgent",
                "role": "Assistant",
                "system_prompt": "You are a helpful AI assistant."
            }
        }
        try:
            with open(DEFAULT_AGENT_FILE, 'w') as f:
                json.dump(fallback, f, indent=2)
            self.logger.info("Created fallback hexagent.json")
        except Exception as e:
            self.logger.error(f"Failed to create fallback agent: {e}")

    def load_agent_config(self, agent_name: str = 'hexagent') -> Dict[str, Any]:
        """Load specific agent configuration"""
        target_file = AGENTS_DIR / f"{agent_name}.json"
        
        if not target_file.exists():
            self.logger.warning(f"Agent config {agent_name} not found. Using default.")
            target_file = DEFAULT_AGENT_FILE
            
        try:
            with open(target_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Failed to load agent config: {e}")
            return {}

    def get_system_prompt(self, agent_name: str = 'hexagent') -> str:
        """Get just the system prompt for an agent"""
        config = self.load_agent_config(agent_name)
        
        # Advanced HexStrike Persona Format (if it has instructions or role)
        if 'instructions' in config or 'role' in config:
             return self._compile_advanced_persona(config)

        # Legacy/Simple Format (Fallback)
        if 'agent' in config and 'system_prompt' in config['agent']:
             return config['agent']['system_prompt']
             
        return ""

    def _compile_advanced_persona(self, config: Dict[str, Any]) -> str:
        """Compile an advanced persona JSON into a system prompt string"""
        prompt = []
        name = config.get('name', 'Operator')
        role = config.get('role', 'Agent')
        description = config.get('description', '')
        
        prompt.append(f"You are {name}, {role}.")
        if description:
             prompt.append(description)
             
        prompt.append("\n[INSTRUCTIONS]")
        instructions = config.get('instructions', [])
        if isinstance(instructions, list):
             for inst in instructions:
                 prompt.append(inst)
        elif isinstance(instructions, str):
             prompt.append(instructions)
             
        if 'style' in config:
             prompt.append("\n[COMMUNICATION STYLE]")
             for k, v in config['style'].items():
                  prompt.append(f"- {k.capitalize()}: {v}")
                  
        if 'capabilities' in config:
             prompt.append("\n[CAPABILITIES]")
             for cap in config['capabilities']:
                  prompt.append(f"- {cap}")
                  
        if 'api_endpoints' in config:
             prompt.append("\n[HEXSTRIKE API ENDPOINTS]")
             prompt.append("You MUST route all tool execution via these REST endpoints:")
             for tool, endpoint in config['api_endpoints'].items():
                  prompt.append(f"- {tool}: {endpoint}")
                  
        return "\n".join(prompt)
