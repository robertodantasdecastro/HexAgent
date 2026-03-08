"""
ActionDispatcher - Centralized Action Handling
ActionDispatcher - Manipulação Centralizada de Ações

Acts as the single entry point for all system actions (Commands, Files, Config),
ensuring consistent validation, logging, and security.

Atua como ponto de entrada único para todas as ações do sistema (Comandos, Arquivos, Configuração),
garantindo validação, logging e segurança consistentes.

@author: Roberto Dantas de Castro
"""

import logging
from typing import Dict, Any, Optional
from services.file_service import FileService
# Removed top-level import to prevent circular dependency with core/__init__.py
# Removido import de nível superior para prevenir dependência circular

logger = logging.getLogger(__name__)

class ActionDispatcher:
    """
    Central dispatcher for all agent actions
     despachante central para todas as ações do agente
    """
    
    def __init__(self, agent_core):
        """
        Initialize Dispatcher
        Inicializa Despachante
        
        Args:
            agent_core: Reference to AgentCore (for CommandExecutor access)
                       Referência ao AgentCore (para acesso ao CommandExecutor)
        """
        self.core = agent_core
        self.file_service = FileService()
        
        # Local import to avoid circular dependency
        from services.system_config_service import SystemConfigService
        self.config_service = SystemConfigService()
        
    def dispatch(self, action_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatch an action to the appropriate handler
        Despacha uma ação para o manipulador apropriado
        
        Args:
            action_type: Type of action ('execute_command', 'write_file', etc.)
                        Tipo de ação ('execute_command', 'write_file', etc.)
            params: Action parameters
                   Parâmetros da ação
                   
        Returns:
            Action result dictionary
            Dicionário com resultado da ação
        """
        logger.info(f"Dispatching action: {action_type}")
        
        try:
            handler = getattr(self, f"_handle_{action_type}", None)
            
            if not handler:
                return {
                    "success": False,
                    "error": f"Unknown action type: {action_type}",
                    "exit_code": 1
                }
            
            return handler(params)
            
        except Exception as e:
            logger.error(f"Action dispatch failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "exit_code": 1
            }

    def _handle_execute_command(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle shell command execution / Trata execução de comando shell"""
        command = params.get('command')
        if not command:
            raise ValueError("Missing 'command' parameter")
        
        # Use AgentCore's executor
        if not self.core.executor:
             return {
                "success": False, 
                "error": "Executor not initialized",
                "exit_code": 1
            }
            
        return self.core.executor.execute_command(command)

    def _handle_write_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle file write / Trata escrita de arquivo"""
        path = params.get('path')
        content = params.get('content')
        
        if not path or content is None:
             raise ValueError("Missing 'path' or 'content' parameter")
             
        return self.file_service.write_file(
            content=content,
            filename=path.split('/')[-1], # Simplified fallback
            user_path=path,
            overwrite=params.get('overwrite', False)
        )
    
    def _handle_read_file(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle file read / Trata leitura de arquivo"""
        path = params.get('path')
        if not path:
             raise ValueError("Missing 'path' parameter")
             
        return self.file_service.read_file(path)
