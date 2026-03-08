"""
HexStrike Controller
Controlador HexStrike

Handles HexStrike Agent configuration and lifecycle.
Gerencia configuração e ciclo de vida do Agente HexStrike.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from controllers.base_controller import BaseController
from services.hexstrike_config_service import HexStrikeConfigService
from services.hexstrike_manager import HexStrikeManager
import time

class HexStrikeController(BaseController):
    """
    Controller for HexStrike operations
    Controlador para operações HexStrike
    """
    
    def __init__(self, core_ref=None):
        self.config_service = HexStrikeConfigService()
        self.manager = HexStrikeManager()
        self.core = core_ref
        super().__init__(
            name='hexstrike',
            import_name=__name__,
            url_prefix='/hexstrike'
        )
    
    def _register_routes(self):
        
        # CONFIGURATION / CONFIGURAÇÃO
        @self.blueprint.route('/config', methods=['GET'])
        def get_config():
            try:
                self.log_request('GET /hexstrike/config')
                config = self.config_service.load_config()
                return self.success_response(data=config)
            except Exception as e:
                self.log_error('GET /hexstrike/config', e)
                return self.error_response("Failed load config", 500)

        @self.blueprint.route('/config', methods=['POST'])
        def save_config():
            try:
                self.log_request('POST /hexstrike/config')
                data = self.validate_request(['config'])
                self.config_service.save_config(data['config'])
                return self.success_response(message="HexStrike config saved")
            except Exception as e:
                self.log_error('POST /hexstrike/config', e)
                return self.error_response("Failed save config", 500)

        # LIFECYCLE / CICLO DE VIDA
        @self.blueprint.route('/start', methods=['POST'])
        def start_service():
            try:
                self.log_request('POST /hexstrike/start')
                success, msg = self.manager.start()
                if success:
                    time.sleep(2)
                    status = self.manager.get_status()
                    return self.success_response(data=status, message=msg)
                return self.error_response(msg, 500)
            except Exception as e:
                return self.error_response(str(e), 500)

        @self.blueprint.route('/stop', methods=['POST'])
        def stop_service():
            try:
                self.log_request('POST /hexstrike/stop')
                self.manager.stop()
                return self.success_response(message="HexStrike stopped")
            except Exception as e:
                return self.error_response(str(e), 500)

        @self.blueprint.route('/restart', methods=['POST'])
        def restart_service():
            try:
                self.log_request('POST /hexstrike/restart')
                self.manager.stop()
                time.sleep(1)
                success, msg = self.manager.start()
                if success:
                    time.sleep(2)
                    status = self.manager.get_status()
                    return self.success_response(data=status, message="HexStrike restarted")
                return self.error_response(msg, 500)
            except Exception as e:
                return self.error_response(str(e), 500)
                
        @self.blueprint.route('/status', methods=['GET'])
        def get_status():
            try:
                status = self.manager.get_status()
                return self.success_response(data=status)
            except Exception as e:
                return self.error_response(str(e), 500)

        @self.blueprint.route('/logs/stream', methods=['GET'])
        def stream_logs():
            from flask import Response
            import os
            import time
            
            def generate():
                log_file = self.manager.log_file
                
                wait_count = 0
                while not os.path.exists(log_file) and wait_count < 10:
                    time.sleep(1)
                    wait_count += 1
                
                if not os.path.exists(log_file):
                    yield "data: Log file not found yet.\n\n"
                    return
                
                try:
                    with open(log_file, 'r', encoding='utf-8', errors='replace') as f:
                        f.seek(0, os.SEEK_END)
                        size = f.tell()
                        if size > 4096:
                             f.seek(size - 4096)
                        
                        while True:
                            where = f.tell()
                            line = f.readline()
                            if not line:
                                time.sleep(0.5)
                                f.seek(where)
                            else:
                                # Convert newlines safely for SSE format
                                content = line.replace('\n', '')
                                yield f"data: {content}\n\n"
                except GeneratorExit:
                    pass
                except Exception as e:
                    yield f"data: Error: {str(e)}\n\n"

            return Response(generate(), mimetype='text/event-stream')

        # TOOLS / FERRAMENTAS
        @self.blueprint.route('/tools', methods=['GET'])
        def list_tools():
            try:
                self.log_request('GET /hexstrike/tools')
                if not self.core or not self.core.hexstrike:
                     return self.error_response("Agent Core not ready", 503)
                
                tools = self.core.hexstrike.list_tools()
                if isinstance(tools, dict) and tools.get("success") is False:
                     return self.error_response(tools.get("error", "Unknown error listing tools"), 500)
                     
                return self.success_response(data=tools)
            except Exception as e:
                self.log_error('GET /hexstrike/tools', e)
                return self.error_response(str(e), 500)

        from flask import request

        @self.blueprint.route('/tools/<tool_name>/run', methods=['POST'])
        def run_tool(tool_name):
            try:
                self.log_request(f'POST /hexstrike/tools/{tool_name}/run')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                data = request.get_json(silent=True) or {}
                result = self.core.hexstrike.execute_tool(tool_name, data)
                return self.success_response(data=result)
            except Exception as e:
                self.log_error(f'POST /hexstrike/tools/{tool_name}/run', e)
                return self.error_response(str(e), 500)

        @self.blueprint.route('/tools/<tool_name>/schema', methods=['GET'])
        def get_tool_schema(tool_name):
            try:
                self.log_request(f'GET /hexstrike/tools/{tool_name}/schema')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                result = self.core.hexstrike.get_tool_schema(tool_name)
                return self.success_response(data=result)
            except Exception as e:
                self.log_error(f'GET /hexstrike/tools/{tool_name}/schema', e)
                return self.error_response(str(e), 500)

        # BUG BOUNTY WORKFLOWS
        @self.blueprint.route('/bugbounty/<workflow_id>', methods=['POST'])
        def run_bugbounty(workflow_id):
            try:
                self.log_request(f'POST /hexstrike/bugbounty/{workflow_id}')
                if not self.core or not self.core.hexstrike:
                    return self.error_response("Agent Core not ready", 503)
                
                data = request.get_json(silent=True) or {}
                if 'target' not in data:
                    return self.error_response("Target parameter is required", 400)
                    
                result = self.core.hexstrike.run_bugbounty_workflow(workflow_id, data)
                
                # Check for explicit failure from client
                if isinstance(result, dict) and result.get("success") is False:
                     return self.error_response(result.get("error", "Unknown workflow error"), 500)
                     
                return self.success_response(data=result)
            except Exception as e:
                self.log_error(f'POST /hexstrike/bugbounty/{workflow_id}', e)
                return self.error_response(str(e), 500)

        # PROCESSES
        @self.blueprint.route('/processes', methods=['GET'])
        def list_processes():
            try:
                self.log_request('GET /hexstrike/processes')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                result = self.core.hexstrike.list_processes()
                return self.success_response(data=result)
            except Exception as e:
                return self.error_response(str(e), 500)

        @self.blueprint.route('/processes/<int:pid>/terminate', methods=['POST'])
        def terminate_process(pid):
            try:
                self.log_request(f'POST /hexstrike/processes/{pid}/terminate')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                result = self.core.hexstrike.terminate_process(pid)
                return self.success_response(data=result)
            except Exception as e:
                return self.error_response(str(e), 500)

        @self.blueprint.route('/processes/<int:pid>/pause', methods=['POST'])
        def pause_process(pid):
            try:
                self.log_request(f'POST /hexstrike/processes/{pid}/pause')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                result = self.core.hexstrike.pause_process(pid)
                return self.success_response(data=result)
            except Exception as e:
                return self.error_response(str(e), 500)

        @self.blueprint.route('/processes/<int:pid>/resume', methods=['POST'])
        def resume_process_api(pid):
            try:
                self.log_request(f'POST /hexstrike/processes/{pid}/resume')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                result = self.core.hexstrike.resume_process(pid)
                return self.success_response(data=result)
            except Exception as e:
                return self.error_response(str(e), 500)

        # CTF
        @self.blueprint.route('/ctf/<workflow_type>', methods=['POST'])
        def run_ctf(workflow_type):
            try:
                self.log_request(f'POST /hexstrike/ctf/{workflow_type}')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                data = request.get_json(silent=True) or {}
                result = self.core.hexstrike.run_ctf_workflow(workflow_type, data)
                return self.success_response(data=result)
            except Exception as e:
                return self.error_response(str(e), 500)

        # VULN INTEL
        @self.blueprint.route('/vuln-intel/cves', methods=['GET'])
        def get_vuln_cves():
            try:
                self.log_request('GET /hexstrike/vuln-intel/cves')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                target = request.args.get('target', '')
                result = self.core.hexstrike.monitor_cve(target)
                return self.success_response(data=result)
            except Exception as e:
                return self.error_response(str(e), 500)

        # VISUAL
        @self.blueprint.route('/visual/card', methods=['POST'])
        def get_visual_card():
            try:
                self.log_request('POST /hexstrike/visual/card')
                if not self.core or not self.core.hexstrike: return self.error_response("Agent Core not ready", 503)
                data = request.get_json(silent=True) or {}
                result = self.core.hexstrike.get_vulnerability_card(data)
                return self.success_response(data=result)
            except Exception as e:
                return self.error_response(str(e), 500)
