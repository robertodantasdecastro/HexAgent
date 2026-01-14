"""
Ollama Provider Strategy - TEMPLATE
Estratégia de Provedor Ollama - TEMPLATE

Implementation of InferenceStrategy for Ollama (local AI).
Implementação de InferenceStrategy para Ollama (IA local).

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Multi-Engine Architecture)
@status: TEMPLATE - Ready for implementation
"""

from typing import Generator, List, Dict, Any, Optional
import logging
import requests
from .base_strategy import InferenceStrategy

logger = logging.getLogger(__name__)


class OllamaStrategy(InferenceStrategy):
    """
    Ollama provider strategy (local AI models)
    Estratégia de provedor Ollama (modelos IA locais)
    
    TODO: Implement this strategy for local Ollama instance.
    TODO: Implementar esta estratégia para instância local Ollama.
    
    IMPLEMENTATION GUIDE / GUIA DE IMPLEMENTAÇÃO:
    1. Use Ollama HTTP API (localhost:11434)
    2. Implement model discovery (GET /api/tags)
    3. Implement streaming chat (POST /api/generate)
    4. No API key required (local)
    5. Register with ProviderFactory
    
    SPECIAL FEATURES:
    - No API key needed
    - Dynamic model list from installed models
    - Fully offline capable
    """
    
    DEFAULT_BASE_URL = "http://localhost:11434"
    DEFAULT_MODEL = "llama2"  # Most common default
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Ollama strategy
        
        Args:
            config: {
                'base_url': str (optional, default: localhost:11434),
                'model': str (optional)
            }
        """
        self.base_url = config.get('base_url', self.DEFAULT_BASE_URL)
        self.model = config.get('model', self.DEFAULT_MODEL)
        
        logger.info(f"OllamaStrategy initialized (TEMPLATE) with URL: {self.base_url}")
    
    def get_provider_name(self) -> str:
        return "ollama"
    
    def get_available_models(self) -> List[str]:
        """
        TODO: Implement dynamic model discovery from Ollama
        TODO: Implementar descoberta dinâmica de modelos do Ollama
        
        IMPLEMENTATION:
        1. GET /api/tags
        2. Parse response JSON
        3. Return list of model names
        """
        # Placeholder - should query Ollama API
        return ["llama2", "codellama", "mistral"]
    
    def chat_step(self, prompt: str, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        TODO: Implement Ollama streaming chat
        TODO: Implementar chat com streaming Ollama
        
        IMPLEMENTATION:
        1. POST /api/generate with stream=true
        2. Parse newline-delimited JSON responses
        3. Yield response chunks
        """
        raise NotImplementedError("OllamaStrategy is a template")
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        # Ollama doesn't require API key
        # Just check if base_url is valid if provided
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """
        TODO: Implement connection test
        TODO: Implementar teste de conexão
        
        IMPLEMENTATION:
        Try GET /api/tags to check if Ollama is running
        """
        return {
            'success': False,
            'message': 'OllamaStrategy is a template - not yet implemented',
            'message_pt': 'OllamaStrategy é um template - ainda não implementado'
        }
    
    def get_default_model(self) -> str:
        return self.DEFAULT_MODEL
    
    def get_config_schema(self) -> Dict[str, Any]:
        """Ollama-specific schema (no API key needed)"""
        return {
            "type": "object",
            "properties": {
                "base_url": {
                    "type": "string",
                    "required": False,
                    "label": "Ollama URL",
                    "label_pt": "URL Ollama",
                    "default": self.DEFAULT_BASE_URL
                },
                "model": {
                    "type": "string",
                    "required": False,
                    "label": "Model",
                    "label_pt": "Modelo"
                }
            }
        }


# TODO: Uncomment when ready
# from .provider_factory import ProviderFactory
# ProviderFactory.register_provider('ollama', OllamaStrategy)
