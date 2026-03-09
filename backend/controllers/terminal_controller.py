"""
Terminal Controller - Real-time PTY Access
Controlador de Terminal - Acesso PTY em Tempo Real

Exposes PTY via HTTP/SSE for xterm.js integration.
Expõe PTY via HTTP/SSE para integração com xterm.js.

@author: HexAgent Dev
"""
from flask import Response, stream_with_context, request
from controllers.base_controller import BaseController
from services.pty_service import PTYService
import json

class TerminalController(BaseController):
    def __init__(self, core_ref=None):
        self.pty = PTYService()
        super().__init__(
            name='terminal',
            import_name=__name__,
            url_prefix='/terminal'
        )

    def _register_routes(self):
        self.blueprint.add_url_rule('/stream', view_func=self.stream_output, methods=['GET'])
        self.blueprint.add_url_rule('/input', view_func=self.write_input, methods=['POST'])
        self.blueprint.add_url_rule('/resize', view_func=self.resize, methods=['POST'])
        self.blueprint.add_url_rule('/lint', view_func=self.lint_command, methods=['POST'])

    def stream_output(self):
        """
        SSE Endpoint for Terminal Output.
        Endpoint SSE para Saída do Terminal.
        """
        def generate():
            for chunk in self.pty.read_generator():
                if chunk:
                    # Normal data / Dados normais
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
                else:
                    # Heartbeat (Empty string from service)
                    # Heartbeat (String vazia do serviço)
                    yield ": keepalive\n\n"
        
        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no', # Crucial for Nginx/Proxies
                'Connection': 'keep-alive'
            }
        )

    def write_input(self):
        """
        Write keystrokes to PTY.
        Escrever teclas no PTY.
        """
        try:
            data = self.get_request_data()
            input_data = data.get('data', '')
            
            if input_data:
                # [SEC] Sudo Mode Interception
                # If the string ends with \r (Enter stroke) AND starts with sudo 
                # we blindly inject the password pipeline to avoid manual prompt if active
                from services.security_service import security_service
                if security_service.is_elevated():
                    # Check if it is a complete command execution starting with sudo
                    # Requires matching full strings submitted, typically copy/pasted or generated commands
                    if input_data.strip().startswith("sudo ") and input_data.endswith("\r"):
                        payload = security_service.get_sudo_payload()
                        # Override "sudo command" with "echo pass | sudo -S command"
                        cmd_part = input_data.strip()[5:] # remove 'sudo '
                        input_data = f"{payload} {cmd_part}\r"

                self.pty.write(input_data)
                return self.success_response()
            else:
                return self.error_response("No data provided", 400)
        except Exception as e:
            self.log_error('POST /terminal/input', e)
            return self.error_response(str(e), 500)

    def resize(self):
        """
        Resize terminal.
        Redimensionar terminal.
        """
        try:
            data = self.get_request_data()
            cols = data.get('cols', 80)
            rows = data.get('rows', 24)
            
            self.pty.resize(cols, rows)
            return self.success_response()
        except Exception as e:
            self.log_error('POST /terminal/resize', e)
            return self.error_response(str(e), 500)

    def lint_command(self):
        """
        Passive linting of user command.
        """
        try:
            data = self.get_request_data()
            command = data.get('command', '')
            cwd = data.get('cwd', '/')
            
            if not command or len(command.strip()) < 3:
                return self.success_response({"valid": True, "suggestion": None, "reason": None})
                
            if not getattr(self, 'core_ref', None) or not getattr(self.core_ref, 'linter', None):
                return self.success_response({"valid": True, "suggestion": None, "reason": "Linter not initialized"})
                
            result = self.core_ref.linter.lint_command(command, cwd)
            return self.success_response(result)
        except Exception as e:
            self.log_error('POST /terminal/lint', e)
            return self.error_response(str(e), 500)
