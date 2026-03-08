"""
5ire Provider Strategy
Estratégia de Provedor 5ire

Local AI inference for 5ire tool compatible with OpenAI API.
Inferência local de IA para ferramenta 5ire compatível com API OpenAI.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from typing import Generator, List, Dict, Any, Optional
import logging
from .lmstudio_strategy import LMStudioStrategy

logger = logging.getLogger(__name__)


class FiveIreStrategy(LMStudioStrategy):
    """
    5ire provider strategy (Local)
    Estratégia de provedor 5ire (Local)
    
    Inherits from LMStudioStrategy as it likely shares similar
    local OpenAI-compatible architecture.
    Herda de LMStudioStrategy pois provavelmente compartilha
    arquitetura local compatível com OpenAI similar.
    """
    
    # Default 5ire configuration / Configuração padrão do 5ire
    # Assuming port 5000 or similar if different from LMStudio(1234)
    # Assumindo porta 5000 ou similar se diferente do LMStudio(1234)
    DEFAULT_HOST = "http://localhost"
    DEFAULT_PORT = 5000
    
    def get_provider_name(self) -> str:
        return "5ire"
    
    def get_default_model(self) -> str:
        return "5ire-model"


# Register with ProviderFactory
from .provider_factory import ProviderFactory
ProviderFactory.register_provider('5ire', FiveIreStrategy)
