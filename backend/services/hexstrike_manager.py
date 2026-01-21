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
        
        # 1. Venv Path
        configured_venv = env_conf.get('venv_path')
        if configured_venv:
             self.venv_python = os.path.join(configured_venv, "bin", "python")
        else:
             # Fallback default
             self.venv_python = os.path.join(self.base_dir, "venv", "bin", "python")

        # 2. HexStrike App Path
        configured_app = services_conf.get('hexstrike_app_path')
        if configured_app:
            self.hexstrike_dir = configured_app
        else:
            # Fallback default
            self.hexstrike_dir = os.path.join(os.path.dirname(self.base_dir), "hexstrike-ai")
            
        self.server_script = os.path.join(self.hexstrike_dir, "hexstrike_server.py")
        self.log_file = os.path.join(self.hexstrike_dir, "hexstrike_service.log")

        self._initialized = True
        
        logger.info(f"HexStrikeManager Initialized:")
        logger.info(f"  - App Dir: {self.hexstrike_dir}")
        logger.info(f"  - Venv Python: {self.venv_python}")
        logger.info(f"  - Port: {self.port}")

    def is_running(self):
        """Check if service is running by port connectivity"""
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
            logger.error(f"Error checking HexStrike status on {self.host}:{self.port}: {e}")
            return False

    def start(self):
        """Start the HexStrike service using the unified venv"""
        if self.is_running():
            logger.info("HexStrike service already running.")
            return True, "Already running"
            
        if not os.path.exists(self.venv_python):
            return False, f"Unified Venv Python not found at: {self.venv_python}"
            
        if not os.path.exists(self.server_script):
            return False, f"HexStrike server script not found at: {self.server_script}"
            
        try:
            # Environment Setup
            env = os.environ.copy()
            env["HEXSTRIKE_PORT"] = str(self.port)
            env["HEXSTRIKE_HOST"] = self.host # Use self.host
            # Explicitly set PYTHONPATH to ensure imports work correctly
            env["PYTHONPATH"] = self.hexstrike_dir

            # Log setup
            log_fd = open(self.log_file, 'a')
            
            cmd = [
                self.venv_python,
                self.server_script,
                "--port", str(self.port)
            ]
            
            logger.info(f"Starting HexStrike: {' '.join(cmd)}")
            
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
                return False, f"Process died immediately. Check {self.log_file}"
            
            # If still running but not listening, return success (might be slow startup)
            logger.warning("HexStrike process running but port not yet open. Returning success.")
            return True, "Started (Initializing...)"
            
        except Exception as e:
            logger.error(f"Failed to start HexStrike: {e}")
            return False, str(e)

    def stop(self):
        """Stop the service"""
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
