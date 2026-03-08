"""
Response Block Domain Model
Modelo de Domínio de Blocos de Resposta

Generic structure for all AI->GUI communication.
Estrutura genérica para toda comunicação IA->GUI.

@author: Roberto Dantas de Castro
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import json
import time

class ResponseBlock(ABC):
    """
    Abstract Base Class for Response Blocks.
    Classe Base Abstrata para Blocos de Resposta.
    """
    
    def __init__(self, block_type: str, content: str = "", metadata: Optional[Dict[str, Any]] = None):
        self.type = block_type
        self.content = content
        self.metadata = metadata or {}
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "type": self.type,
            "content": self.content,
            "metadata": self.metadata,
            "timestamp": self.timestamp
        }
    
    def to_sse(self) -> str:
        """Convert to SSE string format."""
        return f"data: {json.dumps(self.to_dict())}\n\n"

class TextBlock(ResponseBlock):
    """Standard narrative text."""
    def __init__(self, content: str, iteration: int = 1):
        super().__init__("text", content, {"iteration": iteration})

class ThinkingBlock(ResponseBlock):
    """Chain of Thought / Reflection."""
    def __init__(self, content: str, iteration: int = 1):
        super().__init__("thinking", content, {"iteration": iteration})

class CommandBlock(ResponseBlock):
    """Proposed Command."""
    def __init__(self, command: str, auto_execute: bool = False):
        super().__init__("command_proposal", command, {"auto_execute": auto_execute})

class ToolCallBlock(ResponseBlock):
    """Proposed Tool Call (Native Function)."""
    def __init__(self, tool_name: str, arguments: Dict[str, Any], auto_execute: bool = False):
        super().__init__("tool_call", tool_name, {
            "auto_execute": auto_execute,
            "tool_name": tool_name,
            "arguments": arguments
        })

class ResultBlock(ResponseBlock):
    """Execution Result."""
    def __init__(self, output: str, success: bool, exit_code: int, command: str):
        # Maps to 'command_result' handler in useChatManager.js
        # Triggers updateActiveBlock + completeActiveBlock({success, exit_code})
        super().__init__("command_result", output, {
            "success": success, 
            "exit_code": exit_code,
            "command": command
        })

class AnalysisBlock(ResponseBlock):
    """AI Analysis of Results."""
    def __init__(self, content: str, mood: str = "neutral"):
        super().__init__("analysis", content, {"mood": mood})

class SuggestionBlock(ResponseBlock):
    """Next Steps Suggestions."""
    def __init__(self, suggestions: list):
        # suggestions can be a list of strings or dicts
        super().__init__("suggestion", json.dumps(suggestions) if isinstance(suggestions, list) else suggestions, {})


class ErrorBlock(ResponseBlock):
    """System Error."""
    def __init__(self, error_msg: str, source: str = "system"):
        super().__init__("error", error_msg, {"source": source})

class LifecycleBlock(ResponseBlock):
    """Block Start/End markers."""
    def __init__(self, lifecycle_type: str, block_name: str, meta: Dict = None):
        # lifecycle_type: 'block_start' or 'block_end'
        super().__init__(lifecycle_type, block_name, meta)
