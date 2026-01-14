"""
Provider Factory - Creates AI Provider Strategies
Fábrica de Provedores - Cria Estratégias de Provedor de IA

Implements the Factory pattern to create appropriate provider strategies
based on configuration.

Implementa o padrão Factory para criar estratégias de provedor apropriadas
com base na configuração.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Multi-Engine Architecture)
"""

from typing import Dict, Any, List, Type
import logging
from .base_strategy import InferenceStrategy

logger = logging.getLogger(__name__)


class ProviderFactory:
    """
    Factory for creating AI provider strategy instances
    Fábrica para criar instâncias de estratégia de provedor IA
    
    This class implements the Factory design pattern to decouple the
    creation of provider strategies from their usage. It maintains a
    registry of available providers and creates instances on demand.
    
    Esta classe implementa o padrão de projeto Factory para desacoplar a
    criação de estratégias de provedor de seu uso. Mantém um registro de
    provedores disponíveis e cria instâncias sob demanda.
    
    Design Pattern: Factory Pattern / Padrão de Projeto: Factory
    """
    
    # Registry of available provider strategies
    # Registro de estratégias de provedor disponíveis
    _PROVIDERS: Dict[str, Type[InferenceStrategy]] = {}
    
    @classmethod
    def register_provider(cls, name: str, provider_class: Type[InferenceStrategy]):
        """
        Register a new provider strategy
        Registra uma nova estratégia de provedor
        
        This method allows dynamic registration of provider strategies.
        Providers can be registered at runtime.
        
        Este método permite registro dinâmico de estratégias de provedor.
        Provedores podem ser registrados em tempo de execução.
        
        Args / Argumentos:
            name (str): Unique provider identifier (lowercase)
                       Identificador único do provedor (minúsculas)
            provider_class (Type[InferenceStrategy]): Provider class
                                                     Classe do provedor
        
        Example / Exemplo:
            ProviderFactory.register_provider('openai', OpenAIStrategy)
        """
        cls._PROVIDERS[name.lower()] = provider_class
        logger.info(f"Registered provider: {name}")
    
    @classmethod
    def create_provider(
        cls,
        engine: str,
        config: Dict[str, Any]
    ) -> InferenceStrategy:
        """
        Create a provider strategy instance
        Cria uma instância de estratégia de provedor
        
        Factory method that creates and returns an appropriate provider
        strategy based on the engine name.
        
        Método factory que cria e retorna uma estratégia de provedor
        apropriada com base no nome do motor.
        
        Args / Argumentos:
            engine (str): Provider name ('hexsecgpt', 'openai', 'deepseek', 'ollama')
                        Nome do provedor
            config (Dict[str, Any]): Provider-specific configuration
                                   Configuração específica do provedor
                                   {
                                       'api_key': str,
                                       'model': str (optional),
                                       'base_url': str (optional),
                                       ... provider-specific fields
                                   }
        
        Returns / Retorna:
            InferenceStrategy: Configured provider instance
                             Instância configurada do provedor
        
        Raises / Lança:
            ValueError: If engine is not supported / Se motor não é suportado
            TypeError: If config is invalid / Se config é inválido
        
        Example / Exemplo:
            >>> factory = ProviderFactory()
            >>> provider = factory.create_provider('hexsecgpt', {
            ...     'api_key': 'sk-...',
            ...     'model': 'google/gemini-2.0-flash-exp:free'
            ... })
            >>> for chunk in provider.chat_step("Hello"):
            ...     print(chunk, end='')
        """
        engine_lower = engine.lower()
        
        # Check if provider is registered
        # Verificar se provedor está registrado
        if engine_lower not in cls._PROVIDERS:
            available = list(cls._PROVIDERS.keys())
            raise ValueError(
                f"Unsupported engine: '{engine}'. "
                f"Available engines: {available} / "
                f"Motor não suportado: '{engine}'. "
                f"Motores disponíveis: {available}"
            )
        
        # Get provider class from registry
        # Obter classe do provedor do registro
        provider_class = cls._PROVIDERS[engine_lower]
        
        # Validate configuration
        # Validar configuração
        if not isinstance(config, dict):
            raise TypeError(
                f"Config must be a dictionary, got {type(config)} / "
                f"Config deve ser um dicionário, recebeu {type(config)}"
            )
        
        logger.info(f"Creating provider instance: {engine} with config keys: {list(config.keys())}")
        
        # Create and return provider instance
        # Criar e retornar instância do provedor
        try:
            provider_instance = provider_class(config)
            logger.info(f"Successfully created provider: {provider_instance}")
            return provider_instance
        except Exception as e:
            logger.error(f"Failed to create provider '{engine}': {e}")
            raise
    
    @classmethod
    def get_available_engines(cls) -> List[str]:
        """
        Get list of all registered provider engines
        Obtém lista de todos os motores de provedor registrados
        
        Returns / Retorna:
            List[str]: List of provider names / Lista de nomes de provedor
        
        Example / Exemplo:
            >>> ProviderFactory.get_available_engines()
            ['hexsecgpt', 'openai', 'deepseek', 'ollama']
        """
        engines = sorted(list(cls._PROVIDERS.keys()))
        logger.debug(f"Available engines: {engines}")
        return engines
    
    @classmethod
    def is_engine_supported(cls, engine: str) -> bool:
        """
        Check if an engine is supported
        Verifica se um motor é suportado
        
        Args / Argumentos:
            engine (str): Engine name to check / Nome do motor para verificar
        
        Returns / Retorna:
            bool: True if supported / True se suportado
        """
        return engine.lower() in cls._PROVIDERS
    
    @classmethod
    def get_provider_info(cls, engine: str) -> Dict[str, Any]:
        """
        Get information about a specific provider
        Obtém informações sobre um provedor específico
        
        Args / Argumentos:
            engine (str): Provider name / Nome do provedor
        
        Returns / Retorna:
            Dict[str, Any]: Provider information / Informações do provedor
            {
                'name': str,
                'class': str,
                'available': bool
            }
        """
        engine_lower = engine.lower()
        
        if engine_lower not in cls._PROVIDERS:
            return {
                'name': engine,
                'available': False,
                'error': 'Provider not registered'
            }
        
        provider_class = cls._PROVIDERS[engine_lower]
        
        return {
            'name': engine_lower,
            'class': provider_class.__name__,
            'available': True,
            'module': provider_class.__module__
        }


# NOTE: Actual provider implementations will register themselves
# when their modules are imported. See hexsecgpt_strategy.py for example.
#
# NOTA: Implementações reais de provedor se registrarão automaticamente
# quando seus módulos forem importados. Veja hexsecgpt_strategy.py como exemplo.
