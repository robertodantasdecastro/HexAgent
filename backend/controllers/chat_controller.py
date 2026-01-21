"""
Chat Controller - Handles AI chat and completion endpoints
Controlador de Chat - Gerencia endpoints de chat e completions de IA

Provides endpoints for AI-powered chat interactions with AgentCore integration.
Fornece endpoints para interações de chat com IA com integração AgentCore.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (AgentCore Integration)
"""

from core.base_controller import BaseController
from flask import request, Response
import json
import os


class ChatController(BaseController):
    """
    Controller for AI chat and completion operations with AgentCore
    Controlador para operações de chat e completion de IA com AgentCore
    
    Handles:
    - AI chat conversations with command execution / Conversas de chat com IA e execução de comandos
    - Code completions / Completions de código
    - Streaming Server-Sent Events responses / Respostas Server-Sent Events com streaming
    - Iterative AI → Command loops / Loops iterativos IA → Comando
    """
    
    def __init__(self, core_ref=None):
        """
        Initialize chat controller
        Inicializa controlador de chat
        
        Args:
            core_ref: Reference to AgentCore instance (HexBrain + HexStrike)
                     Referência à instância AgentCore (HexBrain + HexStrike)
        """
        self.core_ref = core_ref
        super().__init__(
            name='chat',
            import_name=__name__,
            url_prefix=''  # Root level endpoints / Endpoints no nível raiz
        )
    
    def _register_routes(self):
        """Register all chat routes / Registra todas as rotas de chat"""
        
        # ============================================================================
        # CHAT - Main AI chat endpoint with AgentCore integration
        # Chat - Endpoint principal de chat com IA e integração AgentCore
        # ============================================================================
        
        @self.blueprint.route('/chat', methods=['POST'])
        def process_chat():
            """
            Process AI chat request with AgentCore
            Processa requisição de chat com IA usando AgentCore
            
            Request body / Corpo da requisição:
            {
                "prompt": str,              # User message / Mensagem do usuário
                "context": [                # Optional conversation context / Contexto opcional
                    {"role": "user"|"assistant", "content": str}
                ],
                "stream": bool,             # Enable SSE streaming (default: True)
                "options": {
                    "auto_execute": bool,   # Auto-execute proposed commands / Auto-executar comandos propostos
                    "max_iterations": int   # Max AI→Command iterations / Máx iterações IA→Comando
                }
            }
            
            Response (SSE stream) / Resposta (stream SSE):
                data: {"type": "text", "content": str, "metadata": {...}}
                data: {"type": "command_proposal", "content": str, "metadata": {...}}
                data: {"type": "command_result", "content": str, "metadata": {...}}
                data: {"type": "complete", "content": "", "metadata": {...}}
            
            Returns:
                SSE stream with AI responses and command execution results
                Stream SSE com respostas da IA e resultados de execução de comandos
            """
            try:
                self.log_request('POST /chat')
                
                # Get request data / Obtém dados da requisição
                data = self.get_request_data()
                prompt = data.get('prompt', '')
                context = data.get('context', [])
                stream_enabled = data.get('stream', True)
                options = data.get('options', {})
                
                # Extract options / Extrai opções
                auto_execute = options.get('auto_execute', False)
                max_iterations = options.get('max_iterations', 10)
                
                # Validate input / Valida entrada
                if not prompt:
                    return self.error_response("Prompt cannot be empty / Prompt não pode estar vazio", 400)
                
                # Use AgentCore if available / Usa AgentCore se disponível
                if self.core_ref:
                    self.logger.info(f"Processing with AgentCore (auto_exec={auto_execute}, max_iter={max_iterations})")
                    
                    # Add context to AI brain if provided
                    # Adiciona contexto ao cérebro IA se fornecido
                    if context and isinstance(context, list):
                        for msg in context[-5:]:  # Last 5 messages / Últimas 5 mensagens
                            if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                                self.core_ref.brain.add_context(msg['role'], msg['content'])
                    
                    # Define SSE generator function
                    # Define função geradora SSE
                    def generate_sse():
                        """
                        Generate Server-Sent Events stream from AgentCore
                        Gera stream Server-Sent Events do AgentCore
                        """
                        try:
                            for chunk in self.core_ref.process_message(
                                user_input=prompt,
                                auto_execute=auto_execute,
                                max_iterations=max_iterations,
                                stream=stream_enabled
                            ):
                                # Yield SSE formatted data
                                # Retorna dados formatados SSE
                                yield f"data: {json.dumps(chunk)}\\n\\n"
                                
                        except Exception as e:
                            self.logger.error(f"AgentCore processing error: {e}", exc_info=True)
                            error_chunk = {
                                "type": "error",
                                "content": f"Processing error: {str(e)}",
                                "metadata": {"error_type": type(e).__name__}
                            }
                            yield f"data: {json.dumps(error_chunk)}\\n\\n"
                    
                    # Return SSE stream response
                    # Retorna resposta de stream SSE
                    return Response(
                        generate_sse(),
                        mimetype='text/event-stream',
                        headers={
                            'Cache-Control': 'no-cache',
                            'X-Accel-Buffering': 'no',  # Disable nginx buffering / Desabilita buffering nginx
                            'Connection': 'keep-alive'
                        }
                    )
                
                else:
                    # Fallback: Simple OpenRouter mode without AgentCore
                    # Fallback: Modo OpenRouter simples sem AgentCore
                    self.logger.warning("AgentCore not available, using simple fallback mode")
                    
                    # Load API Key from Service (Single Source of Truth)
                    from services.ai_config_service import AIConfigService
                    ai_service = AIConfigService()
                    ai_config_full = ai_service.load_ai_config()
                    
                    # 1. Config File
                    api_key = ai_config_full.get('ai', {}).get('api_key')
                    
                    # 2. Env Var Override
                    if not api_key:
                        api_key = os.getenv('OPENROUTER_API_KEY') or os.getenv('API_KEY')
                    
                    if not api_key:
                        # Standalone mode message / Mensagem modo standalone
                        return self.success_response(
                            data={
                                "response": (
                                    "⚠️ AI features are currently disabled.\\n\\n"
                                    "To enable AI chat:\\n"
                                    "1. Set OPENROUTER_API_KEY environment variable\\n"
                                    "2. Or configure API key in Settings\\n"
                                    "3. Restart the application\\n\\n"
                                    "Get your API key at: https://openrouter.ai/keys"
                                ),
                                "standalone": True,
                                "iterations": 0
                            }
                        )
                    
                    # Simple OpenRouter call for fallback
                    # Chamada simples OpenRouter para fallback
                    try:
                        import requests
                        
                        # Build messages / Constrói mensagens
                        messages = []
                        if context and isinstance(context, list):
                            for msg in context[-5:]:
                                if isinstance(msg, dict) and 'role' in msg and 'content' in msg:
                                    messages.append({'role': msg['role'], 'content': msg['content']})
                        
                        messages.append({'role': 'user', 'content': prompt})
                        
                        # Call API / Chama API
                        response = requests.post(
                            'https://openrouter.ai/api/v1/chat/completions',
                            headers={
                                'Authorization': f'Bearer {api_key}',
                                'HTTP-Referer': 'https://github.com/HexAgentGUI',
                                'X-Title': 'HexAgentGUI',
                                'Content-Type': 'application/json'
                            },
                            json={
                                'model': 'google/gemini-2.0-flash-exp:free',
                                'messages': messages,
                                'stream': False
                            },
                            timeout=30
                        )
                        
                        if response.status_code != 200:
                            return self.error_response(f"AI service error: {response.status_code}", 500)
                        
                        result = response.json()
                        
                        if 'choices' in result and len(result['choices']) > 0:
                            ai_response = result['choices'][0]['message']['content']
                            return self.success_response(
                                data={
                                    "response": ai_response,
                                    "iterations": 1,
                                    "model": result.get('model', 'unknown')
                                },
                                message="Chat processed successfully"
                            )
                        else:
                            return self.error_response("Invalid API response format", 500)
                    
                    except requests.exceptions.Timeout:
                        return self.error_response("AI service timeout", 504)
                    except Exception as e:
                        self.logger.error(f"Fallback API error: {e}")
                        return self.error_response(f"AI processing failed: {str(e)}", 500)
                
            except Exception as e:
                self.log_error('POST /chat', e)
                return self.error_response("Chat processing failed / Processamento de chat falhou", 500)
        
        # ============================================================================
        # EXECUTE - Manual Command Execution
        # Executar - Execução Manual de Comandos
        # ============================================================================
        
        @self.blueprint.route('/execute', methods=['POST'])
        def manual_execute():
            """
            Manually execute a command via ActionDispatcher
            Executa manualmente um comando via ActionDispatcher
            """
            try:
                self.log_request('POST /execute')
                data = self.get_request_data()
                command = data.get('command')
                
                if not command:
                    return self.error_response("Command is required", 400)
                
                if not self.core_ref:
                    return self.error_response("AgentCore not initialized", 503)
                
                # Use Dispatcher!
                result = self.core_ref.dispatcher.dispatch('execute_command', {'command': command})
                
                # Format response to match frontend expectation (useChatManager.js)
                # Formatar resposta para corresponder à expectativa do frontend
                response_data = {
                    "success": result.get('success', False),
                    "output": result.get('stdout', '') + result.get('stderr', ''),
                    "exit_code": result.get('exit_code', 1)
                }
                
                return self.success_response(data=response_data)
                
            except Exception as e:
                self.log_error('POST /execute', e)
                return self.error_response(f"Execution failed: {str(e)}", 500)
        
        # ============================================================================
        # COMPLETE - Code completion endpoint
        # Complete - Endpoint de completion de código
        # ============================================================================
        
        @self.blueprint.route('/complete', methods=['POST'])
        def code_completion():
            """
            Generate code completion suggestions
            Gera sugestões de completion de código
            
            Request body / Corpo da requisição:
            {
                "code": str,        # Partial code / Código parcial
                "language": str,    # Programming language / Linguagem de programação
                "cursor_position": int  # Optional cursor position / Posição do cursor (opcional)
            }
            
            Returns:
                Completion suggestions / Sugestões de completion
            """
            try:
                self.log_request('POST /complete')
                
                # Get request data / Obtém dados da requisição
                data = self.get_request_data()
                code = data.get('code', '')
                language = data.get('language', 'python')
                cursor_position = data.get('cursor_position')
                
                # Check if AgentCore is available
                # Verifica se AgentCore está disponível
                if not self.core_ref:
                    return self.error_response(
                        "AI features not available in standalone mode / "
                        "Recursos de IA não disponíveis em modo standalone",
                        503
                    )
                
                # TODO: Implement actual completion using AgentCore
                # TODO: Implementar completion real usando AgentCore
                self.logger.info(f"Code completion request for {language} ({len(code)} chars)")
                
                # Placeholder response / Resposta placeholder
                return self.success_response(
                    data={
                        "completions": [],
                        "language": language,
                        "ready": False
                    },
                    message="Completion endpoint ready for implementation / Endpoint de completion pronto para implementação"
                )
                
            except Exception as e:
                self.log_error('POST /complete', e)
                return self.error_response("Completion failed / Completion falhou", 500)
