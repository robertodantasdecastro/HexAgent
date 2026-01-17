"""
LM Studio Provider Strategy
Estratégia de Provedor LM Studio

Local AI inference using LM Studio OpenAI-compatible API
Inferência local de IA usando API compatível com OpenAI do LM Studio

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Local Inference Support)
"""

from typing import Generator, List, Dict, Any, Optional
import logging
import requests
import json
from .base_strategy import InferenceStrategy

logger = logging.getLogger(__name__)


class LMStudioStrategy(InferenceStrategy):
    """
    LM Studio local provider strategy
    Estratégia de provedor local LM Studio
    
    Uses OpenAI-compatible API format for local inference.
    Enables privacy-focused, offline AI capabilities.
    
    Usa formato de API compatível com OpenAI para inferência local.
    Permite capacidades de IA focadas em privacidade e offline.
    """
    
    # Default LM Studio configuration / Configuração padrão do LM Studio
    DEFAULT_HOST = "http://localhost"
    DEFAULT_PORT = 1234
    DEFAULT_TIMEOUT = 60  # seconds / segundos
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize LM Studio strategy
        Inicializa estratégia LM Studio
        
        Args / Argumentos:
            config (Dict[str, Any]): Configuration dictionary / Dicionário de configuração
                {
                    'host': str,           # Optional, default: http://localhost
                    'port': int,           # Optional, default: 1234
                    'model': str,          # Model identifier from LM Studio
                    'timeout': int,        # Optional, default: 60
                    'system_prompt': str   # Optional
                }
        
        Raises / Lança:
            ValueError: If configuration is invalid / Se configuração é inválida
        """
        self.host = config.get('host', self.DEFAULT_HOST)
        self.port = config.get('port', self.DEFAULT_PORT)
        self.model = config.get('model', 'local-model')
        self.timeout = config.get('timeout', self.DEFAULT_TIMEOUT)
        self.system_prompt = config.get('system_prompt')
        
        # Build base URL / Construir URL base
        self.base_url = f"{self.host}:{self.port}/v1"
        
        logger.info(f"LMStudioStrategy initialized: {self.base_url}, model: {self.model}")
    
    def get_provider_name(self) -> str:
        """Get provider name / Obtém nome do provedor"""
        return "lmstudio"
    
    def get_available_models(self) -> List[str]:
        """
        Fetch available models from LM Studio server
        Busca modelos disponíveis do servidor LM Studio
        
        Returns / Retorna:
            List[str]: List of model identifiers / Lista de identificadores de modelo
        """
        try:
            response = requests.get(
                f"{self.base_url}/models",
                timeout=5
            )
            response.raise_for_status()
            
            models_data = response.json()
            models = [m['id'] for m in models_data.get('data', [])]
            
            logger.info(f"Found {len(models)} models in LM Studio")
            return models
            
        except requests.exceptions.ConnectionError:
            logger.warning(f"LM Studio not running or unreachable at {self.base_url}")
            return []
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout connecting to LM Studio at {self.base_url}")
            return []
        except Exception as e:
            logger.error(f"Error fetching models from LM Studio: {e}")
            return []
    
    def chat_step(self, prompt: str, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Execute inference with streaming
        Executa inferência com streaming
        
        Args / Argumentos:
            prompt (str): User prompt / Prompt do usuário
            model (Optional[str]): Specific model to use / Modelo específico para usar
        
        Yields / Produz:
            str: Response chunks / Chunks de resposta
        """
        model_to_use = model or self.model
        
        # Build messages / Construir mensagens
        messages = []
        if self.system_prompt:
            messages.append({"role": "system", "content": self.system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            logger.info(f"Sending request to LM Studio: model={model_to_use}")
            
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": model_to_use,
                    "messages": messages,
                    "stream": True,
                    "temperature": 0.7,
                    "max_tokens": 4000
                },
                timeout=self.timeout,
                stream=True
            )
            response.raise_for_status()
            
            # Stream response / Transmitir resposta
            for line in response.iter_lines():
                if line:
                    line_text = line.decode('utf-8')
                    
                    # Skip empty lines / Pular linhas vazias
                    if not line_text.strip():
                        continue
                    
                    # Process SSE format / Processar formato SSE
                    if line_text.startswith('data: '):
                        data_str = line_text[6:]  # Remove "data: "
                        
                        # Skip [DONE] marker / Pular marcador [DONE]
                        if data_str.strip() == '[DONE]':
                            break
                        
                        try:
                            data = json.loads(data_str)
                            
                            # Extract content / Extrair conteúdo
                            choices = data.get('choices', [])
                            if choices:
                                delta = choices[0].get('delta', {})
                                content = delta.get('content', '')
                                
                                if content:
                                    yield content
                                    
                        except json.JSONDecodeError as e:
                            logger.debug(f"JSON decode error in stream: {e}")
                            pass
                            
        except requests.exceptions.Timeout:
            error_msg = (
                f"Request timeout after {self.timeout}s. "
                "Check LM Studio server or increase timeout. / "
                f"Timeout da requisição após {self.timeout}s. "
                "Verifique o servidor LM Studio ou aumente o timeout."
            )
            logger.error(error_msg)
            yield error_msg
            
        except requests.exceptions.ConnectionError:
            error_msg = (
                f"Cannot connect to LM Studio at {self.base_url}. "
                "Is it running? / "
                f"Não foi possível conectar ao LM Studio em {self.base_url}. "
                "Ele está rodando?"
            )
            logger.error(error_msg)
            yield error_msg
            
        except Exception as e:
            error_msg = f"LM Studio inference error: {str(e)} / Erro de inferência LM Studio: {str(e)}"
            logger.error(error_msg)
            yield error_msg
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate LM Studio configuration
        Valida configuração do LM Studio
        
        Args / Argumentos:
            config (Dict[str, Any]): Configuration to validate / Configuração para validar
        
        Returns / Retorna:
            bool: True if valid / True se válido
        """
        # Model is optional for LM Studio (auto-detected)
        # Modelo é opcional para LM Studio (auto-detectado)
        
        # Validate host format if provided / Validar formato do host se fornecido
        if 'host' in config:
            host = config['host']
            if not isinstance(host, str) or not host.startswith('http'):
                logger.warning(f"Invalid host format: {host}")
                return False
        
        # Validate port if provided / Validar porta se fornecida
        if 'port' in config:
            port = config['port']
            if not isinstance(port, int) or port < 1 or port > 65535:
                logger.warning(f"Invalid port: {port}")
                return False
        
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to LM Studio server
        Testa conexão com servidor LM Studio
        
        Returns / Retorna:
            Dict[str, Any]: Test result with success status and details
                          Resultado do teste com status de sucesso e detalhes
        """
        try:
            logger.info(f"Testing connection to LM Studio at {self.base_url}")
            
            # Try to fetch models list / Tentar buscar lista de modelos
            response = requests.get(
                f"{self.base_url}/models",
                timeout=5
            )
            response.raise_for_status()
            
            models_data = response.json()
            models = [m['id'] for m in models_data.get('data', [])]
            
            logger.info(f"LM Studio connection successful, found {len(models)} models")
            
            return {
                'success': True,
                'message': f"Connected to LM Studio at {self.base_url}",
                'message_pt': f"Conectado ao LM Studio em {self.base_url}",
                'models_found': len(models),
                'models': models[:10],  # First 10 models / Primeiros 10 modelos
                'base_url': self.base_url
            }
            
        except requests.exceptions.ConnectionError:
            logger.warning(f"Cannot connect to LM Studio at {self.base_url}")
            return {
                'success': False,
                'message': f"Cannot connect to LM Studio at {self.base_url}",
                'message_pt': f"Não foi possível conectar ao LM Studio em {self.base_url}",
                'hint': 'Make sure LM Studio is running with local server enabled',
                'hint_pt': 'Certifique-se de que o LM Studio está rodando com servidor local habilitado',
                'base_url': self.base_url
            }
            
        except requests.exceptions.Timeout:
            logger.warning(f"Timeout connecting to LM Studio at {self.base_url}")
            return {
                'success': False,
                'message': f"Timeout connecting to LM Studio at {self.base_url}",
                'message_pt': f"Timeout ao conectar ao LM Studio em {self.base_url}",
                'hint': 'LM Studio might be starting up, try again in a few seconds',
                'hint_pt': 'LM Studio pode estar iniciando, tente novamente em alguns segundos'
            }
            
        except Exception as e:
            logger.error(f"LM Studio connection test failed: {e}")
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
            str: Default model identifier / Identificador do modelo padrão
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
                "host": {
                    "type": "string",
                    "required": False,
                    "label": "Server Host",
                    "label_pt": "Host do Servidor",
                    "description": "LM Studio server host",
                    "description_pt": "Host do servidor LM Studio",
                    "default": "http://localhost",
                    "placeholder": "http://localhost"
                },
                "port": {
                    "type": "integer",
                    "required": False,
                    "label": "Server Port",
                    "label_pt": "Porta do Servidor",
                    "description": "LM Studio server port",
                    "description_pt": "Porta do servidor LM Studio",
                    "default": 1234,
                    "placeholder": "1234",
                    "min": 1,
                    "max": 65535
                },
                "model": {
                    "type": "string",
                    "required": False,
                    "label": "Model",
                    "label_pt": "Modelo",
                    "description": "Model identifier (auto-detected if empty)",
                    "description_pt": "Identificador do modelo (auto-detectado se vazio)",
                    "placeholder": "local-model"
                },
                "timeout": {
                    "type": "integer",
                    "required": False,
                    "label": "Request Timeout (seconds)",
                    "label_pt": "Timeout da Requisição (segundos)",
                    "description": "Maximum time to wait for response",
                    "description_pt": "Tempo máximo para esperar resposta",
                    "default": 60,
                    "min": 10,
                    "max": 300
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
        return f"LMStudioStrategy(base_url='{self.base_url}', model='{self.model}')"


# Auto-register with ProviderFactory
# Auto-registrar com ProviderFactory
# Auto-register with ProviderFactory
# Auto-registrar com ProviderFactory
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('lmstudio', LMStudioStrategy)

# Register aliases for other local OpenAI-compatible engines
# Registrar aliases para outros motores locais compatíveis com OpenAI
ProviderFactory.register_provider('5ire', LMStudioStrategy)
ProviderFactory.register_provider('ollama', LMStudioStrategy)
ProviderFactory.register_provider('localai', LMStudioStrategy)
ProviderFactory.register_provider('text-generation-webui', LMStudioStrategy)

logger.info("LMStudioStrategy registered with ProviderFactory (aliases: 5ire, ollama, localai)")
