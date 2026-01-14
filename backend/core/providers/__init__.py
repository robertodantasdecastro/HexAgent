"""
AI Provider Strategies
Estratégias de Provedor de IA

This package contains provider strategy implementations for different AI engines.
Este pacote contém implementações de estratégia de provedor para diferentes motores de IA.

Auto-imports all strategies to register them with ProviderFactory.
Auto-importa todas as estratégias para registrá-las com ProviderFactory.
"""

# Import base classes / Importar classes base
from .base_strategy import InferenceStrategy
from .provider_factory import ProviderFactory

#  Import all concrete strategies to trigger auto-registration
# Importar todas as estratégias concretas para acionar auto-registro
from .hexsecgpt_strategy import HexSecGPTStrategy
from .lmstudio_strategy import LMStudioStrategy

# Future imports will be added here / Futuras importações serão adicionadas aqui
# from .openai_strategy import OpenAIStrategy
# from .deepseek_strategy import DeepSeekStrategy
# from .ollama_strategy import OllamaStrategy

__all__ = [
    'InferenceStrategy',
    'ProviderFactory',
    'HexSecGPTStrategy',
    'LMStudioStrategy'
]
