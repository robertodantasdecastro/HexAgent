"""
Service Controller - Handles service control endpoints
Controlador de Serviço - Gerencia endpoints de controle de serviços

@author: Roberto Dantas de Castro
"""

from core.base_controller import BaseController


class ServiceController(BaseController):
    """Controller for service operations / Controlador para operações de serviço"""
    
    def __init__(self, hexstrike_ref=None):
        self.hexstrike = hexstrike_ref
        super().__init__(name='service', import_name=__name__, url_prefix='')
        self.services = {
            'hexstrike': {
                'pid': None,
                'process': None,
                'port': 8888,
                'path': '/home/d4r13n/iatools/hexstrike-ai/hexstrike_server.py',
                'cwd': '/home/d4r13n/iatools/hexstrike-ai'
            }
        }
    
    def _check_port(self, port):
        """Check if port is open / Verifica se porta está aberta"""
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            return result == 0
        except:
            return False

    def _register_routes(self):
        """Register service routes / Registra rotas de serviço"""
        
        @self.blueprint.route('/start_service', methods=['POST'])
        def start_service():
            """Start a service / Inicia um serviço"""
            try:
                data = self.get_request_data()
                service_name = data.get('service', 'hexstrike')
                
                if service_name not in self.services:
                    return self.error_response(f"Unknown service: {service_name}", 404)
                
                service = self.services[service_name]
                
                # Check if already running
                if self._check_port(service['port']):
                    return self.success_response(message=f"Service {service_name} already running", data={'status': 'running'})

                import subprocess
                import sys
                import os
                import time
                
                # Verify paths exist
                startup_script = os.path.join(service['cwd'], 'start_hexstrike.sh')
                if not os.path.exists(startup_script):
                     return self.error_response(f"Startup script not found at {startup_script}", 500)

                print(f"[ServiceController] Starting {service_name} using script: {startup_script}")
                
                # Executing the shell script which handles venv and requirements
                # Executando script shell que gerencia venv e requisitos
                cmd = ['/bin/bash', startup_script, str(service['port'])]
                
                env = os.environ.copy()
                
                # Redirect output to log file in the SERVICE directory
                log_file_path = os.path.join(service['cwd'], 'hexstrike_service.log')
                log_file = open(log_file_path, 'a')
                
                print(f"[ServiceController] Logs redirected to: {log_file_path}")
                
                proc = subprocess.Popen(
                    cmd,
                    cwd=service['cwd'],
                    stdout=log_file,
                    stderr=subprocess.STDOUT,
                    start_new_session=True, # Detach
                    env=env
                )
                
                service['process'] = proc
                service['pid'] = proc.pid
                
                # Wait for port to open (up to 30 seconds - extra time for venv creation)
                # Aumentado tempo de espera para 30s para permitir criação do venv
                for _ in range(60):
                    if self._check_port(service['port']):
                        print(f"[ServiceController] {service_name} is listening on port {service['port']}")
                        return self.success_response(message=f"Service {service_name} started successfully", data={'status': 'running'})
                    time.sleep(0.5)

                return self.success_response(message=f"Service {service_name} started (Initialization in progress... check logs)", data={'status': 'starting'})
                
            except Exception as e:
                self.log_error('/start_service', e)
                return self.error_response(f"Service start failed: {str(e)}", 500)
        
        @self.blueprint.route('/stop_service', methods=['POST'])
        def stop_service():
            """Stop a service / Para um serviço"""
            try:
                data = self.get_request_data()
                service_name = data.get('service', 'hexstrike')
                
                if service_name not in self.services:
                     return self.error_response(f"Unknown service: {service_name}", 404)

                service = self.services[service_name]
                import os
                import signal
                
                # Kill by recorded PID first
                if service['process']:
                    try:
                        service['process'].terminate()
                        try:
                            service['process'].wait(timeout=2)
                        except:
                            service['process'].kill()
                        service['process'] = None
                        service['pid'] = None
                        print(f"[ServiceController] Stopped {service_name} (Child)")
                    except Exception as e:
                        print(f"[ServiceController] Error stopping child: {e}")

                # Kill by Port (Safety net)
                try:
                    import subprocess
                    subprocess.run(f"fuser -k -n tcp {service['port']}", shell=True)
                except:
                    pass

                return self.success_response(message=f"Service {service_name} stopped", data={'status': 'stopped'})
            except Exception as e:
                self.log_error('/stop_service', e)
                return self.error_response(f"Service stop failed: {str(e)}", 500)
        
        @self.blueprint.route('/service', methods=['POST']) # Legacy Check Status?
        def service_operation():
            pass

        @self.blueprint.route('/status/services', methods=['GET'])
        def get_services_status():
            """Get status of all services / Status de todos os serviços"""
            status = {}
            for name, svc in self.services.items():
                is_running = self._check_port(svc['port'])
                status[name] = 'running' if is_running else 'stopped'
                
                # Check for zombie/starting process without psutil
                # Verifica processo zumbi/iniciando sem psutil
                if not is_running and svc['pid']:
                     try:
                         # Signal 0 checks if process exists
                         import os
                         os.kill(svc['pid'], 0) 
                         status[name] = 'starting'
                     except OSError:
                         # Process dead
                         svc['pid'] = None
                         
            return self.success_response(data=status)
