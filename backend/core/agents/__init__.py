"""
Cognitive Agents Module
Módulo de Agentes Cognitivos

Contains real implementations of cognitive interfaces.
Contém implementações reais de interfaces cognitivas.

Phase 3.8+ of Transitional Cognitive Bridge Architecture.
Fase 3.8+ da Arquitetura de Ponte Cognitiva Transicional.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.3.0 (Cognitive Agents Implementation)
"""

from .persona_processor import PersonaProcessor
from .risk_evaluator import RiskEvaluator

__all__ = ['PersonaProcessor', 'RiskEvaluator']
