"""
HexStrike Client - Command Execution Interface
Cliente HexStrike - Interface de Execução de Comandos

Communicates with HexStrike server API for command execution.
Comunica com servidor API HexStrike para execução de comandos.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

import requests
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class HexStrikeClient:
    """
    Client for HexStrike command execution server
    Cliente para servidor de execução de comandos HexStrike
    
    Provides interface to execute shell commands and security tools via HexStrike API.
    Fornece interface para executar comandos shell e ferramentas de segurança via API HexStrike.
    """
    
    DEFAULT_BASE_URL = "http://localhost:8888"
    DEFAULT_TIMEOUT = 60
    
    def __init__(self, base_url: Optional[str] = None, timeout: Optional[int] = None):
        """
        Initialize HexStrike client
        Inicializa cliente HexStrike
        
        Args:
            base_url: HexStrike server URL (default: http://localhost:8888)
                     URL do servidor HexStrike (padrão: http://localhost:8888)
            timeout: Default request timeout in seconds (default: 60)
                    Timeout padrão de requisição em segundos (padrão: 60)
        """
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip('/')
        self.timeout = timeout or self.DEFAULT_TIMEOUT
        self.session = requests.Session()
        
        logger.info(f"HexStrikeClient initialized: {self.base_url}")
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check if HexStrike server is alive and responding
        Verifica se servidor HexStrike está vivo e respondendo
        
        Returns:
            Health status dictionary:
            {
                "status": "ok" | "error",
                "message": str (optional),
                "alive": bool (optional)
            }
        """
        try:
            logger.debug("Performing health check")
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=5  # Short timeout for health check
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info("Health check successful")
            return data
            
        except requests.exceptions.Timeout:
            logger.warning("Health check timed out")
            return {
                "status": "error",
                "message": "Health check timed out",
                "alive": False
            }
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"Health check connection error: {e}")
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}",
                "alive": False
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e),
                "alive": False
            }
    
    def is_available(self) -> bool:
        """
        Quick availability check
        Verificação rápida de disponibilidade
        
        Returns:
            True if server is available, False otherwise
        """
        health = self.health_check()
        return health.get("status") != "error" and health.get("alive", True)
    
    def execute_command(
        self, 
        command: str, 
        timeout: Optional[int] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Execute shell command via HexStrike
        Executa comando shell via HexStrike
        
        Args:
            command: Shell command to execute / Comando shell para executar
            timeout: Execution timeout in seconds (default: self.timeout)
                    Timeout de execução em segundos (padrão: self.timeout)
            use_cache: Use command result cache if available
                      Usar cache de resultado de comando se disponível
            
        Returns:
            Command execution result:
            {
                "success": bool,
                "command": str,
                "output": str,
                "stdout": str (alternative),
                "stderr": str (optional),
                "error": str (if failed),
                "exit_code": int,
                "cached": bool (optional)
            }
        """
        timeout = timeout or self.timeout
        
        try:
            logger.info(f"Executing command: {command[:50]}...")
            
            response = self.session.post(
                f"{self.base_url}/api/command",
                json={
                    "command": command,
                    "use_cache": use_cache
                },
                timeout=timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Normalize response format
            # Normaliza formato de resposta
            result = {
                "success": data.get("success", False),
                "command": command,
                "output": data.get("output", "") or data.get("stdout", ""),
                "error": data.get("error", "") or data.get("stderr", ""),
                "exit_code": data.get("exit_code", 0) or data.get("exitCode", 0),
                "cached": data.get("cached", False)
            }
            
            logger.info(f"Command executed successfully (exit code: {result['exit_code']})")
            return result
            
        except requests.exceptions.Timeout:
            error_msg = f"Command timed out after {timeout}s"
            logger.error(error_msg)
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": error_msg,
                "exit_code": -1
            }
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            logger.error(f"Command execution HTTP error: {error_msg}")
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": error_msg,
                "exit_code": -1
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Command execution failed: {error_msg}", exc_info=True)
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": error_msg,
                "exit_code": -1
            }
    
    def execute_tool(
        self, 
        tool_name: str, 
        parameters: Dict[str, Any],
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute specific security tool
        Executa ferramenta de segurança específica
        
        Args:
            tool_name: Tool name (e.g., 'nmap', 'nuclei', 'gobuster')
                      Nome da ferramenta (ex: 'nmap', 'nuclei', 'gobuster')
            parameters: Tool-specific parameters / Parâmetros específicos da ferramenta
            timeout: Execution timeout in seconds (default: 300s for tools)
                    Timeout de execução em segundos (padrão: 300s para ferramentas)
            
        Returns:
            Tool execution result dictionary / Dicionário de resultado de execução
        """
        timeout = timeout or 300  # 5 minutes default for tools / 5 minutos padrão para ferramentas
        
        try:
            logger.info(f"Executing tool: {tool_name}")
            
            endpoint = f"/api/tools/{tool_name}"
            response = self.session.post(
                f"{self.base_url}{endpoint}",
                json=parameters,
                timeout=timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Tool {tool_name} executed successfully")
            return data
            
        except requests.exceptions.Timeout:
            error_msg = f"Tool {tool_name} timed out after {timeout}s"
            logger.error(error_msg)
            return {
                "success": False,
                "tool": tool_name,
                "error": error_msg
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Tool {tool_name} execution failed: {error_msg}", exc_info=True)
            return {
                "success": False,
                "tool": tool_name,
                "error": error_msg
            }
    
    def list_tools(self) -> Dict[str, Any]:
        """
        Get list of available tools
        Obtém lista de ferramentas disponíveis
        
        Returns:
            List of available tools / Lista de ferramentas disponíveis
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/tools",
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to list tools: {e}")
            return {"success": False, "error": str(e)}
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get command cache statistics
        Obtém estatísticas de cache de comandos
        
        Returns:
            Cache statistics / Estatísticas de cache
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/cache/stats",
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"success": False, "error": str(e)}
    
    def clear_cache(self) -> Dict[str, Any]:
        """
        Clear command result cache
        Limpa cache de resultados de comando
        
        Returns:
            Operation result / Resultado da operação
        """
        try:
            logger.info("Clearing command cache")
            response = self.session.post(
                f"{self.base_url}/api/cache/clear",
                timeout=10
            )
            response.raise_for_status()
            logger.info("Cache cleared successfully")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return {"success": False, "error": str(e)}
    
    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return f"HexStrikeClient(url='{self.base_url}')"
