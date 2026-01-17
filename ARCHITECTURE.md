# HexAgentGUI - Architecture Documentation
## Documentação de Arquitetura

> **System architecture and technical design**  
> **Arquitetura do sistema e design técnico**

---

## 🏗️ High-Level Architecture / Arquitetura de Alto Nível

```
┌──────────────────────────────────────────────────────────┐
│                    Electron Shell                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Frontend (React)                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │           App.jsx (Orchestrator)             │  │  │
│  │  │  - Global State Hooks (Config/Session)       │  │  │
│  │  │  - Service Integration                       │  │  │
│  │  │  - Layout & Modals                           │  │  │
│  │  └──────────────────────┬───────────────────────┘  │  │
│  │                         │                          │  │
│  │         ┌───────────────┴───────────────┐          │  │
│  │         ▼               ▼               ▼          │  │
│  │   ┌──────────┐   ┌───────────┐  ┌────────────┐     │  │
│  │   │Chat      │   │ Utilities │  │  Services  │     │  │
│  │   │Components│   │ & Hooks   │  │            │     │  │
│  │   └──────────┘   └───────────┘  └────────────┘     │  │
│  │                     (Parser, Init)                     │  │
│  └────-───────────────────────────────────────────────┘  │
30: └────────-──────────────────┬──────────────────────────────┘
31:                             │ HTTP/REST (localhost:5000)
32: ┌─────-─────────────────────▼──────────────────────────────┐
33: │                Flask Backend (Python)                    │
34: │  ┌────────────────────────────────────────────────────┐  │
35: │  │              server.py (API Layer)                 │  │
36: │  │  - Route Handlers                                  │  │
37: │  │  - Request Validation                              │  │
38: │  │  - Response Formatting                             │  │
39: │  └────────────────────────────────────────────────────┘  │
40: │                        │                                 │
41: │        ┌───────────────┼───────────────┐                 │
42: │        ▼               ▼               ▼                 │
43: │    ┌──────────┐   ┌───────────┐  ┌────────────┐          │
44: │    │Config    │   │ Execution │  │  Persona   │          │
45: │    │Loader    │   │  Engine   │  │  Loader    │          │
46: │    └──────────┘   └───────────┘  └────────────┘          │
47: │                        │                                 │
48: │                        ▼                                 │
49: │  ┌────────────────────────────────────────────────────┐  │
50: │  │          HexStrike AI Server                       │  │
51: │  │  - Command Execution (subprocess)                  │  │
52: │  │  - OpenRouter AI Integration                       │  │
53: │  │  - Autonomous Iteration Logic                      │  │
54: │  └────────────────────────────────────────────────────┘  │
55: └──────────────────────────────────────────────────────────┘
```

---

## 📦 Component Breakdown / Detalhamento de Componentes

### Frontend Layer / Camada Frontend

#### 1. **Main Application (`src/App.jsx`)**

**English:**
- **Size:** ~500 lines (Refactored)
- **Role:** Application Orchestrator
- **Responsibilities:**
  - Hook-based state management
  - Modal composition
  - Layout rendering
  - Service routing

**Português:**
- **Tamanho:** ~500 linhas (Refatorado)
- **Papel:** Orquestrador da Aplicação
- **Responsabilidades:**
  - Gerenciamento de estado baseado em Hooks
  - Composição de modais
  - Renderização de layout
  - Roteamento de serviços

---

#### 2. **Chat Components (`src/components/chat/`)**

##### **Block.jsx**
**English:**
- **Role:** Unified Message Renderer
- **Features:**
  - Renders User/Agent/System messages
  - Handles parsing via `agentParser`
  - Manages action buttons (Copy/Execute)
  - Bilingual UI support

**Português:**
- **Papel:** Renderizador Unificado de Mensagens
- **Recursos:**
  - Renderiza mensagens de Usuário/Agente/Sistema
  - Gerencia parsing via `agentParser`
  - Gerencia botões de ação (Copiar/Executar)
  - Suporte a UI bilíngue

##### **CodeBlock.jsx**
**English:**
- **Role:** Syntax Highlighting Component
- **Features:** PrismJS integration, auto-detect language, save/execute actions.

**Português:**
- **Papel:** Componente de Destaque de Sintaxe
- **Recursos:** Integração PrismJS, auto-detecção de linguagem, ações salvar/executar.

---

#### 3. **Utilities & Hooks**

##### **useBackendInit.js** (`src/hooks/`)
**English:** Encapsulates complex startup logic (Backend -> Brain -> Config -> HexStrike).
**Português:** Encapsula lógica complexa de inicialização (Backend -> Brain -> Config -> HexStrike).

##### **agentParser.js** (`src/utils/`)
**English:** Regex-based parser to split AI streams into Text, Code, and Command blocks.
**Português:** Parser baseado em Regex para dividir streams de IA em blocos de Texto, Código e Comando.

##### **ScriptManager.js** (`src/utils/`)
**English:** Singleton manager for script operations (Save/Execute/Debug). Uses APIClient.
**Português:** Gerenciador Singleton para operações de script (Salvar/Executar/Depurar). Usa APIClient.

---

#### 4. **Modals (`src/components/`)**

##### **SettingsModal.jsx**
**English:** Manages System, UI, and Service configurations.
**Português:** Gerencia configurações de Sistema, UI e Serviços.

##### **AIConfigModal.jsx**
**English:** Manages AI Engine, Model, and API Key settings.
**Português:** Gerencia configurações de Motor de IA, Modelo e Chave API.

---

[... Rest of file unchanged / Resto do arquivo inalterado ...]

## 🛠️ Technology Stack / Pilha Tecnológica

### Frontend

| Technology | Purpose | Propósito |
|-----------|---------|-----------|
| **React 18.3** | UI framework | Framework de UI |
| **Vite 5.3** | Build tool | Ferramenta de build |
| **TailwindCSS 3.4** | Styling | Estilização |
| **Electron 31.0** | Desktop app | Aplicativo desktop |
| **Lucide React** | Icons | Ícones |
| **Prism.js** | Syntax highlighting | Destaque de sintaxe |

### Backend

| Technology | Purpose | Propósito |
|-----------|---------|-----------|
| **Python 3.13** | Runtime | Runtime |
| **Flask 3.1** | Web framework | Framework web |
| **Subprocess** | Command execution | Execução de comandos |
| **JSON** | Configuration | Configuração |

---

## 📈 Future Enhancements / Melhorias Futuras

**Short-term / Curto Prazo:**
1. ✅ **Refactored App.jsx (Completed)**
2. TypeScript migration
3. Unit test coverage (>80%)

**Long-term / Longo Prazo:**
1. Cloud sync for sessions
2. Collaborative mode (multi-user)
3. Plugin system

---

**Last Updated:** 2026-01-14
**Version:** 1.1.0-refactor
**Maintainer:** Roberto Dantas de Castro
