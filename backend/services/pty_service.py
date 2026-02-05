"""
PTY Service - Pseudoterminal Management
Serviço PTY - Gerenciamento de Pseudoterminal

Manages a persistent shell process (zsh/bash) attached to a PTY.
Gerencia um processo de shell persistente (zsh/bash) anexado a um PTY.

@author: HexAgent Dev
"""
import os
import pty
import select
import subprocess
import threading
import time
import logging
import fcntl
import termios
import struct
from typing import Optional, Generator

logger = logging.getLogger(__name__)

class PTYService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PTYService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.master_fd: Optional[int] = None
        self.pid: Optional[int] = None
        self.output_buffer = b""
        self.lock = threading.Lock()
        self._initialized = True
        
        # Start automatically / Iniciar automaticamente
        self.start_pty()

    def start_pty(self):
        """
        Fork a new PTY process.
        Bifurca um novo processo PTY.
        """
        if self.pid:
            return

        try:
            # Create PTY
            self.pid, self.master_fd = pty.fork()
            
            if self.pid == 0:
                # CHILD PROCESS / PROCESSO FILHO
                # Execute shell
                shell = os.environ.get('SHELL', '/bin/bash')
                os.chdir(os.path.expanduser('~'))
                # Set basic terminal type to avoid weird escape codes
                os.environ['TERM'] = 'xterm-256color'
                os.execlp(shell, shell)
            else:
                # PARENT PROCESS / PROCESSO PAI
                logger.info(f"PTY started. PID: {self.pid}, FD: {self.master_fd}")
                
                # Set non-blocking mode
                fl = fcntl.fcntl(self.master_fd, fcntl.F_GETFL)
                fcntl.fcntl(self.master_fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)

        except Exception as e:
            logger.error(f"Failed to start PTY: {e}")
            self.stop_pty()

    def stop_pty(self):
        """
        Kill PTY process.
        Mata o processo PTY.
        """
        if self.master_fd:
            try:
                os.close(self.master_fd)
            except:
                pass
            self.master_fd = None
            
        if self.pid:
            try:
                os.kill(self.pid, 9)
                os.waitpid(self.pid, 0)
            except:
                pass
            self.pid = None
        
        logger.info("PTY stopped")

    def write(self, data: str):
        """
        Write input to PTY.
        Escrever entrada no PTY.
        """
        if not self.master_fd:
            self.start_pty()
            
        try:
            os.write(self.master_fd, data.encode('utf-8'))
        except OSError as e:
            logger.error(f"PTY Write Error: {e}")
            self.stop_pty()

    def resize(self, cols: int, rows: int):
        """
        Resize terminal window.
        Redimensionar janela do terminal.
        """
        if not self.master_fd:
            return
            
        try:
            # struct winsize { unsigned short ws_row, ws_col, ws_xpixel, ws_ypixel; };
            winsize = struct.pack("HHHH", rows, cols, 0, 0)
            fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, winsize)
        except Exception as e:
            logger.error(f"PTY Resize Error: {e}")

    def read_generator(self) -> Generator[str, None, None]:
        """
        Generator yielding output chunks.
        Gerador que fornece pedaços de saída.
        
        Uses select to wait for data efficiently.
        Usa select para esperar dados eficientemente.
        """
        while True:
            if not self.master_fd:
                time.sleep(1)
                continue

            try:
                # Wait for data to be ready to read
                r, w, x = select.select([self.master_fd], [], [], 1.0)
                
                if self.master_fd in r:
                    try:
                        data = os.read(self.master_fd, 1024)
                        if data:
                            yield data.decode('utf-8', errors='replace')
                        else:
                            # EOF
                            self.stop_pty()
                            break
                    except OSError:
                        # Error reading, possibly closed
                        self.stop_pty()
                        break
                        
            except Exception as e:
                logger.error(f"PTY Read Error: {e}")
                time.sleep(1)
