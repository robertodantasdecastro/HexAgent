"""
Response Strategy Module
Módulo de Estratégia de Resposta

Standardizes how AI responses are formatted and sent to the frontend.
Padroniza como as respostas da IA são formatadas e enviadas ao frontend.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.1.0
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ResponseStrategy(ABC):
    """
    Abstract Base Class for Response Strategies
    Classe Base Abstrata para Estratégias de Resposta
    """
    
    @abstractmethod
    def format(self, content: Any, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format the content for the frontend.
        Formata o conteúdo para o frontend.
        """
        pass

class TextResponse(ResponseStrategy):
    """
    Strategy for streaming text chunks.
    Estratégia para streaming de pedaços de texto.
    """
    def format(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        meta = metadata or {}
        meta['status'] = 'streaming'
        return {
            "type": "text",
            "content": content,
            "metadata": meta
        }

class CommandProposalResponse(ResponseStrategy):
    """
    Strategy for proposing commands to the user.
    Estratégia para propor comandos ao usuário.
    """
    def format(self, command: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        meta = metadata or {}
        meta['status'] = 'proposal'
        return {
            "type": "command_proposal",
            "content": command,
            "metadata": meta
        }

class CommandResultResponse(ResponseStrategy):
    """
    Strategy for returning command execution results.
    Estratégia para retornar resultados da execução de comandos.
    """
    def format(self, output: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        meta = metadata or {}
        meta['status'] = 'complete'
        return {
            "type": "command_result",
            "content": output,
            "metadata": meta
        }

class ErrorResponse(ResponseStrategy):
    """
    Strategy for error reporting.
    Estratégia para relato de erros.
    """
    def format(self, error_msg: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        meta = metadata or {}
        meta['status'] = 'error'
        return {
            "type": "error",
            "content": error_msg,
            "metadata": meta
        }

class BlockStartResponse(ResponseStrategy):
    """
    Strategy for signaling the start of a UI block.
    Estratégia para sinalizar o início de um bloco de UI.
    """
    def format(self, block_type: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        meta = metadata or {}
        meta['status'] = 'start'
        return {
            "type": "block_start",
            "block": block_type,
            "metadata": meta
        }

class BlockEndResponse(ResponseStrategy):
    """
    Strategy for signaling the end of a UI block.
    Estratégia para sinalizar o fim de um bloco de UI.
    """
    def format(self, block_type: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        meta = metadata or {}
        meta['status'] = 'end'
        return {
            "type": "block_end",
            "block": block_type,
            "metadata": meta
        }

class ResponseFactory:
    """
    Factory to create response objects easily.
    Fábrica para criar objetos de resposta facilmente.
    """
    
    @staticmethod
    def create_text(content: str, iteration: int, max_iterations: int) -> Dict[str, Any]:
        return TextResponse().format(content, {
            "iteration": iteration, 
            "max_iterations": max_iterations
        })

    @staticmethod
    def create_proposal(command: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        return CommandProposalResponse().format(command, metadata)

    @staticmethod
    def create_result(output: str, success: bool, exit_code: int, cmd: str) -> Dict[str, Any]:
        return CommandResultResponse().format(output, {
            "success": success,
            "exit_code": exit_code,
            "command": cmd
        })

    @staticmethod
    def create_error(error: str) -> Dict[str, Any]:
        return ErrorResponse().format(error)

    @staticmethod
    def create_block_start(block_type: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return BlockStartResponse().format(block_type, metadata)

    @staticmethod
    def create_block_end(block_type: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return BlockEndResponse().format(block_type, metadata)
