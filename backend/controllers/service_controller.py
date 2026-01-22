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

        @self.blueprint.route('/services/configure_access', methods=['POST'])
        def configure_access():
            """
            Configure network access for a service
            Configurar acesso de rede para um serviço
            """
            try:
                data = self.get_request_data()
                service_name = data.get('service')
                access_type = data.get('access')  # 'local' or 'public'
                
                if service_name != 'hexstrike':
                    return self.error_response("Only HexStrike service supports access configuration", 400)
                
                if access_type not in ['local', 'public']:
                    return self.error_response("Invalid access type. Use 'local' or 'public'", 400)
                
                # 1. Update Configuration
                from services.system_config_service import SystemConfigService
                config_service = SystemConfigService()
                config = config_service.load_system_config()
                
                new_host = '0.0.0.0' if access_type == 'public' else '127.0.0.1'
                if 'services' not in config: config['services'] = {}
                config['services']['hexstrike_host'] = new_host
                
                config_service.save_system_config(config)
                
                # 2. Restart Service if running
                # Reiniciar serviço se estiver rodando
                self.manager.host = new_host # Update runtime host
                
                if self.manager.is_running():
                    self.manager.stop()
                    # Allow time for cleanup
                    import time
                    time.sleep(2) 
                    self.manager.start()
                    
                return self.success_response(
                    message=f"Access configured to {access_type} ({new_host}). Service restarted if applicable.",
                    data={"host": new_host}
                )
                
            except Exception as e:
                self.log_error('/services/configure_access', e)
                return self.error_response(f"Failed to configure access: {str(e)}", 500)
