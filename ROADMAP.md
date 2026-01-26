# HexAgentGUI Roadmap 2026-2027
> **Strategic Vision:** The Cyberpunk-style Autonomous Security Agent
> **Visão Estratégica:** O Agente de Segurança Autônomo estilo Cyberpunk

## 📅 Q1 2026: Consolidation & Architecture (Current Phase)
**Focus:** Stability, OOP Refactoring, and Core Integration.
**Foco:** Estabilidade, Refatoração POO e Integração do Core.

- [x] **Backend Modularization:** Split monolithic `app.py` into Blueprints/Controllers.
- [x] **AgentCore Implementation:** Create central "Brain" orchestrator.
- [x] **Configuration persistence:** Implement `~/.hexagent-gui` JSON storage.
- [x] **AI Engine Diversity:** Support OpenRouter, LM Studio, Ollama.
- [ ] **Variable Mapping Audit:** Final verification of new Block State variables (`isThinking`, `blockState`) vs Backend SSE events.
- [ ] **Inference Blocks Refactor:** 
    - [ ] Create `InputBlock` with abort/edit logic.
    - [ ] Create `ThinkingBlock` with CoT toggles.
    - [ ] Create `ShellBlock` with xterm.js.
    - [ ] Implement `useBlockManager` hook for state machine.
- [ ] **Safety Trigger:** Implement "Abort" and "Infinite Mode" authorization.

## 📅 Q2 2026: Advanced Capability & HexStrike Deep-Link
**Focus:** Tool Orchestration, Automation, and UI Polish.
**Foco:** Orquestração de Ferramentas, Automação e Polimento da UI.

- [ ] **HexStrike Shell:** Embed real ZSH terminal via MCP/WebSockets using `xterm.js`.
- [ ] **MCP Registry:** Expand `MCPManager` to dynamically load external MCP servers (Kali tools).
- [ ] **Workflows Templates:** Pre-defined mission profiles (Pentest, OSINT, Reversing).
- [ ] **Cyberpunk UI 2.0:** Glassmorphism, Neon accents, smooth framer-motion animations.
- [ ] **Bilingual Implementation:** 100% Code comment coverage (En/Pt-BR).

## 📅 Q3 2026: Autonomous Operations
**Focus:** Long-running tasks and specialized agents.
**Foco:** Tarefas de longa duração e agentes especializados.

- [ ] **Shadow Mode:** Agent runs in background, monitoring logs/traffic.
- [ ] **Collaboration Mode:** Multi-agent swarms (Scout + Exploiter + Analyst).
- [ ] **Report Generation:** PDF/Markdown reports of missions.

---

# Detailed Task List (Next Sprint) / Lista de Tarefas Detalhada

## 1. UI Refactoring (Inference Blocks)
- [ ] Create `src/blocks/ThinkingBlock.jsx`: Visualization of `Chain of Thought`.
- [ ] Create `src/blocks/ShellBlock.jsx`: Syntax highlighted command execution result.
- [ ] Create `src/blocks/NarrativeBlock.jsx`: Markdown rendering of AI explanation.
- [ ] Update `ChatController` to stream block delimiters clearly.

## 2. Safety & Control
- [ ] Backend: Add `POST /chat/abort` to `ChatController.py`.
- [ ] Backend: Update `Orchestrator.py` to check an `abort_flag` during loops.
- [ ] Frontend: Add "Emergency Stop" button to `HeaderBar`.

## 3. HexStrike Integration
- [ ] Verify `HexStrikeClient` timeout settings for long Nmap scans.
- [ ] Implement "Streamed Output" for tools (real-time stdout via SSE).
