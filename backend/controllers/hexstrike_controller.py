"""
HexStrike Controller
Controlador HexStrike

Handles HexStrike Agent configuration and lifecycle.
Gerencia configuração e ciclo de vida do Agente HexStrike.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from core.base_controller import BaseController
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
                if self.manager.start():
                    # Wait and check
                    time.sleep(2)
                    status = self.manager.check_health()
                    return self.success_response(data=status, message="HexStrike started")
                return self.error_response("Failed to start process", 500)
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
                
        @self.blueprint.route('/status', methods=['GET'])
        def get_status():
            try:
                status = self.manager.check_health()
                return self.success_response(data=status)
            except Exception as e:
                return self.error_response(str(e), 500)

        # TOOLS / FERRAMENTAS
        @self.blueprint.route('/tools', methods=['GET'])
        def list_tools():
            try:
                self.log_request('GET /hexstrike/tools')
                if not self.core or not self.core.hexstrike:
                     return self.error_response("Agent Core not ready", 503)
                
                tools = self.core.hexstrike.list_tools()
                return self.success_response(data=tools)
            except Exception as e:
                self.log_error('GET /hexstrike/tools', e)
                return self.error_response(str(e), 500)
