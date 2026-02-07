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
import json
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
        
        # Use shared helper for base_url construction / Usar helper compartilhado para construção de base_url
        self.base_url = InferenceStrategy._build_base_url(
            config=config,
            default_url=self.DEFAULT_BASE_URL,
            needs_v1_suffix=True  # OpenAI-compatible APIs need /v1
        )
        
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

        
        self.system_prompt = ""  # Store system prompt
        self.tools = [] # Store registered tools
        
        logger.info(f"{self.__class__.__name__} initialized with model: {self.model}")
    
    def set_system_context(self, context: str):
        """Update system prompt"""
        self.system_prompt = context
        logger.debug(f"OpenAI System Prompt Updated: {len(context)} chars")

    def register_tools(self, tools: List[Dict[str, Any]]):
        """Register tools for the API call"""
        self.tools = tools
        logger.info(f"Registered {len(tools)} tools for OpenAIStrategy")

    def get_provider_name(self) -> str:
        return "openai"
    
    def get_available_models(self) -> List[str]:
        """
        Fetch available models from OpenAI-compatible API (supports LM Studio, OpenAI, etc.)
        Busca modelos disponíveis de API compatível com OpenAI (suporta LM Studio, OpenAI, etc.)
        
        Returns:
            List of model IDs / Lista de IDs de modelos
        """
        try:
            # Attempt to fetch models from API / Tentar buscar modelos da API
            logger.info(f"Fetching models from {self.base_url}")
            response = self.client.models.list()
            
            # Extract model IDs from response / Extrair IDs de models da resposta
            fetched_models = [model.id for model in response.data]
            
            if fetched_models:
                logger.info(f"Successfully fetched {len(fetched_models)} models from API")
                # Combine with default models (deduped) / Combinar com modelos padrão (sem duplicatas)
                all_models = sorted(list(set(self.AVAILABLE_MODELS + fetched_models)))
                return all_models
            else:
                logger.warning("API returned empty model list, using defaults")
                return self.AVAILABLE_MODELS.copy()
                
        except Exception as e:
            # Fallback to default models if API call fails / Fallback para modelos padrão se chamada API falhar
            logger.warning(f"Failed to fetch models from API: {e}, using default list")
            # Include current model if not in defaults / Incluir modelo atual se não estiver nos padrões
            return list(set(self.AVAILABLE_MODELS + [self.model]))
    
    def chat_step(self, prompt: str, chat_context: Optional[List[Dict[str, str]]] = None, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Execute streaming chat completion
        Executa completion de chat com streaming
        """
        model_to_use = model or self.model
        
        try:
            logger.debug(f"Sending request to {self.base_url} model={model_to_use}")
            
            messages = []
            if self.system_prompt:
                messages.append({"role": "system", "content": self.system_prompt})
            
            # Incorporate chat context / Incorporar contexto do chat
            if chat_context:
                for msg in chat_context:
                    if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                        # Safety check for None content
                        content = msg['content'] if msg['content'] is not None else ""
                        messages.append({"role": msg['role'], "content": content})

            # Only append prompt if provided (Orchestrator might send it in context)
            if prompt:
                messages.append({"role": "user", "content": prompt})
            
            kwargs = {
                "model": model_to_use,
                "messages": messages,
                "stream": True,
                "temperature": 0.7
            }
            
            if self.tools:
                kwargs["tools"] = self.tools
                kwargs["tool_choice"] = "auto"
                
            stream = self.client.chat.completions.create(**kwargs)
            
            # Buffer for tool calls
            tool_calls_buffer = {}
            
            for chunk in stream:
                # Handle Content
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                
                # Handle Tool Calls
                if chunk.choices and chunk.choices[0].delta.tool_calls:
                    for tc in chunk.choices[0].delta.tool_calls:
                        if tc.index not in tool_calls_buffer:
                            tool_calls_buffer[tc.index] = {
                                "id": tc.id,
                                "function": {"name": "", "arguments": ""}
                            }
                        
                        if tc.function and tc.function.name:
                            tool_calls_buffer[tc.index]["function"]["name"] += tc.function.name
                        
                        if tc.function and tc.function.arguments:
                            tool_calls_buffer[tc.index]["function"]["arguments"] += tc.function.arguments

            # Yield accumulated tool calls as markdown blocks
            for index, tc_data in tool_calls_buffer.items():
                func_name = tc_data["function"]["name"]
                func_args = tc_data["function"]["arguments"]
                
                # Format as special markdown block
                tool_block = f"\n```tool_call\n{{\"name\": \"{func_name}\", \"arguments\": {func_args}}}\n```\n"
                logger.debug(f"Yielding tool call: {func_name}")
                yield tool_block
                    
        except openai.APIError as e:
            # Re-raise API errors with context
            logger.error(f"OpenAI API Error: {e}")
            raise e
        except Exception as e:
            # Fatal errors must be raised
            logger.error(f"Critical AI Error: {e}")
            raise e
    
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

