"""
Security Service - In-Memory Safe Credential Manager
Serviço de Segurança - Gerenciador Seguro de Credenciais em Memória

Responsible for temporarily holding root (sudo) passwords in RAM
without ever writing them to disk. Validates and manages elevated privileges lifecycle.

@author: Roberto Dantas de Castro
"""
import logging
import subprocess
import threading
from typing import Optional

logger = logging.getLogger(__name__)

class SecurityService:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SecurityService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        # At-rest RAM password buffer (DO NOT EXPORT THIS TO LOGS OR DISK)
        # Buffer de senha em RAM (NÃO EXPOR ISSO EM LOGS OU DISCO)
        self._sudo_password: Optional[str] = None
        self._sudo_valid = False
        self._initialized = True
        logger.info("[SECURITY] Sudo Privileges Service Started (Volatile RAM Base)")

    def is_elevated(self) -> bool:
        """
        Returns true if the user's explicit sudo session is active.
        """
        return self._sudo_valid and self._sudo_password is not None

    def authenticate_sudo(self, password: str) -> bool:
        """
        Validates the root password strictly in RAM via dummy payload.
        Valida a senha de root via payload inofensivo no sistema.
        """
        try:
            # We run `sudo -S -l` using Popen pipeline passing the password to STDIN
            proc = subprocess.Popen(
                ['sudo', '-S', '-l'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            out, err = proc.communicate(input=f"{password}\n".encode('utf-8'))
            
            if proc.returncode == 0:
                self._sudo_password = password
                self._sudo_valid = True
                logger.warning("[SECURITY] Sudo Elevate SUCCESS. Active Session Acquired.")
                return True
            else:
                self._sudo_password = None
                self._sudo_valid = False
                logger.error("[SECURITY] Sudo Elevate FAILED. Invalid Password.")
                return False
                
        except Exception as e:
            logger.error(f"[SECURITY] Critical Error while validating Sudo: {e}")
            self._sudo_password = None
            self._sudo_valid = False
            return False

    def revoke_sudo(self) -> bool:
        """
        Clears the loaded buffer from RAM.
        Limpa o buffer de sudo da memória.
        """
        self._sudo_password = None
        self._sudo_valid = False
        logger.info("[SECURITY] Sudo Elevate REVOKED.")
        
        # Invalidate current linux sudo token ticket logic
        try:
            subprocess.run(['sudo', '-k'], check=False)
        except:
            pass
            
        return True

    def get_sudo_payload(self) -> Optional[str]:
        """
        Retrieves the payload prefix logic to attach to PTY or Core streams securely.
        Retorna o prefixo do payload para acoplar nas streams do Core de forma segura.
        """
        if not self.is_elevated():
            return None
        return f'echo "{self._sudo_password}" | sudo -S'

# Singleton Instance
security_service = SecurityService()
