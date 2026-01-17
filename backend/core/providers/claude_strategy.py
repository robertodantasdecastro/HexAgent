"""
Claude (Anthropic) Provider Strategy
Estratégia de Provedor Claude (Anthropic)

Implementation of InferenceStrategy for Anthropic API.
Implementação de InferenceStrategy para API Anthropic.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from typing import Generator, List, Dict, Any, Optional
import logging
import anthropic
from .base_strategy import InferenceStrategy

logger = logging.getLogger(__name__)


class ClaudeStrategy(InferenceStrategy):
    """
    Claude provider strategy
    Estratégia de provedor Claude
    """
    
    AVAILABLE_MODELS = [
        "claude-3-5-sonnet-20240620",
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307"
    ]
    
    DEFAULT_MODEL = "claude-3-5-sonnet-20240620"
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize Claude strategy"""
        self.api_key = config.get('api_key')
        
        if not self.api_key:
            raise ValueError("API key required for Claude")
        
        self.model = config.get('model', self.DEFAULT_MODEL)
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        
        logger.info(f"ClaudeStrategy initialized with model: {self.model}")
    
    def get_provider_name(self) -> str:
        return "claude"
    
    def get_available_models(self) -> List[str]:
        return self.AVAILABLE_MODELS.copy()
    
    def chat_step(self, prompt: str, model: Optional[str] = None) -> Generator[str, None, None]:
        """Execute streaming chat completion"""
        model_to_use = model or self.model
        
        try:
            logger.debug(f"Sending request to Anthropic model={model_to_use}")
            
            with self.client.messages.stream(
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
                model=model_to_use
            ) as stream:
                for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            error_msg = f"AI Error (Claude): {str(e)}"
            logger.error(error_msg)
            yield error_msg
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        return 'api_key' in config and bool(config['api_key'])
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection by simple call"""
        try:
            # Simple ping
            self.client.messages.create(
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
                model=self.model
            )
            return {
                'success': True,
                'message': "Connected to Claude",
                'message_pt': "Conectado ao Claude"
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
ProviderFactory.register_provider('claude', ClaudeStrategy)
