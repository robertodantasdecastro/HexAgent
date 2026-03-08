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
    
    # Model categorization / Categorização de modelos
    # Chat models use /v1/chat/completions endpoint
    # Modelos de chat usam endpoint /v1/chat/completions
    CHAT_MODELS = [
        'gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4-0613', 'gpt-4-32k',
        'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-0613',
        'gpt-4o', 'gpt-4o-mini', # Added from AVAILABLE_MODELS
        # LM Studio chat models / Modelos de chat do LM Studio
        'llama', 'mistral', 'phi', 'openhermes', 'openchat', 'gemma',
        'qwen', 'yi', 'mixtral', 'solar', 'orca'
    ]
    
    # Completion models use /v1/completions endpoint
    # Modelos de completion usam endpoint /v1/completions
    # NOTE: OpenAI discontinued all completion models in 2023
    # NOTA: OpenAI descontinuou todos os modelos de completion em 2023
    # This list is kept for compatibility with local engines (LM Studio, Ollama)
    # Esta lista é mantida para compatibilidade com engines locais
    COMPLETION_MODELS = [
        'codex', 'code-davinci', 'code-cushman',
        'davinci', 'curie', 'babbage', 'ada',
        'text-davinci', 'text-curie', 'text-babbage', 'text-ada'
    ]
    
    # Valid OpenAI models as of 2026 / Modelos válidos da OpenAI em 2026
    # Note: Codex models were discontinued in March 2023
    # Nota: Modelos Codex foram descontinuados em Março de 2023
    AVAILABLE_MODELS = [
        "gpt-4o",           # Latest model / Modelo mais recente
        "gpt-4o-mini",      # Compact version / Versão compacta
        "gpt-4-turbo",      # Turbo variant / Variante turbo
        "gpt-4",            # Standard GPT-4 / GPT-4 padrão
        "gpt-3.5-turbo"     # Most cost-effective / Mais econômico
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

        
        self.system_prompt = config.get('system_prompt', "")  # Load system prompt from config
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

    def _is_chat_model(self, model_name: str) -> bool:
        """
        Determine if model uses Chat API or Completion API.
        Determinar se modelo usa API de Chat ou de Completion.
        
        Args:
            model_name: Model identifier
            
        Returns:
            True if chat model, False if completion model
        """
        model_lower = model_name.lower()
        
        # Check explicit completion models first (more specific)
        # Verificar modelos de completion primeiro (mais específico)
        for comp_model in self.COMPLETION_MODELS:
            if comp_model.lower() in model_lower:
                logger.info(f"Detected completion model: {model_name}")
                return False
        
        # Check chat models
        # Verificar modelos de chat
        for chat_model in self.CHAT_MODELS:
            if chat_model.lower() in model_lower:
                logger.info(f"Detected chat model: {model_name}")
                return True
        
        # Default: assume chat model (safer, more common)
        # Padrão: assumir modelo de chat (mais seguro, mais comum)
        logger.warning(f"Unknown model type: {model_name}, defaulting to chat API")
        return True
    
    @classmethod
    def get_config_schema(cls) -> Dict[str, Any]:
        """
        Get JSON schema for provider configuration
        Obtém esquema JSON para configuração do provedor
        """
        return {
            "type": "object",
            "properties": {
                "api_key": {
                    "type": "string",
                    "required": True,
                    "label": "OpenAI API Key",
                    "label_pt": "Chave API OpenAI",
                    "description": "Your OpenAI API key (sk-...)",
                    "description_pt": "Sua chave API OpenAI (sk-...)"
                },
                "model": {
                    "type": "string",
                    "required": False,
                    "label": "Model",
                    "label_pt": "Modelo",
                    "default": "gpt-4o",
                    "description": "OpenAI Model ID",
                    "description_pt": "ID do Modelo OpenAI"
                },
                "organization": {
                    "type": "string",
                    "required": False,
                    "label": "Organization ID",
                    "label_pt": "ID da Organização",
                    "description": "Optional Organization ID",
                    "description_pt": "ID da Organização Opcional"
                },
                "base_url": {
                    "type": "string",
                    "required": False,
                    "label": "Base URL",
                    "label_pt": "URL Base",
                    "description": "Optional API Endpoint (e.g. for proxies)",
                    "description_pt": "Endpoint de API Opcional (ex: proxies)",
                    "default": "https://api.openai.com/v1"
                }
            }
        }

    def get_provider_name(self) -> str:
        return "openai"
    
    def get_available_models(self) -> List[str]:
        """
        Fetch available models from OpenAI-compatible API (supports LM Studio, OpenAI, etc.)
        Busca modelos disponíveis de API compatível com OpenAI (suporta LM Studio, OpenAI, etc.)
        Fetch and filter available models from OpenAI API
        Buscar e filtrar modelos disponíveis da API OpenAI
        
        Returns:
            List of relevant, current model IDs (filtered)
        """
        try:
            # Query API for available models / Consultar API por modelos disponíveis
            response = self.client.models.list()
            all_models = [model.id for model in response.data]
            
            if all_models:
                # Filter to show only relevant chat models
                # Filtrar para mostrar apenas modelos de chat relevantes
                filtered = self._filter_models(all_models)
                logger.info(f"✅ Fetched {len(all_models)} models from {self.base_url}, filtered to {len(filtered)}")
                return filtered if filtered else self.AVAILABLE_MODELS.copy()
            else:
                # No models returned, use defaults / Nenhum modelo retornado, usar padrões
                logger.warning(f"⚠️ No models returned, using defaults")
                return self.AVAILABLE_MODELS.copy()
                
        except Exception as e:
            # Fallback to default list on error / Fallback para lista padrão em erro
            logger.warning(f"⚠️ Failed to fetch models: {e}. Using default list.")
            return self.AVAILABLE_MODELS.copy()
    
    def _filter_models(self, models: List[str]) -> List[str]:
        """
        Filter models to show only relevant/current ones
        Filtrar modelos para mostrar apenas relevantes/atuais
        
        Keeps: gpt-5.x, gpt-4.1, gpt-4o, gpt-4, gpt-3.5-turbo
        Excludes: old snapshots, deprecated, specialized (audio, realtime, embedding)
        
        Args:
            models: List of all model IDs from API
            
        Returns:
            Filtered list of relevant model IDs
        """
        # Patterns to INCLUDE (priority order)
        include_patterns = [
            'gpt-5',           # GPT-5 series (newest)
            'gpt-4.1',         # GPT-4.1 series
            'gpt-4o',          # GPT-4o multimodal
            'gpt-4-turbo',     # GPT-4 turbo
            'gpt-4',           # Standard GPT-4
            'gpt-3.5-turbo'    # GPT-3.5 economical
        ]
        
        # Patterns to EXCLUDE
        exclude_patterns = [
            'realtime',        # Real-time audio models (specialized)
            'audio',           # Audio-only models
            'preview',         # Preview/beta versions
            'vision',          # Vision-only (deprecated)
            'instruct',        # Instruct variants (mostly deprecated)
            'embedding',       # Embedding models
            'tts',             # Text-to-speech
            'whisper',         # Speech-to-text
            'dall-e',          # Image generation
            'babbage',         # Old completion models
            'davinci',         # Old completion models
            'curie',           # Old completion models
            'ada',             # Old completion models
            '-0',              # Specific date snapshots (e.g., gpt-4-0314)
            '-1',              # Specific date snapshots
            '-2',              # Specific date snapshots
        ]
        
        filtered = []
        
        for model in models:
            model_lower = model.lower()
            
            # Special case: gpt-3.5-turbo contains "-3" but should always be included
            if 'gpt-3.5-turbo' in model_lower:
                filtered.append(model)
                continue
            
            # Check if should be excluded
            should_exclude = any(pattern in model_lower for pattern in exclude_patterns)
            if should_exclude:
                continue
            
            # Check if matches include patterns
            should_include = any(pattern in model_lower for pattern in include_patterns)
            if should_include:
                filtered.append(model)
        
        # Sort: newest first (reverse alphabetical puts higher versions first)
        return sorted(filtered, reverse=True)
    
    def chat_step(self, prompt: str, chat_context: Optional[List[Dict[str, str]]] = None, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Execute streaming chat completion
        Executa completion de chat com streaming
        """
        model_to_use = model or self.model
        is_chat = self._is_chat_model(model_to_use)
        
        try:
            logger.debug(f"Sending request to {self.base_url} model={model_to_use} (endpoint={'chat' if is_chat else 'completion'})")
            
            if is_chat:
                # Chat Completions API / API de Chat Completions
                
                # 1. Consolidate System Prompts
                # Fundir Prompts de Sistema para evitar fragmentação da Persona
                final_system_prompt = self.system_prompt or ""
                
                context_messages = []
                if chat_context:
                    for msg in chat_context:
                        if isinstance(msg, dict):
                            role = msg.get('role')
                            content = msg.get('content') or ""
                            
                            if role == 'system':
                                # Append context system messages to the main prompt
                                # Anexar mensagens de sistema do contexto ao prompt principal
                                final_system_prompt += f"\n\n[CONTEXT UPDATE]\n{content}"
                            else:
                                context_messages.append({"role": role, "content": content})

                messages = []
                if final_system_prompt:
                    logger.info(f"🐛 SYSTEM PROMPT SENT TO OPENAI:\n{final_system_prompt}") # DEBUG PERSOSA
                    messages.append({"role": "system", "content": final_system_prompt})
                
                # 2. Add User History
                messages.extend(context_messages)

                # 3. Add Current Prompt
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
                    
            else:
                # Legacy Completions API / API de Completions Legado
                # Convert messages to simple prompt / Converter mensagens para prompt simples
                prompt_text = ""
                
                if self.system_prompt:
                    prompt_text += f"{self.system_prompt}\n\n"
                
                if chat_context:
                    for msg in chat_context:
                        if isinstance(msg, dict) and 'content' in msg:
                            role = msg.get('role', 'user')
                            content = msg['content'] if msg['content'] is not None else ""
                            prompt_text += f"{role.capitalize()}: {content}\n"
                
                if prompt:
                    prompt_text += f"User: {prompt}\n"
                
                prompt_text += "Assistant:"
                
                kwargs = {
                    "model": model_to_use,
                    "prompt": prompt_text,
                    "stream": True,
                    "temperature": 0.7,
                    "max_tokens": 2000  # Required for completion models
                }
                
                stream = self.client.completions.create(**kwargs)
                
                for chunk in stream:
                    if chunk.choices and chunk.choices[0].text:
                        yield chunk.choices[0].text
                    
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

