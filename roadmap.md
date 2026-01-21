# HexAgentGUI - Long-Term Development Roadmap / Roteiro de Longo Prazo

**Last Updated / Última Atualização:** 2026-01-18
**Project Status:** v2.0.0 (Stable / Estável)
**Current Phase:** v2.1.0 Planning
**Focus:** Advanced Features (Network Viz, Version Control)

---

## 🎯 Strategic Vision / Visão Estratégica

Build a professional, autonomous AI security platform that bridges the gap between **Chat** and **Real System Execution**.
Construir uma plataforma de segurança IA autônoma e profissional que una **Chat** e **Execução Real de Sistema**.

*   **Autonomy**: "Don't just tell me, do it." (Shadow Git, HexStrike).
*   **Safety**: Local-first, keyless inference (`lmstudio`, `ollama`).
*   **Architecture**: Modular, OOP, Service-Based.

---

## 📊 Status Summary / Resumo de Status

### ✅ Achievements (v2.0.0 - "Foundation"):
- [x] **Architecture Rewrite**: Removed `server.py`. Migrated to Factory Pattern `app.py` + Controllers.
- [x] **Configuration Source of Truth**: `AIConfigService` manages all settings. No more sync drift.
- [x] **Local Engine Support**: First-class support for `lmstudio`, `5ire`, `ollama` (No API Keys needed).
- [x] **Startup/Shutdown**: Robust lifecycle management with `AgentCore` graceful shutdown.
- [x] **Bilingual Support**: 100% Backend Docstrings in EN/PT.

---

## 📅 PHASE 1: Feature Expansion (v2.1.0)
**Target:** 2026-02-15
**Theme:** "Visual & Control"

### 1.1 Network Visualization (Nmap Integration)
*   **Goal**: Run Nmap scans via HexStrike and visualize results as an interactive graph node.
*   **Tasks**:
    *   [ ] Backend: Parse Nmap XML output in `HexStrikeClient`.
    *   [ ] Frontend: Integrate `react-force-graph` or `cytoscape.js`.
    *   [ ] UI: Create "Network Map" tab in workspace.

### 1.2 Shadow Git (Workspace Versioning)
*   **Goal**: "Undo" for the real world. Automatically commit changes to a hidden git repo when Agent executes file modifications.
*   **Tasks**:
    *   [ ] Backend: `GitManager` service.
    *   [ ] Logic: Pre/Post hooks on `FileController` write operations.
    *   [ ] UI: Timeline view of "Agent Actions" with Rollback button.

---

## 📅 PHASE 2: Enterprise Refinement (v2.2.0)
**Target:** 2026-03-30
**Theme:** "Testing & Hardening"

### 2.1 Backend Testing
*   **Goal**: Reach 80% coverage on Core Logic.
*   **Tasks**:
    *   [ ] Unit Tests for `AIConfigService`, `AgentCore`.
    *   [ ] Mock Tests for `ProviderFactory` (switching engines).

### 2.2 Frontend Refinement
*   **Goal**: Reduce `App.jsx` complexity (currently ~400 lines, target <200).
*   **Tasks**:
    *   [ ] Extract `ChatController` logic fully to React Hook/Context.
    *   [ ] Implement `BlockFactory` for chat message rendering.

---

## 📅 LONG TERM: v3.0.0 (Plugin System)
*   **Goal**: Allow third-party tools to plug into HexAgent.
*   **Concepts**:
    *   `HexPlugin`: Python class that auto-registers with `CommandDispatcher`.
    *   `UIPlugin`: React component injected into Tabs.

---

## 📜 Version History / Histórico de Versões

### v2.0.0 (Current)
*   **Major**: Complete Backend Rewrite (OOP Services).
*   **Feature**: Keyless Local AI Support.
*   **Fix**: Hot Reloading & Configuration Stability.

### v1.x (Legacy)
*   Initial Prototype (`server.py` monolith).
*   Basic Chat & File Editing.
