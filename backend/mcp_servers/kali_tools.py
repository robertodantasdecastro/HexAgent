"""
Kali Tools MCP Server
Servidor MCP Ferramentas Kali

Provides security tools access via MCP.
Fornece acesso a ferramentas de segurança via MCP.
"""
import asyncio
import subprocess
import shutil
from typing import Any, List, Dict

from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
# Inicializar Servidor FastMCP
mcp = FastMCP("kali-tools")

@mcp.tool()
def check_tool_installed(tool_name: str) -> str:
    """
    Check if a Kali tool is installed.
    Verificar se ferramenta Kali está instalada.
    """
    path = shutil.which(tool_name)
    return f"Tool {tool_name} found at {path}" if path else f"Tool {tool_name} not found"

@mcp.tool()
def ping_host(host: str, count: int = 4) -> str:
    """
    Ping a host to check reachability.
    Pingar um host para verificar conectividade.
    """
    try:
        cmd = ["ping", "-c", str(count), host]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.stdout
    except Exception as e:
        return f"Ping failed: {e}"

if __name__ == "__main__":
    mcp.run()
