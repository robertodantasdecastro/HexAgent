"""
Service Controller - Handles service control endpoints
Controlador de Serviço - Gerencia endpoints de controle de serviços

@author: Roberto Dantas de Castro
"""

from core.base_controller import BaseController
from services.hexstrike_manager import HexStrikeManager

class ServiceController(BaseController):
    """Controller for service operations / Controlador para operações de serviço"""
    
    def __init__(self, hexstrike_ref=None):
        self.hexstrike_client = hexstrike_ref # Reference to the API Client, not the Process Manager
        super().__init__(name='service', import_name=__name__, url_prefix='')
        
        # Initialize Manager / Inicializa Gerenciador
        self.manager = HexStrikeManager()
    
    def _register_routes(self):
        """Register service routes / Registra rotas de serviço"""
        
        @self.blueprint.route('/start_service', methods=['POST'])
        def start_service():
            """Start a service / Inicia um serviço"""
            try:
                data = self.get_request_data()
                service_name = data.get('service', 'hexstrike')
                
                if service_name != 'hexstrike':
                    return self.error_response(f"Unknown service: {service_name}", 404)
                
                success, message = self.manager.start()
                
                if success:
                    status = self.manager.get_status()['status']
                    return self.success_response(message=message, data={'status': status})
                else:
                    return self.error_response(f"Failed to start: {message}", 500)
                
            except Exception as e:
                self.log_error('/start_service', e)
                return self.error_response(f"Service start failed: {str(e)}", 500)
        
        @self.blueprint.route('/stop_service', methods=['POST'])
        def stop_service():
            """Stop a service / Para um serviço"""
            try:
                data = self.get_request_data()
                service_name = data.get('service', 'hexstrike')
                
                if service_name != 'hexstrike':
                     return self.error_response(f"Unknown service: {service_name}", 404)

                success, message = self.manager.stop()
                return self.success_response(message=message, data={'status': 'stopped'})
                
            except Exception as e:
                self.log_error('/stop_service', e)
                return self.error_response(f"Service stop failed: {str(e)}", 500)
        
        @self.blueprint.route('/status/services', methods=['GET'])
        def get_services_status():
            """Get status of all services / Status de todos os serviços"""
            status = {
                'hexstrike': self.manager.get_status()['status']
            }
            return self.success_response(data=status)
