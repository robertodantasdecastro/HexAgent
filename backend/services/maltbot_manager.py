import subprocess
import os
import threading
import time
import logging

# Configure logger
logger = logging.getLogger(__name__)

class MaltbotManager:
    """
    Manages the lifecycle of the Maltbot (Node.js) process.
    """
    _instance = None
    _process = None
    _lock = threading.Lock()

    MOLTBOT_PATH = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def __init__(self):
        self._find_moltbot_path()
        self._check_path()

    def _find_moltbot_path(self):
        """Robustly find the moltbot directory."""
        # Candidates to check
        candidates = [
            # 1. Environment variable
            os.environ.get('MOLTBOT_HOME'),
            # 2. Relative to this file (Dev mode) -> backend/services/../../moltbot = root/moltbot
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../moltbot")),
            # 3. Sibling of 'iatools/HexAgentGUI' -> iatools/moltbot (Common user setup)
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../moltbot")),
             # 4. Hardcoded User Path (Fallback for specific env)
            "/home/d4r13n/iatools/moltbot"
        ]

        for path in candidates:
            if path and os.path.exists(path) and os.path.exists(os.path.join(path, 'package.json')):
                self.MOLTBOT_PATH = path
                logger.info(f"Maltbot path resolved to: {self.MOLTBOT_PATH}")
                return

        logger.error("Could not find 'moltbot' directory in any candidate path.")
        self.MOLTBOT_PATH = None  # Will fail check_path

    def _check_path(self):
        if not os.path.exists(self.MOLTBOT_PATH):
            logger.warning(f"Maltbot directory not found at {self.MOLTBOT_PATH}")

    def is_running(self):
        return self._process is not None and self._process.poll() is None

    def start(self):
        with self._lock:
            if self.is_running():
                logger.info("Maltbot is already running.")
                return {"status": "already_running", "pid": self._process.pid}

            if not os.path.exists(self.MOLTBOT_PATH):
                return {"status": "error", "message": "Maltbot path not found"}

            try:
                # Command to start moltbot using its run script
                # "gateway run" launches the WebSocket Gateway in foreground mode
                cmd = ["node", "scripts/run-node.mjs", "gateway", "run"]
                
                # Start the process independent of the parent so it doesn't block
                self._process = subprocess.Popen(
                    cmd,
                    cwd=self.MOLTBOT_PATH,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,
                    # preexec_fn=os.setsid # Optional: detach process group on Linux
                )
                
                # Start a thread to consume stdout/stderr to prevent buffer locking
                threading.Thread(target=self._log_output, args=(self._process.stdout, "STDOUT"), daemon=True).start()
                threading.Thread(target=self._log_output, args=(self._process.stderr, "STDERR"), daemon=True).start()

                logger.info(f"Maltbot started with PID {self._process.pid}")
                return {"status": "started", "pid": self._process.pid}

            except Exception as e:
                logger.error(f"Failed to start Maltbot: {e}")
                return {"status": "error", "message": str(e)}

    def stop(self):
        with self._lock:
            if not self.is_running():
                return {"status": "not_running"}

            try:
                self._process.terminate()
                try:
                    self._process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self._process.kill()
                    self._process.wait()
                
                self._process = None
                logger.info("Maltbot stopped.")
                return {"status": "stopped"}
            except Exception as e:
                logger.error(f"Error stopping Maltbot: {e}")
                return {"status": "error", "message": str(e)}

    def status(self):
        if self.is_running():
            return {"status": "running", "pid": self._process.pid}
        else:
            return {"status": "stopped"}

    def _log_output(self, stream, label):
        """Reads stream line by line and logs it."""
        try:
            for line in iter(stream.readline, ''):
                if line:
                    logger.debug(f"[Moltbot {label}] {line.strip()}")
        except Exception:
            pass
        finally:
            stream.close()
