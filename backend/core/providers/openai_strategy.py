"""
OpenAI Provider Strategy - TEMPLATE
Estratégia de Provedor OpenAI - TEMPLATE

Implementation of InferenceStrategy for OpenAI API.
Implementação de InferenceStrategy para API OpenAI.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Multi-Engine Architecture)
@status: TEMPLATE - Ready for implementation
"""


from typing import Generator, List, Dict, Any, Optional
import logging
import openai
from .base_strategy import InferenceStrategy

logger = logging.getLogger(__name__)


class OpenAIStrategy(InferenceStrategy):
    """
    OpenAI provider strategy (direct API)
    Estratégia de provedor OpenAI (API direta)
    
    Standard implementation for OpenAI-compatible APIs.
    Implementação padrão para APIs compatíveis com OpenAI.
    """
    
    AVAILABLE_MODELS = [
        "gpt-4-turbo",
        "gpt-4",
        "gpt-3.5-turbo",
        "gpt-4o",
        "gpt-4o-mini"
    ]
    
    DEFAULT_MODEL = "gpt-4o"
    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize OpenAI strategy
        Inicializa estratégia OpenAI
        """
        self.api_key = config.get('api_key')
        self.base_url = config.get('base_url', self.DEFAULT_BASE_URL)
        
        if not self.api_key:
            raise ValueError(f"API key required for {self.get_provider_name()}")
        
        self.model = config.get('model', self.DEFAULT_MODEL)
        self.organization = config.get('organization')
        
        # Initialize OpenAI client
        self.client = openai.OpenAI(
            api_key=self.api_key,
            organization=self.organization,
            base_url=self.base_url
        )
        
        logger.info(f"{self.__class__.__name__} initialized with model: {self.model}")
    
    def get_provider_name(self) -> str:
        return "openai"
    
    def get_available_models(self) -> List[str]:
        return self.AVAILABLE_MODELS.copy()
    
    def chat_step(self, prompt: str, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Execute streaming chat completion
        Executa completion de chat com streaming
        """
        model_to_use = model or self.model
        
        try:
            logger.debug(f"Sending request to {self.base_url} model={model_to_use}")
            
            stream = self.client.chat.completions.create(
                model=model_to_use,
                messages=[{"role": "user", "content": prompt}], # Context is managed by HexBrain usually, but this is raw step
                stream=True,
                temperature=0.7
            )
            
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            error_msg = f"AI Error ({self.get_provider_name()}): {str(e)}"
            logger.error(error_msg)
            yield error_msg
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        return 'api_key' in config and bool(config['api_key'])
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection by listing models"""
        try:
            self.client.models.list()
            return {
                'success': True,
                'message': f"Connected to {self.get_provider_name()}",
                'message_pt': f"Conectado ao {self.get_provider_name()}"
            }
        except Exception as e:
            return {
                'success': False,
                'message': f"Connection failed: {str(e)}",
                'message_pt': f"Conexão falhou: {str(e)}",
                'error': str(e)
            }
    
    def get_default_model(self) -> str:
        return self.DEFAULT_MODEL


# Register with ProviderFactory
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('openai', OpenAIStrategy)

