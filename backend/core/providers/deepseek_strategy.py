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
from .base_strategy import InferenceStrategy

logger = logging.getLogger(__name__)


class DeepSeekStrategy(InferenceStrategy):
    """
    DeepSeek provider strategy
    Estratégia de provedor DeepSeek
    
    TODO: Implement this strategy for DeepSeek AI API.
    TODO: Implementar esta estratégia para API DeepSeek AI.
    
    IMPLEMENTATION GUIDE / GUIA DE IMPLEMENTAÇÃO:
    1. Research DeepSeek API documentation
    2. Implement API client (may be OpenAI-compatible)
    3. Define available models
    4. Implement streaming chat
    5. Register with ProviderFactory
    """
    
    # TODO: Define available models / Definir modelos disponíveis
    AVAILABLE_MODELS = [
        "deepseek-chat",
        "deepseek-coder"
    ]
    
    DEFAULT_MODEL = "deepseek-chat"
    BASE_URL = "https://api.deepseek.com"  # TODO: Verify URL
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize DeepSeek strategy"""
        self.api_key = config.get('api_key')
        
        if not self.api_key:
            raise ValueError("API key required for DeepSeek")
        
        self.model = config.get('model', self.DEFAULT_MODEL)
        
        # TODO: Initialize DeepSeek client
        logger.info(f"DeepSeekStrategy initialized (TEMPLATE) with model: {self.model}")
    
    def get_provider_name(self) -> str:
        return "deepseek"
    
    def get_available_models(self) -> List[str]:
        return self.AVAILABLE_MODELS.copy()
    
    def chat_step(self, prompt: str, model: Optional[str] = None) -> Generator[str, None, None]:
        """TODO: Implement DeepSeek streaming chat"""
        raise NotImplementedError("DeepSeekStrategy is a template")
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        return 'api_key' in config and bool(config['api_key'])
    
    def test_connection(self) -> Dict[str, Any]:
        return {
            'success': False,
            'message': 'DeepSeekStrategy is a template - not yet implemented',
            'message_pt': 'DeepSeekStrategy é um template - ainda não implementado'
        }
    
    def get_default_model(self) -> str:
        return self.DEFAULT_MODEL


# TODO: Uncomment when ready
# from .provider_factory import ProviderFactory
# ProviderFactory.register_provider('deepseek', DeepSeekStrategy)
