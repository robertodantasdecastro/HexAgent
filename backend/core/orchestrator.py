"""
Agent Orchestrator Module
Módulo Orquestrador do Agente

Centralizes the iterative loop of the autonomous agent.
Centraliza o loop iterativo do agente autônomo.

Uses Strict OOP Response Blocks.
Usa Blocos de Resposta POO Estritos.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (Block Pattern)
"""

import logging
import json
import re
from typing import Generator, Dict, Any, List, Optional
from .command_executor import CommandExecutor
# from .response_strategy import ResponseFactory # Legacy removed / Legado removido
from .mcp_manager import MCPManager

# Import new Domain Blocks / Importar novos Blocos de Domínio
from .domain.response_block import (
    TextBlock, CommandBlock, ResultBlock, ErrorBlock, LifecycleBlock
)

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Orchestrates the autonomous agent loop using Response Blocks.
    Orquestra o loop do agente autônomo usando Blocos de Resposta.
    """

    def __init__(self, provider: Any, executor: CommandExecutor, mcp_manager: MCPManager):
        self.provider = provider
        self.executor = executor
        self.mcp_manager = mcp_manager
        
    def process(
        self, 
        user_input: str,
        chat_context: Optional[List[Dict[str, str]]] = None,
        auto_execute: bool = False,
        max_iterations: int = 10,
        abort_signal: Optional[Any] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Process the user input through the autonomous loop.
        Processa a entrada do usuário através do loop autônomo.
        """
        iteration = 0
        history = list(chat_context) if chat_context else []
        history.append({"role": "user", "content": user_input})
        
        if not self.provider:
            yield ErrorBlock("AI Brain not initialized. Please configure API Key.").to_dict()
            return

        logger.info(f"Orchestrator: Starting Cycle. Input='{user_input[:50]}...'")

        while iteration < max_iterations:
            if abort_signal and abort_signal.is_set():
                yield ErrorBlock("Process aborted by user").to_dict()
                break

            iteration += 1
            logger.info(f"Orchestrator: Starting iteration {iteration}/{max_iterations}")

            # Notify: Narrative Block Start
            yield LifecycleBlock("block_start", "narrative", {"iteration": iteration}).to_dict()

            # 1. AI Response Streaming
            full_response = ""
            
            try:
                for chunk in self.provider.chat_step(prompt=None, chat_context=history):
                    if abort_signal and abort_signal.is_set(): break
                    
                    full_response += chunk
                    # Stream text chunks as TextBlocks (optimization: maybe buffering?)
                    yield TextBlock(chunk, iteration).to_dict()
                
            except Exception as e:
                logger.error(f"AI Error: {e}")
                yield ErrorBlock(f"AI Provider Error: {str(e)}").to_dict()
                yield LifecycleBlock("block_end", "narrative", {"status": "error"}).to_dict()
                break
            
            history.append({"role": "assistant", "content": full_response})
            
            # Notify: Narrative Block End
            yield LifecycleBlock("block_end", "narrative").to_dict()

            if abort_signal and abort_signal.is_set(): break

            # 2. Extract Commands
            commands = self._extract_commands(full_response)
            
            if not commands:
                logger.info("Orchestrator: No commands found.")
                break
            
            # 3. Process Commands
            any_executed = False
            command_results = []
            
            for cmd_idx, cmd in enumerate(commands, 1):
                if abort_signal and abort_signal.is_set(): break

                # Handle Tool Calls
                if cmd.startswith("MCP_TOOL_CALL|"):
                    yield from self._handle_tool_call(cmd, auto_execute)
                    any_executed = True
                    continue

                # Bash Command Proposal
                yield CommandBlock(cmd, auto_execute).to_dict()

                if auto_execute and self.executor.is_available():
                    # Notify: Shell Block Start
                    yield LifecycleBlock("block_start", "shell", {"command": cmd}).to_dict()
                    
                    try:
                        result = self.executor.execute_command(cmd)
                        success = result["success"]
                        
                        yield ResultBlock(
                            result["stdout"] if success else result["error"],
                            success,
                            result.get("exit_code", 0),
                            cmd
                        ).to_dict()
                        
                        if success:
                            command_results.append(f"Command: {cmd}\nOutput:\n{result['stdout']}")
                        else:
                            command_results.append(f"Command: {cmd}\nError:\n{result['error']}")
                            
                        any_executed = True

                    except Exception as e:
                        yield ErrorBlock(f"Execution Error: {str(e)}").to_dict()
                        command_results.append(f"Command: {cmd}\nException: {str(e)}")
                    
                    yield LifecycleBlock("block_end", "shell").to_dict()

            # 4. Loop Logic
            if not auto_execute: break
            if not any_executed: break

            if command_results:
                feedback = "Command Execution Results:\n" + "\n---\n".join(command_results)
                history.append({"role": "user", "content": feedback})

        logger.info(f"Loop finished after {iteration} iterations.")
        yield LifecycleBlock("complete", "process", {"iterations": iteration}).to_dict()

    def _extract_commands(self, text: str) -> List[str]:
        """Extract bash commands and Tool Calls."""
        commands = []
        
        # 1. Code blocks (bash/sh/zsh)
        pattern_code = r'```(?:bash|sh|zsh)?\s*\n(.*?)\n\s*```'
        for match in re.findall(pattern_code, text, re.DOTALL | re.IGNORECASE):
            for line in match.split('\n'):
                line = line.strip()
                if line and not line.startswith('#'): commands.append(line)

        # 2. [EXEC] Tags
        pattern_exec = r'\[EXEC\]\s*(.*?)\s*\[/EXEC\]'
        for match in re.findall(pattern_exec, text, re.DOTALL | re.IGNORECASE):
             cmd = match.strip().strip("`")
             if cmd: commands.append(cmd)

        # 3. Tool Calls
        pattern_tool = r'```tool_call\n(.*?)\n```'
        for match in re.findall(pattern_tool, text, re.DOTALL | re.IGNORECASE):
             try:
                cmd = f"MCP_TOOL_CALL|{match.strip()}"
                commands.append(cmd)
             except: pass
                 
        return sorted(list(set(commands)), key=commands.index) # Dedupe preserving order

    def _handle_tool_call(self, cmd_str: str, auto_execute: bool) -> Generator[Dict[str, Any], None, None]:
        try:
            tool_json = cmd_str.split("|", 1)[1]
            tool_data = json.loads(tool_json)
            tool_name = tool_data.get("name")
            tool_args = tool_data.get("arguments")
            
            yield CommandBlock(f"Tool: {tool_name}", auto_execute).to_dict()
            
            if auto_execute:
                yield LifecycleBlock("block_start", "tool", {"name": tool_name}).to_dict()
                try:
                    result = self.mcp_manager.call_tool_sync(tool_name, tool_args)
                    output = json.dumps(result, indent=2) if not isinstance(result, str) else result
                    yield ResultBlock(output, True, 0, tool_name).to_dict()
                except Exception as e:
                    yield ErrorBlock(f"Tool Error: {str(e)}").to_dict()
                yield LifecycleBlock("block_end", "tool").to_dict()
        except Exception as e:
            yield ErrorBlock(f"Tool Parsing Error: {str(e)}").to_dict()
