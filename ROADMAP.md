# HexAgentGUI - Strategic Development Roadmap / Roteiro Estratégico de Desenvolvimento

> **Last Updated / Última Atualização:** 2026-01-22
> **Project Status:** v2.0.0 (Stable / Estável)
> **Next Release:** v2.1.0 (MCP Ecosystem)

---

## 🎯 Executive Vision / Visão Executiva

HexAgentGUI aims to be the premier **Autonomous Security Agent Interface**, seamlessly blending local LLM intelligence with professional-grade security tools (Kali Linux). The evolution focuses on three pillars:
HexAgentGUI visa ser a principal **Interface de Agente de Segurança Autônomo**, unindo inteligência de LLM local com ferramentas de segurança profissional (Kali Linux). A evolução foca em três pilares:

1.  **Total Interoperability (MCP)**: Native integration with the Model Context Protocol ecosystem.
2.  **Situation Awareness**: Passive monitoring and anomaly detection triggers.
3.  **Adaptive Behavior**: Dynamic personality and engagement profiles (Stealth vs. Active).

---

## 📅 PHASE 1: MCP Ecosystem Injection (v2.1.0)
**Timeline:** Immediate (Q1 2026)
**Theme:** "Tool Expansion / Expansão de Ferramentas"

The goal is to move beyond hardcoded tool integrations to a flexible, server-based model using MCP.

### 1.1 Local Filesystem Authority (`mcp-filesystem`)
*   **Objective:** Give the Agent safe, regulated access to the local filesystem for file analysis and report generation.
*   **Key Tasks:**
    *   Integration of `mcp-filesystem` server.
    *   Security Scoping: Restrict access to `~/iatools/workspace` and `~/.hexagent-gui/logs`.
    *   **GUI:** "File Explorer" tab visualized via MCP resources.

### 1.2 Kali Tool Wrapper (`mcp-kali-server`)
*   **Objective:** Create a dedicated MCP server that exposes Kali Linux tools as standard MCP Tools.
*   **Key Tasks:**
    *   Develop `mcp-kali-server` (Python/FastAPI).
    *   Wrap tools: `nmap`, `gobuster`, `metasploit-framework` (rpc).
    *   Standardize output parsing (JSON) for LLM consumption.

### 1.3 MCP Registry UI Finalization
*   **Objective:** Complete the UI for managing these servers.
*   **Key Tasks:**
    *   Server Health Checks (Heartbeat).
    *   Dynamic Tool Listing (What tools does this server provide?).

---

## 📅 PHASE 2: Passive Monitoring Module (v2.2.0)
**Timeline:** Short-Term (Q2 2026)
**Theme:** "Eyes Wide Open / Olhos Bem Abertos"

Transition from a reactive "Chat" bot to a proactive "Watchdog".

### 2.1 Network Listener Service (`NetWatcher`)
*   **Objective:** Passive background service to monitor network traffic without active scanning.
*   **Requirements:**
    *   Raw Socket capability (requires `capabilities` or root).
    *   Optimized for Kali networking stack.
*   **Triggers:**
    *   New Device Detection (ARP Monitoring).
    *   Unusual Outbound Traffic (Sustainability Check).

### 2.2 Anomaly Triggers & Alerts
*   **Objective:** Let the Agent "wake up" and notify the user based on events.
*   **Key Tasks:**
    *   `EventBus` implementation in Backend.
    *   Websocket "Push" notifications to GUI.
    *   Configurable Rules (e.g., "Alert me if port 4444 opens").

---

## 📅 PHASE 3: Dynamic Personalization (v3.0.0)
**Timeline:** Long-Term (Q3 2026)
**Theme:** "Adaptive Engagement / Engajamento Adaptativo"

### 3.1 Behavior Profiles (Plugins)
*   **Objective:** Switch the Agent's "Personality" and "Rules of Engagement" instantly.
*   **Proposed Profiles:**
    *   🕵️ **Stealth / Furtivo**:
        *   System Prompt: "Prioritize silence. Do not scan aggresively. Use passive recon."
        *   Tools Allowed: `dns-recon`, `passive-nmap`.
    *   ⚔️ **Assault / Assalto**:
        *   System Prompt: "Maximum noise allowed. Full exploitation authorization."
        *   Tools Allowed: `metasploit`, `hydra`.
    *   🛡️ **Blue Team / Defensivo**:
        *   System Prompt: "Analyze logs. Harden configurations. Report vulnerabilities."
        *   Tools Allowed: `chkrootkit`, `lynis`.

### 3.2 Dynamic Context injection
*   **Objective:** Inject Profile-specific knowledge into the context window.
*   **Implementation:**
    *   `ProfileManager` service to swap System Prompts and MCP Tool access lists on the fly.

---

## 🛠️ Technical Quality Criteria / Critérios de Qualidade Técnica

*   **POO & SOLID**: All new modules (e.g., `NetWatcher`, `ProfileManager`) must be Classes with Single Responsibility. Use Interfaces for Service interaction.
*   **OS Agnostic core**: While tools (Kali) are Linux-specific, the *Agent Core* must run on macOS/Windows (mocking Linux tools if absent).
*   **Dependencies**:
    *   Future-proof `requirements.txt`.
    *   Isolate MCP servers in their own VENVs to avoid dependency hell.

---

## 🔗 Variable Synchronization Plan / Plano de Sincronização

To ensure the GUI natively reflects this roadmap:

1.  **New State Object**: `monitoringConfig`
    *   Mapped to `config.json -> monitoring`.
2.  **New State Object**: `activeProfile`
    *   Mapped to `config.json -> agent -> profile`.
3.  **MCP Synchronization**:
    *   The `MCPRegistry` component (already created) becomes the source of truth for available tools.

---
*Created by Antigravity Agent for User D4R13N.*
