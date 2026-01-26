"""
Agent Orchestrator Module
Módulo Orquestrador do Agente

Centralizes the iterative loop of the autonomous agent:
Think -> Propose -> Execute -> Feedback

Centraliza o loop iterativo do agente autônomo:
Pensar -> Propor -> Executar -> Feedback

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

import logging
import json
import re
from typing import Generator, Dict, Any, List, Optional
from .command_executor import CommandExecutor
from .response_strategy import ResponseFactory
from .mcp_manager import MCPManager

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Orchestrates the autonomous agent loop.
    Orquestra o loop do agente autônomo.
    """

    def __init__(self, provider: Any, executor: CommandExecutor, mcp_manager: MCPManager):
        """
        Initialize the orchestrator.
        Inicializa o orquestrador.

        Args:
            provider: AI Provider instance (Strategy Pattern)
            executor: CommandExecutor instance
            mcp_manager: MCPManager instance
        """
        self.provider = provider
        self.executor = executor
        self.mcp_manager = mcp_manager
        
    def process(
        self, 
        user_input: str,
        chat_context: Optional[List[Dict[str, str]]] = None,
        auto_execute: bool = False,
        max_iterations: int = 10
        abort_signal: Optional[Any] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Process the user input through the autonomous loop.
        Processa a entrada do usuário através do loop autônomo.
        """
        iteration = 0
        current_context = user_input
        
        while iteration < max_iterations:
            # SAFETY CHECK 1: Abort Signal
            if abort_signal and abort_signal.is_set():
                logger.warning("Orchestrator: Abort signal received. Terminating loop.")
                yield {"type": "abort", "content": "Process aborted by user", "metadata": {}}
                break

            iteration += 1
            logger.info(f"Orchestrator: Starting iteration {iteration}/{max_iterations}")

            # Notify: Thinking Block Start
            yield {"type": "block_start", "block": "thinking", "metadata": {"iteration": iteration}}

            # 1. AI Thinking / Pensamento da IA
            full_response = ""
            try:
                # Pass context only on first iteration or handle history properly
                iter_context = chat_context if iteration == 1 else None
                
                for chunk in self.provider.chat_step(prompt=current_context, chat_context=iter_context):
                    # SAFETY CHECK 2: Abort during stream
                    if abort_signal and abort_signal.is_set():
                         logger.warning("Orchestrator: Aborted / Thinking.")
                         break

                    full_response += chunk
                    yield ResponseFactory.create_text(chunk, iteration, max_iterations)
            
            except Exception as e:
                logger.error(f"AI Error: {e}")
                yield ResponseFactory.create_error(f"AI Error: {str(e)}")
                yield {"type": "block_end", "block": "thinking", "metadata": {"status": "error"}}
                break
            
            # Notify: Thinking Block End
            yield {"type": "block_end", "block": "thinking", "metadata": {}}

            if abort_signal and abort_signal.is_set():
                break

            # 2. Extract Commands / Extrair Comandos
            commands = self._extract_commands(full_response)
            
            if not commands:
                logger.info("Orchestrator: No commands found. Task likely complete.")
                # Notify: Narrative Block
                yield {"type": "block_start", "block": "narrative", "metadata": {}}
                yield {"type": "text", "content": full_response} # Or specialized narrative type
                yield {"type": "block_end", "block": "narrative", "metadata": {}}
                break

            # 3. Process Commands / Processar Comandos
            any_executed = False
            
            for cmd_idx, cmd in enumerate(commands, 1):
                if abort_signal and abort_signal.is_set(): break

                # Tool Call Check
                if cmd.startswith("MCP_TOOL_CALL|"):
                    yield from self._handle_tool_call(cmd, auto_execute)
                    any_executed = True 
                    continue

                # Bash Command - Notify Shell Block Start if Executing
                meta = {
                    "iteration": iteration,
                    "command_index": cmd_idx,
                    "total_commands": len(commands),
                    "auto_execute": auto_execute
                }
                
                yield ResponseFactory.create_proposal(cmd, meta)

                if auto_execute and self.executor.is_available():
                    logger.info(f"Orchestrator: Auto-executing {cmd}")
                    
                    # Notify: Shell Block Start
                    yield {"type": "block_start", "block": "shell", "metadata": {"command": cmd}}
                    
                    try:
                        result = self.executor.execute_command(cmd)
                        yield ResponseFactory.create_result(
                            result["stdout"] if result["success"] else result["error"],
                            result["success"],
                            result.get("exit_code", 0),
                            cmd
                        )
                        any_executed = True
                        
                        # Prepare feedback
                        feedback_header = f"Command `{cmd}` executed."
                        feedback_status = "Success" if result["success"] else "Failed"
                        current_context += f"\n\n[{feedback_header}]\nStatus: {feedback_status}\nOutput:\n{result['stdout'] or result['error']}"

                    except Exception as e:
                        logger.error(f"Execution Error: {e}")
                        yield ResponseFactory.create_error(f"Execution Error: {str(e)}")
                    
                    # Notify: Shell Block End
                    yield {"type": "block_end", "block": "shell", "metadata": {"exit_code": result.get("exit_code", 1) if 'result' in locals() else 1}}
                
            # 4. Loop Control / Controle do Loop
            if not auto_execute:
                logger.info("Orchestrator: Auto-execute disabled. Stopping loop.")
                break
            
            if not any_executed:
                logger.info("Orchestrator: No commands executed. Stopping loop.")
                break

            current_context += "\n\nAnalyze the results above and continue."

        # End of Loop
        logger.info(f"Orchestrator: Loop finished after {iteration} iterations.")
        yield {
            "type": "complete",
            "content": "",
            "metadata": {"iterations": iteration}
        }

    def _extract_commands(self, text: str) -> List[str]:
        """
        Extract bash commands and Tool Calls from AI response
        Extrai comandos bash e Chamadas de Ferramenta da resposta da IA
        """
        commands = []
        
        # 1. Bash / Sh blocks
        pattern_bash = r'```(?:bash|sh)\n(.*?)\n```'
        matches_bash = re.findall(pattern_bash, text, re.DOTALL | re.IGNORECASE)
        for match in matches_bash:
            for line in match.split('\n'):
                line = line.strip()
                if line and not line.startswith('#'):
                    commands.append(line)
        
        # 2. Tool Calls
        pattern_tool = r'```tool_call\n(.*?)\n```'
        matches_tool = re.findall(pattern_tool, text, re.DOTALL | re.IGNORECASE)
        for match in matches_tool:
             try:
                json.loads(match)
                commands.append(f"MCP_TOOL_CALL|{match}")
             except:
                 pass
                 
        return commands

    def _handle_tool_call(self, cmd_str: str, auto_execute: bool) -> Generator[Dict[str, Any], None, None]:
        """
        Handle MCP Tool Call logic
        Lida com lógica de chamada de ferramenta MCP
        """
        try:
            tool_json = cmd_str.split("|", 1)[1]
            tool_data = json.loads(tool_json)
            tool_name = tool_data.get("name")
            tool_args = tool_data.get("arguments")
            
            yield ResponseFactory.create_proposal(f"Tool Call: {tool_name}", {"tool": tool_name, "args": tool_args})
            
            if auto_execute:
                try:
                    result_obj = self.mcp_manager.call_tool_sync(tool_name, tool_args)
                    output_str = json.dumps(result_obj, indent=2) if not isinstance(result_obj, str) else result_obj
                    
                    yield ResponseFactory.create_result(output_str, True, 0, f"tool:{tool_name}")
                except Exception as e:
                    yield ResponseFactory.create_error(f"Tool Error: {str(e)}")
        except Exception as e:
            yield ResponseFactory.create_error(f"Tool Parsing Error: {str(e)}")
