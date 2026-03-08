"""
HexStrike Client - Command Execution Interface
Cliente HexStrike - Interface de Execução de Comandos

Communicates with HexStrike server API for command execution.
Comunica com servidor API HexStrike para execução de comandos.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

import requests
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class HexStrikeClient:
    """
    Client for HexStrike command execution server
    Cliente para servidor de execução de comandos HexStrike
    
    Provides interface to execute shell commands and security tools via HexStrike API.
    Fornece interface para executar comandos shell e ferramentas de segurança via API HexStrike.
    """
    
    DEFAULT_BASE_URL = "http://localhost:8888"
    DEFAULT_TIMEOUT = 60
    
    def __init__(self, base_url: Optional[str] = None, timeout: Optional[int] = None):
        """
        Initialize HexStrike client
        Inicializa cliente HexStrike
        
        Args:
            base_url: HexStrike server URL (default: http://localhost:8888)
                     URL do servidor HexStrike (padrão: http://localhost:8888)
            timeout: Default request timeout in seconds (default: 60)
                    Timeout padrão de requisição em segundos (padrão: 60)
        """
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip('/')
        self.timeout = timeout or self.DEFAULT_TIMEOUT
        self.session = requests.Session()
        
        logger.info(f"HexStrikeClient initialized: {self.base_url}")
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check if HexStrike server is alive and responding
        Verifica se servidor HexStrike está vivo e respondendo
        
        Returns:
            Health status dictionary:
            {
                "status": "ok" | "error",
                "message": str (optional),
                "alive": bool (optional)
            }
        """
        try:
            logger.debug("Performing health check")
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=5  # Short timeout for health check
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info("Health check successful")
            return data
            
        except requests.exceptions.Timeout:
            logger.warning("Health check timed out")
            return {
                "status": "error",
                "message": "Health check timed out",
                "alive": False
            }
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"Health check connection error: {e}")
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}",
                "alive": False
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e),
                "alive": False
            }
    
    def is_available(self) -> bool:
        """
        Quick availability check
        Verificação rápida de disponibilidade
        
        Returns:
            True if server is available, False otherwise
        """
        health = self.health_check()
        return health.get("status") != "error" and health.get("alive", True)
    
    def execute_command(
        self, 
        command: str, 
        timeout: Optional[int] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Execute shell command via HexStrike
        Executa comando shell via HexStrike
        
        Args:
            command: Shell command to execute / Comando shell para executar
            timeout: Execution timeout in seconds (default: self.timeout)
                    Timeout de execução em segundos (padrão: self.timeout)
            use_cache: Use command result cache if available
                      Usar cache de resultado de comando se disponível
            
        Returns:
            Command execution result:
            {
                "success": bool,
                "command": str,
                "output": str,
                "stdout": str (alternative),
                "stderr": str (optional),
                "error": str (if failed),
                "exit_code": int,
                "cached": bool (optional)
            }
        """
        timeout = timeout or self.timeout
        
        try:
            logger.info(f"Executing command: {command[:50]}...")
            
            response = self.session.post(
                f"{self.base_url}/api/command",
                json={
                    "command": command,
                    "use_cache": use_cache
                },
                timeout=timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Normalize response format
            # Normaliza formato de resposta
            result = {
                "success": data.get("success", False),
                "command": command,
                "output": data.get("output", "") or data.get("stdout", ""),
                "error": data.get("error", "") or data.get("stderr", ""),
                "exit_code": data.get("exit_code", 0) or data.get("exitCode", 0),
                "cached": data.get("cached", False)
            }
            
            logger.info(f"Command executed successfully (exit code: {result['exit_code']})")
            return result
            
        except requests.exceptions.Timeout:
            error_msg = f"Command timed out after {timeout}s"
            logger.error(error_msg)
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": error_msg,
                "exit_code": -1
            }
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
            logger.error(f"Command execution HTTP error: {error_msg}")
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": error_msg,
                "exit_code": -1
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Command execution failed: {error_msg}", exc_info=True)
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": error_msg,
                "exit_code": -1
            }
    
    def execute_tool(
        self, 
        tool_name: str, 
        parameters: Dict[str, Any],
        timeout: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute specific security tool
        Executa ferramenta de segurança específica
        
        Args:
            tool_name: Tool name (e.g., 'nmap', 'nuclei', 'gobuster')
                      Nome da ferramenta (ex: 'nmap', 'nuclei', 'gobuster')
            parameters: Tool-specific parameters / Parâmetros específicos da ferramenta
            timeout: Execution timeout in seconds (default: 300s for tools)
                    Timeout de execução em segundos (padrão: 300s para ferramentas)
            
        Returns:
            Tool execution result dictionary / Dicionário de resultado de execução
        """
        timeout = timeout or 300  # 5 minutes default for tools / 5 minutos padrão para ferramentas
        
        try:
            logger.info(f"Executing tool: {tool_name}")
            
            endpoint = f"/api/tools/{tool_name}"
            response = self.session.post(
                f"{self.base_url}{endpoint}",
                json=parameters,
                timeout=timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"Tool {tool_name} executed successfully")
            return data
            
        except requests.exceptions.Timeout:
            error_msg = f"Tool {tool_name} timed out after {timeout}s"
            logger.error(error_msg)
            return {
                "success": False,
                "tool": tool_name,
                "error": error_msg
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Tool {tool_name} execution failed: {error_msg}", exc_info=True)
            return {
                "success": False,
                "tool": tool_name,
                "error": error_msg
            }
    
    def list_tools(self) -> Dict[str, Any]:
        """
        Get list of available tools
        Obtém lista de ferramentas disponíveis
        
        Returns:
            List of available tools / Lista de ferramentas disponíveis
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/tools",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            return data.get("tools", data)
        except Exception as e:
            logger.error(f"Failed to list tools: {e}")
            return {"success": False, "error": str(e)}
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get command cache statistics
        Obtém estatísticas de cache de comandos
        
        Returns:
            Cache statistics / Estatísticas de cache
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/cache/stats",
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"success": False, "error": str(e)}
    
    def run_bugbounty_workflow(self, workflow_id: str, data: Dict[str, Any], timeout: Optional[int] = None) -> Dict[str, Any]:
        """
        Execute a Bug Bounty workflow
        Executa um workflow de Bug Bounty
        
        Args:
            workflow_id: ID do workflow (ex: reconnaissance-workflow)
            data: Payload contendo target, etc.
            timeout: Execution timeout
        """
        timeout = timeout or 600 # Workflows demandam mais tempo
        try:
            logger.info(f"Executing Bug Bounty Workflow: {workflow_id} against {data.get('target')}")
            endpoint = f"/api/bugbounty/{workflow_id}"
            response = self.session.post(
                f"{self.base_url}{endpoint}",
                json=data,
                timeout=timeout
            )
            response.raise_for_status()
            logger.info(f"Bug Bounty Workflow {workflow_id} executed successfully")
            return response.json()
        except requests.exceptions.Timeout:
            error_msg = f"Workflow {workflow_id} timed out after {timeout}s"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Workflow {workflow_id} failed: {error_msg}")
            return {"success": False, "error": error_msg}

    def clear_cache(self) -> Dict[str, Any]:
        """
        Clear command result cache
        Limpa cache de resultados de comando
        
        Returns:
            Operation result / Resultado da operação
        """
        try:
            logger.info("Clearing command cache")
            response = self.session.post(
                f"{self.base_url}/api/cache/clear",
                timeout=10
            )
            response.raise_for_status()
            logger.info("Cache cleared successfully")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return {"success": False, "error": str(e)}
    
    def select_tools(self, query: str) -> Dict[str, Any]:
        """
        Ask HexStrike Intelligence to select best tools for a task
        Pede à Inteligência HexStrike para selecionar as melhores ferramentas
        
        Args:
            query: User objective / Objetivo do usuário
            
        Returns:
            List of recommended tools with reasoning
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/intelligence/select-tools",
                json={"query": query},
                timeout=30
            )
            response.raise_for_status()
            logger.info("Intelligence: Tool selection received")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to select tools: {e}")
            return {"success": False, "error": str(e), "tools": []}

    def optimize_parameters(self, tool_name: str, target: str) -> Dict[str, Any]:
        """
        Ask HexStrike Intelligence to optimize tool parameters
        Pede à Inteligência HexStrike para otimizar parâmetros
        
        Args:
            tool_name: Tool to optimize / Ferramenta para otimizar
            target: Target url/ip / Alvo
            
        Returns:
            Optimized command string
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/intelligence/optimize-parameters",
                json={"tool": tool_name, "target": target},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to optimize parameters: {e}")
            return {"success": False, "error": str(e)}


    def get_telemetry(self) -> Dict[str, Any]:
        """
        Get server telemetry including active processes and resource usage.
        Obtém telemetria do servidor incluindo processos ativos e uso de recursos.
        """
        try:
            response = self.session.get(f"{self.base_url}/api/telemetry", timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get telemetry: {e}")
            return {"success": False, "error": str(e)}

    def get_environment_context(self) -> str:
        """
        Build a rich environment context string for LLM system prompt injection.
        SOLVES: AI suggesting tool installations for tools already on Kali Linux.
        RESOLVE: IA sugerindo instalar ferramentas já presentes no Kali Linux.
        """
        ctx_lines = [
            "### Kali Linux Environment / Ambiente Kali Linux ###",
            "OS: Kali Linux (Offensive Security) | Shell: ZSH | Mode: Authorized Pentest",
            "",
            "CRITICAL: ALL tools below are PRE-INSTALLED. NEVER suggest installing them.",
            "CRÍTICO: TODAS as ferramentas abaixo já estão INSTALADAS. NUNCA sugira instalá-las.",
            "",
            "Available Security Tools (pre-installed on Kali):",
        ]
        kali_tools = [
            "nmap", "masscan", "rustscan", "netdiscover", "arp-scan",
            "gobuster", "feroxbuster", "ffuf", "dirsearch", "dirb",
            "nuclei", "nikto", "sqlmap", "hydra", "metasploit", "msfconsole",
            "burpsuite", "wireshark", "tcpdump", "netcat", "nc", "socat",
            "john", "hashcat", "aircrack-ng",
            "enum4linux", "enum4linux-ng", "smbmap", "rpcclient", "nbtscan",
            "crackmapexec", "netexec", "evil-winrm", "impacket",
            "whatweb", "wafw00f", "wpscan",
            "amass", "subfinder", "assetfinder", "dnsx", "httpx", "katana",
            "gau", "waybackurls", "arjun", "paramspider", "dalfox",
            "proxychains", "radare2", "gdb", "pwntools", "ghidra",
            "binwalk", "checksec", "ropper", "ropgadget",
            "responder", "bettercap", "python3", "curl", "wget", "docker",
        ]
        for i in range(0, len(kali_tools), 10):
            ctx_lines.append("  " + " | ".join(kali_tools[i:i+10]))
        # Enrich with live HexStrike telemetry
        try:
            telemetry = self.get_telemetry()
            if telemetry.get("success") is not False:
                procs = telemetry.get("active_processes", [])
                if procs:
                    ctx_lines.append(f"\nActive HexStrike Processes: {len(procs)}")
                    for p in procs[:3]:
                        ctx_lines.append(f"  - PID {p.get('pid','?')}: {str(p.get('command','?'))[:50]}")
        except Exception:
            pass
        ctx_lines.append("\n### End Environment Context ###")
        return "\n".join(ctx_lines)

    def analyze_target(self, target: str, context: str = "") -> Dict[str, Any]:
        """Use HexStrike Intelligence Engine to analyze a target."""
        try:
            response = self.session.post(
                f"{self.base_url}/api/intelligence/analyze-target",
                json={"target": target, "context": context},
                timeout=60
            )
            response.raise_for_status()
            logger.info(f"Target analysis received for: {target}")
            return response.json()
        except Exception as e:
            logger.error(f"Failed to analyze target: {e}")
            return {"success": False, "error": str(e), "target": target}

    def smart_scan(self, target: str, scan_type: str = "network_discovery", context: str = "") -> Dict[str, Any]:
        """
        Execute intelligent scan using HexStrike decision engine.
        scan_type: network_discovery | web_reconnaissance | vulnerability_assessment |
                   api_testing | comprehensive_network_pentest
        """
        try:
            logger.info(f"Smart scan: type={scan_type}, target={target}")
            response = self.session.post(
                f"{self.base_url}/api/intelligence/smart-scan",
                json={"target": target, "scan_type": scan_type, "context": context},
                timeout=300
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            return {"success": False, "error": f"Smart scan timed out for: {target}"}
        except Exception as e:
            logger.error(f"Smart scan failed: {e}")
            return {"success": False, "error": str(e)}

    def run_bugbounty_workflow(self, workflow: str, target: str, **kwargs) -> Dict[str, Any]:
        """
        Run a specialized BugBounty workflow via HexStrike.
        workflow: reconnaissance-workflow | vulnerability-hunting-workflow |
                  osint-workflow | business-logic-workflow | comprehensive-assessment
        """
        try:
            payload = {"target": target, **kwargs}
            logger.info(f"BugBounty workflow '{workflow}' for: {target}")
            response = self.session.post(
                f"{self.base_url}/api/bugbounty/{workflow}",
                json=payload,
                timeout=600
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            return {"success": False, "error": f"BugBounty workflow '{workflow}' timed out"}
        except Exception as e:
            logger.error(f"BugBounty workflow '{workflow}' failed: {e}")
            return {"success": False, "error": str(e)}

    def execute_async(self, command: str, timeout: int = 300) -> Dict[str, Any]:
        """
        Execute command asynchronously allowing long-running operations
        Executa comando assincronamente permitindo operações longas
        """
        try:
            logger.info(f"Executing async command: {command[:50]}")
            response = self.session.post(
                f"{self.base_url}/api/process/execute-async",
                json={"command": command, "timeout": timeout},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to start async execution: {e}")
            return {"success": False, "error": str(e)}

    def poll_task_result(self, task_id: str) -> Dict[str, Any]:
        """
        Poll result of an async task
        Faz poll do resultado de uma tarefa assíncrona
        """
        try:
            response = self.session.get(
                f"{self.base_url}/api/process/get-task-result/{task_id}",
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to poll task {task_id}: {e}")
            return {"success": False, "error": str(e)}

    def terminate_process(self, pid: int) -> Dict[str, Any]:
        """
        Terminate a specific running process
        Termina um processo em execução específico
        """
        try:
            logger.info(f"Terminating target process PID: {pid}")
            response = self.session.post(
                f"{self.base_url}/api/processes/terminate/{pid}", 
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to terminate process {pid}: {e}")
            return {"success": False, "error": str(e)}

    # === FASE B: Process Management Extensions ===
    
    def list_processes(self) -> Dict[str, Any]:
        """List active async processes"""
        try:
            response = self.session.get(f"{self.base_url}/api/processes/list", timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_dashboard(self) -> Dict[str, Any]:
        """Get processes dashboard metrics"""
        try:
            response = self.session.get(f"{self.base_url}/api/processes/dashboard", timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def pause_process(self, pid: int) -> Dict[str, Any]:
        """Pause a running process"""
        try:
            response = self.session.post(f"{self.base_url}/api/processes/pause/{pid}", timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def resume_process(self, pid: int) -> Dict[str, Any]:
        """Resume a paused process"""
        try:
            response = self.session.post(f"{self.base_url}/api/processes/resume/{pid}", timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    # === FASE B: CTF & Vulnerability Intel Extensions ===

    def run_ctf_workflow(self, workflow_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Run a specialized CTF workflow (e.g. create-challenge-workflow)"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/ctf/{workflow_type}",
                json=params,
                timeout=600
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def suggest_ctf_tools(self, category: str) -> Dict[str, Any]:
        """Suggest tools for a CTF category"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/ctf/suggest-tools",
                json={"category": category},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def monitor_cve(self, target: str) -> Dict[str, Any]:
        """Monitor CVEs for a given target"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/vuln-intel/cve-monitor",
                json={"target": target},
                timeout=120
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_exploit(self, cve_id: str) -> Dict[str, Any]:
        """Generate/suggest exploit payload for a CVE"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/vuln-intel/exploit-generate",
                json={"cve_id": cve_id},
                timeout=120
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_threat_feeds(self) -> Dict[str, Any]:
        """Get latest threat feeds"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/vuln-intel/threat-feeds",
                json={},
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    # === FASE B: Visual / Reporting Extensions ===

    def get_vulnerability_card(self, vulnerability_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a vulnerability card report"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/visual/vulnerability-card",
                json=vulnerability_data,
                timeout=60
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_summary_report(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary report from scan results"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/visual/summary-report",
                json={"results": results},
                timeout=120
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_tool_schema(self, tool_name: str) -> Dict[str, Any]:
        """Get schema for a specific tool if available"""
        try:
            response = self.session.get(f"{self.base_url}/api/tools/{tool_name}/schema", timeout=10)
            if response.status_code == 404:
                return {"success": False, "error": "Schema not found for this tool"}
            response.raise_for_status()
            return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}

    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return f"HexStrikeClient(url='{self.base_url}')"
