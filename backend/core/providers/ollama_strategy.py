"""
Ollama Provider Strategy
Estratégia de Provedor Ollama

Local AI inference using Ollama HTTP API
Inferência local de IA usando API HTTP do Ollama

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Complete Implementation)
"""

from typing import Generator, List, Dict, Any, Optional
import logging
import requests
import json
from .base_strategy import InferenceStrategy

logger = logging.getLogger(__name__)


class OllamaStrategy(InferenceStrategy):
    """
    Ollama provider strategy (local AI models)
    Estratégia de provedor Ollama (modelos IA locais)
    
    Supports local Ollama instance for privacy-focused, offline AI.
    Suporta instância local do Ollama para IA focada em privacidade e offline.
    
    API Endpoints:
    - GET /api/tags - List installed models
    - POST /api/chat - Streaming chat
    - POST /api/generate - Text generation
    - GET /api/version - Version info
    """
    
    # Default Ollama configuration / Configuração padrão do Ollama
    DEFAULT_BASE_URL = "http://localhost:11434"
    DEFAULT_MODEL = "llama2"
    DEFAULT_TIMEOUT = 120  # Ollama can be slower on first load / Ollama pode ser mais lento no primeiro carregamento
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Ollama strategy
        Inicializa estratégia Ollama
        
        Args / Argumentos:
            config (Dict[str, Any]): Configuration dictionary / Dicionário de configuração
                {
                    'base_url': str,       # Optional, default: http://localhost:11434
                    'host': str,           # Alternative: host for Ollama server
                    'port': int,           # Alternative: port for Ollama server
                    'model': str,          # Model name from Ollama
                    'timeout': int,        # Optional, default: 120
                    'system_prompt': str,  # Optional
                    'temperature': float,  # Optional, default: 0.7
                }
        
        Raises / Lança:
            ValueError: If configuration is invalid / Se configuração é inválida
        """
        # Use shared helper for base_url construction / Usar helper compartilhado
        self.base_url = InferenceStrategy._build_base_url(
            config=config,
            default_url=self.DEFAULT_BASE_URL,
            needs_v1_suffix=False  # Ollama doesn't use /v1 suffix
        )
        
        self.model = config.get('model', self.DEFAULT_MODEL)
        self.timeout = config.get('timeout', self.DEFAULT_TIMEOUT)
        self.system_prompt = config.get('system_prompt')
        self.temperature = config.get('temperature', 0.7)
        
        logger.info(f"OllamaStrategy initialized: {self.base_url}, model: {self.model}")
    
    def get_provider_name(self) -> str:
        """Get provider name / Obtém nome do provedor"""
        return "ollama"
    
    def get_available_models(self) -> List[str]:
        """
        Fetch available models from Ollama instance
        Busca modelos disponíveis da instância Ollama
        
        Returns / Retorna:
            List[str]: List of installed model names / Lista de nomes de modelos instalados
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            response.raise_for_status()
            
            tags_data = response.json()
            models = [m['name'] for m in tags_data.get('models', [])]
            
            logger.info(f"Found {len(models)} models in Ollama")
            return models
            
        except requests.exceptions.ConnectionError:
            logger.warning(f"Ollama not running or unreachable at {self.base_url}")
            return []
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout connecting to Ollama at {self.base_url}")
            return []
        except Exception as e:
            logger.error(f"Error fetching models from Ollama: {e}")
            return []
    
    def chat_step(self, prompt: str, chat_context: Optional[List[Dict[str, str]]] = None, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Execute inference with streaming using Ollama chat API
        Executa inferência com streaming usando API de chat do Ollama
        
        Args / Argumentos:
            prompt (str): User prompt / Prompt do usuário
            chat_context (List[Dict]): Conversation history / Histórico da conversa
            model (Optional[str]): Specific model to use / Modelo específico para usar
        
        Yields / Produz:
            str: Response chunks / Chunks de resposta
        """
        model_to_use = model or self.model
        
        # Build messages / Construir mensagens
        messages = []
        
        # Add system prompt if configured
        # Adicionar prompt de sistema se configurado
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})
            
        # Add conversation history if provided
        # Adicionar histórico de conversa se fornecido
        if chat_context and isinstance(chat_context, list):
            for msg in chat_context:
                if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                    messages.append({"role": msg['role'], "content": msg['content']})
        
        # Add current user prompt
        # Adicionar prompt atual do usuário
        messages.append({"role": "user", "content": prompt})
        
        try:
            logger.info(f"Sending request to Ollama: model={model_to_use}, history={len(chat_context) if chat_context else 0} msgs")
            
            # Ollama chat API uses different format than OpenAI
            # API de chat do Ollama usa formato diferente do OpenAI
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model_to_use,
                    "messages": messages,
                    "stream": True,
                    "options": {
                        "temperature": self.temperature,
                    }
                },
                timeout=self.timeout,
                stream=True
            )
            response.raise_for_status()
            
            # Stream response - Ollama uses newline-delimited JSON
            # Transmitir resposta - Ollama usa JSON delimitado por newline
            for line in response.iter_lines():
                if line:
                    try:
                        # Parse JSON line / Parsear linha JSON
                        data = json.loads(line.decode('utf-8'))
                        
                        # Extract message content from Ollama format
                        # Extrair conteúdo da mensagem do formato Ollama
                        if 'message' in data:
                            content = data['message'].get('content', '')
                            if content:
                                yield content
                        
                        # Check for completion / Verificar conclusão
                        if data.get('done', False):
                            logger.debug("Ollama stream completed")
                            break
                            
                    except json.JSONDecodeError as e:
                        logger.debug(f"JSON decode error in Ollama stream: {e}")
                        continue
                        
        except requests.exceptions.Timeout:
            error_msg = (
                f"Request timeout after {self.timeout}s. "
                "Ollama might be loading the model for the first time. / "
                f"Timeout da requisição após {self.timeout}s. "
                "Ollama pode estar carregando o modelo pela primeira vez."
            )
            logger.error(error_msg)
            yield error_msg
            
        except requests.exceptions.ConnectionError:
            error_msg = (
                f"Cannot connect to Ollama at {self.base_url}. "
                "Is Ollama running? / "
                f"Não foi possível conectar ao Ollama em {self.base_url}. "
                "O Ollama está rodando?"
            )
            logger.error(error_msg)
            yield error_msg
            
        except Exception as e:
            error_msg = f"Ollama inference error: {str(e)} / Erro de inferência Ollama: {str(e)}"
            logger.error(error_msg)
            yield error_msg
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate Ollama configuration
        Valida configuração do Ollama
        
        Args / Argumentos:
            config (Dict[str, Any]): Configuration to validate / Configuração para validar
        
        Returns / Retorna:
            bool: True if valid / True se válido
        """
        # Ollama doesn't require API key (local only)
        # Ollama não requer API key (apenas local)
        
        # Validate base_url format if provided / Validar formato da base_url se fornecida
        if 'base_url' in config:
            base_url = config['base_url']
            if not isinstance(base_url, str) or not base_url.startswith('http'):
                logger.warning(f"Invalid base_url format: {base_url}")
                return False
        
        # Validate temperature if provided / Validar temperatura se fornecida
        if 'temperature' in config:
            temp = config['temperature']
            if not isinstance(temp, (int, float)) or temp < 0 or temp > 2:
                logger.warning(f"Invalid temperature: {temp} (must be 0-2)")
                return False
        
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to Ollama instance
        Testa conexão com instância Ollama
        
        Returns / Retorna:
            Dict[str, Any]: Test result with success status and details
                          Resultado do teste com status de sucesso e detalhes
        """
        try:
            logger.info(f"Testing connection to Ollama at {self.base_url}")
            
            # Try to fetch version info first / Tentar buscar info de versão primeiro
            try:
                version_response = requests.get(
                    f"{self.base_url}/api/version",
                    timeout=5
                )
                version_info = version_response.json() if version_response.ok else {}
            except Exception:
                version_info = {}
            
            # Try to fetch models list / Tentar buscar lista de modelos
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            response.raise_for_status()
            
            tags_data = response.json()
            models = [m['name'] for m in tags_data.get('models', [])]
            
            logger.info(f"Ollama connection successful, found {len(models)} models")
            
            return {
                'success': True,
                'message': f"Connected to Ollama at {self.base_url}",
                'message_pt': f"Conectado ao Ollama em {self.base_url}",
                'models_found': len(models),
                'models': models[:10],  # First 10 models / Primeiros 10 modelos
                'base_url': self.base_url,
                'version': version_info.get('version', 'unknown')
            }
            
        except requests.exceptions.ConnectionError:
            logger.warning(f"Cannot connect to Ollama at {self.base_url}")
            return {
                'success': False,
                'message': f"Cannot connect to Ollama at {self.base_url}",
                'message_pt': f"Não foi possível conectar ao Ollama em {self.base_url}",
                'hint': 'Make sure Ollama is running (ollama serve)',
                'hint_pt': 'Certifique-se de que o Ollama está rodando (ollama serve)',
                'base_url': self.base_url
            }
            
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout connecting to Ollama at {self.base_url}")
            return {
                'success': False,
                'message': f"Timeout connecting to Ollama at {self.base_url}",
                'message_pt': f"Timeout ao conectar ao Ollama em {self.base_url}",
                'hint': 'Ollama might be starting up, try again in a few seconds',
                'hint_pt': 'Ollama pode estar iniciando, tente novamente em alguns segundos'
            }
            
        except Exception as e:
            logger.error(f"Ollama connection test failed: {e}")
            return {
                'success': False,
                'message': f"Connection error: {str(e)}",
                'message_pt': f"Erro de conexão: {str(e)}",
                'error': str(e)
            }
    
    def get_default_model(self) -> str:
        """
        Get default model
        Obtém modelo padrão
        
        Returns / Retorna:
            str: Default model name / Nome do modelo padrão
        """
        return self.model
    
    def get_config_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema for configuration
        Obtém esquema JSON para configuração
        
        Returns schema for dynamic form generation in frontend.
        Retorna esquema para geração dinâmica de formulário no frontend.
        
        Returns / Retorna:
            Dict[str, Any]: JSON schema / Esquema JSON
        """
        return {
            "type": "object",
            "properties": {
                "base_url": {
                    "type": "string",
                    "required": False,
                    "label": "Ollama URL",
                    "label_pt": "URL do Ollama",
                    "description": "Ollama server base URL",
                    "description_pt": "URL base do servidor Ollama",
                    "default": "http://localhost:11434",
                    "placeholder": "http://localhost:11434"
                },
                "model": {
                    "type": "string",
                    "required": False,
                    "label": "Model",
                    "label_pt": "Modelo",
                    "description": "Model name (auto-detected if empty)",
                    "description_pt": "Nome do modelo (auto-detectado se vazio)",
                    "placeholder": "llama2"
                },
                "timeout": {
                    "type": "integer",
                    "required": False,
                    "label": "Request Timeout (seconds)",
                    "label_pt": "Timeout da Requisição (segundos)",
                    "description": "Maximum time to wait for response",
                    "description_pt": "Tempo máximo para esperar resposta",
                    "default": 120,
                    "min": 30,
                    "max": 600
                },
                "temperature": {
                    "type": "number",
                    "required": False,
                    "label": "Temperature",
                    "label_pt": "Temperatura",
                    "description": "Sampling temperature (0-2)",
                    "description_pt": "Temperatura de amostragem (0-2)",
                    "default": 0.7,
                    "min": 0,
                    "max": 2,
                    "step": 0.1
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
        return f"OllamaStrategy(base_url='{self.base_url}', model='{self.model}')"


# Auto-register with ProviderFactory
# Auto-registrar com ProviderFactory
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('ollama', OllamaStrategy)

logger.info("OllamaStrategy registered with ProviderFactory")
