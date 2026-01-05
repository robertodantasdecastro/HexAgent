# HexAgentGUI - Architecture Documentation
## Documentação de Arquitetura

> **System architecture and technical design**  
> **Arquitetura do sistema e design técnico**

---

## 🏗️ High-Level Architecture / Arquitetura de Alto Nível

```
┌──────────────────────────────────────────────────────────┐
│                    Electron Shell                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Frontend (React)                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │           App.jsx (Main Component)           │  │  │
│  │  │  - State Management                          │  │  │
│  │  │  - Message Routing                           │  │  │
│  │  │  - UI Orchestration                          │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │                        │                            │  │
│  │        ┌───────────────┼───────────────┐            │  │
│  │        ▼               ▼               ▼            │  │
│  │  ┌──────────┐   ┌───────────┐  ┌────────────┐     │  │
│  │  │Components│   │ Utilities │  │  Services  │     │  │
│  │  │ (11)     │   │  (5)      │  │            │     │  │
│  │  └──────────┘   └───────────┘  └────────────┘     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP/REST (localhost:5000)
┌──────────────────────────▼──────────────────────────────┐
│                Flask Backend (Python)                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │              server.py (API Layer)                 │  │
│  │  - Route Handlers                                  │  │
│  │  - Request Validation                              │  │
│  │  - Response Formatting                             │  │
│  └────────────────────────────────────────────────────┘  │
│                        │                                 │
│        ┌───────────────┼───────────────┐                 │
│        ▼               ▼               ▼                 │
│  ┌──────────┐   ┌───────────┐  ┌────────────┐          │
│  │Config    │   │ Execution │  │  Persona   │          │
│  │Loader    │   │  Engine   │  │  Loader    │          │
│  └──────────┘   └───────────┘  └────────────┘          │
│                        │                                 │
│                        ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │          HexStrike AI Server                       │  │
│  │  - Command Execution (subprocess)                  │  │
│  │  - OpenRouter AI Integration                       │  │
│  │  - Autonomous Iteration Logic                      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 Component Breakdown / Detalhamento de Componentes

### Frontend Layer / Camada Frontend

#### 1. **Main Application (`src/App.jsx`)**

**English:**
- **Size:** 60KB, 1474 lines
- **Role:** Core application logic and state management
- **Responsibilities:**
  - Message history management
  - API communication
  - UI state coordination
  - Session management
  - Configuration handling

**Português:**
- **Tamanho:** 60KB, 1474 linhas
- **Papel:** Lógica central da aplicação e gerenciamento de estado
- **Responsabilidades:**
  - Gerenciamento de histórico de mensagens
  - Comunicação com API
  - Coordenação de estado da UI
  - Gerenciamento de sessões
  - Manipulação de configuração

**Key Functions / Funções Principais:**
```javascript
- parseAgentContent()  // Parse AI responses / Parsear respostas da IA
- sendMessage()        // Send user message / Enviar mensagem do usuário
- handleExecute()      // Execute commands / Executar comandos
- loadSession()        // Load saved session / Carregar sessão salva
- saveSession()        // Save current session / Salvar sessão atual
```

---

#### 2. **Components (`src/components/`)**

##### **SmartBlock.jsx** - Intelligent Content Renderer
**English:**
- Auto-detects content type (CODE, SHELL, ERROR, etc.)
- Applies appropriate styling and actions
- Handles ANSI color rendering
- Provides context-aware action buttons

**Português:**
- Detecta automaticamente tipo de conteúdo (CODE, SHELL, ERROR, etc.)
- Aplica estilização e ações apropriadas
- Manipula renderização de cores ANSI
- Fornece botões de ação sensíveis ao contexto

##### **SettingsModal.jsx** - Configuration UI
- Tabbed interface (General, AI, Appearance, Advanced)
- Real-time config updates
- Hierarchical config system (templates → user → runtime)

##### **SessionModal.jsx** - Session Management
- List all saved sessions
- Load/Save/Delete operations
- Auto-save functionality

##### **ScriptBlock.jsx** - Script Management
- Save scripts with auto-path suggestion
- Execute with custom arguments
- Debug mode with language-specific flags
- Real-time output display

##### **Other Components:**
- `HelpModal.jsx` - Help and documentation
- `LoadingScreen.jsx` - Initialization screen
- `BrainSelector.jsx` - AI brain/persona selection
- `SaveFilesDialog.jsx` - Temporary file save prompt
- `ShutdownModal.jsx` - Graceful shutdown handling
- `WelcomeDialog.jsx` - First-run setup wizard
- `IterationLimitDialog.jsx` - Iteration control settings

---

#### 3. **Utilities (`src/utils/`)**

##### **ansiRenderer.jsx**
```javascript
/**
 * Converts ANSI escape codes to colored React components
 * Converts códigos de escape ANSI para componentes React coloridos
 */
export const AnsiRenderer = ({ text, customColors })
export const hasAnsiCodes = (text)
```

##### **blockTypeDetector.js**
```javascript
/**
 * Detects block type from content patterns
 * Detecta tipo de bloco a partir de padrões de conteúdo
 */
export function detectBlockType(content, context)
export function getBlockTypeName(blockType)
```

##### **tempFileManager.js**
```javascript
/**
 * Tracks AI-generated files during session
 * Rastreia arquivos gerados pela IA durante a sessão
 */
class TempFileManager {
  trackFile(path, content)
  getUnsavedFiles()
  clearTracking()
}
```

##### **scriptManager.js**
```javascript
/**
 * Manages script lifecycle (save, execute, debug)
 * Gerencia ciclo de vida de scripts (salvar, executar, depurar)
 */
export class ScriptManager {
  static saveScript(path, content, makeExecutable)
  static executeScript(path, args, workingDir)
  static debugScript(path, args)
}
```

##### **configManager.js**
```javascript
/**
 * Configuration hierarchy management
 * Gerenciamento de hierarquia de configuração
 */
export const ConfigManager = {
  loadConfig(category, filename)
  saveConfig(category, filename, data)
  resetToDefaults()
}
```

---

### Backend Layer / Camada Backend

#### 1. **Flask API (`backend/server.py`)**

**English:**
- **Size:** 58KB
- **Role:** REST API server and request router
- **Port:** 5000 (configurable)

**Português:**
- **Tamanho:** 58KB
- **Papel:** Servidor de API REST e roteador de requisições
- **Porta:** 5000 (configurável)

**Main Endpoints / Endpoints Principais:**

```python
# Health & Init / Saúde e Inicialização
GET  /health              # Server status / Status do servidor
POST /init                # Initialize AI brain / Inicializar cérebro da IA

# Chat & Execution / Chat e Execução
POST /chat                # Send message to AI / Enviar mensagem para IA
POST /execute             # Execute shell command / Executar comando shell
POST /stop                # Stop AI generation / Parar geração da IA

# Session Management / Gerenciamento de Sessões
GET  /sessions            # List sessions / Listar sessões
GET  /load_session        # Load session / Carregar sessão
POST /save_session        # Save session / Salvar sessão
POST /delete_session      # Delete session / Deletar sessão

# Configuration / Configuração
GET  /config              # Get all config / Obter toda configuração
POST /config              # Update config / Atualizar configuração
GET  /config/user/ui/:file # Get UI config / Obter config da UI

# Script Management / Gerenciamento de Scripts
POST /script/save         # Save script / Salvar script
POST /script/execute      # Execute script / Executar script
POST /script/debug        # Debug script / Depurar script

# System / Sistema
POST /shutdown            # Shutdown server / Desligar servidor
GET  /status              # System status / Status do sistema
```

---

#### 2. **Configuration System (`backend/config_loader.py`)**

**Hierarchy / Hierarquia:**

```
1. Templates (config_templates/)
   └─ Default values / Valores padrão
   
2. User Config (~/.hexagent-gui/config/)
   └─ User overrides / Sobrescritas do usuário
   
3. Runtime (in-memory)
   └─ Temporary changes / Mudanças temporárias
```

**Configuration Categories / Categorias de Configuração:**

```
config_templates/
├── ai/
│   ├── main.json          # Model, temperature, max_tokens
│   ├── brain.json         # Persona/brain settings
│   └── web_search.json    # Web search toggle
├── ui/
│   ├── block_rules.json   # Block rendering rules
│   ├── temp_files.json    # File tracking config
│   └── theme.json         # Colors, fonts, appearance
├── features/
│   └── auto_execute.json  # Command execution settings
└── system/
    └── paths.json         # Directory locations
```

---

#### 3. **HexStrike Integration**

**English:**
HexStrike AI Server provides:
- OpenRouter API integration
- Autonomous iteration logic (up to 10 loops)
- Command parsing and execution
- Result analysis and decision-making

**Português:**
Servidor HexStrike AI fornece:
- Integração com API OpenRouter
- Lógica de iteração autônoma (até 10 loops)
- Análise e execução de comandos
- Análise de resultados e tomada de decisão

**Communication Flow / Fluxo de Comunicação:**

```
User Input → Flask API → HexStrike Server → OpenRouter API
                ↓             ↓                    ↓
         Session Save    Command Exec         AI Response
                ↓             ↓                    ↓
         Store in DB    Get Output           Stream Tokens
                ↓             ↓                    ↓
              ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
                         Unified Response
                               ↓
                         Frontend Display
```

---

## 🔄 Data Flow / Fluxo de Dados

### 1. **Message Sending Flow**

```
[User Types Message]
        ↓
[App.jsx: sendMessage()]
        ↓
[POST /chat to Flask]
        ↓
[server.py: handle_chat()]
        ↓
[Forward to HexStrike Server]
        ↓
[HexStrike: OpenRouter API call]
        ↓
[Stream tokens back]
        ↓
[Flask: Forward stream to frontend]
        ↓
[App.jsx: Update UI in real-time]
        ↓
[Display in SmartBlock components]
```

### 2. **Command Execution Flow**

```
[AI Decides to Execute Command]
        ↓
[Backend: Parse command from response]
        ↓
[POST /execute with command]
        ↓
[server.py: subprocess.run()]
        ↓
[Capture stdout, stderr, exit_code]
        ↓
[Return result to frontend]
        ↓
[Display in OUTPUT block with ANSI colors]
```

### 3. **Configuration Update Flow**

```
[User Opens Settings Modal]
        ↓
[Load current config via GET /config]
        ↓
[User Changes Settings]
        ↓
[POST /config with updated values]
        ↓
[Backend: Merge with user config]
        ↓
[Save to ~/.hexagent-gui/config/]
        ↓
[Return updated config]
        ↓
[Frontend: Apply changes immediately]
```

---

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
| **React Syntax Highlighter** | Code rendering | Renderização de código |

### Backend

| Technology | Purpose | Propósito |
|-----------|---------|-----------|
| **Python 3.13** | Runtime | Runtime |
| **Flask 3.1** | Web framework | Framework web |
| **Subprocess** | Command execution | Execução de comandos |
| **JSON** | Configuration | Configuração |
| **OpenRouter API** | AI model routing | Roteamento de modelo de IA |

---

## 🔐 Security Considerations / Considerações de Segurança

**English:**
1. **Command Execution:** All commands executed via `subprocess.run()` with timeout (30s)
2. **Path Traversal Protection:** Script save paths validated against `../` attacks
3. **API Authentication:** OpenRouter API key stored in user config (not in code)
4. **Local-only Server:** Flask binds to `localhost:5000` (not exposed externally)
5. **Permission Validation:** Scripts set to `0o755` only if explicitly requested

**Português:**
1. **Execução de Comandos:** Todos os comandos executados via `subprocess.run()` com timeout (30s)
2. **Proteção contra Path Traversal:** Caminhos de salvamento de scripts validados contra ataques `../`
3. **Autenticação de API:** Chave de API do OpenRouter armazenada em config de usuário (não no código)
4. **Servidor Local Apenas:** Flask vincula a `localhost:5000` (não exposto externamente)
5. **Validação de Permissões:** Scripts configurados para `0o755` apenas se explicitamente solicitado

---

## 📊 Performance Optimizations / Otimizações de Performance

**Implemented / Implementado:**
1. ✅ React.memo for frequently re-rendering components
2. ✅ useMemo for expensive computations
3. ✅ useCallback for event handlers
4. ✅ Code splitting with React.lazy (planned)
5. ✅ ANSI rendering caching
6. ✅ Stream processing (chunks, not full response)

**Planned / Planejado:**
- Dynamic imports for large modals
- Virtual scrolling for long message history
- Web Workers for heavy parsing tasks

---

## 🧪 Testing Strategy / Estratégia de Testes

**Manual Testing / Testes Manuais:**
- All features tested on Kali Linux ARM64
- ANSI color rendering verified with `ls -la`, `grep --color`
- Script execution tested with Python, Bash, Node.js
- Session persistence verified across restarts

**Automated Testing (Future) / Testes Automatizados (Futuro):**
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests with Playwright/Cypress

---

## 📈 Future Enhancements / Melhorias Futuras

**Short-term / Curto Prazo:**
1. TypeScript migration
2. Unit test coverage (>80%)
3. Plugin system for custom blocks
4. Multi-language support (Spanish, French)

**Long-term / Longo Prazo:**
1. Cloud sync for sessions
2. Collaborative mode (multi-user)
3. Custom AI model support (local LLMs)
4. Mobile app (React Native)

---

## 📚 Related Documentation / Documentação Relacionada

- [Features Documentation](FEATURES.md)
- [User Manual](USER_MANUAL.md)
- [Installation Guide](INSTALL.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

**Last Updated:** 2026-01-05  
**Version:** 1.0.0  
**Maintainer:** Roberto Dantas de Castro
