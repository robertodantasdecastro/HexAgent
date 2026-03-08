# App.jsx POO Refactoring Plan
# Plano de Refatoração POO do App.jsx

**Date:** 2026-01-12 20:32  
**Current:** App.jsx = 1812 lines (monolithic)  
**Goal:** Modular POO architecture  
**Pattern:** Singleton Services + React Hooks

---

## 📊 CURRENT ANALYSIS

### App.jsx Structure (31 functions):

**Utility Functions (can be extracted):**
1. `parseAgentContent` - Parse AI responses
2. `Block` - Render chat blocks  
3. `CodeBlock` - Render code blocks

**App Component Functions:**
1. `toggleService` - Service management
2. `stopGeneration` - Abort control
3. `handleBeforeUnload` - Lifecycle
4. `checkStatus` - Health checks
5. `waitForBackend` - Initialization
6. `initBackend` - Initialization
7. `initialize` - Initialization
8. **`handleSubmit`** - CRITICAL (Chat submission)
9. **`handleContinue`** - CRITICAL (Continue chat)
10. `handleExecuteProposal` - Command execution
11. `handleKeyDown` - Input handling
12. `handleSettingsSave` - Config
13. `handleExportChat` - Export
14. `handleConfigUpdate` - Config
15. `toggleUnlimited` - Settings
16. `handleServiceCommand` - Service control
17. `handleSessionCommand` - Session control
18. `handleLoadSession` - Session
19. `handleSaveSession` - Session

### Existing POO Services:

✅ **SessionService** - Singleton pattern
- Methods: loadSession, saveSession, listSessions, deleteSession, autoSave
- 294 lines, clean POO

✅ **APIClient** - Singleton Facade pattern  
- Methods: get, post, put, delete, retry
- 473 lines, clean POO

✅ **CommandService** - Exists (need to check)
✅ **WorkflowService** - Exists (need to check)

---

## 🏗️ REFACTORING ARCHITECTURE

### New Services to Create:

#### 1. **ChatService** (CRITICAL for SSE)

```javascript
/**
 * ChatService - Handles all chat/AI interactions
 * Serviço de Chat - Gerencia todas interações de chat/IA
 * 
 * @pattern Singleton + Observer (for SSE)
 */
class ChatService {
  static #instance = null;
  
  #api;
  #currentEventSource = null;
  #messageHandlers = [];
  
  async sendMessage(prompt, context = [], options = {}) {
    // SSE implementation
  }
  
  abortCurrentRequest() {
    if (this.#currentEventSource) {
      this.#currentEventSource.close();
    }
  }
  
  onMessage(handler) {
    this.#messageHandlers.push(handler);
  }
  
  #handleSSEChunk(chunk) {
    // Process SSE chunks (text, command_proposal, command_result, complete)
  }
}
```

**File:** `src/services/ChatService.js`  
**Responsibility:** All chat/AI communication including SSE streaming  
**Lines:** ~300

---

#### 2. **BlockParserService**

```javascript
/**
 * BlockParserService - Parse and format AI responses
 * Serviço de Parser de Blocos - Parsear e formatar respostas da IA
 * 
 * @pattern Util/Helper (Stateless)
 */
class BlockParserService {
  static parseAgentContent(content) {
    // Extract from current parseAgentContent function
  }
  
  static extractCodeBlocks(content) {
    // Code block extraction
  }
  
  static extractCommands(content) {
    // Command extraction
  }
}
```

**File:** `src/services/BlockParserService.js`  
**Responsibility:** Parsing AI responses into structured sections  
**Lines:** ~150

---

#### 3. **CommandExecutionService**

```javascript
/**
 * CommandExecutionService - Execute and track commands
 * Serviço de Execução de Comandos - Executar e rastrear comandos
 * 
 * @pattern Singleton
 */
class CommandExecutionService {
  static #instance = null;
  
  #api;
  #executionHistory = new Map();
  
  async executeCommand(command, options = {}) {
    // Execute via backend
  }
  
  async approveProposal(proposalId) {
    // Approve proposed command
  }
  
  async rejectProposal(proposalId) {
    // Reject proposed command
  }
  
  getExecutionHistory() {
    return Array.from(this.#executionHistory.values());
  }
}
```

**File:** `src/services/CommandExecutionService.js`  
**Responsibility:** Command proposal/execution/tracking  
**Lines:** ~200

---

#### 4. **AgentConfigService**

```javascript
/**
 * AgentConfigService - Manage AgentCore configuration
 * Serviço de Configuração do Agente - Gerenciar configuração AgentCore
 * 
 * @pattern Singleton
 */
class AgentConfigService {
  static #instance = null;
  
  #api;
  #config = {
    maxIterations: 10,
    autoExecute: false,
    model: 'google/gemini-2.0-flash-exp:free'
  };
  
  async loadConfig() {
    // Load from backend
  }
  
  async saveConfig(config) {
    // Save to backend
  }
  
  async getAgentStatus() {
    // Get AgentCore health status
  }
  
  getConfig() {
    return { ...this.#config };
  }
}
```

**File:** `src/services/AgentConfigService.js`  
**Responsibility:** Agent/AI configuration management  
**Lines:** ~150

---

### Component Extraction:

#### 5. **ChatBlock Component**

Extract `Block` function → `src/components/ChatBlock.jsx`

```javascript
/**
 * ChatBlock - Render individual chat blocks
 * @props {string} type - 'user' | 'agent' | 'output'
 * @props {string} content
 * @props {string} timestamp
 * @props {Function} onExecute
 * @props {boolean} isLoading
 */
export function ChatBlock({ type, content, timestamp, onExecute, isLoading, colors }) {
  // Extracted from current Block function
}
```

**File:** `src/components/ChatBlock.jsx`  
**Lines:** ~200

---

#### 6. **CodeBlock Component**

Extract `CodeBlock` function → `src/components/CodeBlock.jsx`

```javascript
/**
 * CodeBlock - Render code with syntax highlighting
 * @props {string} code
 * @props {string} language
 * @props {Function} onExecute
 */
export function CodeBlock({ code, language, onExecute, colors }) {
  // Extracted from current CodeBlock function
}
```

**File:** `src/components/CodeBlock.jsx`  
**Lines:** ~100

---

## 📋 REFACTORING STEPS

### Phase 1: Extract Services (2-3 hours)

1. **Create ChatService** (1h)
   - [ ] Create `src/services/ChatService.js`
   - [ ] Implement SSE connection logic
   - [ ] Implement message sending
   - [ ] Implement abort logic
   - [ ] Add tests

2. **Create BlockParserService** (30min)
   - [ ] Create `src/services/BlockParserService.js`
   - [ ] Extract `parseAgentContent` logic
   - [ ] Add static helper methods

3. **Create CommandExecutionService** (45min)
   - [ ] Create `src/services/CommandExecutionService.js`
   - [ ] Implement command execution
   - [ ] Implement proposal approval/rejection

4. **Create AgentConfigService** (45min)
   - [ ] Create `src/services/AgentConfigService.js`
   - [ ] Implement config load/save
   - [ ] Implement status fetching

---

### Phase 2: Extract Components (1 hour)

5. **Extract ChatBlock** (30min)
   - [ ] Create `src/components/ChatBlock.jsx`
   - [ ] Move Block function logic
   - [ ] Update imports in App.jsx

6. **Extract CodeBlock** (30min)
   - [ ] Create `src/components/CodeBlock.jsx`  
   - [ ] Move CodeBlock function logic
   - [ ] Update imports in App.jsx

---

### Phase 3: Refactor App.jsx (2 hours)

7. **Update App.jsx to use Services** (2h)
   - [ ] Import all new services
   - [ ] Replace handleSubmit with ChatService
   - [ ] Replace handleContinue with ChatService
   - [ ] Replace parseAgentContent with BlockParserService
   - [ ] Replace command execution with CommandExecutionService
   - [ ] Use AgentConfigService for settings
   - [ ] Clean up old functions
   - [ ] Test all features

---

### Phase 4: Update Modals (1 hour)

8. **Update SettingsModal** (30min)
   - [ ] Use AgentConfigService
   - [ ] Add AI configuration tab
   - [ ] Add AgentCore status display

9. **Update ServiceManagerModal** (30min)
   - [ ] Use AgentConfigService for status
   - [ ] Display AgentCore/HexBrain/HexStrike

---

## 📁 NEW FILE STRUCTURE

```
src/
├── services/
│   ├── APIClient.js              ✅ (exists)
│   ├── SessionService.js         ✅ (exists)
│   ├── CommandService.js         ✅ (exists)
│   ├── WorkflowService.js        ✅ (exists)
│   ├── ChatService.js            ⚠️ CREATE (SSE + AI)
│   ├── BlockParserService.js     ⚠️ CREATE (parsing)
│   ├── CommandExecutionService.js⚠️ CREATE (exec)
│   └── AgentConfigService.js     ⚠️ CREATE (config)
│
├── components/
│   ├── ChatBlock.jsx             ⚠️ CREATE (extract from App)
│   ├── CodeBlock.jsx             ⚠️ CREATE (extract from App)
│   ├── CommandProposal.jsx       ✅ (created)
│   ├── SettingsModal.jsx         ⚠️ UPDATE
│   ├── ServiceManagerModal.jsx   ⚠️ UPDATE
│   └── ... (existing)
│
└── App.jsx                        ⚠️ REFACTOR (reduce to ~800 lines)
```

---

## 🎯 BENEFITS

### Before:
- App.jsx: 1812 lines (monolithic)
- All logic in one file
- Difficult to test
- Hard to maintain

### After:
- App.jsx: ~800 lines (orchestration only)
- 4 new services (~800 lines total)
- 2 extracted components (~300 lines)
- Clean separation of concerns
- Easy to test each service
- Scalable architecture

---

## ⚡ EXECUTION PLAN

### Option A: Full Refactor First (5-6h)
1. Extract all services
2. Extract components
3. Refactor App.jsx
4. Integrate SSE
5. Update modals

### Option B: Incremental (Recommended - 3-4h)
1. **Create ChatService with SSE** (most critical) ⭐
2. **Update App.jsx to use ChatService**
3. Extract other services incrementally
4. Extract components later
5. Update modals

---

## 🔥 RECOMMENDED: Option B - Start with ChatService

**Why:**
- ChatService is most critical for SSE
- Can integrate SSE immediately
- Other extractions can wait
- Faster time to working SSE

**Steps:**
1. Create ChatService.js (1h)
2. Update handleSubmit to use ChatService (30min)
3. Update handleContinue to use ChatService (30min)
4. Test SSE streaming (30min)
5. Extract other services later (optional)

**Total:** 2.5 hours to working SSE

---

**Status:** Ready to implement  
**Recommendation:** Option B - ChatService first  
**Next:** Create ChatService.js with SSE support
