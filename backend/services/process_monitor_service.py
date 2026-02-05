"""
Process Monitor Service
Serviço de Monitoramento de Processos

Handles process supervision, specifically ensuring the backend terminates
if the parent Electron process dies.
Lida com supervisão de processos, especificamente garantindo que o backend termine
se o processo Electron pai morrer.

@author: Roberto Dantas de Castro
"""

import threading
import time
import psutil
import os
import sys
import logging

class ProcessMonitorService:
    def __init__(self, check_interval=2.0):
        """
        Initialize Process Monitor
        Inicializar Monitor de Processos
        
        Args:
            check_interval (float): Seconds between checks / Segundos entre verificações
        """
        self.check_interval = check_interval
        self.logger = logging.getLogger('ProcessMonitor')
        self._stop_event = threading.Event()
        self._thread = None

    def start_watchdog(self, target_pid=None):
        """
        Start the parent process watchdog
        Iniciar o cão de guarda do processo pai
        
        Args:
            target_pid (int, optional): PID to monitor. Defaults to Parent PID.
                                      PID para monitorar. Padrão é PID do Pai.
        """
        if os.environ.get('HEXAGENT_SETUP_ONLY'):
            self.logger.info("Setup mode detected. Watchdog disabled.")
            return

        pid_to_watch = target_pid or os.getppid()
        
        self.logger.info(f"Starting watchdog for PID: {pid_to_watch}")
        
        self._thread = threading.Thread(
            target=self._watch_process,
            args=(pid_to_watch,),
            daemon=True
        )
        self._thread.start()

    def _watch_process(self, pid):
        """
        Internal monitoring loop
        Loop de monitoramento interno
        """
        while not self._stop_event.is_set():
            try:
                # Check if process is alive / Verificar se processo está vivo
                if not psutil.pid_exists(pid):
                    self.logger.warning(f"Parent process {pid} died. Terminating backend...")
                    os._exit(0)
                
                # Check for adoption by init (PID 1) - Linux specific
                # Verificar adoção pelo init (PID 1) - Específico Linux
                current_ppid = os.getppid()
                if current_ppid != pid and current_ppid == 1:
                    self.logger.warning("Process orphaned (adopted by init). Terminating backend...")
                    os._exit(0)
                    
                time.sleep(self.check_interval)
            except Exception as e:
                self.logger.error(f"Watchdog error: {e}")
                time.sleep(self.check_interval * 2)

    def stop(self):
        """
        Stop the monitor
        Parar o monitor
        """
        self._stop_event.set()
