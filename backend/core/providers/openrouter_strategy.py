"""
OpenRouter Provider Strategy
Estratégia de Provedor OpenRouter

Implementation of InferenceStrategy for OpenRouter API.
Implementação de InferenceStrategy para API OpenRouter.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0
"""

import logging
from typing import List, Dict, Any
from .openai_strategy import OpenAIStrategy

logger = logging.getLogger(__name__)

class OpenRouterStrategy(OpenAIStrategy):
    """
    OpenRouter provider strategy
    Estratégia de provedor OpenRouter
    
    Access to multiple models via a single API.
    Acesso a múltiplos modelos via uma única API.
    """
    
    # Common OpenRouter models for quick access
    AVAILABLE_MODELS = [
        "openai/gpt-4o",
        "anthropic/claude-3.5-sonnet",
        "google/gemini-pro-1.5",
        "meta-llama/llama-3.1-405b-instruct",
        "mistralai/mistral-large",
        "deepseek/deepseek-coder",
        "deepseek/deepseek-chat"
    ]
    
    DEFAULT_MODEL = "openai/gpt-4o"
    DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
    
    def __init__(self, config: Dict[str, Any]):
        # Ensure base_url is set correctly if not provided
        if 'base_url' not in config:
            config['base_url'] = self.DEFAULT_BASE_URL
            
        super().__init__(config)
        
        # OpenRouter suggests adding these headers for rankings
        # Inject directly into the underlying httpx client used by openai library
        extra_headers = {
            "HTTP-Referer": "https://github.com/robertodantasdecastro/HexAgent",
            "X-Title": "HexAgent GUI"
        }
        
        # Update default headers in the client
        if hasattr(self.client, '_client') and hasattr(self.client._client, 'headers'):
             self.client._client.headers.update(extra_headers) # v1.x private client access
        elif hasattr(self.client, 'default_headers'):
             self.client.default_headers.update(extra_headers) # Some versions

    def get_provider_name(self) -> str:
        return "openrouter"
    
    def get_available_models(self) -> List[str]:
        """
        Fetch available models dynamically from OpenRouter API
        Busca modelos disponíveis dinamicamente da API OpenRouter
        """
        try:
            logger.info("Fetching available models from OpenRouter...")
            models_page = self.client.models.list()
            
            # OpenAI client returns a SyncCursorPage[Model]
            # iterate to get IDs
            fetched_models = [m.id for m in models_page.data]
            
            if fetched_models:
                logger.info(f"Successfully fetched {len(fetched_models)} models from OpenRouter")
                return sorted(list(set(self.AVAILABLE_MODELS + fetched_models)))
            
        except Exception as e:
            logger.error(f"Failed to fetch OpenRouter models: {e}")
            logger.warning("Falling back to static model list")
            
        # Fallback
        return list(set(self.AVAILABLE_MODELS + [self.model]))

# Register with ProviderFactory
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('openrouter', OpenRouterStrategy)
