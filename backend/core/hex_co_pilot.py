"""
Hex Co-Pilot Linter
Assistente de Código Híbrido em Tempo Real
"""

import json
import logging
from core.providers.provider_factory import ProviderFactory

class CommandLinter:
    def __init__(self, core_ref):
        self.core_ref = core_ref
        # Use own logger - AgentCore does not expose self.logger
        self.logger = getattr(core_ref, 'logger', None) or logging.getLogger(__name__)

    @property
    def provider(self):
        return getattr(self.core_ref, 'provider', None)

    def lint_command(self, command: str, cwd: str) -> dict:
        """
        Analisa um comando em tempo real e sugere otimizações.
        Retorna um dicionário com 'valid', 'suggestion', 'reason'.
        """
        if not command or len(command.strip()) < 3:
             return {"valid": True, "suggestion": None, "reason": None}
             
        if not self.provider:
            return {"valid": True, "suggestion": None, "reason": "Provider Linter not initialized"}

        prompt = f"""
You are a Cyber Security Terminal Linter. 
Analyze the following shell command typed by the user.

Command: {command}
Working Directory: {cwd}

Rules:
1. Provide a safer, stealthier, or more optimal alternative if applicable (e.g., using -Pn -sS in nmap, --batch in sqlmap).
2. If the command is completely destructive (like rm -rf /), flag it as invalid.
3. Keep the reason very short, max 10 words.
4. Output STRICTLY in JSON format with no markdown wrappers or extra text.

Returns:
{{
  "valid": boolean,
  "suggestion": "optimized command string here or null if perfect",
  "reason": "short explanation"
}}
"""
        try:
             response_text = ""
             for chunk in self.provider.chat_step(prompt=prompt, chat_context=[]):
                 response_text += chunk
                 
             # Limpeza do JSON defensiva
             response_text = response_text.replace("```json", "").replace("```", "").strip()
             return json.loads(response_text)
        except Exception as e:
             self.logger.error(f"Linter Exception: {e}")
             return {"valid": True, "suggestion": None, "reason": "Linter failed internally"}
