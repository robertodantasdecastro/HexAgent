# HexAgentGUI Roadmap 2026-2027
> **Strategic Vision:** The Cyberpunk-style Autonomous Security Agent (HexStrike-AI)
> **Visão Estratégica:** O Agente de Segurança Autônomo estilo Cyberpunk (HexStrike-AI)

## 📅 Q1 2026: Consolidation & Architecture (Current Phase)
**Focus:** Stability, Strict OOP Refactoring, and Core Integration.
**Foco:** Estabilidade, Refatoração POO Estrita e Integração do Core.

- [x] **Backend Modularization:** Split monolithic `app.py` into Blueprints/Controllers.
- [ ] **IA Core Refactoring (Milestone 1):**
    - [x] **Strict OOP:** Refactor `AgentCore` and `ChatController` to eliminate procedural logic.
    - [x] **Facade Pattern:** Make `ChatController` a thin facade over `AgentCore`.
    - [x] **State Sync:** Ensure `useAIConfig` (Frontend) and `ConfigController` (Backend) are fully synchronized.
- [x] **Bilingual Documentation:** 100% coverage (EN/PT-BR) for all core files.
- [x] **Configuration persistence:** Implement `~/.hexagent-gui` JSON storage.
- [x] **Inference Blocks Refactor:**
    - [x] Backend ResponseStrategy with `block_start`/`block_end`.
    - [x] Create `InputBlock`, `ThinkingBlock`, `ShellBlock`.

## 📅 Q2 2026: Hybrid Terminal & HexStrike Deep-Link
**Focus:** Tool Orchestration, Automation, and UI Polish.
**Foco:** Orquestração de Ferramentas, Automação e Polimento da UI.

- [ ] **Hybrid Terminal (Milestone 2/3):**
    - [x] **Command Mode:** IA-assisted command construction and execution.
    - [x] **Context Awareness:** IA understands current directory (CWD) and system state.
    - [x] **HexStrike Shell:** Embed real ZSH terminal via MCP/WebSockets using `xterm.js` (Visual Integration Complete).
- [x] **MCP Registry:** Expand `MCPManager` to dynamically load external MCP servers (Kali tools).
- [x] **Cyberpunk UI 2.0:** Glassmorphism, Neon accents, smooth framer-motion animations.

## 📅 Q3 2026: Autonomous Operations & Passive Monitoring
**Focus:** Long-running tasks and specialized agents.
**Foco:** Tarefas de longa duração e agentes especializados.

- [ ] **Passive Monitoring (Milestone 3):**
- [ ] **Traffic Analysis (Milestone 3):**
    - [x] **Netstat/SS Polling:** Periodically check active connections.
    - [x] **Intrusion Detection:** Auto-detect potential attacks and suggest countermeasures.
- [x] **Personalization (Milestone 6):**
    - [x] **Dynamic Profiles:** User-definable behavioral plugins (e.g., "Aggressive Pentester", "Passive Analyst").
- [x] **Shadow Mode (Milestone 7):**
    - [x] **Background Thread:** MonitoringService daemon implementing basic system stats.
    - [x] **UI Toggle:** Frontend Ghost Icon for enabling/disabling monitoring.
- [x] **Traffic Analysis (Milestone 3):**
    - [x] **Packet Sniffer:** Subprocess wrapper for `psutil` network connections.
    - [x] **Anomaly Detection:** Basic logic to flag suspicious ports (4444, 6667, etc).

## 📅 Q4 2026: Cognitive Evolution (Memory & RAG)
**Focus:** Long-term memory, Learning, and Knowledge Graphs.
**Foco:** Memória de Longo Prazo, Aprendizado e Grafos de Conhecimento.

- [x] **Knowledge Graph (Milestone 8):**
    - [x] **RAG Engine:** Vector database for semantic search of past interactions (MemoryService V1 implemented).
    - [x] **Entity Extraction:** Auto-extracts context tags and saves to memory.

---

# Detailed Task List (Next Sprint) / Lista de Tarefas Detalhada

## 1. Core Refactoring (Immediate) - **COMPLETED**
- [x] Refactor `backend/controllers/chat_controller.py` to remove business logic.
- [x] Refactor `backend/core/agent_core.py` to enforce Singleton-like state consistency.
- [x] Implement `POST /config/ai` hot-reload verification test.

## 2. Documentation
- [x] Rewrite `README.md` to reflect "HexStrike-AI" identity.
- [x] Update `INSTALL.md` with new `~/.hexagent-gui` structure details.
