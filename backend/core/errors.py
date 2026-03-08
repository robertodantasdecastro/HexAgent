"""
Custom Exceptions for HexAgentGUI Backend
Exceções Personalizadas para o Backend do HexAgentGUI

Defines custom exception classes for better error handling and
more specific error responses.

Define classes de exceção personalizadas para melhor tratamento
de erros e respostas de erro mais específicas.
"""


class HexAgentError(Exception):
    """
    Base exception for all HexAgent errors
    Exceção base para todos os erros do HexAgent
    """
    def __init__(self, message: str, code: int = 500):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ConfigError(HexAgentError):
    """Configuration related errors / Erros relacionados à configuração"""
    def __init__(self, message: str):
        super().__init__(message, code=400)


class ValidationError(HexAgentError):
    """Input validation errors / Erros de validação de entrada"""
    def __init__(self, message: str):
        super().__init__(message, code=400)


class AuthenticationError(HexAgentError):
    """Authentication errors / Erros de autenticação"""
    def __init__(self, message: str):
        super().__init__(message, code=401)


class AuthorizationError(HexAgentError):
    """Authorization errors / Erros de autorização"""
    def __init__(self, message: str):
        super().__init__(message, code=403)


class NotFoundError(HexAgentError):
    """Resource not found errors / Erros de recurso não encontrado"""
    def __init__(self, message: str):
        super().__init__(message, code=404)


class ServiceUnavailableError(HexAgentError):
    """Service unavailable errors / Erros de serviço indisponível"""
    def __init__(self, message: str):
        super().__init__(message, code=503)
