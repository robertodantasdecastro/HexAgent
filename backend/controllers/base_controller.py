"""
Base Controller - Abstract base class for all domain controllers
Controlador Base - Classe base abstrata para todos os controladores de domínio

This module defines the BaseController class that all domain-specific controllers
must inherit from. It provides common functionality like response formatting,
error handling, request validation, and logging.

Este módulo define a classe BaseController que todos os controladores específicos
de domínio devem herdar. Fornece funcionalidade comum como formatação de resposta,
tratamento de erros, validação de requisição e logging.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0
"""

from abc import ABC, abstractmethod
from flask import Blueprint, request, jsonify
from typing import Dict, Any, List, Optional, Tuple
import logging


class BaseController(ABC):
    """
    Abstract base controller implementing common controller functionality
    Controlador base abstrato implementando funcionalidade comum de controlador
    
    All domain controllers should inherit from this class and implement
    the _register_routes() method to define their specific endpoints.
    
    Todos os controladores de domínio devem herdar desta classe e implementar
    o método _register_routes() para definir seus endpoints específicos.
    """
    
    def __init__(self, name: str, import_name: str, url_prefix: Optional[str] = None):
        """
        Initialize controller with Flask Blueprint
        Inicializa controlador com Flask Blueprint
        
        Args:
            name: Blueprint name / Nome do Blueprint
            import_name: Module import name (usually __name__) / Nome de importação do módulo
            url_prefix: URL prefix for all routes (e.g., '/config') / Prefixo URL para todas as rotas
        """
        self.blueprint = Blueprint(name, import_name, url_prefix=url_prefix)
        self.logger = self._setup_logger()
        self._register_routes()
        self.logger.info(f"[{name}] Controller initialized with prefix: {url_prefix}")
    
    @abstractmethod
    def _register_routes(self):
        """
        Register all routes for this controller
        Registra todas as rotas para este controlador
        
        Must be implemented by subclasses to define specific endpoints.
        Deve ser implementado por subclasses para definir endpoints específicos.
        """
        pass
    
    def _setup_logger(self) -> logging.Logger:
        """
        Setup controller-specific logger
        Configura logger específico do controlador
        
        Returns:
            Configured logger instance / Instância de logger configurada
        """
        logger = logging.getLogger(self.__class__.__name__)
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '[%(name)s] %(levelname)s: %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
    
    def success_response(
        self, 
        data: Any = None, 
        message: Optional[str] = None, 
        code: int = 200
    ) -> Tuple[Dict, int]:
        """
        Create standard success response
        Cria resposta de sucesso padrão
        
        Args:
            data: Response data / Dados de resposta
            message: Optional success message / Mensagem de sucesso opcional
            code: HTTP status code (default 200) / Código de status HTTP
            
        Returns:
            Tuple of (response_dict, status_code) / Tupla de (dicionário de resposta, código de status)
        """
        response = {
            "success": True
        }
        if data is not None:
            response["data"] = data
        if message:
            response["message"] = message
        
        return jsonify(response), code
    
    def error_response(
        self, 
        error: str, 
        code: int = 400, 
        details: Any = None
    ) -> Tuple[Dict, int]:
        """
        Create standard error response
        Cria resposta de erro padrão
        
        Args:
            error: Error message / Mensagem de erro
            code: HTTP status code / Código de status HTTP
            details: Optional error details / Detalhes de erro opcionais
            
        Returns:
            Tuple of (response_dict, status_code) / Tupla de (dicionário de resposta, código de status)
        """
        response = {
            "success": False,
            "error": error
        }
        if details:
            response["details"] = details
        
        return jsonify(response), code
    
    def validate_request(self, required_fields: List[str]) -> Dict[str, Any]:
        """
        Validate that required fields exist in request JSON
        Valida que campos obrigatórios existem no JSON da requisição
        
        Args:
            required_fields: List of required field names / Lista de nomes de campos obrigatórios
            
        Returns:
            Request JSON data / Dados JSON da requisição
            
        Raises:
            ValueError: If required fields are missing / Se campos obrigatórios estiverem faltando
        """
        data = request.get_json() or {}
        missing = [f for f in required_fields if f not in data]
        
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        
        return data
    
    def get_request_data(self) -> Dict[str, Any]:
        """
        Safely get request JSON data
        Obtém dados JSON da requisição com segurança
        
        Returns:
            Request data or empty dict / Dados da requisição ou dicionário vazio
        """
        return request.get_json() or {}
    
    def log_request(self, endpoint: str):
        """
        Log incoming request
        Registra requisição recebida
        
        Args:
            endpoint: Endpoint name / Nome do endpoint
        """
        self.logger.info(f"{request.method} {endpoint} - {request.remote_addr}")
    
    def log_error(self, endpoint: str, error: Exception):
        """
        Log error with details
        Registra erro com detalhes
        
        Args:
            endpoint: Endpoint name / Nome do endpoint
            error: Exception that occurred / Exceção que ocorreu
        """
        self.logger.error(f"{endpoint} failed: {str(error)}", exc_info=True)
