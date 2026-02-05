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
import os
from typing import Generator, Dict, Any, List, Optional
from .command_executor import CommandExecutor
# from .response_strategy import ResponseFactory # Legacy removed / Legado removido
from .mcp_manager import MCPManager

# Import new Domain Blocks / Importar novos Blocos de Domínio
from .domain.response_block import (
    TextBlock, CommandBlock, ResultBlock, ErrorBlock, LifecycleBlock, ThinkingBlock
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
        # buffer for tag detection / buffer para detecção de tags
        self.stream_buffer = ""
        # Context Awareness: Current Working Directory
        # Consciência de Contexto: Diretório de Trabalho Atual
        self.cwd = os.getcwd()

    def _process_stream_buffer(self, chunk: str, current_type: str) -> tuple[str, str, str]:
        """
         robust stream buffer processing to handle split tags.
        Processamento robusto de buffer de stream para lidar com tags divididas.
        
        Returns:
            (new_type, content_to_yield, buffer_remainder)
            (novo_tipo, conteúdo_a_emitir, resto_do_buffer)
        """
        # Append new chunk to buffer / Adicionar novo chunk ao buffer
        self.stream_buffer += chunk
        
        content_to_yield = ""
        new_type = current_type
        
        # Define tags to look for / Definir tags para procurar
        TAGS = ["<think>", "<thinking>", "</think>", "</thinking>"]
        
        # Helper to find earliest tag / Auxiliar para encontrar tag mais cedo
        def find_first_tag(text):
            earliest_pos = -1
            found_tag = None
            for tag in TAGS:
                pos = text.find(tag)
                if pos != -1:
                    if earliest_pos == -1 or pos < earliest_pos:
                        earliest_pos = pos
                        found_tag = tag
            return earliest_pos, found_tag

        # Process buffer until no complete tags are found
        # Processar buffer até que nenhuma tag completa seja encontrada
        while True:
            pos, tag = find_first_tag(self.stream_buffer)
            
            if pos == -1:
                # No complete tags. Check for partial tags at the end.
                # Nenhuma tag completa. Verificar tags parciais no final.
                # Threshold: Max tag length is ~11 chars ("</thinking>")
                # Limiar: Comprimento máx da tag é ~11 chars
                
                partial_found = False
                # Check if buffer ends with a partial prefix of any tag
                # Verifica se buffer termina com um prefixo parcial de qualquer tag
                cutoff_index = len(self.stream_buffer)
                
                # Check from end. If buffer is "abc<th", we keep "<th".
                # Optimize: only check last 12 chars
                check_segment = self.stream_buffer[-12:]
                
                for potential_tag in TAGS:
                    # Check prefixes 1..len-1
                    for i in range(1, len(potential_tag)):
                        prefix = potential_tag[:i]
                        if check_segment.endswith(prefix):
                            # We found a partial tag at the very end
                            # Encontramos uma tag parcial no final
                            partial_found = True
                            # Calculate where it starts in the full buffer
                            cutoff_index = len(self.stream_buffer) - i
                            break
                    if partial_found: break

                if partial_found:
                    # Yield everything up to the partial tag start
                    # Emitir tudo até o início da tag parcial
                    content_to_yield += self.stream_buffer[:cutoff_index]
                    self.stream_buffer = self.stream_buffer[cutoff_index:]
                    break
                else:
                    # Safe to yield everything
                    # Seguro para emitir tudo
                    content_to_yield += self.stream_buffer
                    self.stream_buffer = ""
                    break
            else:
                # Found a tag!
                # Encontrou uma tag!
                
                # 1. Content before tag
                content_to_yield += self.stream_buffer[:pos]
                
                # 2. Handle State Change
                if tag in ["<think>", "<thinking>"]:
                    new_type = "thinking"
                elif tag in ["</think>", "</thinking>"]:
                    new_type = "text"
                
                # 3. Remove tag from buffer
                self.stream_buffer = self.stream_buffer[pos + len(tag):]
                
                # Loop to find next tag
        
        return new_type, content_to_yield, self.stream_buffer
        
    # Legacy method kept for interface compatibility if needed, but unused internally now
    def _detect_block_type(self, chunk: str, current_type: str) -> tuple[str, str]:
         return current_type, chunk
         
    def process(
        self, 
        user_input: str,
        chat_context: Optional[List[Dict[str, str]]] = None,
        auto_execute: bool = False,
        max_iterations: int = 10,
        abort_signal: Optional[Any] = None,
        profile_context: str = "",
        memory_context: str = ""
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Process the user input through the autonomous loop.
        Processa a entrada do usuário através do loop autônomo.
        """
        iteration = 0
        history = list(chat_context) if chat_context else []
        
        # Inject Dynamic Context (CWD)
        # Injetar Contexto Dinâmico (CWD)
        system_context = f"Current Working Directory: {self.cwd}\nSystem: Linux (HexStrike-AI)"
        
        
        # Inject MCP Tools Context
        # Injetar Contexto de Ferramentas MCP
        try:
             tools = self.mcp_manager.get_all_tools_sync()
             if tools:
                 tools_desc = "\n\nAvailable MCP Tools (Use ```tool_call JSON block):\n"
                 for tool in tools:
                     tools_desc += f"- {tool.get('name')}: {tool.get('description', 'No desc')} (Args: {json.dumps(tool.get('inputSchema', {}).get('properties', {}).keys() if tool.get('inputSchema') else 'unknown')})\n"
                 system_context += tools_desc
        except Exception as e:
             logger.warning(f"Failed to load tools for prompt: {e}")

        # Inject Profile Context
        # Injetar Contexto de Perfil
        if profile_context:
            system_context += f"\n\n--- User Profile ---\n{profile_context}"

        # Inject Memory Context (RAG)
        # Injetar Contexto de Memória
        if memory_context:
            system_context += f"\n\n--- Relevant Memory (RAG) ---\n{memory_context}"

        history.append({
            "role": "system", 
            "content": system_context
        })
        
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
            current_stream_type = "text" # Internal state from buffer
            active_block_type = "narrative" # What the frontend thinks is open
            self.stream_buffer = "" 
            
            try:
                for chunk in self.provider.chat_step(prompt=None, chat_context=history):
                    if abort_signal and abort_signal.is_set(): break
                    
                    full_response += chunk
                    
                    # Process Buffer
                    new_stream_type, content_to_yield, self.stream_buffer = self._process_stream_buffer(chunk, current_stream_type)
                    current_stream_type = new_stream_type # update internal state
                    
                    if not content_to_yield:
                        continue

                    # Determine target block type
                    # "text" -> "narrative" for frontend consistency
                    target_block_type = "thinking" if new_stream_type == "thinking" else "narrative"

                    # Check for State Transition
                    if target_block_type != active_block_type:
                        # Close current block
                        yield LifecycleBlock("block_end", active_block_type).to_dict()
                        
                        # Open new block
                        yield LifecycleBlock("block_start", target_block_type, {"iteration": iteration}).to_dict()
                        
                        active_block_type = target_block_type

                    # Yield Content
                    if target_block_type == "thinking":
                         yield ThinkingBlock(content_to_yield, iteration).to_dict()
                    else:
                        yield TextBlock(content_to_yield, iteration).to_dict()
                
                # Handling remaining buffer
                if self.stream_buffer:
                    # Logic to flush buffer (usually text if it was incomplete tag, or thinking if inside tag?)
                    # If we were in thinking, buffer is thinking.
                    # _process_stream_buffer handles this mostly, returning buffer only if incomplete tag
                    
                    # If there is remainder, likely text or partial tag.
                    # We default to current active block type.
                    
                    if active_block_type == "thinking":
                         yield ThinkingBlock(self.stream_buffer, iteration).to_dict()
                    else:
                         yield TextBlock(self.stream_buffer, iteration).to_dict()

            except Exception as e:
                logger.error(f"AI Error: {e}")
                yield ErrorBlock(f"AI Provider Error: {str(e)}").to_dict()
                yield LifecycleBlock("block_end", "narrative", {"status": "error"}).to_dict() # Fallback close
                break
            
            history.append({"role": "assistant", "content": full_response})
            
            # Notify: Block End (whatever is active)
            yield LifecycleBlock("block_end", active_block_type).to_dict()

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
                        # Context Awareness: Prepend CWD
                        # Consciência de Contexto: Preceder CWD
                        
                        # Check for CD command (naive implementation)
                        if cmd.strip().startswith("cd "):
                            target_dir = cmd.strip().split(" ", 1)[1]
                            # Resolve path
                            new_path = os.path.abspath(os.path.join(self.cwd, target_dir))
                            if os.path.exists(new_path) and os.path.isdir(new_path):
                                self.cwd = new_path
                                logger.info(f"Context switched to: {self.cwd}")
                                yield ResultBlock(f"Changed directory to {self.cwd}", True, 0, cmd).to_dict()
                                continue
                            else:
                                yield ResultBlock(f"cd: {target_dir}: No such file or directory", False, 1, cmd).to_dict()
                                continue
                        
                        # Execute in CWD
                        full_cmd = f"cd {self.cwd} && {cmd}"
                        # We execute full_cmd but report cmd for clean UI? 
                        # Ideally UI shows context. For now, backend handles it transparently.
                        
                        result = self.executor.execute_command(full_cmd)
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
        """
        Extract bash commands and Tool Calls.
        Extrair comandos bash e chamadas de ferramenta.
        """
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
        """
        Handle execution of MCP Tool Calls.
        Lidar com execução de Chamadas de Ferramenta MCP.
        """
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
