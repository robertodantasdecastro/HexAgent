"""
Kali Linux MCP Server
Servidor MCP Kali Linux

Exposes Kali Linux offensive security tools as MCP resources.
Exponha ferramentas de segurança ofensiva do Kali Linux como recursos MCP.

Tools:
- nmap: Network Scanner
- whois: Domain Information
- gobuster: Directory/DNS Brute-forcing
"""

from mcp.server.fastmcp import FastMCP
import subprocess
import shutil
import logging
from typing import List, Optional

# Initialize FastMCP Server
mcp = FastMCP("kali-tools")
logger = logging.getLogger("kali-tools")

# ============================================================================
# UTILITIES / UTILITÁRIOS
# ============================================================================

def run_command(command: List[str]) -> str:
    """Helper to run shell commands safely"""
    executable = shutil.which(command[0])
    if not executable:
        return f"Error: Command '{command[0]}' not found in PATH."
    
    try:
        # Capture both stdout and stderr
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=300 # 5 min timeout
        )
        if result.returncode != 0:
            return f"Command failed (Exit Code {result.returncode}):\n{result.stderr}"
        
        return result.stdout
    except subprocess.TimeoutExpired:
        return "Error: Command timed out."
    except Exception as e:
        return f"Error executing command: {str(e)}"

# ============================================================================
# TOOLS / FERRAMENTAS
# ============================================================================

@mcp.tool()
def nmap_scan(target: str, arguments: str = "-F") -> str:
    """
    Run Nmap Network Scanner against a target.
    Executar Nmap Network Scanner contra um alvo.
    
    Args:
        target: IP address or hostname / Endereço IP ou hostname
        arguments: Nmap flags (default: -F for fast scan) / Flags do Nmap (padrão: -F)
    """
    # Security: Sanitization would be here. For purely local agent, we trust the agent's intent 
    # but block dangerous flags if needed.
    
    # Simple validation
    if any(c in target for c in [';', '&', '|', '`']):
        return "Error: Invalid characters in target."
        
    cmd = ["nmap", target]
    
    # Split args safely
    if arguments:
        args_list = arguments.split(" ")
        cmd.extend([a for a in args_list if a])
        
    return run_command(cmd)

@mcp.tool()
def whois_lookup(domain: str) -> str:
    """
    Perform a WHOIS lookup for domain information.
    Realizar consulta WHOIS para informações de domínio.
    """
    if any(c in domain for c in [';', '&', '|', '`']):
        return "Error: Invalid characters in domain."
        
    return run_command(["whois", domain])

@mcp.tool()
def gobuster_dir(url: str, wordlist: str = "/usr/share/wordlists/dirb/common.txt") -> str:
    """
    Run Gobuster for directory enumeration.
    Executar Gobuster para enumeração de diretórios.
    
    Args:
        url: Target URL / URL Alvo
        wordlist: Path to wordlist / Caminho da wordlist
    """
    # Verify wordlist exists
    import os
    if not os.path.exists(wordlist):
        return f"Error: Wordlist not found at {wordlist}"
        
    cmd = ["gobuster", "dir", "-u", url, "-w", wordlist, "--no-color", "-z"]
    return run_command(cmd)

# Add more tools here as needed (metasploit, hydra, etc.)

if __name__ == "__main__":
    # Run the server via stdio
    mcp.run()
