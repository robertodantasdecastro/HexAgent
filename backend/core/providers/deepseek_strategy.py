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
        """
        Fetch available models from DeepSeek API
        Buscar modelos disponíveis da API DeepSeek
        
        DeepSeek uses OpenAI-compatible API, so we can use client.models.list()
        DeepSeek usa API compatível com OpenAI, então podemos usar client.models.list()
        """
        try:
            # DeepSeek is OpenAI-compatible, use inherited client
            # DeepSeek é compatível com OpenAI, usar client herdado
            response = self.client.models.list()
            models = [model.id for model in response.data]
            
            if models:
                logger.info(f"✅ Fetched {len(models)} models from DeepSeek API")
                return models
            else:
                logger.warning(f"⚠️  DeepSeek returned no models, using defaults")
                return self.AVAILABLE_MODELS.copy()
                
        except Exception as e:
            logger.warning(f"⚠️  Failed to fetch DeepSeek models: {e}. Using default list.")
            return self.AVAILABLE_MODELS.copy()
    
    # Inherits chat_step, init (calls super), etc from OpenAIStrategy
    # Herda chat_step, init (chama super), etc de OpenAIStrategy


    def _create_client(self):
        """
        Create OpenAI client with DeepSeek configuration
        Cria cliente OpenAI com configuração DeepSeek
        """
        # DeepSeek ALWAYS uses its own base_url, ignore local host/port unless specifically overridden
        # DeepSeek SEMPRE usa sua própria base_url, ignorar host/port local a menos que especificamente sobrescrito
        
        base_url = self.config.get('base_url')
        if not base_url or "localhost" in base_url or "127.0.0.1" in base_url:
             # Force correct DeepSeek URL if it looks like a local misconfiguration
             # Força URL correta do DeepSeek se parecer uma má configuração local
             base_url = self.DEFAULT_BASE_URL
             
        self.client = openai.OpenAI(
            api_key=self.api_key,
            base_url=base_url,
            timeout=self.timeout
        )

# Register with ProviderFactory
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('deepseek', DeepSeekStrategy)

