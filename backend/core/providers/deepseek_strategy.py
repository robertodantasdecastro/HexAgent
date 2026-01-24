"""
DeepSeek Provider Strategy - TEMPLATE
Estratégia de Provedor DeepSeek - TEMPLATE

Implementation of InferenceStrategy for DeepSeek API.
Implementação de InferenceStrategy para API DeepSeek.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Multi-Engine Architecture)
@status: TEMPLATE - Ready for implementation
"""


from typing import Generator, List, Dict, Any, Optional
import logging
from .openai_strategy import OpenAIStrategy

logger = logging.getLogger(__name__)


class DeepSeekStrategy(OpenAIStrategy):
    """
    DeepSeek provider strategy
    Estratégia de provedor DeepSeek
    """
    
    AVAILABLE_MODELS = [
        "deepseek-chat",
        "deepseek-coder"
    ]
    
    DEFAULT_MODEL = "deepseek-chat"
    DEFAULT_BASE_URL = "https://api.deepseek.com/v1"
    
    def get_provider_name(self) -> str:
        return "deepseek"
    
    def get_available_models(self) -> List[str]:
        return self.AVAILABLE_MODELS.copy()
    
    # Inherits chat_step, init (calls super), etc from OpenAIStrategy
    # Herda chat_step, init (chama super), etc de OpenAIStrategy


# Register with ProviderFactory
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('deepseek', DeepSeekStrategy)

