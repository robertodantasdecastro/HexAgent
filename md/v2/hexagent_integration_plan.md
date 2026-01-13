# Hex Agent Integration Plan
# Plano de Integração dos Módulos Hex

**Date:** 2026-01-12 20:10  
**Objective:** Integrate HexSecGPT (AI) + HexStrike (Commands) into HexAgentGUI  
**Status:** PLANNING PHASE

---

## 🎯 Integration Goals

1. **Replace** simple OpenRouter call with HexSecGPT brain
2. **Add** HexStrike command execution capabilities
3. **Maintain** existing UI/UX
4. **Enable** iterative AI → Command → Feedback loop

---

## 📋 ARCHITECTURE ANALYSIS

### Current HexAgentGUI Backend:
```
backend/app.py
├── ConfigController
├── SystemController
├── ChatController  ← **MINIMAL** (just OpenRouter call)
├── SessionController
├── FileController
├── ServiceController
├── HistoryController
└── ProjectController
```

### HexSecGPT Structure:
```python
class HexSecBrain:
    - client: openai.OpenAI
    - model: str
    - history: List[Dict]
    - SYSTEM_PROMPT: str (hacker persona)
    
    Methods:
    - chat(user_input) → Generator[str]  # Streaming!
    - reset()  # Clear history
```

### HexStrike Structure:
```python
hexstrike_server.py (17K lines, 545 functions)

Key Components:
- execute_command(command) → Dict
- execute_command_with_recovery(tool, command, params)
- 100+ tool-specific endpoints

Important Endpoints:
- POST /api/command
- POST /execute_command_async
- GET /health
- POST /api/tools/{nmap, gobuster, nuclei, etc.}
```

---

## 🏗️ PROPOSED ARCHITECTURE

### New Backend Structure:

```
backend/
├── core/
│   ├── hex_brain.py         ← **NEW** (HexSecGPT integration)
│   ├── hex_strike_client.py ← **NEW** (HexStrike API client)
│   └── agent_core.py        ← **NEW** (Orchestrator)
│
├── controllers/
│   ├── chat_controller.py   ← **ENHANCED** (use AgentCore)
│   └── ... (existing)
│
└── app.py                    ← **MODIFIED** (inject deps)
```

---

## 📝 DETAILED DESIGN

### 1. HexBrain (AI Inference)

**File:** `backend/core/hex_brain.py`

```python
"""
HexBrain - AI Inference Engine
Módulo de Inferência IA

Based on HexSecGPT.py HexSecBrain class
Baseado na classe HexSecBrain de HexSecGPT.py
"""

import openai
from typing import Generator, List, Dict
import os

class HexBrain:
    """
    AI Inference Engine using OpenRouter/OpenAI
    Motor de Inferência IA usando OpenRouter/OpenAI
    """
    
    # Default system prompt (can be customized)
    DEFAULT_SYSTEM_PROMPT = """
You are HexAgent, an elite autonomous cybersecurity AI assistant.
    
Your capabilities:
- Analyze security problems
- Propose shell commands to investigate
- Interpret command output
- Iterate until task is complete

Format commands in bash codeblocks:
```bash
command here
```

Be concise, technical, and focused on solving the user's request.
"""
    
    def __init__(self, api_key: str = None, model: str = None, 
                 system_prompt: str = None):
        """
        Initialize AI brain
        
        Args:
            api_key: OpenRouter API key (defaults to env var)
            model: Model name (defaults to gemini-2.0-flash-exp:free)
            system_prompt: Custom system prompt
        """
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY') or os.getenv('API_KEY')
        
        if not self.api_key:
            raise ValueError("API key required")
        
        # Initialize OpenAI client with OpenRouter base URL
        self.client = openai.OpenAI(
            api_key=self.api_key,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://github.com/HexAgentGUI",
                "X-Title": "HexAgentGUI"
            }
        )
        
        self.model = model or "google/gemini-2.0-flash-exp:free"
        self.system_prompt = system_prompt or self.DEFAULT_SYSTEM_PROMPT
        
        # Conversation history
        self.history = [
            {"role": "system", "content": self.system_prompt}
        ]
    
    def chat(self, user_input: str, stream: bool = True) -> Generator[str, None, None]:
        """
        Send message to AI and get streaming response
        
        Args:
            user_input: User message
            stream: Enable streaming (default: True)
            
        Yields:
            Response chunks (if stream=True)
            
        Returns:
            Full response (if stream=False)
        """
        # Add user message to history
        self.history.append({"role": "user", "content": user_input})
        
        try:
            if stream:
                # Streaming response
                response_stream = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.history,
                    stream=True,
                    temperature=0.7
                )
                
                full_content = ""
                for chunk in response_stream:
                    content = chunk.choices[0].delta.content
                    if content:
                        full_content += content
                        yield content
                
                # Add assistant response to history
                self.history.append({"role": "assistant", "content": full_content})
            else:
                # Non-streaming response
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.history,
                    stream=False,
                    temperature=0.7
                )
                
                content = response.choices[0].message.content
                self.history.append({"role": "assistant", "content": content})
                yield content
                
        except Exception as e:
            error_msg = f"AI Error: {str(e)}"
            yield error_msg
    
    def reset(self):
        """Reset conversation history"""
        self.history = [
            {"role": "system", "content": self.system_prompt}
        ]
    
    def add_context(self, role: str, content: str):
        """
        Manually add context to history
        
        Args:
            role: 'user', 'assistant', or 'system'
            content: Message content
        """
        self.history.append({"role": role, "content": content})
```

---

### 2. HexStrike Client

**File:** `backend/core/hex_strike_client.py`

```python
"""
HexStrike Client - Command Execution Interface
Cliente HexStrike - Interface de Execução de Comandos

Communicates with HexStrike server API
Comunica com servidor API do HexStrike
"""

import requests
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class HexStrikeClient:
    """
    Client for HexStrike command execution server
    Cliente para servidor de execução de comandos HexStrike
    """
    
    def __init__(self, base_url: str = "http://localhost:8888"):
        """
        Initialize HexStrike client
        
        Args:
            base_url: HexStrike server URL (default: http://localhost:8888)
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check if HexStrike server is alive
        
        Returns:
            Health status dict
        """
        try:
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=5
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"HexStrike health check failed: {e}")
            return {"status": "error", "message": str(e)}
    
    def execute_command(self, command: str, timeout: int = 60) -> Dict[str, Any]:
        """
        Execute shell command via HexStrike
        
        Args:
            command: Shell command to execute
            timeout: Execution timeout in seconds
            
        Returns:
            {
                "success": bool,
                "command": str,
                "output": str,
                "error": str (if failed),
                "exit_code": int
            }
        """
        try:
            logger.info(f"Executing command: {command}")
            
            response = self.session.post(
                f"{self.base_url}/api/command",
                json={"command": command},
                timeout=timeout
            )
            
            response.raise_for_status()
            data = response.json()
            
            return {
                "success": data.get("success", False),
                "command": command,
                "output": data.get("output", "") or data.get("stdout", ""),
                "error": data.get("error", ""),
                "exit_code": data.get("exit_code", 0)
            }
            
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": f"Command timed out after {timeout}s",
                "exit_code": -1
            }
        except Exception as e:
            logger.error(f"Command execution failed: {e}")
            return {
                "success": False,
                "command": command,
                "output": "",
                "error": str(e),
                "exit_code": -1
            }
    
    def execute_tool(self, tool_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute specific security tool
        
        Args:
            tool_name: Tool name (e.g., 'nmap', 'nuclei')
            parameters: Tool-specific parameters
            
        Returns:
            Tool execution result
        """
        try:
            endpoint = f"/api/tools/{tool_name}"
            response = self.session.post(
                f"{self.base_url}{endpoint}",
                json=parameters,
                timeout=300  # 5 min for tools
            )
            
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error(f"Tool {tool_name} execution failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
```

---

### 3. Agent Core (Orchestrator)

**File:** `backend/core/agent_core.py`

```python
"""
AgentCore - Main Orchestration Engine
AgentCore - Motor Principal de Orquestração

Coordinates AI brain + Command execution
Coordena cérebro IA + Execução de comandos
"""

from typing import Generator, Dict, Any, Optional
import re
import logging
from .hex_brain import HexBrain
from .hex_strike_client import HexStrikeClient

logger = logging.getLogger(__name__)

class AgentCore:
    """
    Main orchestration engine combining AI + Commands
    Motor principal combinando IA + Comandos
    """
    
    def __init__(self, api_key: str = None, hexstrike_url: str = None):
        """
        Initialize Agent Core
        
        Args:
            api_key: OpenRouter API key
            hexstrike_url: HexStrike server URL
        """
        # Initialize AI brain
        self.brain = HexBrain(api_key=api_key)
        
        # Initialize command executor
        self.hexstrike = HexStrikeClient(
            base_url=hexstrike_url or "http://localhost:8888"
        )
        
        # Check HexStrike availability
        health = self.hexstrike.health_check()
        self.hexstrike_available = health.get("status") != "error"
        
        if not self.hexstrike_available:
            logger.warning("HexStrike not available - commands will be disabled")
    
    def process_message(self, user_input: str, auto_execute: bool = False,
                       max_iterations: int = 10) -> Generator[Dict[str, Any], None, None]:
        """
        Process user message with AI and optionally execute commands
        
        Args:
            user_input: User message
            auto_execute: Automatically execute proposed commands
            max_iterations: Maximum AI → Command → AI iterations
            
        Yields:
            Response chunks:
            {
                "type": "text" | "command_proposal" | "command_result",
                "content": str,
                "metadata": dict
            }
        """
        iteration = 0
        
        while iteration < max_iterations:
            iteration += 1
            
            # Get AI response
            logger.info(f"Iteration {iteration}/{max_iterations}")
            
            full_response = ""
            for chunk in self.brain.chat(user_input, stream=True):
                full_response += chunk
                yield {
                    "type": "text",
                    "content": chunk,
                    "metadata": {"iteration": iteration}
                }
            
            # Extract commands from response
            commands = self._extract_commands(full_response)
            
            if not commands:
                # No commands to execute, we're done
                logger.info("No commands found, stopping")
                break
            
            # Process each command
            for cmd in commands:
                # Yield command proposal
                yield {
                    "type": "command_proposal",
                    "content": cmd,
                    "metadata": {
                        "iteration": iteration,
                        "auto_execute": auto_execute
                    }
                }
                
                # Execute if auto-execute or user approves
                if auto_execute and self.hexstrike_available:
                    result = self.hexstrike.execute_command(cmd)
                    
                    # Yield command result
                    yield {
                        "type": "command_result",
                        "content": result["output"],
                        "metadata": {
                            "command": cmd,
                            "success": result["success"],
                            "exit_code": result["exit_code"],
                            "error": result["error"]
                        }
                    }
                    
                    # Add result to AI context for next iteration
                    context_msg = f"Command executed: `{cmd}`\n\nOutput:\n{result['output']}"
                    if result['error']:
                        context_msg += f"\n\nError: {result['error']}"
                    
                    self.brain.add_context("user", context_msg)
                    user_input = "Analyze the output and continue."
            
            # If no auto-execute, stop iterating
            if not auto_execute:
                break
        
        # Yield completion marker
        yield {
            "type": "complete",
            "content": "",
            "metadata": {"iterations": iteration}
        }
    
    def _extract_commands(self, text: str) -> list:
        """
        Extract bash commands from AI response
        
        Looks for:
        ```bash
        command here
        ```
        
        Returns:
            List of commands
        """
        # Regex to match bash code blocks
        pattern = r'```(?:bash|sh)\n(.*?)\n```'
        matches = re.findall(pattern, text, re.DOTALL)
        
        commands = []
        for match in matches:
            # Split multi-line commands
            for line in match.split('\n'):
                line = line.strip()
                if line and not line.startswith('#'):
                    commands.append(line)
        
        return commands
    
    def reset(self):
        """Reset AI conversation"""
        self.brain.reset()
```

---

## 🔧 IMPLEMENTATION STEPS

### Phase 1: Core Modules (2-3 hours)

1. ✅ Create `backend/core/` directory
2. ✅ Implement `hex_brain.py`
3. ✅ Implement `hex_strike_client.py`
4. ✅ Implement `agent_core.py`
5. ✅ Add unit tests

### Phase 2: Controller Integration (1-2 hours)

6. ✅ Modify `chat_controller.py`:

```python
# backend/controllers/chat_controller.py

from core.agent_core import AgentCore

class ChatController(BaseController):
    def __init__(self, core_ref=None):
        self.agent_core = core_ref  # AgentCore instance
        super().__init__(...)
    
    def _register_routes(self):
        @self.blueprint.route('/chat', methods=['POST'])
        def process_chat():
            # Get request data
            data = self.get_request_data()
            prompt = data.get('prompt')
            auto_execute = data.get('options', {}).get('auto_execute', False)
            max_iterations = data.get('options', {}).get('max_iterations', 10)
            
            # Process with AgentCore
            def generate():
                for chunk in self.agent_core.process_message(
                    prompt, auto_execute, max_iterations
                ):
                    yield json.dumps(chunk) + '\n'
            
            return Response(generate(), mimetype='application/json')
```

7. ✅ Modify `app.py` to inject AgentCore:

```python
# backend/app.py

from core.agent_core import AgentCore

def create_app():
    app = Flask(__name__)
    
    # Initialize AgentCore
    try:
        agent_core = AgentCore()
    except Exception as e:
        logger.warning(f"AgentCore init failed: {e}")
        agent_core = None
    
    # Register controllers with core reference
    chat_controller = ChatController(core_ref=agent_core)
    app.register_blueprint(chat_controller.blueprint)
    
    return app
```

### Phase 3: Testing (1 hour)

8. ✅ Test AI-only mode (no commands)
9. ✅ Test command extraction
10. ✅ Test with HexStrike integration
11. ✅ Test iteration limits
12. ✅ Test error handling

### Phase 4: Frontend Updates (1 hour)

13. ✅ Update frontend to handle streaming chunks
14. ✅ Display command proposals
15. ✅ Add manual approve/reject UI

---

## ⚙️ CONFIGURATION

### Environment Variables:

```bash
# AI Configuration
OPENROUTER_API_KEY=sk-or-v1-xxx...

# HexStrike Configuration
HEXSTRIKE_URL=http://localhost:8888
HEXSTRIKE_ENABLED=true

# Agent Configuration
MAX_ITERATIONS=10
AUTO_EXECUTE=false
```

### Config File:

```json
{
  "ai": {
    "api_key": "",
    "model": "google/gemini-2.0-flash-exp:free",
    "max_iterations": 10,
    "auto_execute": false
  },
  "hexstrike": {
    "url": "http://localhost:8888",
    "enabled": true,
    "timeout": 60
  }
}
```

---

## 🧪 TESTING STRATEGY

### Unit Tests:

```python
# tests/test_hex_brain.py
def test_brain_initialization():
    brain = HexBrain(api_key="test-key")
    assert brain.model == "google/gemini-2.0-flash-exp:free"

def test_brain_chat():
    brain = HexBrain(api_key="test-key")
    response = list(brain.chat("Hello", stream=False))
    assert len(response) > 0

# tests/test_hex_strike_client.py
def test_client_health():
    client = HexStrikeClient()
    result = client.health_check()
    assert "status" in result

# tests/test_agent_core.py
def test_command_extraction():
    core = AgentCore(api_key="test-key")
    commands = core._extract_commands("```bash\nls -la\n```")
    assert "ls -la" in commands
```

---

## 📊 BENEFITS

### 1. **Modular Architecture** ✅
- Each component has single responsibility
- Easy to test independently
- Can swap AI providers easily

### 2. **Backwards Compatible** ✅
- Old ChatController can coexist
- Gradual migration possible
- No breaking changes

### 3. **Feature-Rich** ✅
- Streaming AI responses
- Command execution
- Iterative problem solving
- Context awareness

### 4. **Production Ready** ✅
- Error handling
- Logging
- Health checks
- Timeouts

---

## 🚀 TIMELINE

| Phase | Duration | Description |
|-------|----------|-------------|
| 1 | 2-3h | Core modules implementation |
| 2 | 1-2h | Controller integration |
| 3 | 1h | Testing |
| 4 | 1h | Frontend updates |
| **Total** | **5-7h** | Complete integration |

---

## ⚠️ RISKS & MITIGATIONS

### Risk 1: HexStrike Server Down
**Impact:** Commands won't execute  
**Mitigation:** Graceful degradation (AI-only mode)

### Risk 2: API Key Invalid
**Impact:** AI won't work  
**Mitigation:** Clear error messages, config UI

### Risk 3: Infinite Loops
**Impact:** Resource exhaustion  
**Mitigation:** Hard limit on iterations (max_iterations)

---

## ✅ ACCEPTANCE CRITERIA

- [ ] AI responds with streaming
- [ ] Commands extracted from response
- [ ] Commands execute via HexStrike
- [ ] Results feed back to AI
- [ ] UI displays all interactions
- [ ] Error handling works
- [ ] Config persists
- [ ] Tests pass

---

**Status:** Ready to implement  
**Next:** Create core modules
