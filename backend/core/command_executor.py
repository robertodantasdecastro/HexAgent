"""
CommandExecutor - Command Execution and Formatting
Executor de Comandos - Execução e Formatação de Comandos

Executes commands via HexStrike client and formats results for AI feedback.
Executa comandos via cliente HexStrike e formata resultados para feedback da IA.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (AgentCore Integration)
"""

from typing import Dict, List, Any, Optional
import logging


class CommandExecutor:
    """
    Executes commands and formats results
    Executa comandos e formata resultados
    
    Wraps HexStrikeClient to provide clean command execution interface
    with formatted output for AI feedback loops.
    
    Encapsula HexStrikeClient para fornecer interface limpa de execução
    de comandos com saída formatada para loops de feedback de IA.
    """
    
    def __init__(self, hexstrike_client):
        """
        Initialize CommandExecutor
        Inicializa CommandExecutor
        
        Args / Argumentos:
            hexstrike_client: HexStrikeClient instance for command execution
                            Instância HexStrikeClient para execução de comandos
        """
        self.hexstrike_client = hexstrike_client
        self.logger = logging.getLogger(__name__)
    
    def is_available(self) -> bool:
        """
        Check if HexStrike is available for command execution
        Verifica se HexStrike está disponível para execução de comandos
        
        Returns / Retorna:
            bool: True if available / True se disponível
        """
        return self.hexstrike_client is not None and \
               self.hexstrike_client.is_healthy()
    
    def execute_command(self, command: str) -> Dict[str, Any]:
        """
        Execute a single command via HexStrike
        Executa um único comando via HexStrike
        
        Args / Argumentos:
            command (str): Command to execute / Comando para executar
        
        Returns / Retorna:
            Dict[str, Any]: Execution result / Resultado da execução
            {
                'command': str,     # Original command
                'stdout': str,      # Command output
                'stderr': str,      # Error output
                'exit_code': int,   # Exit code (0 = success)
                'success': bool,    # Execution success
                'error': str        # Error message if failed
            }
        """
        if not self.is_available():
            return {
                'command': command,
                'stdout': '',
                'stderr': 'HexStrike not available',
                'exit_code': 1,
                'success': False,
                'error': 'HexStrike client not initialized or unhealthy'
            }
        
        try:
            # Execute via HexStrike / Executar via HexStrike
            self.logger.info(f"Executing command: {command}")
            result = self.hexstrike_client.execute_bash(command)
            
            # Check if execution was successful
            # Verificar se a execução foi bem-sucedida
            exit_code = result.get('exit_code', 1)
            success = exit_code == 0
            
            return {
                'command': command,
                'stdout': result.get('output', ''),
                'stderr': result.get('error', ''),
                'exit_code': exit_code,
                'success': success,
                'error': '' if success else result.get('error', 'Unknown error')
            }
            
        except Exception as e:
            self.logger.error(f"Command execution failed: {e}")
            return {
                'command': command,
                'stdout': '',
                'stderr': str(e),
                'exit_code': 1,
                'success': False,
                'error': str(e)
            }
    
    def execute_and_format(self, commands: List[str], iteration: int = 1) -> Dict[str, Any]:
        """
        Execute multiple commands and format results for AI feedback
        Executa múltiplos comandos e formata resultados para feedback da IA
        
        Args / Argumentos:
            commands (List[str]): List of commands to execute
                                Lista de comandos para executar
            iteration (int): Current iteration number (for logging)
                           Número da iteração atual (para logging)
        
        Returns / Retorna:
            Dict[str, Any]: Formatted results / Resultados formatados
            {
                'results': List[Dict],  # Individual command results
                'summary': str,         # Human-readable summary for AI
                'all_successful': bool, # All commands succeeded
                'any_failed': bool      # At least one failed
            }
        """
        results = []
        summary_parts = []
        
        for cmd in commands:
            # Execute command / Executar comando
            result = self.execute_command(cmd)
            results.append(result)
            
            # Build summary for AI feedback / Construir resumo para feedback da IA
            status = "✅ Sucesso" if result['success'] else "❌ Falhou"
            summary_parts.append(
                f"\nComando: {cmd}\n"
                f"Status: {status}\n"
                f"Resultado: {result['stdout'][:500]}"  # Limit output length
            )
            
            if not result['success']:
                summary_parts.append(f"Erro: {result['error']}")
        
        summary = "\n".join(summary_parts)
        
        all_successful = all(r['success'] for r in results)
        any_failed = any(not r['success'] for r in results)
        
        return {
            'results': results,
            'summary': summary,
            'all_successful': all_successful,
            'any_failed': any_failed,
            'iteration': iteration
        }
    
    def format_for_sse(self, command: str, result: Dict[str, Any], 
                       iteration: int, max_iterations: int) -> Dict[str, Any]:
        """
        Format execution result for SSE streaming
        Formata resultado de execução para streaming SSE
        
        Creates SSE-compatible chunk for frontend consumption.
        Cria chunk compatível com SSE para consumo do frontend.
        
        Args / Argumentos:
            command (str): Executed command / Comando executado
            result (Dict): Execution result / Resultado da execução
            iteration (int): Current iteration / Iteração atual
            max_iterations (int): Maximum iterations / Máximo de iterações
        
        Returns / Retorna:
            Dict[str, Any]: SSE chunk / Chunk SSE
        """
        return {
            "type": "shell_output",
            "command": command,
            "stdout": result['stdout'],
            "stderr": result.get('stderr', ''),
            "exit_code": result['exit_code'],
            "success": result['success'],
            "iteration": iteration,
            "max_iterations": max_iterations
        }
