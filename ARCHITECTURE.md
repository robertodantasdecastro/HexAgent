# HexAgentGUI - Architecture Documentation (v2.1.0)
## Documentação de Arquitetura (v2.1.0)

> **System architecture and technical design**  
> **Arquitetura do sistema e design técnico**

---

## 🏗️ High-Level Architecture / Arquitetura de Alto Nível

```mermaid
graph TD
    User[User / Usuário] --> |Interacts| GUI[Electron Frontend (React)]
    
    subgraph Frontend Logic
        GUI --> |Hooks| UseAI[useAIConfig]
        GUI --> |Hooks| UseSys[useSystemConfig]
        GUI --> |Render| Blocks[Inference Blocks]
        Blocks --> |Thinking| ThinkBlk[ThinkingBlock]
        Blocks --> |Visual| ShellBlk[ShellBlock]
        UseAI --> |Context| AIContext
    end

    subgraph Backend Services (Flask)
        GUI --> |SSE Stream| ChatCtrl[ChatController]
        ChatCtrl --> |Orchestrate| AgentCore[AgentCore (Brain)]
        
        AgentCore --> |Manage| Orchestrator[Orchestrator Loop]
        Orchestrator --> |AI Strategy| ProviderFactory
        Orchestrator --> |Command| HexStrikeClient
        Orchestrator --> |Tools| MCPManager
        
        HexStrikeClient --> |HTTP| HexServer[HexStrike Server (Port 8888)]
    end
    
    subgraph Execution Layer
        HexServer --> |Subprocess| ZSH[ZSH Shell / Tools]
        ProviderFactory --> |API| ExternalAI[OpenAI / OpenRouter / Local]
    end
```

---

## 📦 Component Breakdown / Detalhamento de Componentes

### 1. Frontend Layer (React + Electron)
**Core Orchestrator:**
- **`App.jsx`**: Global State Holder (Context Provider).

**Inference Block System (New Architecture):**
The Chat Interface will be refactored from a simple list to a **State Machine of Blocks**:
1.  **`InputBlock`**: 
    - *State:* Editing / Frozen. 
    - *Func:* User types prompt. During execution, it freezes. Editing it sends an `abort` signal and starts a new branch.
2.  **`ThinkingBlock`**: 
    - *State:* Streaming / Collapsed / Expanded.
    - *Func:* Visualizes the "Chain of Thought" (CoT). Hidden by default (Kernel Debug mode).
3.  **`ProposalBlock`**:
    - *State:* Waiting Approval / Auto-Executing / Rejected.
    - *Func:* Shows the command to be run.
4.  **`ShellBlock`**:
    - *State:* Running / Completed / Interacting.
    - *Func:* `xterm.js` instance connected to `HexStrikeClient` PTY. Real-time ZSH emulation.
5.  **`NarrativeBlock`**:
    - *State:* Streaming / Static.
    - *Func:* Final markdown response explaining the result.

**State Sync:**
- `useBlockManager`: Custom hook to manage the lifecycle of these blocks based on SSE events.

### 2. Backend Layer (Python/Flask)

**Controllers (Blueprints):**
- **`ChatController`**: Manages the SSE Stream and Command Execution.
- **`ConfigController`**: `/system` and `/ai` configuration endpoints.

**Core (OOP):**
- **`AgentCore.py`**: The central brain.
- **`Orchestrator.py`**: Manages the `Think -> Act -> Observe` loop. Implements Safety Triggers (Max Iterations).
- **`ProviderFactory.py`**: Strategy Pattern for AI Providers.
- **`HexStrikeClient.py`**: Proxy to the local HexStrike Security Server.

### 3. Workflow Layer (New)
*   **`WorkflowService`**: Manages specialized mission templates (Pentest, OSINT, RevEng).
*   **Templates**: JSON definitions in `~/.hexagent-gui/workflows/`.

### 4. Data Persistence / Persistência de Dados

All user data is stored in `~/.hexagent-gui`:
- `ai-config.json`: Private keys and model selection.
- `system-config.json`: Theme, UI preferences.
- `sessions/`: JSON dumps of chat histories.
- `workflows/`: Custom mission templates.

---

## 🔄 Execution Flow (Cyberpunk Inference) / Fluxo de Execução

1.  **User Input**: Typed in `InputBlock` or triggered via `WorkflowModal`.
2.  **Dispatch**: Sent to `POST /chat`.
3.  **Reasoning**: `Orchestrator` yields "Thinking" events (visible in `ThinkingBlock`).
4.  **Proposal**: AI proposes a command (visible as "Proposal" in `ShellBlock`).
5.  **Execution**: If Auto-Run is ON, `HexStrikeClient` executes command.
6.  **Observation**: Output is streamed back (visible in `ShellBlock`).
7.  **Synthesis**: AI analyzes result and provides `NarrativeBlock`.

---

**Last Updated:** 2026-01-28
**Version:** 2.1.0 (Inference Blocks & Workflows Implemented)
**Maintainer:** Roberto Dantas de Castro
