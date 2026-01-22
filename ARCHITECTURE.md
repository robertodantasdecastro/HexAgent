# HexAgentGUI - Architecture Documentation (v2.0.0)
## Documentação de Arquitetura (v2.0.0)

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
        GUI --> |Hooks| UseChat[useChatManager]
        UseChat --> |Uses| API[APIClient (Singleton)]
    end

    subgraph Backend Services (Flask)
        API --> |HTTP JSON| Controller[Controllers (Blueprints)]
        Controller --> |Calls| ServiceLayer[Service Layer]
        
        ServiceLayer --> |Config| ConfigService[Config Services]
        ConfigService --> |Read/Write| JSONUtils[JSON Files (~/.hexagent-gui)]
        
        ServiceLayer --> |Orchestrate| AgentCore[AgentCore (Brain)]
        AgentCore --> |Inference| AIProvider[AI Provider Factory]
        AgentCore --> |Execute| HexStrike[HexStrike Client]
    end
    
    subgraph Execution
        HexStrike --> |HTTP| HexServer[HexStrike Server (Port 8888)]
        HexServer --> |Subprocess| Tools[Security Tools (Nmap, etc)]
        AIProvider --> |API| LLM[LLM (Local/Cloud)]
    end
```

---

## 📦 Component Breakdown / Detalhamento de Componentes

### 1. Frontend Layer (React + Electron)

**Core Components:**
- **`App.jsx`**: Main Orchestrator. Manages Layout and Global Modals.
- **`APIClient.js`**: Singleton Facade for all HTTP communications. Handles retries and error parsing.
- **`SessionService.js`**: Repository pattern for Chat Session management.
- **`AIConfigModal.jsx`**: Dynamic settings for AI Engines (Online/Offline).

### 2. Backend Layer (Python/Flask)

**Controllers (Blueprints):**
- **`ConfigController`**: Splitted into `/system` and `/ai` endpoints.
- **`ChatController`**: Bridge to AgentCore for message processing.
- **`SystemController`**: OS-level operations (Clipboard, Browser).

**Services (OOP):**
- **`AIConfigService`**: Manages `ai-config.json` via simplified I/O.
- **`SystemConfigService`**: Manages `system-config.json` via simplified I/O.
- **`AgentCore`**: The "Brain" class. Maintains conversation context and orchestrates the Iteration Loop (Think -> Tool -> Observe).

### 3. Data Persistence / Persistência de Dados

All user data is stored in `~/.hexagent-gui` (Linux Standard Base compliance):
- `ai-config.json`: Private keys and model selection.
- `system-config.json`: Theme, UI preferences.
- `sessions/`: JSON dumps of chat histories.

---

## 🛠️ Technology Stack / Pilha Tecnológica

### Frontend
| Technology | Purpose | Propósito |
|-----------|---------|-----------|
| **React 18.3** | UI framework | Framework de UI |
| **Vite 5.3** | Build tool | Ferramenta de build |
| **TailwindCSS 3.4** | Styling | Estilização |
| **Electron 31.0** | Desktop app | Aplicativo desktop |

### Backend
| Technology | Purpose | Propósito |
|-----------|---------|-----------|
| **Python 3.13** | Runtime | Runtime |
| **Flask 3.1** | Web framework | Framework web |
| **Requests** | HTTP Client | Cliente HTTP |
| **Subprocess** | Command execution | Execução de comandos |

---

## 🔄 Lifecycle Management / Gerenciamento de Ciclo de Vida

1.  **Startup (`start.sh`)**:
    *   Launches `hexstrike-ai` (Port 8888).
    *   Launches `server.py` (Port 5000).
    *   Launches Electron.

2.  **Initialization (`useBackendInit`)**:
    *   Connects to Backend.
    *   Loads Configuration.
    *   Initializes AgentCore (Hot-Reloadable).

3.  **Shutdown**:
    *   Electron close triggers `shutdown` endpoint.
    *   Backend kills child processes (Watchdog).

---

**Last Updated:** 2026-01-21
**Version:** 2.0.0 (AgentCore Integration)
**Maintainer:** Roberto Dantas de Castro
