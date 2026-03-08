"""
TransitionalCoordinator - Transitional Cognitive Coordination Layer
TransitionalCoordinator - Camada de Coordenação Cognitiva Transicional

PHASE 1 of Transitional Cognitive Bridge Architecture.
FASE 1 da Arquitetura de Ponte Cognitiva Transicional.

Coordinating Brain of the HexAgent Platform.
Cérebro Coordenador da Plataforma HexAgent.

Current Responsibilities / Responsabilidades Atuais:
- AI Provider Management / Gerenciamento de Provedores IA
- Loop Orchestration Delegation / Delegação de Orquestração de Loop
- Command Execution Binding / Vínculo de Execução de Comandos
- State Persistence / Persistência de Estado
- Subsystem Initialization / Inicialização de Subsistemas

Future Evolution Path / Caminho de Evolução Futura:
- Will orchestrate specialized cognitive agents via message passing
- Will implement ExecutionMesh for routing-only execution
- Will integrate Reflection, Evolution, and Governance loops
- Will enable genome-driven architecture adaptations

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 3.1.0 (Transitional Architecture - Phase 1)
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
from .hex_co_pilot import CommandLinter

# Services / Serviços
# Services / Serviços
from services.monitoring_service import MonitoringService
from services.memory_service import MemoryService
from services.persona_service import persona_service

logger = logging.getLogger(__name__)

class TransitionalCoordinator:
    """
    Transitional CognitiveCoordinator.
    CognitiveCoordinator Transicional.
    
    CURRENT STATE / ESTADO ATUAL:
    - Delegates to monolithic AgentOrchestrator
    - Manages AI provider and execution engine bindings
    - Provides state management (profile, memory)
    - Centralized subsystem initialization
    
    FUTURE STATE / ESTADO FUTURO:
    - Will coordinate specialized cognitive agents via message passing:
      * PersonaAgent (context processing)
      * PlanningAgent (task planning)
      * ToolSelectorAgent (tool selection)
      * RiskAssessmentAgent (risk evaluation)
      * StrategyAgent (execution strategy)
    - Will integrate ExecutionMesh for routing-only execution
    - Will implement cognitive loops:
      * Reflection Loop (MetaCognitiveAgent)
      * Evolution Loop (EvolutionController)
      * Meta-Strategy Loop (MetaStrategyAgent)
      * Auto-Design Loop (ArchitectureMutationEngine)
      * RSI Loop (MetaEvolutionAgent)
    
    Acts as the Director in the Builder/Director pattern for AI tasks.
    Atua como o Diretor no padrão Builder/Director para tarefas de IA.
    
    NOTE: This is a transitional architecture preserving 100% backward compatibility
          while preparing for evolution to full CognitiveCoordinator pattern.
    NOTA: Esta é uma arquitetura transicional preservando 100% de compatibilidade
          enquanto prepara evolução para padrão CognitiveCoordinator completo.
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
        
        # Load Persona / Carregar Persona
        self.persona = persona_service.load_persona("hexstrike_persona")
        # System Prompt logic: Argument > Persona > Default
        self.system_prompt = system_prompt or persona_service.get_system_prompt()
        
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
        self._initialize_provider(api_key, model, self.system_prompt, engine, provider_kwargs)
        
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
        
        # 5. Initialize Co-Pilot Linter / Inicializar Linter Assistivo
        self.linter = CommandLinter(self)
        
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

    def refresh_status(self):
        """
        Verify status of dependencies.
        Verificar status das dependências.
        """
        logger.info("Re-checking HexStrike Health...")
        health = self.hexstrike.health_check()
        self.hexstrike_available = (health.get("status") != "error")
        
        if self.hexstrike_available:
            logger.info("HexStrike-AI: ONLINE")
        else:
            logger.warning("HexStrike-AI: OFFLINE (Command Execution Limited)")
            
    # Alias for backward compatibility if needed internal
    _check_subsystems = refresh_status

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

        # HexStrike Intelligence Planning
        # Planejamento de Inteligência HexStrike
        planning_context = ""
        if self.hexstrike_available:
             try:
                 planning = self.hexstrike.select_tools(user_input)
                 if planning and planning.get("tools"):
                      tool_names = ", ".join(t.get('name', 'unknown') for t in planning['tools'])
                      reasoning = planning.get('reasoning', 'No reasoning provided')
                      planning_context = f"Suggested Tools: {tool_names}\nReasoning: {reasoning}"
                      logger.info(f"HexStrike Planning: {planning_context}")
             except Exception as e:
                 logger.warning(f"HexStrike Planning failed: {e}")
        
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
            memory_context=memory_context,
            planning_context=planning_context
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

    def plan_task(self, query: str) -> Dict[str, Any]:
        """
        Delegate task planning to HexStrike Intelligence.
        Delegar planejamento de tarefa para Inteligência HexStrike.
        
        Args:
            query: User's objective / Objetivo do usuário
            
        Returns:
            Dict containing tools and reasoning / Dict contendo ferramentas e raciocínio
        """
        if not self.hexstrike_available:
            return {"success": False, "error": "HexStrike Integration Offline", "tools": []}
            
        return self.hexstrike.select_tools(query)

    def optimize_command(self, tool: str, target: str) -> Dict[str, Any]:
        """
        Delegate command optimization to HexStrike Intelligence.
        Delegar otimização de comando para Inteligência HexStrike.
        
        Args:
            tool: Tool name / Nome da ferramenta
            target: Target / Alvo
            
        Returns:
            Dict with optimized command / Dict com comando otimizado
        """
        if not self.hexstrike_available:
             return {"success": False, "error": "HexStrike Integration Offline"}
             
        return self.hexstrike.optimize_parameters(tool, target)

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
    
    def shutdown(self):
        """
        Gracefully shutdown AgentCore and cleanup resources
        Desligar AgentCore graciosamente e limpar recursos
        
        Ensures proper cleanup of:
        - Provider connections / Conexões do provider
        - Monitoring services / Serviços de monitoramento
        - MCP Manager / Gerenciador MCP
        """
        try:
            logger.info("🔻 Shutting down AgentCore...")
            
            # Stop monitoring service if active
            # Parar serviço de monitoramento se ativo
            if hasattr(self, 'monitor') and self.monitor:
                try:
                    self.monitor.stop_monitoring()
                    logger.debug("Monitoring service stopped")
                except Exception as e:
                    logger.warning(f"Error stopping monitor: {e}")
            
            # Cleanup MCP Manager
            # Limpar gerenciador MCP
            if hasattr(self, 'mcp_manager') and self.mcp_manager:
                try:
                    # MCP Manager might have cleanup methods in future
                    logger.debug("MCP Manager cleanup complete")
                except Exception as e:
                    logger.warning(f"Error cleaning up MCP: {e}")
            
            # Close provider connections if exists
            # Fechar conexões do provider se existir
            if hasattr(self, 'provider') and self.provider:
                # Most providers don't need explicit cleanup, but future-proof
                # A maioria dos providers não precisa cleanup explícito, mas preparado para futuro
                logger.debug(f"Provider {self.engine} released")
            
            logger.info("✅ AgentCore shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Error during AgentCore shutdown: {e}")

# ============================================================================
# BACKWARD COMPATIBILITY WRAPPER
# WRAPPER DE COMPATIBILIDADE RETROATIVA
# ============================================================================

class AgentCore(TransitionalCoordinator):
    """
    Backward compatibility wrapper for TransitionalCoordinator.
    Wrapper de compatibilidade retroativa para TransitionalCoordinator.
    
    This class ensures that all existing code using 'AgentCore' continues
    to work without any changes. It simply inherits all functionality from
    TransitionalCoordinator.
    
    Esta classe garante que todo código existente usando 'AgentCore' continue
    funcionando sem alterações. Simplesmente herda toda funcionalidade de
    TransitionalCoordinator.
    
    Usage / Uso:
        # Both work identically / Ambos funcionam identicamente:
        core = AgentCore(...)
        coordinator = TransitionalCoordinator(...)
    
    NOTE: This wrapper will be maintained throughout the transitional period
          and removed only when all codebase references are migrated.
    NOTA: Este wrapper será mantido durante todo período de transição e
          removido apenas quando todas referências do código forem migradas.
    """
    pass
