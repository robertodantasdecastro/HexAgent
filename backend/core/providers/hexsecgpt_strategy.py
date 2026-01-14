"""
HexSecGPT Provider Strategy
Estratégia de Provedor HexSecGPT

Implementation of InferenceStrategy for HexSecGPT using OpenRouter API.
Implementação de InferenceStrategy para HexSecGPT usando API OpenRouter.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Multi-Engine Architecture)
"""

from typing import Generator, List, Dict, Any, Optional
import logging
from .base_strategy import InferenceStrategy
from ..hex_brain import HexBrain

logger = logging.getLogger(__name__)


class HexSecGPTStrategy(InferenceStrategy):
    """
    HexSecGPT provider strategy using OpenRouter
    Estratégia de provedor HexSecGPT usando OpenRouter
    
    This strategy wraps the existing HexBrain class to provide HexSecGPT
    functionality through the OpenRouter API. It supports multiple models
    available on OpenRouter.
    
    Esta estratégia encapsula a classe HexBrain existente para fornecer
    funcionalidade HexSecGPT através da API OpenRouter. Suporta múltiplos
    modelos disponíveis no OpenRouter.
    """
    
    # Available models on OpenRouter for HexSecGPT
    # Modelos disponíveis no OpenRouter para HexSecGPT
    AVAILABLE_MODELS = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-pro",
        "meta-llama/llama-3.2-90b-vision-instruct:free",
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4-turbo",
        "openai/gpt-3.5-turbo"
    ]
    
    # Default model / Modelo padrão
    DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free"
    
    # OpenRouter base URL / URL base do OpenRouter
    BASE_URL = "https://openrouter.ai/api/v1"
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize HexSecGPT strategy
        Inicializa estratégia HexSecGPT
        
        Args / Argumentos:
            config (Dict[str, Any]): Configuration dictionary
                                   Dicionário de configuração
                {
                    'api_key': str,           # Required / Obrigatório
                    'model': str,             # Optional / Opcional
                    'system_prompt': str      # Optional / Opcional
                }
        
        Raises / Lança:
            ValueError: If api_key is missing / Se api_key está faltando
        """
        self.api_key = config.get('api_key')
        
        if not self.api_key:
            raise ValueError(
                "API key is required for HexSecGPT strategy / "
                "Chave API é necessária para estratégia HexSecGPT"
            )
        
        self.model = config.get('model', self.DEFAULT_MODEL)
        self.system_prompt = config.get('system_prompt')
        
        # Initialize HexBrain instance / Inicializa instância HexBrain
        self.brain = HexBrain(
            api_key=self.api_key,
            model=self.model,
            system_prompt=self.system_prompt,
            base_url=self.BASE_URL
        )
        
        logger.info(f"HexSecGPTStrategy initialized with model: {self.model}")
    
    def get_provider_name(self) -> str:
        """Get provider name / Obtém nome do provedor"""
        return "hexsecgpt"
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available models
        Obtém lista de modelos disponíveis
        
        Returns models available on OpenRouter that work well with HexSecGPT.
        Retorna modelos disponíveis no OpenRouter que funcionam bem com HexSecGPT.
        """
        return self.AVAILABLE_MODELS.copy()
    
    def chat_step(self, prompt: str, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Execute inference step with streaming
        Executa passo de inferência com streaming
        
        Args / Argumentos:
            prompt (str): User prompt / Prompt do usuário
            model (Optional[str]): Specific model to use (if None, use current)
                                 Modelo específico para usar (se None, usar atual)
        
        Yields / Produz:
            str: Response chunks / Chunks de resposta
        """
        # If model specified and different from current, re-initialize
        # Se modelo especificado e diferente do atual, re-inicializar
        if model and model != self.model:
            logger.info(f"Switching model from {self.model} to {model}")
            self.model = model
            self.brain = HexBrain(
                api_key=self.api_key,
                model=self.model,
                system_prompt=self.system_prompt,
                base_url=self.BASE_URL
            )
        
        # Delegate to HexBrain / Delegar para HexBrain
        try:
            for chunk in self.brain.chat_step(prompt):
                yield chunk
        except Exception as e:
            logger.error(f"HexSecGPT inference error: {e}")
            raise
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate configuration
        Valida configuração
        
        Checks that api_key is present and model is valid if specified.
        Verifica que api_key está presente e modelo é válido se especificado.
        
        Args / Argumentos:
            config (Dict[str, Any]): Configuration to validate
                                   Configuração para validar
        
        Returns / Retorna:
            bool: True if valid / True se válido
        """
        # Must have API key / Deve ter chave API
        if 'api_key' not in config or not config['api_key']:
            logger.warning("Validation failed: missing api_key")
            return False
        
        # If model specified, check if it's in available list
        # Se modelo especificado, verificar se está na lista disponível
        if 'model' in config:
            model = config['model']
            if model and model not in self.AVAILABLE_MODELS:
                logger.warning(f"Validation warning: model '{model}' not in recommended list")
                # Don't fail - user might want to use custom model
                # Não falhar - usuário pode querer usar modelo customizado
        
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to OpenRouter API
        Testa conexão com API OpenRouter
        
        Sends a minimal test request to verify API key and connectivity.
        Envia uma requisição de teste mínima para verificar chave API e conectividade.
        
        Returns / Retorna:
            Dict[str, Any]: Test result / Resultado do teste
        """
        try:
            logger.info("Testing HexSecGPT connection...")
            
            # Send minimal test prompt / Enviar prompt de teste mínimo
            test_prompt = "test"
            response_chunks = list(self.chat_step(test_prompt))
            
            if response_chunks:
                logger.info("HexSecGPT connection test successful")
                return {
                    'success': True,
                    'message': f"Connected to OpenRouter API with model {self.model}",
                    'message_pt': f"Conectado à API OpenRouter com modelo {self.model}",
                    'model': self.model
                }
            else:
                logger.warning("HexSecGPT test returned empty response")
                return {
                    'success': False,
                    'message': "Connection succeeded but received empty response",
                    'message_pt': "Conexão bem-sucedida mas recebeu resposta vazia"
                }
                
        except Exception as e:
            logger.error(f"HexSecGPT connection test failed: {e}")
            return {
                'success': False,
                'message': f"Connection failed: {str(e)}",
                'message_pt': f"Falha na conexão: {str(e)}",
                'error': str(e)
            }
    
    def get_default_model(self) -> str:
        """Get default model / Obtém modelo padrão"""
        return self.DEFAULT_MODEL
    
    def get_config_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema for configuration
        Obtém esquema JSON para configuração
        
        Returns schema for dynamic form generation in frontend.
        Retorna esquema para geração dinâmica de formulário no frontend.
        """
        return {
            "type": "object",
            "properties": {
                "api_key": {
                    "type": "string",
                    "required": True,
                    "label": "API Key",
                    "label_pt": "Chave API",
                    "description": "OpenRouter API key",
                    "description_pt": "Chave API do OpenRouter",
                    "placeholder": "sk-or-v1-..."
                },
                "model": {
                    "type": "string",
                    "required": False,
                    "label": "Model",
                    "label_pt": "Modelo",
                    "description": "AI model to use",
                    "description_pt": "Modelo de IA para usar",
                    "enum": self.AVAILABLE_MODELS,
                    "default": self.DEFAULT_MODEL
                },
                "system_prompt": {
                    "type": "string",
                    "required": False,
                    "label": "System Prompt",
                    "label_pt": "Prompt do Sistema",
                    "description": "Custom system prompt (optional)",
                    "description_pt": "Prompt de sistema customizado (opcional)",
                    "multiline": True
                }
            }
        }
    
    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return f"HexSecGPTStrategy(model='{self.model}', base_url='{self.BASE_URL}')"


# Auto-register this provider with the factory
# Auto-registrar este provedor com a fábrica
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('hexsecgpt', HexSecGPTStrategy)
logger.info("HexSecGPTStrategy registered with ProviderFactory")
