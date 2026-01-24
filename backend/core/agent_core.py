"""
AgentCore - Main Orchestration Engine
AgentCore - Motor Principal de Orquestração

Coordinates AI brain + Command execution in iterative loops.
Coordena cérebro IA + Execução de comandos em loops iterativos.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from typing import Generator, Dict, Any, Optional, List
import re
import logging
from .hex_brain import HexBrain
from .hex_strike_client import HexStrikeClient
from .inference_engine import InferenceEngine
from .command_executor import CommandExecutor
from .providers import ProviderFactory, InferenceStrategy
from .mcp_manager import MCPManager
import json

logger = logging.getLogger(__name__)


class AgentCore:
    """
    Main orchestration engine combining AI + Commands
    Motor principal combinando IA + Comandos
    
    Coordinates iterative problem-solving loop:
    1. AI proposes solution/commands
    2. Commands are executed (if auto-execute or approved)
    3. Results are fed back to AI
    4. AI analyzes and continues
    5. Repeat until problem solved or max iterations
    
    Coordena loop iterativo de resolução de problemas:
    1. IA propõe solução/comandos
    2. Comandos são executados (se auto-executar ou aprovado)
    3. Resultados são retornados à IA
    4. IA analisa e continua
    5. Repetir até problema resolvido ou máximo de iterações
    """
    
    def __init__(
        self, 
        api_key: Optional[str] = None,
        hexstrike_url: Optional[str] = None,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        engine: str = 'openai',
        provider_kwargs: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize Agent Core with multi-provider support
        Inicializa Agent Core com suporte multi-provedor
        
        Args:
            api_key: AI provider API key (defaults to env var)
                    Chave API do provedor IA (padrão: variável de ambiente)
            hexstrike_url: HexStrike server URL (default: http://localhost:8888)
                          URL do servidor HexStrike (padrão: http://localhost:8888)
            model: AI model name (provider-specific)
                  Nome do modelo IA (específico do provedor)
            system_prompt: Custom system prompt (optional)
                          Prompt de sistema customizado (opcional)
            engine: AI provider engine ('hexsecgpt', 'openai', 'deepseek', 'ollama')
                   Motor provedor IA (padrão: 'hexsecgpt')
            provider_kwargs: Additional provider settings (host, port, etc.)
                            Configurações adicionais do provedor
        """
        # Initialize AI provider using ProviderFactory (Strategy Pattern)
        # Inicializa provedor IA usando ProviderFactory (Padrão Strategy)
        try:
            # Build provider configuration / Construir configuração do provedor
            provider_config = {
                'api_key': api_key,
                'model': model,
                'system_prompt': system_prompt
            }
            
            # Merge additional kwargs if provided (e.g. host/port for LM Studio)
            if provider_kwargs:
                provider_config.update(provider_kwargs)
            
            # Create provider instance via factory / Criar instância via fábrica
            self.engine = engine
            self.provider = ProviderFactory.create_provider(engine, provider_config)
            
            logger.info(f"AI Provider initialized: {self.provider}")
            logger.info(f"Engine: {engine}, Model: {self.provider.get_default_model()}")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI provider '{engine}': {e}")
            raise
        
        # Initialize command executor / Inicializa executor de comandos
        self.hexstrike = HexStrikeClient(base_url=hexstrike_url)
        
        # Check HexStrike availability / Verifica disponibilidade do HexStrike
        health = self.hexstrike.health_check()
        self.hexstrike_available = health.get("status") != "error"
        
        if not self.hexstrike_available:
            logger.warning("HexStrike not available - command execution will be disabled")
            logger.warning("Commands can still be proposed but won't be executed automatically")
        else:
            logger.info("HexStrike available and ready")
        
        # Initialize new POO components / Inicializa novos componentes POO
        # CommandExecutor wraps HexStrike client
        # CommandExecutor encapsula cliente HexStrike
        self.executor = CommandExecutor(self.hexstrike)
        
        # Initialize MCP Manager
        self.mcp_manager = MCPManager()
        logger.info("MCP Manager initialized in AgentCore")
        
        # Initialize AgentOrchestrator
        # Inicializa o Orquestrador do Agente
        from .orchestrator import AgentOrchestrator
        self.orchestrator = AgentOrchestrator(self.provider, self.executor, self.mcp_manager)
        
        # Initialize ActionDispatcher (Legacy/Compatibility)
        from .action_dispatcher import ActionDispatcher
        self.dispatcher = ActionDispatcher(self)

        logger.info(f"AgentCore initialized with {engine} provider")

    def set_profile_context(self, context: str):
        """
        Inject User Profile context into the AI Provider
        Injetar contexto de Perfil de Usuário no Provedor de IA
        """
        if self.provider:
            if hasattr(self.provider, 'set_system_context'):
                self.provider.set_system_context(context)
                logger.info("Profile context injected directly into Provider")
            else:
                self.profile_context = context
                logger.info("Profile context stored in AgentCore (Provider doesn't support direct injection)")
    
    def initialize(
        self, 
        api_key: str = None, 
        engine: str = None, 
        model: str = None,
        provider_kwargs: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Re-initialize the agent with new configuration
        Re-inicializa o agente com nova configuração
        """
        try:
            logger.info(f"Re-initializing AgentCore: Engine={engine}, Model={model}")
            
            current_engine = engine or self.engine
            
            provider_config = {
                'api_key': api_key,
                'model': model if model else (self.provider.get_default_model() if self.provider else None)
            }
            
            if provider_kwargs:
                provider_config.update(provider_kwargs)
            
            self.engine = current_engine
            self.provider = ProviderFactory.create_provider(current_engine, provider_config)
            
            # Update Orchestrator with new provider
            self.orchestrator.provider = self.provider
            
            logger.info("AgentCore re-initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to re-initialize AgentCore: {e}")
            return False
    
    def process_message(
        self, 
        user_input: str,
        chat_context: Optional[List[Dict[str, str]]] = None,
        auto_execute: bool = False,
        max_iterations: int = 10,
        stream: bool = True
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Process user message using AgentOrchestrator
        Processa mensagem do usuário usando AgentOrchestrator
        """
        logger.info(f"AgentCore: Delegating to Orchestrator (Auto-Exec: {auto_execute})")
        
        # Determine if context needs to be injected manually
        if hasattr(self, 'profile_context') and self.profile_context:
             # If provider doesn't support direct context, we might prepend it?
             # For now, Orchestrator handles text-based context if passed
             pass

        yield from self.orchestrator.process(
            user_input=user_input,
            chat_context=chat_context,
            auto_execute=auto_execute,
            max_iterations=max_iterations
        )

    def complete_code(
        self,
        code_context: str,
        language: str = 'python'
    ) -> List[str]:
        """
        Generate completion suggestions for code or commands
        Gera sugestões de completion para código ou comandos
        """
        try:
            # Construct a prompt for the model
            prompt = (
                f"You are an intelligent code completion engine. "
                f"Complete the following {language} code snippet. "
                f"Return ONLY the completion part, no markdown, no explanations.\n\n"
                f"{code_context}"
            )
            
            # Use non-streaming chat step for simplicity
            response_text = ""
            for chunk in self.provider.chat_step(prompt=prompt, model=self.provider.get_default_model()):
                response_text += chunk
                
            # Basic parsing: split by newlines or return single block
            # For command mode, we often want single line completions
            return [response_text.strip()]
            
        except Exception as e:
            logger.error(f"Completion failed: {e}")
            return []
    
    def reset(self):
        """
        Reset AI conversation history
        Reseta histórico de conversa IA
        """
        # Note: Reset not in generic InferenceStrategy interface
        # Would need provider-specific implementation
        # Nota: Reset não está na interface genérica InferenceStrategy  
        # Precisaria de implementação específica do provedor
        pass
        logger.info("Agent conversation reset")

    def shutdown(self):
        """
        Gracefully shutdown agent resources
        Encerra graciosamente recursos do agente
        """
        logger.info("AgentCore shutting down...")
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current agent status
        Obtém status atual do agente
        """
        return {
            "brain_ready": self.provider is not None,
            "hexstrike_available": self.hexstrike_available,
            "conversation_length": 0,  # TODO: Provider-specific
            "model": self.provider.get_default_model() if self.provider else None,
            "provider": self.provider.get_provider_name() if self.provider else None,
            "engine": self.engine,
            "hexstrike_url": self.hexstrike.base_url
        }
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check
        Realiza verificação completa de saúde
        """
        health = {
            "overall": "healthy",
            "components": {}
        }
        
        # Check AI brain
        try:
            health["components"]["brain"] = {
                "status": "ok",
                "model": self.provider.get_default_model() if self.provider else None,
                "history_length": 0
            }
        except Exception as e:
            health["components"]["brain"] = {
                "status": "error",
                "error": str(e)
            }
            health["overall"] = "degraded"
        
        # Check HexStrike
        hexstrike_health = self.hexstrike.health_check()
        health["components"]["hexstrike"] = hexstrike_health
        
        if hexstrike_health.get("status") == "error":
            health["overall"] = "degraded"
        
        return health
    
    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return (f"AgentCore(provider={self.provider.get_provider_name()}, "
                f"hexstrike={'available' if self.hexstrike_available else 'unavailable'})")
