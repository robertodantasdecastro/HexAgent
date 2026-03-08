"""
Chat Controller - AI Interaction Endpoints
Controlador de Chat - Endpoints de Interação com IA

Acts as an HTTP Adapter/Facade for the AgentCore.
Atua como um Adaptador/Facade HTTP para o AgentCore.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 3.0.0 (Strict OOP & Bilingual)
"""

from controllers.base_controller import BaseController
from flask import request, Response
import json
import threading
from typing import Generator, Dict, Any

class ChatController(BaseController):
    """
    Controller for AI chat and completion operations.
    Controlador para operações de chat e completion de IA.
    
    Responsibilities / Responsabilidades:
    - HTTP Request Validation / Validação de Requisição HTTP
    - SSE Stream Formatting / Formatação de Stream SSE
    - AgentCore Delegation / Delegação para AgentCore
    """
    
    def __init__(self, core_ref=None):
        """
        Initialize chat controller.
        Inicializa controlador de chat.
        
        Args:
            core_ref: Reference to AgentCore instance (Business Logic Layer)
                      Referência à instância AgentCore (Camada de Lógica de Negócio)
        """
        self.core_ref = core_ref
        
        # Event for abort control
        # Evento para controle de aborto
        self.abort_event = threading.Event()
        
        super().__init__(
            name='chat',
            import_name=__name__,
            url_prefix=''
        )
    
    def _register_routes(self):
        """
        Register API routes.
        Registra rotas da API.
        """
        self.blueprint.add_url_rule('/chat/abort', view_func=self.abort_chat, methods=['POST'])
        self.blueprint.add_url_rule('/chat', view_func=self.process_chat, methods=['POST'])
        self.blueprint.add_url_rule('/execute', view_func=self.manual_execute, methods=['POST'])
        self.blueprint.add_url_rule('/complete', view_func=self.code_completion, methods=['POST'])
        self.blueprint.add_url_rule('/plan', view_func=self.plan_task, methods=['POST'])
        self.blueprint.add_url_rule('/optimize', view_func=self.optimize_command, methods=['POST'])
        self.blueprint.add_url_rule('/execute_and_analyze', view_func=self.execute_and_analyze, methods=['POST'])
        self.blueprint.add_url_rule('/chat/lint', view_func=self.lint_command, methods=['POST'])

    def abort_chat(self):
        """
        Endpoint: POST /chat/abort
        Signals the Orchestrator to stop the current generation.
        Sinaliza ao Orquestrador para parar a geração atual.
        """
        try:
            self.log_request('POST /chat/abort')
            
            self.abort_event.set()
            self.logger.warning("Abort signal set for AgentCore")
            
            return self.success_response(message="Abort signal sent processing stopped")
            
        except Exception as e:
            self.log_error('POST /chat/abort', e)
            return self.error_response(f"Abort failed: {str(e)}", 500)

    def lint_command(self):
        """
        Endpoint: POST /chat/lint
        Analisa o input e devolve uma sugestão do Co-Pilot de forma rápida.
        """
        try:
            # Não faz log pesado para não poluir
            data = self.get_request_data()
            command = data.get('command', '')
            cwd = data.get('cwd', '~/')
            
            if not getattr(self.core_ref, 'linter', None):
                return self.error_response("Linter motor is offline", 503)
                
            result = self.core_ref.linter.lint_command(command, cwd)
            return self.success_response(data=result)
        except Exception as e:
            self.logger.error(f"Linting endpoint failed: {e}")
            return self.error_response("Internal lint sequence failure", 500)

    def process_chat(self):
        """
        Endpoint: POST /chat
        Main entry point for AI Interaction.
        Ponto de entrada principal para Interação com IA.
        """
        try:
            self.log_request('POST /chat')
            
            # 1. Data Extraction / Extração de Dados
            data = self.get_request_data()
            prompt = data.get('prompt', '')
            context = data.get('context', [])
            stream_enabled = data.get('stream', True)
            options = data.get('options', {})
            
            auto_execute = options.get('auto_execute', False)
            max_iterations = options.get('max_iterations', 10)
            
            # 2. Validation / Validação
            if not self.core_ref:
                return self.error_response("AgentCore not initialized", 503)
                
            if not prompt:
                return self.error_response("Prompt cannot be empty / Prompt não pode estar vazio", 400)
            
            # 3. State Reset / Reset de Estado
            self.abort_event.clear()
            
            self.logger.info(f"Delegating to AgentCore [AutoExec={auto_execute}, Stream={stream_enabled}]")

            # 4. Processing / Processamento
            if stream_enabled:
                return Response(
                    self._generate_sse_stream(prompt, context, auto_execute, max_iterations),
                    mimetype='text/event-stream',
                    headers={
                        'Cache-Control': 'no-cache',
                        'X-Accel-Buffering': 'no',
                        'Connection': 'keep-alive'
                    }
                )
            else:
                return self._process_sync(prompt, context, auto_execute, max_iterations)
                
        except Exception as e:
            self.log_error('POST /chat', e)
            return self.error_response("Chat processing failed", 500)

    def _generate_sse_stream(self, prompt, context, auto_execute, max_iterations) -> Generator[str, None, None]:
        """
        Helper: Formats AgentCore output as SSE.
        Auxiliar: Formata saída do AgentCore como SSE.
        """
        try:
            iterator = self.core_ref.process_message(
                user_input=prompt,
                chat_context=context,
                auto_execute=auto_execute,
                max_iterations=max_iterations,
                stream=True,
                abort_signal=self.abort_event
            )
            
            for chunk in iterator:
                yield f"data: {json.dumps(chunk)}\n\n"
                
        except Exception as e:
            self.logger.error(f"SSE Generation Error: {e}", exc_info=True)
            error_chunk = {
                "type": "error",
                "content": str(e),
                "metadata": {"source": "ChatController"}
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"

    def _process_sync(self, prompt, context, auto_execute, max_iterations):
        """
        Helper: Processes chat synchronously (Block & Wait).
        Auxiliar: Processa chat de forma síncrona (Bloqueia & Aguarda).
        """
        full_content = ""
        final_meta = {}
        
        try:
            iterator = self.core_ref.process_message(
                user_input=prompt,
                chat_context=context,
                auto_execute=auto_execute,
                max_iterations=max_iterations,
                stream=False,
                abort_signal=self.abort_event
            )
            
            for chunk in iterator:
                if chunk.get("type") == "text":
                    full_content += chunk.get("content", "")
                final_meta.update(chunk.get("metadata", {}))
                
            return self.success_response(data={
                "response": full_content,
                "metadata": final_meta
            })
            
        except Exception as e:
            self.logger.error(f"Sync Processing Error: {e}")
            return self.error_response(str(e), 500)

    def manual_execute(self):
        """
        Endpoint: POST /execute
        Direct command execution via AgentCore.
        Execução direta de comando via AgentCore.
        """
        try:
            self.log_request('POST /execute')
            data = self.get_request_data()
            command = data.get('command')
            
            if not command:
                return self.error_response("Command required", 400)
                
            if not self.core_ref:
                return self.error_response("AgentCore not initialized", 503)
            
            # Dispatch to Core / Despachar para Core
            result = self.core_ref.dispatcher.dispatch('execute_command', {'command': command})
            
            return self.success_response(data={
                "success": result.get('success', False),
                "output": result.get('stdout', '') + result.get('stderr', ''),
                "exit_code": result.get('exit_code', 1),
                "cwd": result.get('cwd', '')
            })
            
        except Exception as e:
            self.log_error('POST /execute', e)
            return self.error_response(f"Execution failed: {str(e)}", 500)

    def code_completion(self):
        """
        Endpoint: POST /complete
        Request code completion from AI.
        Solicita completion de código da IA.
        """
        try:
            self.log_request('POST /complete')
            data = self.get_request_data()
            
            if not self.core_ref:
                return self.error_response("AgentCore unavailable", 503)
                
            suggestions = self.core_ref.complete_code(
                code_context=data.get('code', ''),
                language=data.get('language', 'python')
            )
            
            return self.success_response(data={
                "completions": suggestions,
                "ready": True
            })
            
        except Exception as e:
            self.log_error('POST /complete', e)
            return self.error_response("Completion failed", 500)

    def plan_task(self):
        """
        Endpoint: POST /plan
        Get tool suggestions for a task.
        Obter sugestões de ferramentas para uma tarefa.
        """
        try:
            self.log_request('POST /plan')
            data = self.get_request_data()
            query = data.get('query')
            
            if not query:
                return self.error_response("Query required", 400)
                
            if not self.core_ref:
                return self.error_response("AgentCore unavailable", 503)
                
            result = self.core_ref.plan_task(query)
            return self.success_response(data=result)
            
        except Exception as e:
            self.log_error('POST /plan', e)
            return self.error_response("Planning failed", 500)

    def optimize_command(self):
        """
        Endpoint: POST /optimize
        Optimize tool parameters.
        Otimizar parâmetros de ferramenta.
        """
        try:
            self.log_request('POST /optimize')
            data = self.get_request_data()
            
            if not self.core_ref:
                return self.error_response("AgentCore unavailable", 503)
                
            result = self.core_ref.optimize_command(
                tool=data.get('tool', ''),
                target=data.get('target', '')
            )
            return self.success_response(data=result)
            
        except Exception as e:
            self.log_error('POST /optimize', e)
            return self.error_response("Optimization failed", 500)

    def execute_and_analyze(self):
        """
        Endpoint: POST /execute_and_analyze
        Executes a command and immediately triggers AI analysis of the result.
        Executa um comando e aciona imediatamente a análise de IA do resultado.
        """
        try:
            self.log_request('POST /execute_and_analyze')
            data = self.get_request_data()
            command = data.get('command')
            context = data.get('context', [])
            options = data.get('options', {})
            
            # Default to False for safety, unless explicitly enabled
            auto_execute = options.get('auto_execute', False)
            max_iterations = options.get('max_iterations', 10)
            
            if not command:
                return self.error_response("Command required", 400)
                
            if not self.core_ref:
                return self.error_response("AgentCore not initialized", 503)
            
            import json
            
            # 1. Execute Command / Executar Comando
            if command.startswith("MCP_TOOL_CALL|"):
                try:
                    tool_json = command.split("|", 1)[1]
                    tool_data = json.loads(tool_json)
                    tool_name = tool_data.get("name")
                    tool_args = tool_data.get("arguments", {})
                    
                    client = self.core_ref.orchestrator.hex_strike_client
                    if tool_name == "hexstrike_run_tool" and client:
                        result = client.execute_tool(tool_args.get("tool_name"), tool_args.get("parameters", {}))
                    elif tool_name == "hexstrike_run_bugbounty_workflow" and client:
                        result = client.run_bugbounty_workflow(tool_args.get("workflow_id"), tool_args.get("data", {}))
                    else:
                        result = self.core_ref.orchestrator.mcp_manager.call_tool_sync(tool_name, tool_args)
                        
                    output = json.dumps(result, indent=2) if not isinstance(result, str) else result
                    is_success = result.get("success", True) if isinstance(result, dict) else True
                    
                    exec_result = {
                        "success": is_success,
                        "exit_code": 0 if is_success else 1,
                        "stdout": output,
                        "stderr": ""
                    }
                except Exception as e:
                    exec_result = {
                        "success": False,
                        "exit_code": 1,
                        "stdout": "",
                        "stderr": str(e)
                    }
            else:
                # Use executor directly to skip orchestrator loop for this step
                exec_result = self.core_ref.executor.execute_command(command)
            
            # 2. Prepare Context for AI / Preparar Contexto para IA
            # Format result as a clear system report for the AI
            status_icon = "✅" if exec_result.get('success') else "❌"
            output_content = (
                f"[System Report] Command Execution Result\n"
                f"Command: {command}\n"
                f"Status: {status_icon} (Exit Code: {exec_result.get('exit_code')})\n"
                f"Output:\n```\n{exec_result.get('stdout', '')}\n```\n"
                f"Error:\n```\n{exec_result.get('stderr', '')}\n```\n"
                f"Instruction: Analyze this output and proceed with the next step if applicable."
            )
            
            # Add to context so AI sees what happened and acts on it
            # Adicionar ao contexto para que a IA veja o que aconteceu e aja sobre isso
            context.append({"role": "user", "content": output_content})
            
            # 3. Stream AI Analysis / Stream de Análise de IA
            # We trigger the AI with a prompt to analyze
            # Using a generic prompt to encourage continuation
            analysis_prompt = "Analyze the command output above and determine the next action."
            
            self.logger.info(f"Triggering AI Analysis for command: {command} [AutoExec={auto_execute}]")
            
            # Helper to prepend the ResultBlock to the SSE stream
            def _stream_with_result():
                from .domain.response_block import ResultBlock
                # Yield the result block first so the UI can close the terminal module
                yield ResultBlock(
                    output=exec_result.get('stdout', '') + exec_result.get('stderr', ''),
                    success=exec_result.get('success', False),
                    exit_code=exec_result.get('exit_code', -1),
                    command=command
                ).to_sse()
                
                # Then yield the rest of the stream
                yield from self._generate_sse_stream(analysis_prompt, context, auto_execute=auto_execute, max_iterations=max_iterations)

            return Response(
                _stream_with_result(),
                mimetype='text/event-stream',
                 headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no',
                    'Connection': 'keep-alive'
                }
            )

        except Exception as e:
            self.log_error('POST /execute_and_analyze', e)
            return self.error_response(f"Execution/Analysis failed: {str(e)}", 500)
