"""
HexBrain - AI Inference Engine
Módulo de Inferência IA

Based on HexSecGPT.py HexSecBrain class
Baseado na classe HexSecBrain de HexSecGPT.py

Handles AI chat interactions with streaming support and conversation history.
Gerencia interações de chat IA com suporte a streaming e histórico de conversa.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

import openai
from typing import Generator, List, Dict, Optional, Any
import os
import logging

logger = logging.getLogger(__name__)


class HexBrain:
    """
    AI Inference Engine using OpenRouter/OpenAI
    Motor de Inferência IA usando OpenRouter/OpenAI
    
    Provides streaming chat capabilities with conversation history management.
    Fornece capacidades de chat com streaming e gerenciamento de histórico de conversa.
    """
    
    # Default system prompt for HexAgent
    # Prompt de sistema padrão para HexAgent
    DEFAULT_SYSTEM_PROMPT = """You are HexAgent, an elite autonomous cybersecurity AI assistant.

Your capabilities:
- Analyze security problems and provide detailed technical analysis
- Propose shell commands to investigate issues
- Interpret command output and provide insights
- Iterate on problems until they are solved

When proposing commands, format them in bash code blocks:
```bash
command here
```

Be concise, technical, and focused on solving the user's request efficiently.
Always respond in the same language as the user's input.
"""
    

    def __init__(
        self, 
        engine: str = 'openai',
        config: Dict[str, Any] = None,
        system_prompt: Optional[str] = None
    ):
        """
        Initialize AI brain with specific engine
        Inicializa cérebro IA com motor específico
        
        Args:
            engine: Provider engine name (e.g., 'openai', 'claude')
            config: Provider configuration dictionary
            system_prompt: Custom system prompt
        """
        self.engine = engine
        self.config = config or {}
        
        # Set system prompt
        self.system_prompt = system_prompt or self.DEFAULT_SYSTEM_PROMPT
        
        # Initialize conversation history
        self.history: List[Dict[str, str]] = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Initialize Provider Strategy
        from .providers.provider_factory import ProviderFactory
        
        # Mapping hack: If engine is 'hexsecgpt', map to 'openai' with OpenRouter config for backward compatibility if needed, 
        # OR just treat it as generic OpenAI if user has keys. 
        # But the User explicitly said "remove hexsecgpt".
        # So we expect valid engine names now.
        
        try:
            self.provider = ProviderFactory.create_provider(self.engine, self.config)
            logger.info(f"HexBrain initialized with engine: {self.engine}")
        except Exception as e:
            logger.error(f"Failed to initialize AI provider: {e}")
            self.provider = None
            raise

    def chat(
        self, 
        user_input: str, 
        stream: bool = True,
        temperature: float = 0.7
    ) -> Generator[str, None, None]:
        """
        Send message to AI and get streaming response
        Envia mensagem para IA e recebe resposta com streaming
        """
        if not self.provider:
             yield "❌ AI Provider not initialized"
             return

        # Add user message to history
        # Adiciona mensagem do usuário ao histórico
        self.history.append({"role": "user", "content": user_input})
        
        try:
            full_content = ""
            # Delegate to provider
            # Delegar ao provedor
            for chunk in self.provider.chat_step(user_input):
                 full_content += chunk
                 yield chunk
            
            # Add assistant response to history
            # Adiciona resposta do assistente ao histórico
            self.history.append({"role": "assistant", "content": full_content})
            
        except Exception as e:
            error_msg = f"AI Error: {str(e)}"
            logger.error(f"Chat error: {e}", exc_info=True)
            yield error_msg
    
    def chat_step(self, prompt: str) -> Generator[str, None, None]:
        """
        Compatibility wrapper
        Wrapper de compatibilidade
        """
        for chunk in self.chat(prompt, stream=True):
            yield chunk
            
    def reset(self):
        """
        Reset conversation history
        Reinicia histórico de conversa
        """
        self.history = [
            {"role": "system", "content": self.system_prompt}
        ]
        logger.info("Conversation history reset")
    
    def add_context(self, role: str, content: str):
        if role not in ['user', 'assistant', 'system']:
            raise ValueError(f"Invalid role: {role}")
        self.history.append({"role": role, "content": content})
    
    def get_history(self) -> List[Dict[str, str]]:
        return self.history.copy()
    
    def set_system_prompt(self, prompt: str):
        self.system_prompt = prompt
        self.reset()
        
    def __repr__(self) -> str:
        return f"HexBrain(engine='{self.engine}')"

