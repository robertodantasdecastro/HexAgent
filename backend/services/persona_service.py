
import json
import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class PersonaService:
    """
    Service to manage AI Personas.
    Serviço para gerenciar Personas de IA.
    """
    
    def __init__(self):
        # Search paths in order of priority / Caminhos de busca em ordem de prioridade
        # IMPORTANT: ~/.hexagent-gui/agents/ must be first — it is where install.sh deploys personas
        # IMPORTANTE: ~/.hexagent-gui/agents/ deve ser o primeiro — é onde o install.sh implanta as personas
        self.search_paths = [
            os.path.expanduser("~/.hexagent-gui/agents"),          # ✅ PRIMARY: user deploy path
            os.path.expanduser("~/.hexagent-gui/personas"),        # compat: legacy path
            os.path.expanduser("~/.hexagent-gui/config/personas"), # compat: legacy path
            os.path.join(os.path.dirname(__file__), "personas"),   # ✅ source fallback
            "backend/services/personas"                             # ✅ relative fallback
        ]
        self.current_persona: Optional[Dict[str, Any]] = None

        
    def load_persona(self, persona_name: str) -> Optional[Dict[str, Any]]:
        """
        Loads a persona from a JSON file searching in multiple paths.
        Carrega uma persona de um arquivo JSON procurando em múltiplos caminhos.
        """
        for path in self.search_paths:
            try:
                file_path = os.path.join(path, f"{persona_name}.json")
                if os.path.exists(file_path):
                    logger.info(f"Loading persona from: {file_path}")
                    with open(file_path, 'r', encoding='utf-8') as f:
                        persona_data = json.load(f)
                    
                    self.current_persona = persona_data
                    logger.info(f"Loaded persona: {persona_data.get('name')} ({persona_name})")
                    return persona_data
            except Exception as e:
                logger.warning(f"Error checking path {path}: {e}")
                continue
                
        logger.error(f"Persona '{persona_name}' not found in any search path.")
        return None

    def get_system_prompt(self) -> str:
        """
        Generates the system prompt based on the current persona.
        Gera o prompt do sistema baseado na persona atual.
        """
        if not self.current_persona:
            return "You are a helpful AI assistant."
            
        p = self.current_persona
        capabilities = "\n".join([f"- {cap}" for cap in p.get("capabilities", [])])
        instructions = "\n".join([f"- {inst}" for inst in p.get("instructions", [])])
        
        # OS Detection for Context
        try:
            import platform
            os_info = f"{platform.system()} {platform.release()}"
            try:
                import distro
                dist_name = distro.name(pretty=True)
            except ImportError:
                dist_name = "Linux"
        except Exception:
            os_info = "Unknown Linux"
            dist_name = "Linux"

        prompt = f"""
You are {p.get('name')}, a {p.get('role')}.
Version: {p.get('version')}
Running on: {dist_name} ({os_info})

Your capabilities include:
{capabilities}

Style: {p.get('style', {}).get('tone')}


You have access to a real Linux shell.
Use [EXEC]command[/EXEC] for commands you want to run immediately.
Use ```bash for blocks you want the user to review before running.

CRITICAL ENVIRONMENT CONTEXT:
- You are running on a **KALI LINUX** penetration testing environment.
- **STANDARD SECURITY TOOLS ARE ALREADY INSTALLED.**
- DO NOT attempt to install tools like: nmap, masscan, nikto, gobuster, sqlmap, metasploit, hydra, john, etc.
- ASSUME they are available in the $PATH. Use them directly.
- ONLY suggest installation if a specific, non-standard tool is missing after checking with `which`.

CRITICAL INSTRUCTIONS:
- You are running on a REAL system, not a simulation.
- When AUTO-EXECUTE is enabled, your commands run immediately.
- Use 'sudo' only when necessary (many Kali tools require it for raw socket access).
- Do NOT output placeholder code like 'path/to/file'. Use real paths.
- If you need to explore, use 'ls', 'pwd', 'find' first.
{instructions}

Always follow these instructions implicitly.
"""
        return prompt.strip()


    def get_greeting(self) -> str:
        """
        Returns the persona's greeting message.
        Retorna a mensagem de saudação da persona.
        """
        if self.current_persona:
            return self.current_persona.get("greeting", "Hello! How can I help you?")
        return "Hello! How can I help you?"

# Singleton instance
persona_service = PersonaService()
