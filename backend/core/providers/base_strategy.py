"""
Base Strategy Interface for AI Providers
Interface Base de Estratégia para Provedores de IA

Defines the contract that all AI provider strategies must implement.
Define o contrato que todas as estratégias de provedor de IA devem implementar.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Multi-Engine Architecture)
"""

from abc import ABC, abstractmethod
from typing import Generator, List, Dict, Any, Optional


class InferenceStrategy(ABC):
    """
    Abstract base class for AI inference provider strategies
    Classe base abstrata para estratégias de provedor de inferência IA
    
    This interface defines the contract that all AI providers must implement
    to be compatible with the InferenceEngine. Each provider encapsulates
    the specifics of communicating with a particular AI service.
    
    Esta interface define o contrato que todos os provedores de IA devem
    implementar para serem compatíveis com o InferenceEngine. Cada provedor
    encapsula os detalhes de comunicação com um serviço de IA específico.
    
    Design Pattern: Strategy Pattern / Padrão de Projeto: Strategy
    """
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the unique identifier for this provider
        Obtém o identificador único para este provedor
        
        Returns / Retorna:
            str: Provider name (e.g., 'hexsecgpt', 'openai', 'deepseek')
                Nome do provedor (ex: 'hexsecgpt', 'openai', 'deepseek')
        """
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """
        Get list of available models for this provider
        Obtém lista de modelos disponíveis para este provedor
        
        Returns / Retorna:
            List[str]: List of model identifiers
                      Lista de identificadores de modelo
        
        Example / Exemplo:
            ["gpt-4-turbo", "gpt-3.5-turbo"] for OpenAI
            ["google/gemini-2.0-flash-exp:free"] for HexSecGPT
        """
        pass
    
    @abstractmethod
    def chat_step(self, prompt: str, chat_context: Optional[List[Dict[str, str]]] = None, model: Optional[str] = None) -> Generator[str, None, None]:
        """
        Execute a single inference step with streaming response
        Executa um passo único de inferência com resposta em streaming
        
        This is the core method that InferenceEngine calls to get AI responses.
        It must yield chunks of text as they arrive from the API.
        
        Este é o método central que InferenceEngine chama para obter respostas da IA.
        Deve produzir chunks de texto conforme chegam da API.
        
        Args / Argumentos:
            prompt (str): User prompt or conversation context
                        Prompt do usuário ou contexto de conversa
            model (Optional[str]): Specific model to use (if None, use default)
                                 Modelo específico para usar (se None, usar padrão)
        
        Yields / Produz:
            str: Text chunks from AI response
                Chunks de texto da resposta da IA
        
        Raises / Lança:
            Exception: If inference fails / Se inferência falhar
        """
        pass
    
    @abstractmethod
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate provider-specific configuration
        Valida configuração específica do provedor
        
        Checks if all required configuration parameters are present and valid.
        Verifica se todos os parâmetros de configuração necessários estão presentes e válidos.
        
        Args / Argumentos:
            config (Dict[str, Any]): Configuration dictionary
                                   Dicionário de configuração
        
        Returns / Retorna:
            bool: True if configuration is valid / True se configuração é válida
        
        Example / Exemplo:
            config = {
                'api_key': 'sk-...',
                'model': 'gpt-4',
                'base_url': 'https://api.openai.com/v1'
            }
        """
        pass
    
    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to provider API
        Testa conexão com API do provedor
        
        Sends a minimal test request to verify that the provider is reachable
        and the configuration is correct.
        
        Envia uma requisição de teste mínima para verificar que o provedor está
        acessível e a configuração está correta.
        
        Returns / Retorna:
            Dict[str, Any]: Test result / Resultado do teste
            {
                'success': bool,      # Connection successful / Conexão bem-sucedida
                'message': str,       # Status message / Mensagem de status
                'error': str          # Error details if failed / Detalhes do erro se falhou
            }
        """
        pass
    
    @abstractmethod
    def get_default_model(self) -> str:
        """
        Get the default model for this provider
        Obtém o modelo padrão para este provedor
        
        Returns / Retorna:
            str: Default model identifier / Identificador do modelo padrão
        """
        pass
    
    def set_system_context(self, context: str):
        """
        Update the system context/prompt dynamically
        Atualizar o contexto/prompt do sistema dinamicamente
        
        Args:
            context (str): The system prompt/context to set
        """
        # Default implementation does nothing, override in subclasses
        pass
        
    def register_tools(self, tools: List[Dict[str, Any]]):
        """
        Register tools for the AI model to use
        Registrar ferramentas para o modelo de IA usar
        
        Args:
            tools (List[Dict]): List of tools in standard format (OpenAI-like)
        """
        # Default implementation does nothing
        pass
    
    def get_config_schema(self) -> Dict[str, Any]:
        """
        Get JSON schema for provider configuration (optional)
        Obtém esquema JSON para configuração do provedor (opcional)
        
        This method is optional and can be used by the frontend to dynamically
        generate configuration forms.
        
        Este método é opcional e pode ser usado pelo frontend para gerar
        dinamicamente formulários de configuração.
        
        Returns / Retorna:
            Dict[str, Any]: JSON schema for configuration
                          Esquema JSON para configuração
        """
        return {
            "type": "object",
            "properties": {
                "api_key": {"type": "string", "required": True},
                "model": {"type": "string", "required": False}
            }
        }
    
    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return f"{self.__class__.__name__}(provider={self.get_provider_name()})"
