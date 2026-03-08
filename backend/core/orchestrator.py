"""
Agent Orchestrator Module - Transitional Cognitive Pipeline
Módulo Orquestrador do Agente - Pipeline Cognitivo Transicional

PHASE 2-3 of Transitional Cognitive Bridge Architecture.
FASE 2-3 da Arquitetura de Ponte Cognitiva Transicional.

Centralizes the iterative loop of the autonomous agent.
Centraliza o loop iterativo do agente autônomo.

Logically decomposed into 7 explicit stages:
- Stage 1: Build Context (CWD, MCP, Profile, Memory)
- Stage 2: Stream AI Response
- Stage 3: Extract Commands
- Stage 4: Decide Execution Plan
- Stage 5: Execute Commands
- Stage 6: Build Feedback
- Stage 7: Check Iteration Continue

Cognitive interfaces defined with NULL object implementations.
Interfaces cognitivas definidas com implementações NULL object.

Uses Strict OOP Response Blocks.
Usa Blocos de Resposta POO Estritos.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.2.0 (Transitional Architecture - Phase 3)
"""

import logging
import json
import re
import os
from typing import Generator, Dict, Any, List, Optional
from enum import Enum
from dataclasses import dataclass
from .command_executor import CommandExecutor
# from .response_strategy import ResponseFactory # Legacy removed / Legado removido
from .mcp_manager import MCPManager
from .hex_strike_client import HexStrikeClient

# Import new Domain Blocks / Importar novos Blocos de Domínio
from .domain.response_block import (
    TextBlock, CommandBlock, ResultBlock, ErrorBlock, LifecycleBlock, ThinkingBlock,
    AnalysisBlock, SuggestionBlock
)

# Import Stream Tag Detector / Importar Detector de Tags de Stream
from .stream_tag_detector import TagDetector

# Import Cognitive Interfaces (Phase 3) / Importar Interfaces Cognitivas (Fase 3)
from .cognitive_interfaces import (
    IPersonaProcessor, NullPersonaProcessor,
    IStrategyAnalyzer, NullStrategyAnalyzer,
    IToolSelector, NullToolSelector,
    IRiskEvaluator, NullRiskEvaluator,
    IExecutionRouter, NullExecutionRouter,
    IMetaObserver, NullMetaObserver,
    IEvolutionAnalyzer, NullEvolutionAnalyzer,
    # Dataclasses for return types / Dataclasses para tipos de retorno
    RiskAssessment, ExecutionRoute, EvolutionProposal
)

# Import Real Cognitive Agents (Phase 3.8 - Q2 2026) / Importar Agentes Cognitivos Reais
from .agents import PersonaProcessor, RiskEvaluator



logger = logging.getLogger(__name__)


class HookRegistry:
    """
    Registry for cognitive pipeline hooks.
    Registro para hooks de pipeline cognitivo.
    
    All hooks are DISABLED by default in Phase 2.
    Todos hooks são DESABILITADOS por padrão na Phase 2.
    
    Future phases will enable hooks and connect agents.
    Fases futuras ativarão hooks e conectarão agentes.
    """
    
class HookRegistry:
    """
    Registry for cognitive pipeline hooks with interface-based dependency injection.
    Registro para hooks de pipeline cognitivo com injeção de dependência baseada em interface.
    
    PHASE 3: Accepts interface implementations (NULL by default).
    FASE 3: Aceita implementações de interface (NULL por padrão).
    
    Future phases will enable hooks and inject real agent implementations.
    Fases futuras ativarão hooks e injetarão implementações reais de agentes.
    """
    
    def __init__(
        self,
        enabled: bool = False,
        persona_processor: Optional[IPersonaProcessor] = None,
        strategy_analyzer: Optional[IStrategyAnalyzer] = None,
        tool_selector: Optional[IToolSelector] = None,
        risk_evaluator: Optional[IRiskEvaluator] = None,
        execution_router: Optional[IExecutionRouter] = None,
        meta_observer: Optional[IMetaObserver] = None,
        evolution_analyzer: Optional[IEvolutionAnalyzer] = None
    ):
        self.enabled = enabled
        
        # Interface instances (NULL by default) / Instâncias de interface (NULL por padrão)
        self._persona_processor = persona_processor or NullPersonaProcessor()
        self._strategy_analyzer = strategy_analyzer or NullStrategyAnalyzer()
        self._tool_selector = tool_selector or NullToolSelector()
        self._risk_evaluator = risk_evaluator or NullRiskEvaluator()
        self._execution_router = execution_router or NullExecutionRouter()
        self._meta_observer = meta_observer or NullMetaObserver()
        self._evolution_analyzer = evolution_analyzer or NullEvolutionAnalyzer()
    
    # Backward compatibility properties / Propriedades para compatibilidade retroativa
    @property
    def pre_context(self):
        """Legacy property for pre_context hook."""
        return self._persona_processor.process_pre_context if self.enabled else None
    
    @property
    def post_context(self):
        """Legacy property for post_context hook."""
        return self._persona_processor.process_post_context if self.enabled else None
    
    @property
    def post_streaming(self):
        """Legacy property for post_streaming hook."""
        return self._strategy_analyzer.analyze_response if self.enabled else None
    
    @property
    def post_extraction(self):
        """Legacy property for post_extraction hook."""
        return self._tool_selector.select_tools if self.enabled else None
    
    @property
    def pre_execution(self):
        """Legacy property for pre_execution hook."""
        return self._risk_evaluator.evaluate_risk if self.enabled else None
    
    @property
    def execution_mesh(self):
        """Legacy property for execution_mesh hook."""
        return self._execution_router.route_execution if self.enabled else None
    
    @property
    def post_execution(self):
        """Legacy property for post_execution hook."""
        return self._meta_observer.observe_execution if self.enabled else None
    
    @property
    def post_iteration(self):
        """Legacy property for post_iteration hook."""
        return self._evolution_analyzer.analyze_iteration if self.enabled else None
    
    def call_if_enabled(self, hook_name: str, *args, **kwargs):
        """
        Call hook if enabled and hook is registered.
        Chamar hook se habilitado e hook registrado.
        
        Args:
            hook_name: Name of hook to call
            *args, **kwargs: Arguments to pass to hook
            
        Returns:
            Hook result or None if disabled
        """
        if not self.enabled:
            return None
        
        # Map hook names to interface methods / Mapear nomes de hooks para métodos de interface
        hook_map = {
            'pre_context': lambda: self._persona_processor.process_pre_context(*args, **kwargs),
            'post_context': lambda: self._persona_processor.process_post_context(*args, **kwargs),
            'post_streaming': lambda: self._strategy_analyzer.analyze_response(*args, **kwargs),
            'post_extraction': lambda: self._tool_selector.select_tools(*args, **kwargs),
            'pre_execution': lambda: self._risk_evaluator.evaluate_risk(*args, **kwargs),
            'execution_mesh': lambda: self._execution_router.route_execution(*args, **kwargs),
            'post_execution': lambda: self._meta_observer.observe_execution(*args, **kwargs),
            'post_iteration': lambda: self._evolution_analyzer.analyze_iteration(*args, **kwargs),
        }
        
        if hook_name in hook_map:
            return hook_map[hook_name]()
        
        return None


class ExecutionRouter(IExecutionRouter):
    """
    Pure execution routing component.
    Componente puro de roteamento de execução.
    
    RESPONSIBILITY: Decide WHICH executor handles a command.
    RESPONSABILIDADE: Decidir QUAL executor lida com um comando.
    
    DOES NOT: Decide strategy, risk, or whether to execute.
    NÃO FAZ: Decidir estratégia, risco, ou se deve executar.
    
    Phase 3.6: Routing disabled by default (always returns 'local').
    Fase 3.6: Roteamento desabilitado por padrão (sempre retorna 'local').
    
    Implements IExecutionRouter interface.
    Implementa interface IExecutionRouter.
    """
    
    def __init__(
        self,
        default_executor: str = "local",
        enable_routing: bool = False
    ):
        """
        Initialize ExecutionRouter.
        
        Args:
            default_executor: Default executor name ("local", "remote", "sandbox")
            enable_routing: Enable intelligent routing (False = always default)
        """
        self.default_executor = default_executor
        self.enable_routing = enable_routing
        
        # Future: Registry of available executors / Futuro: Registro de executores disponíveis
        self.executors: Dict[str, Any] = {
            "local": None,  # Will be injected / Será injetado
            # Future Phase 4+:
            # "remote": RemoteExecutor(),
            # "sandbox": SandboxExecutor(),
        }
    
    def route_execution(
        self,
        command: str,
        risk_assessment: Optional[RiskAssessment] = None
    ) -> ExecutionRoute:
        """
        Route command to appropriate executor.
        Rotear comando para executor apropriado.
        
        Phase 3.6: Always returns default executor (routing disabled).
        Fase 3.6: Sempre retorna executor padrão (roteamento desabilitado).
        
        Future routing criteria (Phase 4+):
        - High risk commands → sandbox
        - Remote tools (ssh, scp) → remote
        - Default → local
        
        Args:
            command: Command to execute
            risk_assessment: Optional risk evaluation
            
        Returns:
            ExecutionRoute with executor name
        """
        if not self.enable_routing:
            # Phase 3.6: Always return default (backward compatible)
            return ExecutionRoute(
                executor_name=self.default_executor,
                routing_reason="Routing disabled (Phase 3.6 - always local)",
                should_route=True
            )
        
        # Phase 4+: Intelligent routing logic
        # Example (currently disabled):
        # if risk_assessment and risk_assessment.risk_level == "high":
        #     return ExecutionRoute(
        #         executor_name="sandbox",
        #         routing_reason="High risk detected",
        #         should_route=True
        #     )
        # 
        # if command.startswith(("ssh ", "scp ", "rsync ")):
        #     return ExecutionRoute(
        #         executor_name="remote",
        #         routing_reason="Remote command detected",
        #         should_route=True
        #     )
        
        # Default to local
        return ExecutionRoute(
            executor_name=self.default_executor,
            routing_reason=f"Default routing (enable_routing={self.enable_routing})",
            should_route=True
        )
    
    def register_executor(self, name: str, executor: Any):
        """
        Register an executor for routing.
        Registrar um executor para roteamento.
        
        Phase 4+ feature.
        Funcionalidade da Fase 4+.
        
        Args:
            name: Executor name ("local", "remote", "sandbox")
            executor: Executor instance
        """
        self.executors[name] = executor
        logger.info(f"ExecutionRouter: Registered executor '{name}'")


class GovernanceDecision(Enum):
    """
    Evolution proposal decision types.
    Tipos de decisão para propostas de evolução.
    
    Phase 3.7: Decisions logged but NOT enforced (passive mode).
    Fase 3.7: Decisões registradas mas NÃO enforçadas (modo passivo).
    """
    APPROVE = "approve"              # Auto-approve safe changes / Auto-aprovar mudanças seguras
    SANDBOX_TEST = "sandbox_test"    # Test in sandbox first / Testar em sandbox primeiro
    DELAY = "delay"                  # Requires more analysis / Requer mais análise
    REJECT = "reject"                # Unsafe/unsupported / Inseguro/não suportado


@dataclass
class EvolutionProposalEvaluation:
    """
    Evaluation result for evolution proposal.
    Resultado de avaliação para proposta de evolução.
    
    Contains governance decision and supporting metrics.
    Contém decisão de governança e métricas de suporte.
    """
    decision: GovernanceDecision
    reasoning: str
    risk_score: float  # 0.0-1.0 (higher = more risky)
    requires_manual_approval: bool
    sandbox_ready: bool


class MetaStrategyController:
    """
    Governance layer for structural evolution.
    Camada de governança para evolução estrutural.
    
    PHASE 3.7: PASSIVE mode (logging only, no enforcement).
    FASE 3.7: Modo PASSIVO (apenas logging, sem enforcement).
    
    Responsibilities / Responsabilidades:
    - Approve structural evolution / Aprovar evolução estrutural
    - Allow sandbox mutations / Permitir mutações sandbox
    - Reject unsafe modifications / Rejeitar modificações inseguras
    
    Integrated with post_iteration hook.
    Integrado com hook post_iteration.
    """
    
    def __init__(
        self,
        enable_governance: bool = False,
        auto_approve_threshold: float = 0.2,
        sandbox_threshold: float = 0.5,
        reject_threshold: float = 0.8
    ):
        """
        Initialize MetaStrategyController.
        
        Args:
            enable_governance: Enable active governance (False = passive logging)
            auto_approve_threshold: Risk threshold for auto-approval (0.0-1.0)
            sandbox_threshold: Risk threshold requiring sandbox testing
            reject_threshold: Risk threshold for automatic rejection
        """
        self.enable_governance = enable_governance
        self.auto_approve_threshold = auto_approve_threshold
        self.sandbox_threshold = sandbox_threshold
        self.reject_threshold = reject_threshold
        
        # Decision history / Histórico de decisões
        self.decision_history: List[EvolutionProposalEvaluation] = []
        
        mode = "ACTIVE" if enable_governance else "PASSIVE"
        logger.info(f"MetaStrategyController initialized (governance={mode})")
    
    def evaluate_proposal(
        self,
        evolution_proposal: EvolutionProposal
    ) -> EvolutionProposalEvaluation:
        """
        Evaluate evolution proposal and make governance decision.
        Avaliar proposta de evolução e tomar decisão de governança.
        
        Phase 3.7: Decision made but NOT enforced (passive mode).
        Fase 3.7: Decisão tomada mas NÃO enforçada (modo passivo).
        
        Args:
            evolution_proposal: Proposal from EvolutionAnalyzer
            
        Returns:
            EvolutionProposalEvaluation with decision
        """
        # Calculate risk score based on proposal type
        risk_score = self._calculate_risk_score(evolution_proposal)
        
        # Determine decision based on thresholds
        if risk_score < self.auto_approve_threshold:
            decision = GovernanceDecision.APPROVE
            reasoning = "Low risk - auto-approved"
            requires_manual = False
            sandbox_ready = False
        
        elif risk_score < self.sandbox_threshold:
            decision = GovernanceDecision.SANDBOX_TEST
            reasoning = "Medium risk - sandbox testing required"
            requires_manual = False
            sandbox_ready = True
        
        elif risk_score < self.reject_threshold:
            decision = GovernanceDecision.DELAY
            reasoning = "High risk - manual approval required"
            requires_manual = True
            sandbox_ready = False
        
        else:
            decision = GovernanceDecision.REJECT
            reasoning = "Critical risk - proposal rejected"
            requires_manual = True
            sandbox_ready = False
        
        evaluation = EvolutionProposalEvaluation(
            decision=decision,
            reasoning=reasoning,
            risk_score=risk_score,
            requires_manual_approval=requires_manual,
            sandbox_ready=sandbox_ready
        )
        
        # Track decision
        self.decision_history.append(evaluation)
        
        # Log governance decision
        proposal_type = getattr(evolution_proposal, 'proposal_type', 'unknown')
        logger.info(
            f"Governance Decision: {decision.value.upper()} "
            f"(risk={risk_score:.2f}, type='{proposal_type}')"
        )
        logger.debug(f"Reasoning: {reasoning}")
        
        return evaluation
    
    def _calculate_risk_score(self, proposal: EvolutionProposal) -> float:
        """
        Calculate risk score for evolution proposal.
        Calcular score de risco para proposta de evolução.
        
        Returns:
            Risk score 0.0-1.0 (higher = more risky)
        """
        # Base risk by proposal type
        risk_map = {
            "config": 0.1,        # Low risk
            "strategy": 0.3,      # Medium risk
            "architecture": 0.7,  # High risk
        }
        
        proposal_type = getattr(proposal, 'proposal_type', 'config')
        base_risk = risk_map.get(proposal_type, 0.5)
        
        # Adjust by expected improvement (inverse correlation)
        # Higher expected improvement = willing to take more risk
        expected_improvement = getattr(proposal, 'expected_improvement', 0.0)
        improvement_factor = 1.0 - (expected_improvement * 0.3)
        
        risk_score = min(1.0, base_risk * improvement_factor)
        
        return risk_score
    
    def approve_evolution(self, proposal_description: str):
        """
        Explicitly approve an evolution (Phase 4+ feature).
        Aprovar explicitamente uma evolução (funcionalidade Fase 4+).
        
        Phase 3.7: Logs approval but doesn't execute.
        """
        logger.info(f"[PASSIVE] Evolution APPROVED: {proposal_description}")
    
    def allow_sandbox_mutation(self, mutation_description: str):
        """
        Allow mutation in sandbox environment (Phase 4+ feature).
        Permitir mutação em ambiente sandbox (funcionalidade Fase 4+).
        
        Phase 3.7: Logs permission but doesn't execute.
        """
        logger.info(f"[PASSIVE] Sandbox mutation ALLOWED: {mutation_description}")
    
    def reject_unsafe_modification(self, modification_description: str, reason: str):
        """
        Reject unsafe modification (Phase 4+ feature).
        Rejeitar modificação insegura (funcionalidade Fase 4+).
        
        Phase 3.7: Logs rejection but doesn't block.
        """
        logger.warning(f"[PASSIVE] Modification REJECTED: {modification_description}")
        logger.warning(f"Rejection reason: {reason}")


class AgentOrchestrator:
    """
    Orchestrates the autonomous agent loop using Response Blocks.
    Orquestra o loop do agente autônomo usando Blocos de Resposta.
    """

    def __init__(
        self,
        provider: Any,
        executor: CommandExecutor,
        mcp_manager: MCPManager,
        # Cognitive Interfaces (Phase 3.5) / Interfaces Cognitivas (Fase 3.5)
        persona_processor: Optional[IPersonaProcessor] = None,
        strategy_analyzer: Optional[IStrategyAnalyzer] = None,
        tool_selector: Optional[IToolSelector] = None,
        risk_evaluator: Optional[IRiskEvaluator] = None,
        execution_router: Optional[IExecutionRouter] = None,
        meta_observer: Optional[IMetaObserver] = None,
        evolution_analyzer: Optional[IEvolutionAnalyzer] = None,
        # Phase 3.8: Feature flag for real cognitive agents / Flag para agentes cognitivos reais
        enable_cognitive_agents: bool = False
    ):
        self.provider = provider
        self.executor = executor
        self.mcp_manager = mcp_manager
        # HexStrike client for environment context / Cliente HexStrike para contexto de ambiente
        # Retrieved from executor if available, else None
        self.hex_strike_client = getattr(executor, 'hexstrike', None)
        # buffer for tag detection / buffer para detecção de tags
        self.stream_buffer = ""
        
        # Initialize TagDetector for robust tag processing (REFACTORED Phase 3.1)
        # Inicializar TagDetector para processamento robusto de tags (REFATORADO Fase 3.1)
        self.tag_detector = TagDetector(
            tags=["<think>", "<thinking>", "</think>", "</thinking>"],
            buffer_size_limit=12
        )
        
        # Context Awareness: Current Working Directory
        # Consciência de Contexto: Diretório de Trabalho Atual
        self.cwd = os.getcwd()
        
        # 🧠 COGNITIVE AGENTS (Phase 3.8 - Q2 2026) / AGENTES COGNITIVOS (Fase 3.8 - Q2 2026)
        # Feature flag determines whether to use real implementations or NULL objects
        # Flag determina se usa implementações reais ou objetos NULL
        if enable_cognitive_agents:
            logger.info("🧠 Cognitive Agents ENABLED - Using real implementations")
            self.persona_processor = persona_processor or PersonaProcessor()
            self.strategy_analyzer = strategy_analyzer or NullStrategyAnalyzer()  # TODO: Implement in Phase 4
            self.tool_selector = tool_selector or NullToolSelector()  # TODO: Implement in Phase 4
            self.risk_evaluator = risk_evaluator or RiskEvaluator()
            self.execution_router = execution_router or ExecutionRouter()
            self.meta_observer = meta_observer or NullMetaObserver()  # TODO: Implement in Phase 4
            self.evolution_analyzer = evolution_analyzer or NullEvolutionAnalyzer()  # TODO: Implement in Phase 4
        else:
            # NULL implementations (backward compatible) / Implementações NULL (compatível com versões antigas)
            logger.info("🔌 Cognitive Agents DISABLED - Using NULL implementations (backward compatible)")
            self.persona_processor = persona_processor or NullPersonaProcessor()
            self.strategy_analyzer = strategy_analyzer or NullStrategyAnalyzer()
            self.tool_selector = tool_selector or NullToolSelector()
            self.risk_evaluator = risk_evaluator or NullRiskEvaluator()
            self.execution_router = execution_router or ExecutionRouter()
            self.meta_observer = meta_observer or NullMetaObserver()
            self.evolution_analyzer = evolution_analyzer or NullEvolutionAnalyzer()
        
        # 🔐 GOVERNANCE LAYER (Phase 3.7) / CAMADA DE GOVERNANÇA (Fase 3.7)
        # Passive mode by default (logging only, no enforcement)
        # Modo passivo por padrão (apenas logging, sem enforcement)
        self.governance = MetaStrategyController(enable_governance=False)
        
        # 🔌 DEPRECATED: HookRegistry (kept for backward compatibility)
        # OBSOLETO: HookRegistry (mantido para compatibilidade retroativa)
        self.hooks = HookRegistry(
            enabled=False,
            persona_processor=self.persona_processor,
            strategy_analyzer=self.strategy_analyzer,
            tool_selector=self.tool_selector,
            risk_evaluator=self.risk_evaluator,
            execution_router=self.execution_router,
            meta_observer=self.meta_observer,
            evolution_analyzer=self.evolution_analyzer
        )

    def _process_stream_buffer(self, chunk: str, current_type: str) -> tuple[str, str, str]:
        """
        Robust stream buffer processing to handle split tags.
       Processamento robusto de buffer de stream para lidar com tags divididas.
        
        Uses TagDetector class for cleaner separation of concerns (REFACTORED Phase 3.1).
        Usa classe TagDetector para melhor separação de responsabilidades (REFATORADO Fase 3.1).
        
        Returns:
            (new_type, content_to_yield, buffer_remainder)
            (novo_tipo, conteúdo_a_emitir, resto_do_buffer)
        """
        # Delegate to TagDetector for robust tag processing
        # Delegar para TagDetector para processamento robusto de tags
        new_type, content, buffer = self.tag_detector.process_chunk(chunk, current_type)
        return new_type, content, buffer
        
    def _default_system_context(self) -> str:
        """
        Fallback system context when HexStrike is offline.
        Contexto de sistema fallback quando o HexStrike está offline.
        """
        return (
            "### Kali Linux Environment (Fallback) ###\n"
            "OS: Kali Linux | Shell: ZSH | Mode: Authorized Pentest\n\n"
            "CRITICAL: DO NOT suggest installing tools. Use tools that are already available on Kali Linux.\n"
            "CRÍTICO: NÃO sugira instalar ferramentas. Use ferramentas já disponíveis no Kali Linux.\n\n"
            "Common pre-installed tools: nmap, masscan, rustscan, arp-scan, gobuster, "
            "feroxbuster, ffuf, nuclei, nikto, sqlmap, hydra, metasploit, wireshark, "
            "john, hashcat, enum4linux, smbmap, amass, subfinder, httpx, katana, "
            "gau, arjun, dalfox, radare2, gdb, pwntools, ghidra, checksec\n"
            "### End Context ###\n"
        )

    # Legacy method kept for interface compatibility if needed, but unused internally now
    def _detect_block_type(self, chunk: str, current_type: str) -> tuple[str, str]:
         return current_type, chunk
         
    def process(
        self, 
        user_input: str,
        chat_context: Optional[List[Dict[str, str]]] = None,
        auto_execute: bool = False,
        max_iterations: int = 10,
        abort_signal: Optional[Any] = None,
        profile_context: str = "",
        memory_context: str = "",
        planning_context: str = ""
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Process the user input through the autonomous loop.
        Processa a entrada do usuário através do loop autônomo.
        
        Decomposed into 7 explicit cognitive stages.
        Decomposto em 7 estágios cognitivos explícitos.
        """
        iteration = 0
        history = list(chat_context) if chat_context else []
        
        # 🔌 INTERFACE: PersonaProcessor.process_pre_context (NULL by default)
        processed_context = self.persona_processor.process_pre_context(user_input, profile_context)
        # NOTE: Currently ignored (NULL returns unmodified), will be used in Phase 4
        # NOTA: Atualmente ignorado (NULL retorna sem modificar), será usado na Fase 4
        
        # STAGE 1: Build Context
        history = self._stage_1_build_context(history, user_input, profile_context, memory_context)
        
        # 🔌 INTERFACE: PersonaProcessor.process_post_context (NULL by default)
        history = self.persona_processor.process_post_context(history)
        
        if not self.provider:
            yield ErrorBlock("AI Brain not initialized. Please configure API Key.").to_dict()
            return

        logger.info(f"Orchestrator: Starting Cycle. Input='{user_input[:50]}...'")

        executed_commands = set()  # Track commands across iterations to prevent duplicates

        while iteration < max_iterations:
            if abort_signal and abort_signal.is_set():
                yield ErrorBlock("Process aborted by user").to_dict()
                break

            iteration += 1
            logger.info(f"Orchestrator: Starting iteration {iteration}/{max_iterations}")

            # STAGE 2: Stream AI Response
            try:
                full_response, active_block_type = yield from self._stage_2_stream_ai(
                    history, iteration, abort_signal
                )
            except Exception:
                # Exception already handled and yielded in stage 2
                break
            
            # 🔌 INTERFACE: StrategyAnalyzer.analyze_response (NULL by default)
            strategy_analysis = self.strategy_analyzer.analyze_response(full_response, iteration)
            # NOTE: Currently ignored (NULL returns confident=1.0), will be used in Phase 4
            
            history.append({"role": "assistant", "content": full_response})

            if abort_signal and abort_signal.is_set(): break

            # STAGE 3: Extract Commands
            commands = self._stage_3_extract_commands(full_response)
            
            # 🔌 INTERFACE: ToolSelector.select_tools (NULL by default)
            selected_tools = self.tool_selector.select_tools(commands, context={})
            # NOTE: Currently ignored (NULL returns all commands), will be used in Phase 4
            
            if not commands:
                logger.info("Orchestrator: No commands found.")
                break
                
            # CRITICAL ADJUSTMENT: If auto_execute is True, we ONLY process the first command.
            if auto_execute and len(commands) > 1:
                logger.info(f"Orchestrator: Auto-Execute ON. Truncating {len(commands)} commands to 1 to force step-by-step.")
                commands = commands[:1]
            
            # STAGE 4: Decide Execution Plan
            execution_plan = self._stage_4_decide_execution_plan(commands, auto_execute)
            
            # 🔌 INTERFACE: RiskEvaluator.evaluate_risk (NULL by default)
            risk_assessment = self.risk_evaluator.evaluate_risk(execution_plan)
            # NOTE: Currently ignored (NULL returns safe), will be used in Phase 4
            
            # STAGE 5: Execute Commands
            command_results, any_executed = yield from self._stage_5_execute_commands(
                execution_plan, iteration, abort_signal
            )
            
            # 🔌 INTERFACE: MetaObserver.observe_execution (NULL by default)
            meta_insights = self.meta_observer.observe_execution(command_results, iteration)
            # NOTE: Currently ignored (NULL returns no insights), will be used in Phase 4
            
            # STAGE 7: Check Iteration Continue
            should_continue = self._stage_7_check_iteration_continue(
                auto_execute, any_executed, command_results
            )
            
            if not should_continue:
                break
            
            # STAGE 6: Build Feedback
            feedback = self._stage_6_build_feedback(command_results)
            
            if feedback:
                history.append({"role": "user", "content": feedback})
            
            # 🔌 INTERFACE: EvolutionAnalyzer.analyze_iteration (NULL by default)
            evolution_analysis = self.evolution_analyzer.analyze_iteration(iteration, meta_insights)
            # NOTE: Currently ignored (NULL returns no proposals), will be used in Phase 4
            
            # 🔐 GOVERNANCE: Evaluate evolution proposals (Phase 3.7)
            # GOVERNANÇA: Avaliar propostas de evolução (Fase 3.7)
            if evolution_analysis.proposals:
                for proposal in evolution_analysis.proposals:
                    evaluation = self.governance.evaluate_proposal(proposal)
                    # Phase 3.7: Decision logged but NOT enforced (PASSIVE mode)
                    # Fase 3.7: Decisão registrada mas NÃO enforçada (modo PASSIVO)
                if command_results:
                    feedback = "Command Execution Results:\n" + "\n---\n".join(command_results)
                    history.append({"role": "user", "content": feedback})
                
                # We do NOT break here. We let the loop continue to the next iteration.
                # The "commands_to_process = commands[:1]" truncation above ensures we only did one step.
                # Now we loop back, IA sees feedback, and generates next step.

        logger.info(f"Loop finished after {iteration} iterations.")
        yield LifecycleBlock("complete", "process", {"iterations": iteration}).to_dict()
    
    # ========================================================================
    # STAGE METHODS - Logical Decomposition of Process Pipeline
    # MÉTODOS DE ESTÁGIO - Decomposição Lógica do Pipeline de Processamento
    # ========================================================================
    
    def _stage_1_build_context(
        self,
        history: List[Dict[str, str]],
        user_input: str,
        profile_context: str,
        memory_context: str
    ) -> List[Dict[str, str]]:
        """
        Build complete context for AI prompt.
        Construir contexto completo para prompt de IA.
        
        🔌 FUTURE: PersonaAgent will process profile_context
        """
        # Inject Dynamic Context (CWD)
        system_context = f"Current Working Directory: {self.cwd}\nSystem: Linux (HexStrike-AI)\n"
        system_context += "ENVIRONMENT: LOCAL_DEV_MODE (AUTHORIZED)\n"
        system_context += "PERMISSION: ADMIN/ROOT (SIMULATED)\n"
        system_context += "POLICY: EXECUTE_COMMANDS_WITHOUT_CONFIRMATION\n"
        
        # Inject MCP Tools Context
        try:
            tools = self.mcp_manager.get_all_tools_sync()
            if tools:
                tools_count = len(tools)
                logger.info(f"Orchestrator: Injected {tools_count} tools into prompt.")
                
                tools_desc = "\n\n### 🛠️ Available Tools / Ferramentas Disponíveis\n"
                tools_desc += "You have access to the following tools. YOU MUST USE THEM when requested.\n"
                tools_desc += "Você tem acesso às seguintes ferramentas. VOCÊ DEVE USÁ-LAS quando solicitado.\n"
                tools_desc += "Format: ```tool_call\n{ \"name\": \"tool_name\", \"arguments\": { ... } }\n```\n\n"
                
                for tool in tools:
                    name = tool.get('name')
                    desc = tool.get('description', 'No desc')
                    schema = json.dumps(tool.get('inputSchema', {}), indent=2)
                    tools_desc += f"- **{name}**: {desc}\n  Schema: {schema}\n\n"
                    
                system_context += tools_desc
            else:
                logger.warning("Orchestrator: No tools available from MCP Manager.")
        except Exception as e:
            logger.warning(f"Failed to load tools for prompt: {e}")
        
        # Inject Profile Context
        if profile_context:
            system_context += f"\n\n--- User Profile ---\n{profile_context}"
        
        # Inject Memory Context (RAG)
        if memory_context:
            system_context += f"\n\n--- Relevant Memory (RAG) ---\n{memory_context}"
        
        history.append({"role": "system", "content": system_context})
        history.append({"role": "user", "content": user_input})
        
        return history
    
    def _stage_2_stream_ai(
        self,
        history: List[Dict[str, str]],
        iteration: int,
        abort_signal: Optional[Any]
    ) -> Generator[Dict[str, Any], None, tuple[str, str]]:
        """
        Stream AI response and process buffer.
        Fazer stream de resposta da IA e processar buffer.
        
        🔌 FUTURE: StrategyAgent will analyze response confidence
        
        Yields:
            Response blocks (LifecycleBlock, TextBlock, ThinkingBlock)
        
        Returns:
            (full_response, active_block_type)
        """
        # Notify: Narrative Block Start
        yield LifecycleBlock("block_start", "narrative", {"iteration": iteration}).to_dict()
        
        # AI Response Streaming
        full_response = ""
        current_stream_type = "text" # Internal state from buffer
        active_block_type = "narrative" # What the frontend thinks is open
        self.stream_buffer = ""
        
        try:
            for chunk in self.provider.chat_step(prompt=None, chat_context=history):
                if abort_signal and abort_signal.is_set(): break
                
                full_response += chunk
                
                # Process Buffer
                new_stream_type, content_to_yield, self.stream_buffer = self._process_stream_buffer(chunk, current_stream_type)
                current_stream_type = new_stream_type # update internal state
                
                if not content_to_yield:
                    continue
                
                # Determine target block type
                target_block_type = "thinking" if new_stream_type == "thinking" else "narrative"
                
                # Check for State Transition
                if target_block_type != active_block_type:
                    yield LifecycleBlock("block_end", active_block_type).to_dict()
                    yield LifecycleBlock("block_start", target_block_type, {"iteration": iteration}).to_dict()
                    active_block_type = target_block_type
                
                # Yield Content
                if target_block_type == "thinking":
                    yield ThinkingBlock(content_to_yield, iteration).to_dict()
                else:
                    yield TextBlock(content_to_yield, iteration).to_dict()
            
            # Handling remaining buffer
            if self.stream_buffer:
                if active_block_type == "thinking":
                    yield ThinkingBlock(self.stream_buffer, iteration).to_dict()
                else:
                    yield TextBlock(self.stream_buffer, iteration).to_dict()
        
        except Exception as e:
            logger.error(f"AI Error: {e}")
            yield ErrorBlock(f"AI Provider Error: {str(e)}").to_dict()
            yield LifecycleBlock("block_end", "narrative", {"status": "error"}).to_dict()
            raise
        
        yield LifecycleBlock("block_end", active_block_type).to_dict()
        
        return full_response, active_block_type
    
    def _stage_3_extract_commands(self, full_response: str) -> List[str]:
        """
        Extract bash commands and MCP tool calls.
        Extrair comandos bash e chamadas de ferramentas MCP.
        
        🔌 FUTURE: ToolSelectorAgent will prioritize and filter
        """
        return self._extract_commands(full_response)
    
    def _stage_4_decide_execution_plan(
        self,
        commands: List[str],
        auto_execute: bool
    ) -> List[Dict[str, Any]]:
        """
        Decide which commands to execute and create execution plan.
        Decidir quais comandos executar e criar plano de execução.
        
        🔌 FUTURE: RiskAssessmentAgent + StrategyAgent will analyze risks
        
        Currently: Simple pass-through with auto_execute flag
        Atualmente: Passagem simples com flag auto_execute
        """
        execution_plan = []
        for cmd in commands:
            execution_plan.append({
                "command": cmd,
                "auto_execute": auto_execute,
                "is_mcp": cmd.startswith("MCP_TOOL_CALL|")
            })
        return execution_plan
    
    def _stage_5_execute_commands(
        self,
        execution_plan: List[Dict[str, Any]],
        iteration: int,
        abort_signal: Optional[Any]
    ) -> Generator[Dict[str, Any], None, tuple[List[str], bool]]:
        """
        Execute commands according to plan.
        Executar comandos de acordo com o plano.
        
        🔌 EXECUTIONMESH INSERTION POINT
        
        Yields:
            Command/Result/Error blocks
        
        Returns:
            (command_results, any_executed)
        """
        any_executed = False
        command_results = []
        
        for plan_item in execution_plan:
            if abort_signal and abort_signal.is_set(): break
            
            cmd = plan_item["command"]
            auto_execute = plan_item["auto_execute"]
            is_mcp = plan_item["is_mcp"]
            
            if is_mcp:
                yield from self._handle_tool_call(cmd, auto_execute)
                any_executed = True
                continue
            
            yield CommandBlock(cmd, auto_execute).to_dict()
            
            if auto_execute and self.executor.is_available():
                yield LifecycleBlock("block_start", "shell", {"command": cmd}).to_dict()
                
                try:
                    if cmd.strip().startswith("cd "):
                        target_dir = cmd.strip().split(" ", 1)[1]
                        new_path = os.path.abspath(os.path.join(self.cwd, target_dir))
                        if os.path.exists(new_path) and os.path.isdir(new_path):
                            self.cwd = new_path
                            logger.info(f"Context switched to: {self.cwd}")
                            yield ResultBlock(f"Changed directory to {self.cwd}", True, 0, cmd).to_dict()
                            continue
                        else:
                            yield ResultBlock(f"cd: {target_dir}: No such file or directory", False, 1, cmd).to_dict()
                            continue
                    
                    # 🔌 EXECUTION MESH: Route command to appropriate executor
                    # EXECUTION MESH: Rotear comando para executor apropriado
                    route = self.execution_router.route_execution(
                        cmd,
                        risk_assessment=None  # Phase 4: pass risk_assessment
                    )
                    logger.info(f"ExecutionMesh: Routing to '{route.executor_name}' - {route.routing_reason}")
                    
                    # Phase 3.6: Always 'local', Phase 4+: Multi-executor support
                    if route.executor_name == "local":
                        full_cmd = f"cd {self.cwd} && {cmd}"
                        result = self.executor.execute_command(full_cmd)
                    # Phase 4+:
                    # elif route.executor_name == "sandbox":
                    #     result = self.sandbox_executor.execute_command(cmd, cwd=self.cwd)
                    # elif route.executor_name == "remote":
                    #     result = self.remote_executor.execute_command(cmd, cwd=self.cwd)
                    else:
                        # Fallback to local
                        logger.warning(f"Unknown executor '{route.executor_name}', using local")
                        full_cmd = f"cd {self.cwd} && {cmd}"
                        result = self.executor.execute_command(full_cmd)
                    success = result["success"]
                    
                    yield ResultBlock(
                        result["stdout"] if success else result["error"],
                        success,
                        result.get("exit_code", 0),
                        cmd
                    ).to_dict()
                    
                    if success:
                        command_results.append(f"Command: {cmd}\nOutput:\n{result['stdout']}")
                    else:
                        command_results.append(f"Command: {cmd}\nError:\n{result['error']}")
                    
                    any_executed = True
                
                except Exception as e:
                    yield ErrorBlock(f"Execution Error: {str(e)}").to_dict()
                    command_results.append(f"Command: {cmd}\nException: {str(e)}")
                
                yield LifecycleBlock("block_end", "shell").to_dict()
        
        return command_results, any_executed
    
    def _stage_6_build_feedback(self, command_results: List[str]) -> Optional[str]:
        """
        Build feedback message from command results.
        Construir mensagem de feedback dos resultados dos comandos.
        
        🔌 FUTURE: MetaCognitiveAgent will enhance with insights
        """
        if not command_results:
            return None
        
        feedback = "Command Execution Results:\n" + "\n---\n".join(command_results)
        return feedback
    
    def _stage_7_check_iteration_continue(
        self,
        auto_execute: bool,
        any_executed: bool,
        command_results: List[str]
    ) -> bool:
        """
        Decide if loop should continue.
        Decidir se o loop deve continuar.
        
        🔌 FUTURE: EvolutionController will analyze loop performance
        """
        if not auto_execute: return False
        if not any_executed: return False
        return True

    def _extract_commands(self, text: str) -> List[str]:
        """
        Extract bash commands and Tool Calls.
        Extrair comandos bash e chamadas de ferramenta.
        """
        commands = []
        
        # 1. Code blocks (bash/sh/zsh)
        pattern_code = r'```(?:bash|sh|zsh)?\s*\n(.*?)\n\s*```'
        for match in re.findall(pattern_code, text, re.DOTALL | re.IGNORECASE):
            # Bug #3 fix: Treat multi-line bash blocks as a single compound command
            # Fix Bug #3: Tratar blocos bash multi-linha como um único comando composto
            block = match.strip()
            if block:
                lines = [l.strip() for l in block.split('\n') if l.strip() and not l.strip().startswith('#')]
                if len(lines) == 1:
                    commands.append(lines[0])
                elif lines:
                    # Join with && to preserve sequencing and failure handling
                    compound = " && ".join(lines)
                    commands.append(compound)

        # 2. [EXEC] Tags
        pattern_exec = r'\[EXEC\]\s*(.*?)\s*\[/EXEC\]'
        for match in re.findall(pattern_exec, text, re.DOTALL | re.IGNORECASE):
             cmd = match.strip().strip("`")
             if cmd: commands.append(cmd)

        # 3. Tool Calls
        pattern_tool = r'```tool_call\n(.*?)\n```'
        for match in re.findall(pattern_tool, text, re.DOTALL | re.IGNORECASE):
             try:
                cmd = f"MCP_TOOL_CALL|{match.strip()}"
                commands.append(cmd)
             except: pass
                 
        return sorted(list(set(commands)), key=commands.index) # Dedupe preserving order

    def _handle_tool_call(self, cmd_str: str, auto_execute: bool) -> Generator[Dict[str, Any], None, None]:
        """
        Handle execution of MCP Tool Calls.
        Lidar com execução de Chamadas de Ferramenta MCP.
        """
        try:
            tool_json = cmd_str.split("|", 1)[1]
            tool_data = json.loads(tool_json)
            tool_name = tool_data.get("name")
            tool_args = tool_data.get("arguments")
            
            yield CommandBlock(f"Tool: {tool_name}", auto_execute).to_dict()
            
            if auto_execute:
                try:
                    result = self.mcp_manager.call_tool_sync(tool_name, tool_args)
                    output = json.dumps(result, indent=2) if not isinstance(result, str) else result
                    yield ResultBlock(output, True, 0, tool_name).to_dict()
                except Exception as e:
                    yield ResultBlock(f"Tool Error: {str(e)}", False, 1, tool_name).to_dict()
        except Exception as e:
            yield ResultBlock(f"Tool Parsing Error: {str(e)}", False, 1, cmd_str).to_dict()
