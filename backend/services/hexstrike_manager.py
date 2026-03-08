"""
HexStrike Service Manager
Gerenciador do Serviço HexStrike

Handles the lifecycle of the HexStrike AI process, ensuring correct 
virtual environment usage and graceful shutdown.
Gerencia o ciclo de vida do processo HexStrike AI, garantindo uso correto
do ambiente virtual e encerramento gracioso.
"""

import os
import sys
import subprocess
import time
import signal
import socket
import logging
import requests
import psutil
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

class HexStrikeManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(HexStrikeManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # Load Configuration / Carregar Configuração
        from services.system_config_service import SystemConfigService
        self.config_service = SystemConfigService()
        self.config = self.config_service.load_system_config()
        
        # Extract Configs / Extrair Configurações
        services_conf = self.config.get('services', {})
        env_conf = self.config.get('environment', {})
        
        self.process = None
        self.pid = None
        self.port = services_conf.get('hexstrike_port', 8888)
        self.host = services_conf.get('hexstrike_host', '127.0.0.1')
        
        # Paths from Config / Caminhos da Configuração
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) # Fallback
        
        # 1. HexStrike App Path
        configured_app = services_conf.get('hexstrike_app_path')
        if configured_app:
            self.hexstrike_dir = configured_app
        else:
            # Fallback default
            self.hexstrike_dir = os.path.join(os.path.dirname(self.base_dir), "hexstrike-ai")
            
        # 2. Venv Path — Unified venv at HexAgentGUI root (all apps share this venv)
        # Caminho do venv unificado na raiz de HexAgentGUI (todos os apps compartilham)
        configured_venv = env_conf.get('hexstrike_venv_path')
        if configured_venv:
             self.venv_python = os.path.join(configured_venv, "bin", "python")
        else:
             # Unified venv is always at HexAgentGUI root (install.sh installs all deps there)
             # O venv unificado fica sempre na raiz de HexAgentGUI (install.sh instala todas as deps lá)
             unified_venv = os.path.join(self.base_dir, "venv", "bin", "python")
             if os.path.exists(unified_venv):
                 self.venv_python = unified_venv
             else:
                 self.venv_python = sys.executable
                 logger.warning(f"HexStrikeManager: Unified venv not found at {self.base_dir}/venv. Fallback to system Python.")

        self.server_script = os.path.join(self.hexstrike_dir, "hexstrike_server.py")
        self.log_file = os.path.join(self.hexstrike_dir, "hexstrike_service.log")

        self._initialized = True
        
        logger.info(f"HexStrikeManager Initialized:")
        logger.info(f"  - App Dir: {self.hexstrike_dir}")
        logger.info(f"  - Venv Python: {self.venv_python}")
        logger.info(f"  - Port: {self.port}")

        self.server_script = os.path.join(self.hexstrike_dir, "hexstrike_server.py")
        self.log_file = os.path.join(self.hexstrike_dir, "hexstrike_service.log")

        self._initialized = True
        
        logger.info(f"HexStrikeManager Initialized:")
        logger.info(f"  - App Dir: {self.hexstrike_dir}")
        logger.info(f"  - Venv Python: {self.venv_python}")
        logger.info(f"  - Port: {self.port}")

    def is_running(self):
        """
        Check if service is running by port connectivity
        Verificar se o serviço está rodando pela conectividade da porta
        """
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2.0) # Increased timeout from 0.5s to 2.0s
        try:
            # Use configured host instead of hardcoded 127.0.0.1
            result = sock.connect_ex((self.host, self.port))
            sock.close()
            
            is_open = (result == 0)
            if not is_open:
                # Debug log only if we expect it might be running or during startup
                # logger.debug(f"HexStrike port check {self.host}:{self.port} returned {result}")
                pass
                
            return is_open
        except Exception as e:
            return False
    
    def _is_port_healthy(self):
        """
        Check if service is actually responding to HTTP
        Verificar se o serviço está realmente respondendo via HTTP
        """
        try:
            url = f"http://{self.host}:{self.port}/health"
            # Short timeout, don't hang on zombies
            response = requests.get(url, timeout=1) 
            return response.status_code == 200
        except:
            return False

    def _kill_process_on_port(self):
        """
        Find and kill process blocking the port using psutil
        Encontrar e matar processo bloqueando a porta usando psutil
        """
        try:
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    for conn in proc.connections(kind='inet'):
                        if conn.laddr.port == self.port:
                            logger.warning(f"Killing zombie process {proc.pid} on port {self.port}")
                            proc.terminate()
                            proc.wait(timeout=2)
                            return True
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
        except Exception as e:
            logger.error(f"Error killing process on port: {e}")
        return False

    def start(self):
        """
        Start the HexStrike service using the unified venv
        Iniciar o serviço HexStrike usando o venv unificado
        """
        # 1. Check if ANY process is listening
        if self.is_running():
            # 2. Check if it's HEALTHY (responding to HTTP)
            if self._is_port_healthy():
                logger.info("HexStrike service already running and healthy.")
                return True, "Already running"
            else:
                logger.warning("HexStrike port OPEN but UNRESPONSIVE. Killing zombie process...")
                self._kill_process_on_port()
                time.sleep(1) # Wait for cleanup
                
                # Double check
                if self.is_running():
                     logger.error("Failed to kill zombie process. Port still blocked.")
                     return False, "Port blocked by unresponsive process"
            
        if not os.path.exists(self.venv_python):
            return False, f"Unified Venv Python not found at: {self.venv_python}"
            
        if not os.path.exists(self.server_script):
            return False, f"HexStrike server script not found at: {self.server_script}"
            
        try:
            # Environment Setup
            env = os.environ.copy()
            env["HEXSTRIKE_PORT"] = str(self.port)

            # env["HEXSTRIKE_HOST"] = self.host # Host is handled by binding 0.0.0.0 in server or default
            # Limpar variáveis conflitantes
            env["PYTHONPATH"] = ""
            env["VIRTUAL_ENV"] = os.path.dirname(os.path.dirname(self.venv_python)) # Set correct VENV

            # Log setup
            log_fd = open(self.log_file, 'a')
            
            # Use start_hexstrike.sh script for robust environment setup
            # start_script = os.path.join(self.hexstrike_dir, "start_hexstrike.sh")
            
            # Make sure script is executable
            # os.chmod(start_script, 0o755)
            
            # REFACTOR: Launch Python directly to ensure VENV consistency and avoid shell script ambiguity
            # REFATORAÇÃO: Lançar Python diretamente para garantir consistência do VENV e evitar ambiguidade do script shell
            
            cmd = [
                self.venv_python,
                self.server_script,
                "--port", str(self.port)
            ]
            
            logger.info(f"Starting HexStrike via script: {' '.join(cmd)}")
            
            self.process = subprocess.Popen(
                cmd,
                cwd=self.hexstrike_dir,
                stdout=log_fd,
                stderr=subprocess.STDOUT,
                start_new_session=True, # Detach process group
                env=env
            )
            self.pid = self.process.pid
            
            # Wait for startup
            for i in range(20): # 10 seconds wait (20 * 0.5)
                if self.is_running():
                    logger.info("HexStrike service started and is listening.")
                    return True, "Started successfully"
                time.sleep(0.5)
                
            # Check if process died
            if self.process.poll() is not None:
                # BUG FIX: Include last log lines in error for immediate diagnosis
                # CORREÇÃO: Incluir últimas linhas do log no erro para diagnóstico imediato
                tail_msg = ""
                try:
                    with open(self.log_file, 'r') as lf:
                        lines = lf.readlines()
                        if lines:
                            tail = ''.join(lines[-5:]).strip()
                            tail_msg = f" | Last log: {tail}"
                except Exception:
                    pass
                return False, f"Process died immediately. Check {self.log_file}{tail_msg}"
            
            # If still running but not listening, return success (might be slow startup)
            logger.warning("HexStrike process running but port not yet open. Returning success.")
            return True, "Started (Initializing...)"
            
        except Exception as e:
            logger.error(f"Failed to start HexStrike: {e}")
            return False, str(e)

    def stop(self):
        """
        Stop the service
        Parar o serviço
        """
        # 1. Try to kill the child process if we have the object
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=2)
            except:
                try:
                    self.process.kill()
                except:
                    pass
            self.process = None
            self.pid = None
            
        # 2. Safety Net: Kill by Port (fuser)
        try:
            subprocess.run(f"fuser -k -n tcp {self.port}", shell=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
        except:
            pass
            
        return True, "Stopped"

    def get_status(self):
        running = self.is_running()
        status = "running" if running else "stopped"
        
        # Check for intermediate state
        if not running and self.pid and self.process and self.process.poll() is None:
             status = "starting"
             
        return {
            "status": status,
            "port": self.port,
            "pid": self.pid
        }
