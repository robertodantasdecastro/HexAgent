"""
Service Controller - Handles service control endpoints
Controlador de Serviço - Gerencia endpoints de controle de serviços

Acts as a Facade for the HexStrikeManager and SystemConfigService.
Atua como um Facade para o HexStrikeManager e SystemConfigService.

@author: Roberto Dantas de Castro
@version: 3.0.0 (Strict OOP & Bilingual)
"""

from typing import Dict, Tuple, Any
from flask import Response
from core.base_controller import BaseController
from services.hexstrike_manager import HexStrikeManager
from services.system_config_service import SystemConfigService

class ServiceController(BaseController):
    """
    Controller for service operations.
    Controlador para operações de serviço.
    
    Responsibilities / Responsabilidades:
    - Service Lifecycle Management / Gerenciamento de Ciclo de Vida de Serviço
    - Networking Configuration / Configuração de Rede
    """
    
    def __init__(self, hexstrike_ref=None):
        """
        Initialize ServiceController.
        Inicializa ServiceController.
        
        Args:
            hexstrike_ref: Reference to HexStrike API Client (Optional)
                          Referência ao Cliente API HexStrike (Opcional)
        """
        # We store the reference even if not strictly used here, for consistency
        # Armazenamos a referência mesmo se não estritamente usada aqui, para consistência
        self.hexstrike_client = hexstrike_ref 
        
        super().__init__(name='service', import_name=__name__, url_prefix='')
        
        # Initialize Services (Composition)
        # Inicializar Serviços (Composição)
        self.manager = HexStrikeManager()
        self.config_service = SystemConfigService()
    
    def _register_routes(self):
        """
        Register service routes.
        Registra rotas de serviço.
        """
        
        @self.blueprint.route('/start_service', methods=['POST'])
        def start_service():
            """
            Start a service.
            Inicia um serviço.
            """
            try:
                data = self.get_request_data()
                service_name = data.get('service', 'hexstrike')
                
                if service_name != 'hexstrike':
                    return self.error_response(f"Unknown service: {service_name}", 404)
                
                success, message = self.manager.start()
                
                if success:
                    status = self.manager.get_status().get('status', 'unknown')
                    return self.success_response(
                        message=message, 
                        data={'status': status}
                    )
                else:
                    return self.error_response(f"Failed to start: {message}", 500)
                
            except Exception as e:
                self.log_error('/start_service', e)
                return self.error_response(f"Service start failed: {str(e)}", 500)
        
        @self.blueprint.route('/stop_service', methods=['POST'])
        def stop_service():
            """
            Stop a service.
            Para um serviço.
            """
            try:
                data = self.get_request_data()
                service_name = data.get('service', 'hexstrike')
                
                if service_name != 'hexstrike':
                     return self.error_response(f"Unknown service: {service_name}", 404)

                success, message = self.manager.stop()
                return self.success_response(
                    message=message, 
                    data={'status': 'stopped'}
                )
                
            except Exception as e:
                self.log_error('/stop_service', e)
                return self.error_response(f"Service stop failed: {str(e)}", 500)
        
        @self.blueprint.route('/status/services', methods=['GET'])
        def get_services_status():
            """
            Get status of all services.
            Obtém status de todos os serviços.
            """
            try:
                status = {
                    'hexstrike': self.manager.get_status().get('status', 'unknown')
                }
                return self.success_response(data=status)
            except Exception as e:
                self.log_error('/status/services', e)
                return self.error_response("Failed to get status", 500)

        @self.blueprint.route('/services/configure_access', methods=['POST'])
        def configure_access():
            """
            Configure network access for a service.
            Configurar acesso de rede para um serviço.
            
            Updates system config and restarts service if needed.
            Atualiza configuração do sistema e reinicia serviço se necessário.
            """
            try:
                data = self.get_request_data()
                service_name = data.get('service')
                access_type = data.get('access')  # 'local' or 'public'
                
                if service_name != 'hexstrike':
                    return self.error_response("Only HexStrike service supports access configuration", 400)
                
                if access_type not in ['local', 'public']:
                    return self.error_response("Invalid access type. Use 'local' or 'public'", 400)
                
                # 1. Update Configuration via Service
                # 1. Atualizar Configuração via Serviço
                config = self.config_service.load_system_config()
                
                new_host = '0.0.0.0' if access_type == 'public' else '127.0.0.1'
                
                # Ensure 'services' key exists
                if 'services' not in config: 
                    config['services'] = {}
                    
                config['services']['hexstrike_host'] = new_host
                
                self.config_service.save_system_config(config)
                
                # 2. Restart Service if running
                # 2. Reiniciar Serviço se estiver rodando
                self.manager.host = new_host # Update runtime host property
                
                if self.manager.is_running():
                    self.manager.stop()
                    # Allow time for cleanup / Dar tempo para limpeza
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
