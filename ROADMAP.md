# HexAgentGUI Roadmap 2026-2027
> **Strategic Vision:** The Cyberpunk-style Autonomous Security Agent (HexStrike-AI)
> **Visão Estratégica:** O Agente de Segurança Autônomo estilo Cyberpunk (HexStrike-AI)

## 📅 Q1 2026: Consolidation & Architecture (Current Phase)
**Focus:** Stability, Strict OOP Refactoring, and Core Integration.
**Foco:** Estabilidade, Refatoração POO Estrita e Integração do Core.

- [x] **Backend Modularization:** Split monolithic `app.py` into Blueprints/Controllers.
- [ ] **IA Core Refactoring (Milestone 1):**
    - [ ] **Strict OOP:** Refactor `AgentCore` and `ChatController` to eliminate procedural logic.
    - [ ] **Facade Pattern:** Make `ChatController` a thin facade over `AgentCore`.
    - [ ] **State Sync:** Ensure `useAIConfig` (Frontend) and `ConfigController` (Backend) are fully synchronized.
- [ ] **Bilingual Documentation:** 100% coverage (EN/PT-BR) for all core files.
- [x] **Configuration persistence:** Implement `~/.hexagent-gui` JSON storage.
- [x] **Inference Blocks Refactor:**
    - [x] Backend ResponseStrategy with `block_start`/`block_end`.
    - [x] Create `InputBlock`, `ThinkingBlock`, `ShellBlock`.

## 📅 Q2 2026: Hybrid Terminal & HexStrike Deep-Link
**Focus:** Tool Orchestration, Automation, and UI Polish.
**Foco:** Orquestração de Ferramentas, Automação e Polimento da UI.

- [ ] **Hybrid Terminal (Milestone 2):**
    - [ ] **Command Mode:** IA-assisted command construction and execution.
    - [ ] **Context Awareness:** IA understands current directory (CWD) and system state.
    - [ ] **HexStrike Shell:** Embed real ZSH terminal via MCP/WebSockets using `xterm.js`.
- [ ] **MCP Registry:** Expand `MCPManager` to dynamically load external MCP servers (Kali tools).
- [ ] **Cyberpunk UI 2.0:** Glassmorphism, Neon accents, smooth framer-motion animations.

## 📅 Q3 2026: Autonomous Operations & Passive Monitoring
**Focus:** Long-running tasks and specialized agents.
**Foco:** Tarefas de longa duração e agentes especializados.

- [ ] **Passive Monitoring (Milestone 3):**
    - [ ] **Traffic Analysis:** Background monitoring of network traffic for anomalies.
    - [ ] **Intrusion Detection:** Auto-detect potential attacks and suggest countermeasures.
- [ ] **Personalization (Milestone 4):**
    - [ ] **Dynamic Profiles:** User-definable behavioral plugins (e.g., "Aggressive Pentester", "Passive Analyst").
- [ ] **Shadow Mode:** Agent runs in background, monitoring logs/traffic.

---

# Detailed Task List (Next Sprint) / Lista de Tarefas Detalhada

## 1. Core Refactoring (Immediate)
- [ ] Refactor `backend/controllers/chat_controller.py` to remove business logic.
- [ ] Refactor `backend/core/agent_core.py` to enforce Singleton-like state consistency.
- [ ] Implement `POST /config/ai` hot-reload verification test.

## 2. Documentation
- [ ] Rewrite `README.md` to reflect "HexStrike-AI" identity.
- [ ] Update `INSTALL.md` with new `~/.hexagent-gui` structure details.
