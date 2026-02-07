"""
Cognitive Interfaces Module
Módulo de Interfaces Cognitivas

Defines contracts for cognitive agents in the multi-agent pipeline.
Define contratos para agentes cognitivos no pipeline multi-agente.

PHASE 3 of Transitional Cognitive Bridge Architecture.
FASE 3 da Arquitetura de Ponte Cognitiva Transicional.

All interfaces use ABC (Abstract Base Class) pattern.
Todas interfaces usam padrão ABC (Abstract Base Class).

NULL object implementations provided for no-op defaults.
Implementações NULL object fornecidas para padrões no-op.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.2.0 (Transitional Architecture - Phase 3)
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


# ============================================================================
# DATACLASSES - Return Types for Interface Methods
# DATACLASSES - Tipos de Retorno para Métodos de Interface
# ============================================================================

@dataclass
class ProcessedContext:
    """
    Result of persona processing.
    Resultado do processamento de persona.
    """
    modified_input: str
    persona_metadata: Dict[str, Any] = field(default_factory=dict)
    context_enhancements: List[str] = field(default_factory=list)


@dataclass
class StrategyAnalysis:
    """
    Analysis of AI response and execution strategy.
    Análise de resposta da IA e estratégia de execução.
    """
    confidence_score: float  # 0.0-1.0
    should_continue: bool
    strategy_notes: List[str] = field(default_factory=list)


@dataclass
class SelectedTools:
    """
    Result of tool selection/prioritization.
    Resultado de seleção/priorização de ferramentas.
    """
    prioritized_commands: List[str]
    filtered_out: List[str] = field(default_factory=list)
    selection_reason: str = ""


@dataclass
class RiskAssessment:
    """
    Risk assessment for command execution.
    Avaliação de risco para execução de comandos.
    """
    risk_level: str  # "low", "medium", "high"
    should_execute: bool
    requires_approval: bool
    risk_factors: List[str] = field(default_factory=list)


@dataclass
class ExecutionRoute:
    """
    Routing decision for command execution.
    Decisão de roteamento para execução de comandos.
    """
    executor_name: str  # "local", "remote", "sandbox", etc.
    routing_reason: str
    should_route: bool


@dataclass
class MetaInsight:
    """
    Meta-cognitive observation.
    Observação meta-cognitiva.
    """
    insight_type: str  # "bottleneck", "pattern", "opportunity", "error"
    description: str
    confidence: float  # 0.0-1.0
    suggested_action: Optional[str] = None


@dataclass
class MetaInsights:
    """
    Collection of meta-observations.
    Coleção de meta-observações.
    """
    insights: List[MetaInsight] = field(default_factory=list)
    overall_health: float = 1.0  # 0.0-1.0


@dataclass
class EvolutionProposal:
    """
    Proposed evolution/adaptation.
    Proposta de evolução/adaptação.
    """
    proposal_type: str  # "config", "architecture", "strategy"
    description: str
    expected_improvement: float  # 0.0-1.0
    requires_approval: bool


@dataclass
class EvolutionAnalysis:
    """
    Analysis of evolution opportunities.
    Análise de oportunidades de evolução.
    """
    proposals: List[EvolutionProposal] = field(default_factory=list)
    should_evolve: bool = False


# ============================================================================
# COGNITIVE INTERFACES - Abstract Base Classes
# INTERFACES COGNITIVAS - Classes Base Abstratas
# ============================================================================

class IPersonaProcessor(ABC):
    """
    Interface for persona context processing.
    Interface para processamento de contexto de persona.
    
    Maps to: pre_context + post_context hooks
    Mapeia para: hooks pre_context + post_context
    
    Future implementation: PersonaAgent
    Implementação futura: PersonaAgent
    """
    
    @abstractmethod
    def process_pre_context(
        self,
        user_input: str,
        profile_context: str
    ) -> ProcessedContext:
        """
        Process user input and profile before context building.
        Processar entrada do usuário e perfil antes da construção de contexto.
        
        Args:
            user_input: Raw user input
            profile_context: User profile information
            
        Returns:
            ProcessedContext with modifications
        """
        pass
    
    @abstractmethod
    def process_post_context(
        self,
        history: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """
        Validate and enhance context after building.
        Validar e melhorar contexto após construção.
        
        Args:
            history: Chat history with injected context
            
        Returns:
            Modified history
        """
        pass


class IStrategyAnalyzer(ABC):
    """
    Interface for strategy analysis.
    Interface para análise de estratégia.
    
    Maps to: post_streaming hook
    Mapeia para: hook post_streaming
    
    Future implementation: StrategyAgent
    Implementação futura: StrategyAgent
    """
    
    @abstractmethod
    def analyze_response(
        self,
        full_response: str,
        iteration: int
    ) -> StrategyAnalysis:
        """
        Analyze AI response for confidence and strategy decisions.
        Analisar resposta da IA para confiança e decisões de estratégia.
        
        Args:
            full_response: Complete AI response text
            iteration: Current iteration number
            
        Returns:
            StrategyAnalysis with confidence metrics
        """
        pass


class IToolSelector(ABC):
    """
    Interface for tool/command selection.
    Interface para seleção de ferramentas/comandos.
    
    Maps to: post_extraction hook
    Mapeia para: hook post_extraction
    
    Future implementation: ToolSelectorAgent
    Implementação futura: ToolSelectorAgent
    """
    
    @abstractmethod
    def select_tools(
        self,
        commands: List[str],
        context: Optional[Dict[str, Any]] = None
    ) -> SelectedTools:
        """
        Prioritize and filter extracted commands.
        Priorizar e filtrar comandos extraídos.
        
        Args:
            commands: Extracted commands (bash + MCP)
            context: Additional context for selection
            
        Returns:
            SelectedTools with prioritization
        """
        pass


class IRiskEvaluator(ABC):
    """
    Interface for risk evaluation.
    Interface para avaliação de risco.
    
    Maps to: pre_execution hook
    Mapeia para: hook pre_execution
    
    Future implementation: RiskAssessmentAgent
    Implementação futura: RiskAssessmentAgent
    """
    
    @abstractmethod
    def evaluate_risk(
        self,
        execution_plan: List[Dict[str, Any]]
    ) -> RiskAssessment:
        """
        Evaluate risks in execution plan.
        Avaliar riscos no plano de execução.
        
        Args:
            execution_plan: Planned command executions
            
        Returns:
            RiskAssessment with safety recommendations
        """
        pass


class IExecutionRouter(ABC):
    """
    Interface for execution routing.
    Interface para roteamento de execução.
    
    Maps to: execution_mesh hook
    Mapeia para: hook execution_mesh
    
    Future implementation: ExecutionMesh
    Implementação futura: ExecutionMesh
    """
    
    @abstractmethod
    def route_execution(
        self,
        command: str,
        risk_assessment: Optional[RiskAssessment] = None
    ) -> ExecutionRoute:
        """
        Decide which executor should handle command.
        Decidir qual executor deve lidar com o comando.
        
        Args:
            command: Command to execute
            risk_assessment: Risk evaluation result
            
        Returns:
            ExecutionRoute with executor selection
        """
        pass


class IMetaObserver(ABC):
    """
    Interface for meta-cognitive observation.
    Interface para observação meta-cognitiva.
    
    Maps to: post_execution hook
    Mapeia para: hook post_execution
    
    Future implementation: MetaCognitiveAgent
    Implementação futura: MetaCognitiveAgent
    """
    
    @abstractmethod
    def observe_execution(
        self,
        command_results: List[str],
        iteration: int
    ) -> MetaInsights:
        """
        Generate meta-insights from execution results.
        Gerar meta-insights dos resultados de execução.
        
        Args:
            command_results: Results of executed commands
            iteration: Current iteration number
            
        Returns:
            MetaInsights with observations
        """
        pass


class IEvolutionAnalyzer(ABC):
    """
    Interface for evolution analysis.
    Interface para análise de evolução.
    
    Maps to: post_iteration hook
    Mapeia para: hook post_iteration
    
    Future implementation: EvolutionController
    Implementação futura: EvolutionController
    """
    
    @abstractmethod
    def analyze_iteration(
        self,
        iteration: int,
        meta_insights: Optional[MetaInsights] = None
    ) -> EvolutionAnalysis:
        """
        Analyze iteration for evolution opportunities.
        Analisar iteração para oportunidades de evolução.
        
        Args:
            iteration: Current iteration number
            meta_insights: Meta-observations from execution
            
        Returns:
            EvolutionAnalysis with proposals
        """
        pass


# ============================================================================
# NULL OBJECT IMPLEMENTATIONS - No-op Defaults
# IMPLEMENTAÇÕES NULL OBJECT - Padrões No-op
# ============================================================================

class NullPersonaProcessor(IPersonaProcessor):
    """
    No-op implementation of IPersonaProcessor.
    Implementação no-op de IPersonaProcessor.
    
    Used as default when no persona processing is needed.
    Usada como padrão quando nenhum processamento de persona é necessário.
    """
    
    def process_pre_context(
        self,
        user_input: str,
        profile_context: str
    ) -> ProcessedContext:
        # No-op: return unmodified
        return ProcessedContext(
            modified_input=user_input,
            persona_metadata={},
            context_enhancements=[]
        )
    
    def process_post_context(
        self,
        history: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        # No-op: return unmodified
        return history


class NullStrategyAnalyzer(IStrategyAnalyzer):
    """
    No-op implementation of IStrategyAnalyzer.
    Implementação no-op de IStrategyAnalyzer.
    """
    
    def analyze_response(
        self,
        full_response: str,
        iteration: int
    ) -> StrategyAnalysis:
        # No-op: always confident, always continue
        return StrategyAnalysis(
            confidence_score=1.0,
            should_continue=True,
            strategy_notes=[]
        )


class NullToolSelector(IToolSelector):
    """
    No-op implementation of IToolSelector.
    Implementação no-op de IToolSelector.
    """
    
    def select_tools(
        self,
        commands: List[str],
        context: Optional[Dict[str, Any]] = None
    ) -> SelectedTools:
        # No-op: return all commands unchanged
        return SelectedTools(
            prioritized_commands=commands,
            filtered_out=[],
            selection_reason="No filtering applied (NULL implementation)"
        )


class NullRiskEvaluator(IRiskEvaluator):
    """
    No-op implementation of IRiskEvaluator.
    Implementação no-op de IRiskEvaluator.
    """
    
    def evaluate_risk(
        self,
        execution_plan: List[Dict[str, Any]]
    ) -> RiskAssessment:
        # No-op: always safe
        return RiskAssessment(
            risk_level="low",
            should_execute=True,
            requires_approval=False,
            risk_factors=[]
        )


class NullExecutionRouter(IExecutionRouter):
    """
    No-op implementation of IExecutionRouter.
    Implementação no-op de IExecutionRouter.
    """
    
    def route_execution(
        self,
        command: str,
        risk_assessment: Optional[RiskAssessment] = None
    ) -> ExecutionRoute:
        # No-op: always route to local executor
        return ExecutionRoute(
            executor_name="local",
            routing_reason="Default routing (NULL implementation)",
            should_route=True
        )


class NullMetaObserver(IMetaObserver):
    """
    No-op implementation of IMetaObserver.
    Implementação no-op de IMetaObserver.
    """
    
    def observe_execution(
        self,
        command_results: List[str],
        iteration: int
    ) -> MetaInsights:
        # No-op: no insights
        return MetaInsights(
            insights=[],
            overall_health=1.0
        )


class NullEvolutionAnalyzer(IEvolutionAnalyzer):
    """
    No-op implementation of IEvolutionAnalyzer.
    Implementação no-op de IEvolutionAnalyzer.
    """
    
    def analyze_iteration(
        self,
        iteration: int,
        meta_insights: Optional[MetaInsights] = None
    ) -> EvolutionAnalysis:
        # No-op: no evolution needed
        return EvolutionAnalysis(
            proposals=[],
            should_evolve=False
        )
