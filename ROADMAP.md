# HexAgentGUI - Strategic Development Roadmap / Roteiro Estratégico de Desenvolvimento

> **Last Updated / Última Atualização:** 2026-01-23
> **Project Identity:** HexStrike-AI Interface
> **Status:** Refactoring & Evolution / Refatoração e Evolução

---

## 🎯 Executive Vision / Visão Executiva

**HexAgentGUI** is the official cross-platform interface for the **HexStrike-AI** ecosystem. It bridges local LLM intelligence with offensive security tools (Kali Linux), operating on a strict OOP architecture with bilingual documentation.

**HexAgentGUI** é a interface oficial multiplataforma para o ecossistema **HexStrike-AI**. Ela conecta inteligência LLM local com ferramentas de segurança ofensiva (Kali Linux), operando sobre uma arquitetura POO estrita com documentação bilíngue.

---

## 📅 MILESTONE 1: Stability & Foundation (Refactor)
**Focus:** Code Hygiene, OOP, Rebranding
**Foco:** Higiene de Código, POO, Rebranding

### 1.1 "HexSecGPT" Extinction / Extinção do "HexSecGPT"
*   **Objective:** Remove all legacy references to "HexSecGPT". Rename to **HexStrike-AI**.
*   **Actions:**
    *   Refactor `backend/core/hex_brain.py` and references.
    *   Update `locales/*.json` (UI Text).
    *   Update all docstrings and comments.

### 1.2 OOP Enforcement / Aplicação de POO
*   **Objective:** Convert procedural scripts in `src/` to Class-based Services.
*   **Actions:**
    *   Refactor `install.sh` logic (where applicable) or ensure robust setup classes in Python/JS.
    *   Ensure `ChatService.js`, `ConfigService.js` follow Singleton/Factory patterns.

### 1.3 Variable Synchronization / Sincronização de Variáveis
*   **Objective:** Map all GUI states to persistent config.
*   **Actions:**
    *   Audit `~/.hexagent-gui/` persistence.
    *   Ensure `system-config.json` and `ai-config.json` are fully synced with UI switches.

---

## 📅 MILESTONE 2: MCP Ecosystem Integration
**Focus:** Extensibility & Tooling
**Foco:** Extensibilidade e Ferramentas

### 2.1 File System Authority (`mcp-filesystem`)
*   **Objective:** Safe access to local files for analysis.
*   **Actions:**
    *   Integrate `mcp-filesystem` server.
    *   Implement "File Explorer" tab in GUI.
    *   Security scoping (Sandboxing).

### 2.2 Kali Linux Bridge (`mcp-kali-server`)
*   **Objective:** Expose Kali tools as MCP resources.
*   **Actions:**
    *   Develop `mcp-kali-server` (Python/FastAPI).
    *   Wrap `nmap`, `gobuster`, `metasploit` (RPC).
    *   Standardize JSON outputs for LLM parsing.

---

## 📅 MILESTONE 3: Passive Monitoring (The Watchdog)
**Focus:** Awareness & Defense
**Foco:** Consciência e Defesa

### 3.1 NetWatcher Service
*   **Objective:** Background network traffic analysis.
*   **Actions:**
    *   Implement `NetWatcher` class (Raw Sockets).
    *   Passive ARP monitoring.
    *   Outbound traffic anomaly detection.

### 3.2 Event Bus & Alerts
*   **Objective:** Real-time user notifications.
*   **Actions:**
    *   Backend `EventBus` implementation.
    *   WebSocket push to GUI.
    *   Configurable alert rules (e.g., "New Port Opened").

---

## 📅 MILESTONE 4: Dynamic Personalization
**Focus:** Adaptability
**Foco:** Adaptabilidade

### 4.1 Behavior Profiles / Perfis de Comportamento
*   **Objective:** Context-switching for different operational modes.
*   **Profiles:**
    *   🕵️ **Stealth**: Passive recon only.
    *   ⚔️ **Assault**: Active exploitation allowed.
    *   🛡️ **Defense**: Hardening and analysis.

### 4.2 Dynamic Context / Contexto Dinâmico
*   **Objective:** Inject profile-specific rules into LLM context.
*   **Actions:**
    *   `ProfileManager` service.
    *   Dynamic System Prompt injection based on active profile.

---

## 🛠️ Technical Standards / Padrões Técnicos

1.  **Language:** English (Primary) + Portuguese-BR (Secondary) in all comments/docs.
2.  **Architecture:** Strict OOP (Classes, Interfaces).
3.  **Persistence:** All state must survive restarts via `~/.hexagent-gui/`.
4.  **Error Handling:** Graceful degradation (GUI must work even if Backend is offline).

---

## 🚀 RECENT UPDATES / ATUALIZAÇÕES RECENTES (2026-01-24)

### ✅ Phase 1, 2 & 3 Complete / Fases 1, 2 e 3 Concluídas
*   **Inference Engine Rewrite:** Transitioned from spaghetti code to `AgentOrchestrator` + `InferenceStrategy` (SOLID/OOP).
*   **Multi-Provider Architecture:** Added support for **OpenRouter.ai**, creating a unified interface for OpenAI, DeepSeek, Claude, and Local LLMs.
*   **Mode Refactoring:** Split UI into **Chat Mode** (Conversational) and **Command Mode** (Terminal-like).
*   **Resilience:** Implemented self-healing configuration and connection retry logic.
*   **Debug Tools:** Added "Context Dump" feature for rapid state analysis.

### 🔜 NEXT: Phase 4 (Documentation & Hardening)
*   Standardizing all code comments to EN/PT-BR.
*   Finalizing Executive Summary.
