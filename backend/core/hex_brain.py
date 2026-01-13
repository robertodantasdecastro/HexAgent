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
from typing import Generator, List, Dict, Optional
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
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        """
        Initialize AI brain
        Inicializa cérebro IA
        
        Args:
            api_key: OpenRouter API key (defaults to OPENROUTER_API_KEY env var)
                    Chave API OpenRouter (padrão: variável OPENROUTER_API_KEY)
            model: Model name (defaults to gemini-2.0-flash-exp:free)
                  Nome do modelo (padrão: gemini-2.0-flash-exp:free)
            system_prompt: Custom system prompt (defaults to DEFAULT_SYSTEM_PROMPT)
                          Prompt de sistema customizado (padrão: DEFAULT_SYSTEM_PROMPT)
            base_url: API base URL (defaults to OpenRouter)
                     URL base da API (padrão: OpenRouter)
                     
        Raises:
            ValueError: If API key is not provided and not in environment
        """
        # Get API key from parameter or environment
        # Obtém chave API do parâmetro ou ambiente
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY') or os.getenv('API_KEY')
        
        if not self.api_key:
            raise ValueError(
                "API key required. Set OPENROUTER_API_KEY environment variable or pass api_key parameter. / "
                "Chave API necessária. Defina variável OPENROUTER_API_KEY ou passe parâmetro api_key."
            )
        
        # Set model and base URL
        # Define modelo e URL base
        self.model = model or "google/gemini-2.0-flash-exp:free"
        self.base_url = base_url or "https://openrouter.ai/api/v1"
        
        # Initialize OpenAI client with OpenRouter configuration
        # Inicializa cliente OpenAI com configuração OpenRouter
        self.client = openai.OpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "HTTP-Referer": "https://github.com/HexAgentGUI",
                "X-Title": "HexAgentGUI"
            }
        )
        
        # Set system prompt
        # Define prompt de sistema
        self.system_prompt = system_prompt or self.DEFAULT_SYSTEM_PROMPT
        
        # Initialize conversation history with system prompt
        # Inicializa histórico de conversa com prompt de sistema
        self.history: List[Dict[str, str]] = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        logger.info(f"HexBrain initialized with model: {self.model}")
    
    def chat(
        self, 
        user_input: str, 
        stream: bool = True,
        temperature: float = 0.7
    ) -> Generator[str, None, None]:
        """
        Send message to AI and get streaming response
        Envia mensagem para IA e recebe resposta com streaming
        
        Args:
            user_input: User message / Mensagem do usuário
            stream: Enable streaming (default: True) / Habilitar streaming (padrão: True)
            temperature: Model temperature (0.0-1.0, default: 0.7)
                        Temperatura do modelo (0.0-1.0, padrão: 0.7)
            
        Yields:
            Response chunks (if stream=True) / Chunks de resposta (se stream=True)
            
        Returns:
            Full response (if stream=False) / Resposta completa (se stream=False)
        """
        # Add user message to history
        # Adiciona mensagem do usuário ao histórico
        self.history.append({"role": "user", "content": user_input})
        
        try:
            if stream:
                # Streaming response / Resposta com streaming
                logger.debug(f"Sending streaming request to {self.model}")
                
                response_stream = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.history,
                    stream=True,
                    temperature=temperature
                )
                
                full_content = ""
                for chunk in response_stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        full_content += content
                        yield content
                
                # Add complete assistant response to history
                # Adiciona resposta completa do assistente ao histórico
                self.history.append({"role": "assistant", "content": full_content})
                logger.debug(f"Streaming response complete: {len(full_content)} chars")
            else:
                # Non-streaming response / Resposta sem streaming
                logger.debug(f"Sending non-streaming request to {self.model}")
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.history,
                    stream=False,
                    temperature=temperature
                )
                
                content = response.choices[0].message.content
                self.history.append({"role": "assistant", "content": content})
                logger.debug(f"Non-streaming response received: {len(content)} chars")
                yield content
                
        except openai.AuthenticationError as e:
            error_msg = "Authentication failed. Check your API key. / Autenticação falhou. Verifique sua chave API."
            logger.error(f"Authentication error: {e}")
            yield error_msg
        except openai.RateLimitError as e:
            error_msg = "Rate limit exceeded. Please try again later. / Limite de taxa excedido. Tente novamente mais tarde."
            logger.error(f"Rate limit error: {e}")
            yield error_msg
        except openai.APIConnectionError as e:
            error_msg = "API connection failed. Check your internet connection. / Conexão com API falhou. Verifique sua conexão."
            logger.error(f"Connection error: {e}")
            yield error_msg
        except Exception as e:
            error_msg = f"AI Error: {str(e)}"
            logger.error(f"Unexpected error in chat: {e}", exc_info=True)
            yield error_msg
    
    def chat_step(self, prompt: str) -> Generator[str, None, None]:
        """
        Compatibility wrapper for iterative inference loop
        Wrapper de compatibilidade para loop iterativo de inferência
        
        This method is used by InferenceEngine and is a simple wrapper around chat().
        Este método é usado pelo InferenceEngine e é um wrapper simples em torno de chat().
        
        Args / Argumentos:
            prompt (str): User prompt / Prompt do usuário
        
        Yields / Produz:
            str: Response chunks / Chunks de resposta
        """
        for chunk in self.chat(prompt, stream=True):
            yield chunk
    
    def reset(self):
        """
        Reset conversation history to initial state
        Reseta histórico de conversa para estado inicial
        
        Removes all messages except the system prompt.
        Remove todas as mensagens exceto o prompt de sistema.
        """
        self.history = [
            {"role": "system", "content": self.system_prompt}
        ]
        logger.info("Conversation history reset")
    
    def add_context(self, role: str, content: str):
        """
        Manually add context to conversation history
        Adiciona manualmente contexto ao histórico de conversa
        
        Args:
            role: Message role ('user', 'assistant', or 'system')
                 Papel da mensagem ('user', 'assistant' ou 'system')
            content: Message content / Conteúdo da mensagem
            
        Raises:
            ValueError: If role is invalid
        """
        if role not in ['user', 'assistant', 'system']:
            raise ValueError(
                f"Invalid role: {role}. Must be 'user', 'assistant', or 'system'. / "
                f"Papel inválido: {role}. Deve ser 'user', 'assistant' ou 'system'."
            )
        
        self.history.append({"role": role, "content": content})
        logger.debug(f"Added {role} context: {len(content)} chars")
    
    def get_history(self) -> List[Dict[str, str]]:
        """
        Get current conversation history
        Obtém histórico atual de conversa
        
        Returns:
            List of message dictionaries / Lista de dicionários de mensagem
        """
        return self.history.copy()
    
    def set_system_prompt(self, prompt: str):
        """
        Update system prompt and reset history
        Atualiza prompt de sistema e reseta histórico
        
        Args:
            prompt: New system prompt / Novo prompt de sistema
        """
        self.system_prompt = prompt
        self.reset()
        logger.info("System prompt updated and history reset")
    
    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return f"HexBrain(model='{self.model}', messages={len(self.history)})"
