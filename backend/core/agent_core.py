"""
AgentCore - Central Intelligence System
AgentCore - Sistema Central de Inteligência

Coordinating Brain of the HexAgent Platform.
Cérebro Coordenador da Plataforma HexAgent.

Responsibilities / Responsabilidades:
- AI Provider Management / Gerenciamento de Provedores IA
- Loop Orchestration / Orquestração de Loop
- Command Execution Binding / Vínculo de Execução de Comandos
- State Persistence / Persistência de Estado

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 3.0.0 (Strict OOP & Bilingual)
"""

from typing import Generator, Dict, Any, Optional, List
import logging
import threading

# Core Components / Componentes do Core
from .hex_strike_client import HexStrikeClient
from .command_executor import CommandExecutor
from .providers import ProviderFactory
from .mcp_manager import MCPManager
from .orchestrator import AgentOrchestrator
from .action_dispatcher import ActionDispatcher

# Services / Serviços
# Services / Serviços
from services.monitoring_service import MonitoringService
from services.memory_service import MemoryService

logger = logging.getLogger(__name__)

class AgentCore:
    """
    Main Logic Core.
    Núcleo Lógico Principal.
    
    Acts as the Director in the Builder/Director pattern for AI tasks.
    Atua como o Diretor no padrão Builder/Director para tarefas de IA.
    """
    
    # Class-level lock for thread safety if needed
    _lock = threading.Lock()

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
        Initialize the Core System.
        Inicializa o Sistema Central.
        
        Args:
            api_key: Credential for AI Service / Credencial para Serviço de IA
            hexstrike_url: URL for Execution Engine / URL para Motor de Execução
            engine: AI Provider Name / Nome do Provedor de IA
            provider_kwargs: Extra connection args / Argumentos extras de conexão
        """
        self.engine = engine
        self.provider = None
        self.profile_context = None
        
        logger.info(f"Booting AgentCore [Engine={engine}]")
        
        # 1. Initialize Subsystems / Inicializar Subsistemas
        # HexStrike Client (Execution Layer)
        self.hexstrike = HexStrikeClient(base_url=hexstrike_url)
        self.executor = CommandExecutor(self.hexstrike)
        
        # MCP Manager (Tools Layer)
        self.mcp_manager = MCPManager()
        
        # 2. Initialize AI Brain / Inicializar Cérebro IA
        self._initialize_provider(api_key, model, system_prompt, engine, provider_kwargs)
        
        # 3. Initialize Monitoring / Inicializar Monitoramento
        self.monitor = MonitoringService()
        self.memory = MemoryService()
        
        # 3. Check Health / Verificar Saúde
        self._check_subsystems()
        
        # 4. Bind Orchestrator / Vincular Orquestrador
        self.orchestrator = AgentOrchestrator(
            provider=self.provider, 
            executor=self.executor, 
            mcp_manager=self.mcp_manager
        )
        
        # 5. Legacy Dispatcher (for backward compatibility with pure commands)
        self.dispatcher = ActionDispatcher(self)

    def _initialize_provider(
        self, 
        api_key: Optional[str], 
        model: Optional[str], 
        system_prompt: Optional[str], 
        engine: str, 
        provider_kwargs: Optional[Dict[str, Any]]
    ):
        """
        Setup the AI Strategy.
        Configura a Estratégia de IA.
        """
        try:
            config = {
                'api_key': api_key,
                'model': model,
                'system_prompt': system_prompt
            }
            
            if provider_kwargs:
                config.update(provider_kwargs)
            
            self.provider = ProviderFactory.create_provider(engine, config)
            logger.info(f"AI Provider Online: {engine.upper()} / {model or 'default'}")
            
        except Exception as e:
            logger.warning(f"AI Provider Init Failed: {e}")
            self.provider = None

    def _check_subsystems(self):
        """
        Verify status of dependencies.
        Verificar status das dependências.
        """
        health = self.hexstrike.health_check()
        self.hexstrike_available = (health.get("status") != "error")
        
        if self.hexstrike_available:
            logger.info("HexStrike-AI: ONLINE")
        else:
            logger.warning("HexStrike-AI: OFFLINE (Command Execution Limited)")

    def set_profile_context(self, context: str):
        """
        Set the User Profile Context for the AI.
        Define o Contexto de Perfil do Usuário para a IA.
        """
        self.profile_context = context
        logger.info("Profile Context Updated in AgentCore")

    def reload_mcp(self):
        """
        Reload MCP Manager.
        Recarregar Gerenciador MCP.
        """
        if self.mcp_manager:
            self.mcp_manager.restart_sync()
            logger.info("MCP Manager reloaded via AgentCore")

    def health_check(self) -> Dict[str, Any]:
        """
        Detailed Health Check.
        Verificação de Saúde Detalhada.
        """
        return {
            "overall": "healthy" if self.provider and self.hexstrike_available else "degraded",
            "brain": "ready" if self.provider else "error",
            "execution_engine": "online" if self.hexstrike_available else "offline",
            "shadow_mode": "active" if self.monitor.active else "inactive",
            "stats": self.monitor.get_stats()
        }

    def toggle_shadow_mode(self, enabled: bool) -> bool:
        """
        Toggle Shadow Mode Monitoring.
        Alternar Monitoramento do Modo Sombra.
        """
        if enabled:
            self.monitor.start_monitoring()
        else:
            self.monitor.stop_monitoring()
        return self.monitor.active

    def initialize(
        self, 
        api_key: str = None, 
        engine: str = None, 
        model: str = None, 
        provider_kwargs: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Hot-reload configuration.
        Recarga a quente da configuração.
        """
        with self._lock:
            try:
                target_engine = engine or self.engine
                logger.info(f"Reloading Core Configuration -> {target_engine}")
                
                # Determine model / Determinar modelo
                if not model and self.provider:
                    try:
                        model = self.provider.get_default_model()
                    except:
                        pass
                
                self._initialize_provider(api_key, model, None, target_engine, provider_kwargs)
                self.engine = target_engine
                
                # Update Orchestrator / Atualizar Orquestrador
                self.orchestrator.provider = self.provider
                
                return True
            except Exception as e:
                logger.error(f"Hot-reload failed: {e}")
                return False

    def process_message(
        self, 
        user_input: str,
        chat_context: Optional[List[Dict[str, str]]] = None,
        auto_execute: bool = False,
        max_iterations: int = 10,
        stream: bool = True,
        abort_signal: Optional[Any] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Main Execution Entry Point.
        Ponto de Entrada de Execução Principal.
        
        Delegates to Orchestrator.
        Delega para o Orquestrador.
        """
        if not self.provider:
             yield {
                 "type": "error", 
                 "content": "AI Core not configured. Please check Settings.",
                 "metadata": {"source": "AgentCore"}
             }
             return

        # Retrieve relevant memory / Recuperar memória relevante
        memory_context = self.memory.retrieve_context(user_input)
        
        # Accumulator for full response
        full_response = []
        
        # Stream response and accumulate
        for chunk in self.orchestrator.process(
            user_input=user_input,
            chat_context=chat_context,
            auto_execute=auto_execute,
            max_iterations=max_iterations,
            abort_signal=abort_signal,
            profile_context=self.profile_context or "",
            memory_context=memory_context
        ):
            # Accumulate text content for memory
            # Acumular conteúdo de texto para memória
            if isinstance(chunk, dict):
                 # Handle different block types if needed, for now just grab text usage or content
                 # Tratar tipos de bloco diferentes se necessário
                 if chunk.get('type') == 'text':
                     full_response.append(chunk.get('content', ''))
                     
            yield chunk
        
        # Save interaction to memory (Auto-Save)
        # Salvar interação na memória (Auto-Save)
        try:
            final_text = "".join(full_response).strip()
            if final_text and len(final_text) > 50: # Only save substantial interactions
                # Create a concise memory string
                memory_entry = f"User asked: {user_input}\nAssistant Answered: {final_text[:500]}..." 
                self.memory.add_memory(content=memory_entry, source="chat_history", tags=["auto_save"])
                logger.info("Chat interaction saved to Long-Term Memory")
        except Exception as e:
            logger.warning(f"Failed to auto-save memory: {e}")

    def complete_code(self, code_context: str, language: str = 'python') -> List[str]:
        """
        Code Completion Facade.
        Facade de Completion de Código.
        """
        if not self.provider:
            return []
            
        try:
            # Simple prompt for completion / Prompt simples para completion
            prompt = (
                f"Complete this {language} code. Return ONLY code:\n\n{code_context}"
            )
            
            # Simple sync call / Chamada síncrona simples
            response = ""
            for chunk in self.provider.chat_step(prompt=prompt, chat_context=[]):
                response += chunk
                
            return [response.strip()]
        except Exception as e:
            logger.error(f"Completion Error: {e}")
            return []

    def get_status(self) -> Dict[str, Any]:
        """Diagnostic Status / Status de Diagnóstico"""
        model = "unknown"
        if self.provider:
            # Try to get model from provider attribute or config
            if hasattr(self.provider, 'model'):
                model = self.provider.model
            elif hasattr(self.provider, 'config'):
                model = self.provider.config.get('model', 'unknown')
        
        return {
            "engine": self.engine,
            "provider": self.engine, # Alias for consistency
            "model": model,
            "brain_ready": self.provider is not None, # Alias for SystemController
            "provider_ready": self.provider is not None,
            "hexstrike_online": self.hexstrike_available,
            "orchestrator_ready": self.orchestrator is not None
        }
