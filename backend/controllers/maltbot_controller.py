"""
Maltbot Controller - Handles Maltbot lifecycle and interactions
Controlador Maltbot - Gerencia ciclo de vida e interações do Maltbot

@author: Roberto Dantas de Castro
"""

from core.base_controller import BaseController
from services.maltbot_manager import MaltbotManager

class MaltbotController(BaseController):
    """Controller for Maltbot operations / Controlador para operações do Maltbot"""
    
    def __init__(self, core_ref=None):
        # We might need core_ref later for AI interactions with the bot
        self.core = core_ref
        super().__init__(name='maltbot', import_name=__name__, url_prefix='/maltbot')
        
        # Initialize Manager and Config Service
        # Inicializa Gerenciador e Serviço de Configuração
        self.manager = MaltbotManager.get_instance()
        from services.moltbot_config_service import MoltbotConfigService
        self.config_service = MoltbotConfigService()
    
    def _register_routes(self):
        """Register maltbot routes / Registra rotas do maltbot"""
        
        # CONFIGURATION / CONFIGURAÇÃO
        @self.blueprint.route('/config', methods=['GET'])
        def get_config():
            try:
                self.log_request('GET /maltbot/config')
                config = self.config_service.load_config()
                return self.success_response(data=config)
            except Exception as e:
                self.log_error('GET /maltbot/config', e)
                return self.error_response("Failed load config", 500)

        @self.blueprint.route('/config', methods=['POST'])
        def save_config():
            try:
                self.log_request('POST /maltbot/config')
                data = self.validate_request(['config'])
                self.config_service.save_config(data['config'])
                return self.success_response(message="Maltbot config saved")
            except Exception as e:
                self.log_error('POST /maltbot/config', e)
                return self.error_response("Failed save config", 500)

        
        @self.blueprint.route('/start', methods=['POST'])
        def start_maltbot():
            """Start Maltbot service / Inicia serviço Maltbot"""
            try:
                result = self.manager.start()
                if result['status'] in ['started', 'already_running']:
                    return self.success_response(message="Maltbot started", data=result)
                else:
                    return self.error_response(f"Failed to start: {result.get('message')}", 500)
            except Exception as e:
                self.log_error('/start', e)
                return self.error_response(f"Maltbot start failed: {str(e)}", 500)
        
        @self.blueprint.route('/stop', methods=['POST'])
        def stop_maltbot():
            """Stop Maltbot service / Para serviço Maltbot"""
            try:
                result = self.manager.stop()
                if result['status'] == 'stopped':
                    return self.success_response(message="Maltbot stopped", data=result)
                else:
                    return self.error_response(f"Failed to stop: {result.get('message')}", 500)
            except Exception as e:
                self.log_error('/stop', e)
                return self.error_response(f"Maltbot stop failed: {str(e)}", 500)
        
        @self.blueprint.route('/status', methods=['GET'])
        def get_status():
            """Get Maltbot status / Status do Maltbot"""
            status = self.manager.status()
            return self.success_response(data=status)
