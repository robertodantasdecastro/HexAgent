# HexAgentGUI Roadmap 2026-2027
> **Strategic Vision:** The Cyberpunk-style Autonomous Security Agent (HexStrike-AI)
> **Visão Estratégica:** O Agente de Segurança Autônomo estilo Cyberpunk (HexStrike-AI)

## 📅 Q1 2026: Consolidation & Architecture (Current Phase)
**Focus:** Stability, Strict OOP Refactoring, and Core Integration.
**Foco:** Estabilidade, Refatoração POO Estrita e Integração do Core.

- [x] **Backend Modularization:** Split monolithic `app.py` into Blueprints/Controllers.
- [x] **IA Core Refactoring (Milestone 1):**
    - [x] **Strict OOP:** Refactor `AgentCore` and `ChatController` to eliminate procedural logic.
    - [x] **Facade Pattern:** Make `ChatController` a thin facade over `AgentCore`.
    - [x] **State Sync & Auto-Execute Repair:** Ensure `useAIConfig` and `ConfigController` are synchronized, handling "HexStrike Offline" exceptions without infinite hallucinations.
- [x] **Bilingual Documentation:** 100% coverage (EN/PT-BR) for all core files.
- [x] **Configuration persistence:** Implement `~/.hexagent-gui` JSON storage.
- [x] **Inference Blocks Refactor:**
    - [x] Backend ResponseStrategy with `block_start`/`block_end`.
    - [x] Create `InputBlock`, `ThinkingBlock`, `ShellBlock`.

## 📅 Q2 2026: Hybrid Terminal & HexStrike Deep-Link
**Focus:** Tool Orchestration, Automation, and UI Polish.
**Foco:** Orquestração de Ferramentas, Automação e Polimento da UI.

- [x] **Hybrid Terminal (Milestone 2/3):**
    - [x] **Command Mode:** IA-assisted command construction and execution.
    - [x] **Context Awareness:** IA understands current directory (CWD) and system state.
    - [x] **HexStrike Shell:** Embed real ZSH terminal via MCP/WebSockets using `xterm.js` (Visual Integration Complete + Delta Optimization).
    - [x] **Terminal Visual Persistence Fix:** Cleaned up orchestrator lifecycle redundancies emitting accidental early-close events, allowing stdout to be fully painted sequentially on the UI.
- [x] **MCP Registry & Native Actions:** Expand `MCPManager` to dynamically load external MCP servers (Kali tools) and route requests via native Client instead of wrapping it via Bash.
- [x] **Cyberpunk UI 2.0:** Glassmorphism, Neon accents, smooth framer-motion animations.

## 📅 Q3 2026: Consolidação Avançada e Interfaces
**Focus:** Native Endpoints, Assisted Terminal, and MCP Integration.
**Foco:** Endpoints Nativos, Terminal Assistido e Integração MCP.

- [ ] **Revisão Completa dos Endpoints (Milestone 3):**
    - [ ] **HexStrike Visual Dashboard:** O frontend consumirá rotas mapeadas na identity `hexstrike_persona` (ex: `POST /api/tools/nmap`, `POST /api/bugbounty/reconnaissance-workflow`).
- [ ] **Terminal de Sistema Assistido por IA (Milestone 4):**
    - [ ] **Command Interpolation:** The AI intercepts user terminal inputs (e.g., `nmap -sS`), checks flags against manual pages, and auto-corrects them before the user presses Enter.
- [ ] **Ecossistema MCP Integrado (Milestone 5):**
    - [x] **Native Capability Registry:** Basic JSON endpoints to `HexStrike`.
    - [ ] **`mcp-kali-server`:** Deep Linux execution orchestration allowing root orchestration directly via Context Protocol.
    - [ ] **`mcp-filesystem`:** Native replacement for standard EditorPlugins to support massive file reads/edits.

## 📅 Q4 2026: Ecossistema Expandido e Evolução Dinâmica
**Focus:** Passive Monitoring, Dynamic Personas, and Knowledge Graphs.
**Foco:** Monitoramento Passivo, Personas Dinâmicas e Grafos de Conhecimento.

- [ ] **Monitoramento Passivo & Contra-Ataque (Milestone 6):**
    - [x] **Netstat/SS Polling:** Periodically check active connections.
    - [ ] **Passive Monitoring Service:** Real-time Frontend daemon consuming `GET /api/telemetry` to detect incoming port scans or unauthorized processes.
    - [ ] **Intrusion Countermeasures:** AI-suggested reactive actions (e.g., inject `iptables` drop rules or deploy dynamic honeypots).
- [ ] **Personalização Dinâmica (Behavioral Plugins) (Milestone 7):**
    - [x] **Hexstrike Profile:** Defined central core prompt.
    - [ ] **Dynamic Profiles GUI:** Engage "Stealth Pentester" or "Forensic Analyst" modes directly from `AIConfigModal`, overriding `system_prompts` on-the-fly via `ai-config.json`.
- [ ] **Knowledge Graph (Milestone 8):**
    - [x] **RAG Engine:** Vector database for semantic search of past interactions (MemoryService V1 implemented).
    - [x] **Entity Extraction:** Auto-extracts context tags and saves to memory.

---

# 🗺️ Plano de Desenvolvimento v3.0 — Fases Ordenadas por Hierarquia Técnica

## 🔴 FASE A — Fundação Estável (Q1-Q2 2026 — v2.2.0)
*Dependência: nenhuma — deve ser executada primeiro*

- [x] **A1. Auditoria e Limpeza de Código:** gerar `AUDIT_REPORT.md`, garantir SRP em todos os controllers/services, documentar EN/PT-BR
- [x] **A2. Real-Time Shell Output & Persistence:** Rotear corretamente Native Tools vs. Shell Execution em `execute_and_analyze` e manter output visualmente persistente no Frontend React.
- [ ] **A3. Botão ABORT:** `POST /chat/abort` no backend + `terminate_process(pid)` via HexStrike + botão na UI
- [ ] **A4. Reorganização Tests:** documentar todos os testes existentes, criar `tests/README.md`, adicionar testes de segurança

## 🟠 FASE B — Integração Completa HexStrike (Q2 2026 — v2.5.0)
*Dependência: Fase A 100% testada*

- [ ] **B1. Expandir HexStrikeClient:** todos os grupos de endpoints (Tools, Processos, CTF, Vuln Intel, Visual)
- [ ] **B2. Expandir HexStrikeController:** novos blueprints para tools, processos, CTF e visual
- [ ] **B3. Painel de Ferramentas HexStrike:** GUI com abas Network | Web | Binary | Cloud | OSINT | Forensic
- [ ] **B4. Painel de Processos Ativos:** lista com kill/pause/resume em tempo real

## 🟡 FASE C — GUI Tools & Ecossistema (Q3 2026 — v2.8.0)
*Dependência: Fase B 100% testada (Invocação base HexStrike)*

- [ ] **C1. Bug Bounty Visual Dashboard:** Interface nativa e Consumo Completo de Endpoints (`POST /api/ctf/`, `POST /api/vuln-intel/` e `POST /api/tools/...`).
- [ ] **C2. Terminal Assistido (Co-Pilot):** Linter interativo na caixa de Terminal Híbrida em real-time corrigindo erros humanos e oferecendo flags curadas para nmaps/metasploits.
- [ ] **C3. Integração de Sistema MCP Avançada:** Instanciar drag-and-drop de servidores `mcp-kali-server` e `mcp-filesystem` na GUI.

## 🔵 FASE D — Evolução Cognitiva e Monitoramento (Q4 2026 — v3.0.0)
*Dependência: Fase C 100% testada*

- [ ] **D1. Monitoramento Passivo & Contra-Medidas:** Daemon consumindo telemetria da rede para autodefesa reativa (`iptables`).
- [ ] **D2. Personalização Dinâmica UI:** Modal dinâmico "Behavioral Plugins" para sobrescrever a persona central on-the-fly.

---

# Detailed Task List — Next Sprint / Lista de Tarefas Detalhada
## FASE A — Imediato

- [x] Refactor `backend/controllers/chat_controller.py` to remove business logic.
- [x] Refactor `backend/core/agent_core.py` to enforce Singleton-like state consistency.
- [x] Implement `POST /config/ai` hot-reload verification test.
- [x] Execute Cognitive Reconstruction: Root cleanup, Shadow Architecture correction (Completed 2026-02-20).
- [x] Orchestrator Loop Fix (7 bugs) + Stop Generation + Discovery Protocol (2026-02-21).
- [x] **[A1]** Generate `AUDIT_REPORT.md` (code quality sweep all controllers + services) - Found and documented Command Mode Drift
- [x] Cognitive Dissonance Removal: Clear Chatty Persona tags `<analysis>` / `<suggestion>` and inject `Actionable block ONLY`.
- [x] Repair Auto-Execute Infinite Loops & Routing: Dispatch Hexstrike Offline errors natively as `ResultBlock` to trigger safe LLM fallbacks.
- [x] **[A2]** Execution Lifecycle & Persistence: Complete implementation of `ToolCallBlock` interactive parsing in frontend + removal of duplicate `block_start` SSE that erased React rendering.
- [ ] **[A3]** Implement ABORT button (backend signal + frontend UI)

## FASE A — Documentação

- [x] Rewrite `README.md` to reflect "HexStrike-AI" identity.
- [x] Update `INSTALL.md` with new `~/.hexagent-gui` structure details.
- [ ] Update `ARCHITECTURE.md` with v3.0 phased plan (after Fase A implementation)

