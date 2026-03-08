# Project Evolution Memory

> **Note:** This document serves as the "Live Architectural Memory" for the Omega Cognition system. Update incrementally.

## ARCHITECTURE_STATE
- **Version:** 2.1.0 (Stable)
- **Pattern:** Client-Server (Electron/React <-> Flask/Python)
- **Core Abstraction:** AgentOrchestrator with Block-Based Response Stream (Thinking, Shell, Narrative).
- **Inference Strategy:**
    - **Brain:** HexSecGPT (Unified Provider Interface)
    - **Body:** HexStrikeClient (MCP-based execution)
    - **Interface:** React Stream with State Machine Blocks

## FILE_STRUCTURE
```
/
├── backend/                  # Flask Server
│   ├── app.py               # Application Factory
│   ├── core/                # Core Logic (AgentCore, Orchestrator)
│   ├── controllers/         # Blueprint Controllers (Facades)
│   └── services/            # Business Logic Services
├── src/                      # React Frontend
│   ├── blocks/              # Stream Blocks (Input, Shell, Thinking)
│   ├── components/          # UI Components
│   └── services/            # Frontend API Services
├── config_templates/         # Default Configurations
└── install.sh                # Lifecycle Manager
```

## CORE_LOGIC
- **Orchestration:** `AgentOrchestrator.process()` manages the Think-Act-Observe loop (up to 10 iterations).
- **Communication:** Server-Sent Events (SSE) stream JSON blocks to Frontend.
- **State Management:**
    - **Frontend:** `useAIConfig` (Zustand/Context)
    - **Backend:** `AgentCore` Singleton
    - **Persistence:** JSON files in `~/.hexagent-gui/`

### 📅 DEVELOPMENT TIMELINE & CHANGELOG

* **[2026-02-20] SYSTEM RECOVERY & COGNITIVE RECONSTRUCTION:**
    * Sistema desligado abruptamente (Crash).
    * `AutoRecovery` / `SmartResume` acionado: Validados `XTermConsole.jsx`, `useChatManager.js`, `orchestrator.py`. Nenhuma corrupção de código identificada.
    * Estado de Implementação (PTY & Inference Blocks) recuperado com os Gaps A e B finalizados pendendo teste manual.
    * Executada **Sanitização de Repositório e Resolução de Shadow Architecture**: Isolamento de PIDs residuais, movimentação de scripts sujos para `_archive`, e correção de roteamento de logs para `~/.hexagent-gui/logs/`. Correção do controlador do `moltbot`.
    * **Orchestrator Loop Fix (7 Bugs):** Corrigidos 7 bugs críticos no loop do orquestrador: feedback des-indentado do for-loop, `_extract_commands` multi-linha tratado como comando composto, deduplicação entre iterações, notificação de truncamento, system prompt com EXECUTION POLICY step-by-step, fix de import `BaseController` quebrado, e remoção de import duplicado.

* **[2026-02-20] INFERENCE BLOCKS & PTY INTEGRATION (Sessão 2):** Release 2.1.0 (Architecture Stabilization).
- **2026-02-15:** Full HexStrike Integration & VENV unification.
- **2026-02-16:** Cognitive Reconstruction & ShellBlock Delta Optimization.
- **2026-02-16:** Session Layer Refactoring & PTY Verification.
- **2026-02-20:** HexStrike API Expansion (`get_environment_context`, intelligence endpoints), Lazy Loading for heavy imports, and UserBlock React.memo optimization.

## TASKS_PRIMARY
- [x] **Refactor SessionController:** Extract file logic into `SessionService` to strictly follow Service Layer pattern.
- [ ] **[FASE A] Real-Time Shell Output:** `/api/process/execute-async` + polling frontend (ShellBlock streaming).
- [ ] **[FASE A] Botão ABORT:** POST /chat/abort + terminate_process(pid) no HexStrike.
- [ ] **[FASE B] Expandir HexStrikeClient:** cobrir todos os 130+ endpoints da API HexStrike-AI.
- [ ] **[FASE B] Painéis HexStrike na GUI:** Tools Panel + Processos Ativos.
- [ ] **[FASE C] Modos Especializados:** Bug Bounty Panel + CTF Panel + CVE Intel + Script Builder.
- [ ] **[FASE D] Multi-Agent Mesh:** popular core/agents/ e modularizar orchestrator.

## TASKS_SECONDARY
- [ ] **MCP Expansion:** Add more local tools to `HexStrikeManager`.
- [ ] **Cloud Sync:** Optional session backup to cloud.

## BUGFIX_LOG
- **2026-02-21:** Corrigidos imports `from core.base_controller` → `from controllers.base_controller` em 15 controllers (fontes + deploy).
- **2026-02-21:** Injeção de Stop Generation Rule + Discovery Protocol no system_context do Orchestrator.
- **2026-02-20:** Fixed `UserBlock` cascading re-renders by removing inline JSX console.log and applying `React.memo` with custom comparison.
- **2026-02-20:** Fixed HexStrike server crash (`aiohttp` ModuleNotFound) by strictly enforcing the unified venv path in `system-config.json` and lazy-loading heavy modules.
- **2026-02-16:** Fixed ShellBlock flickering by implementing Delta Updates (`lastContentLengthRef`).
- **2026-02-15:** Fixed "Process died during startup" in HexStrike service.

## TECHNICAL_DEBT
- **[ATIVO] Monolito do Orchestrator:** orquestrador viola SRP — será fragmentado na Fase D.
- **[ATIVO] HexStrikeClient incompleto:** apenas 10/130 endpoints consumidos — mitigado na Fase B.
- **[ATIVO] core/agents/ vazio:** Shadow Architecture — será populado na Fase D.
- **NarrativeBlock Optimization:** Fixed (2026-02-17). `parseAgentContent` now memoized.
- **HexStrike Context Injection:** Fixed (2026-02-19). `AgentOrchestrator` now pulls real installed tools from `HexStrikeClient.get_environment_context()`.

## CHANGELOG
* **[2026-03-07] MRQUENTILHA BASE ALIGNMENT:**
    * `HexAgentGUI` definido como arquitetura base para o projeto `MrQuentilha`.
    * Criado `docs/mrquentilha_base_blueprint.md` consolidando estrutura, memoria, governanca e evolucao planejada.
    * Formalizado o contrato de memoria em camadas: runtime, sessao, operacional, AI, perfil, arquitetural e governanca.
    * Formalizada a governanca por artefatos vivos: `ARCHITECTURE.md`, `livememory.md`, `project_evolution.md`, `roadmap.md`, `AUDIT_REPORT.md` e testes.
    * Alinhado o modelo de evolucao para `Antigravity IDE`: workspace-first, artifact-driven, resumable, sem acoplamento direto do core a APIs do IDE.
    * Direcao imediata para Codex: Fase 0 de alinhamento antes de expandir produto ou adicionar novas especializacoes.

* **[2026-02-21] PLANO GLOBAL v3.0 — Refatoração e Evolução Completa:**
    * Auditoria completa do ecossistema: 130+ endpoints HexStrike-AI identificados (apenas 10 integrados).
    * Gap principal: sem real-time shell output, sem botão ABORT, sem painéis GUI para tools/bugbounty/ctf.
    * Criado Plano Global v3.0 com 4 fases (A: Fundação, B: Integração, C: Especializados, D: Cognitivo).
    * Ordenado por hierarquia técnica de dependências.
    * Protocolo de Auto-Resume integrado ao plano.
    * `livememory.md` atualizado como ponto único de verdade para sessões de IA.
    * `project_evolution.md` e `ROADMAP.md` alinhados com o novo plano.

* **[2026-02-21] BUGFIXES CRÍTICOS (FASE 0) & CRASHES RECORRENTES:**
    * Bugs Críticos (Fase 0) solucionados nos FONTES:
      - B0.A: PersonaService com paths corretos (`agents/`).
      - B0.B: SettingsModal com tratativas de timeout e fallback.
      - B0.C: Demais modais auditados e confirmados seguros.
    * **Problema:** Sistema sofreu crashes sequenciais durante a execução de `install.sh` (build de dependências python/electron). Deploy da Fase 0 ainda pendente de conclusão pelo script instalador.

* **[2026-02-21] RECONSTRUÇÃO COGNITIVA + AUDITORIA:**
    * Mapeamento completo da arquitetura alvo (OMEGA COGNITION) vs real (monolito).
    * Drift crítico identificado em core/agents/ (vazio) e HexStrikeClient (parcial).
    * `livememory.md` criado como primeiro documento vivo de estado arquitetural.
    * Stop Generation Rule + Discovery Protocol injetados no system_context (anti-alucinação).
    * Correção imports base_controller em 15 controllers + deploy sincronizado.

* **[2026-02-20] SYSTEM RECOVERY & COGNITIVE RECONSTRUCTION:**
    * Orchestrator Loop Fix (7 Bugs): feedback, _extract_commands, deduplicação, notificação truncamento, EXECUTION POLICY, import BaseController, import duplicado.

* **[2026-02-20] INFERENCE BLOCKS & PTY INTEGRATION (Release 2.1.0):**
    * HexStrike API Expansion, Lazy Loading, UserBlock React.memo optimization.

## NEXT_STEPS
1. **PRÓXIMA SESSÃO:** Executar Fase 0 de alinhamento para a linha base `MrQuentilha`.
   - consolidar o contrato de memoria e governanca
   - normalizar `profile.json` vs `user_profile.json`
   - preparar quebra controlada do monolito do orquestrador
   - fortalecer testes de controllers/services/core
   - consolidar artefatos de iteracao compatíveis com Antigravity (`implementation_plan`, findings, state docs)
2. Em seguida, retomar a Fase A/B do Plano Global v3.0 sob a nova linha base.
3. Usar `/SmartResume` ao iniciar nova sessão para reconstruir estado.
4. Referência: `livememory.md` + `docs/mrquentilha_base_blueprint.md`.
