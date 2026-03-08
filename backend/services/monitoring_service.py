"""
Monitoring Service - Shadow Mode
Serviço de Monitoramento - Modo Sombra

Handles background monitoring tasks (System Stats, Network Watch).
Gerencia tarefas de monitoramento em segundo plano (Stats do Sistema, Vigilância de Rede).

@author: HexAgent Dev
"""
import threading
import time
import logging
import psutil
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class MonitoringService:
    """
    Singleton Service for Passive Monitoring.
    Serviço Singleton para Monitoramento Passivo.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MonitoringService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.active = False
        self.thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()
        self.stats = {"cpu": 0, "memory": 0, "net_connections": 0}
        self._initialized = True

    def start_monitoring(self):
        """
        Start the background monitoring thread.
        Iniciar a thread de monitoramento em segundo plano.
        """
        if self.active:
            return
            
        logger.info("Starting Shadow Mode Monitoring...")
        self.stop_event.clear()
        self.active = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()

    def stop_monitoring(self):
        """
        Stop the background monitoring thread.
        Parar a thread de monitoramento em segundo plano.
        """
        if not self.active:
            return
            
        logger.info("Stopping Shadow Mode Monitoring...")
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=2.0)
        self.active = False

    def get_stats(self) -> Dict[str, Any]:
        """
        Return latest stats.
        Retornar últimas estatísticas.
        """
        return self.stats

    def _monitor_loop(self):
        """
        Main loop for monitoring.
        Loop principal de monitoramento.
        """
        while not self.stop_event.is_set():
            try:
                # 1. System Stats / Estatísticas do Sistema
                self.stats["cpu"] = psutil.cpu_percent(interval=None)
                self.stats["memory"] = psutil.virtual_memory().percent
                
                # 2. Network Connections (Traffic Analysis)
                # 2. Conexões de Rede (Análise de Tráfego)
                # Count ESTABLISHED connections / Contar conexões ESTABELECIDAS
                connections = psutil.net_connections(kind='inet')
                established = [c for c in connections if c.status == 'ESTABLISHED']
                self.stats["net_connections"] = len(established)
                
                # Anomaly Detection (Suspicious Ports)
                suspicious_ports = [4444, 6667, 1337, 31337] 
                alerts = []
                
                active_list = []
                for c in established:
                    laddr = f"{c.laddr.ip}:{c.laddr.port}"
                    raddr = f"{c.raddr.ip}:{c.raddr.port}" if c.raddr else "N/A"
                    active_list.append({"local": laddr, "remote": raddr, "pid": c.pid})
                    
                    if c.laddr.port in suspicious_ports or (c.raddr and c.raddr.port in suspicious_ports):
                         alerts.append(f"Suspicious Port Detected: {c.laddr.port} <-> {raddr}")
                
                self.stats["active_connections_list"] = active_list[:10] # Top 10 only
                self.stats["alerts"] = alerts

                # Log if high load / intrusion detection stub
                if self.stats["cpu"] > 90:
                    logger.warning(f"High CPU Warning: {self.stats['cpu']}%")
                
                if alerts:
                    logger.warning(f"Intrusion Alert: {alerts}")
                
                time.sleep(2) # Poll interval
            except Exception as e:
                logger.error(f"Monitoring Error: {e}")
                time.sleep(5)
