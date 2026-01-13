# GUI State Variables Map - Complete Inventory
# Mapa de Variáveis de Estado GUI - Inventário Completo 

**Updated:** 2026-01-10 04:22  
**File:** `App.jsx`  
**Total State Variables:** 40+  
**Status:** ✅ All variables mapped and analyzed

---

## 📊 State Variables Breakdown / Classificação de Variáveis de Estado

### Category Summary:
- **useState Hooks:** 27 variables
- **useRef Hooks:** 4 refs
- **Custom Hooks:** 6 hooks
- **Modal States:** 7 modals (via useModalState)
- **Config Hooks:** 2 hooks (System + AI)

**Total:** 40+ managed state variables

---

## 1️⃣ Core Chat & Block Management / Gerenciamento Central de Chat e Blocos

### `blocks` - Message History Array
```javascript
const [blocks, setBlocks] = useState([]);
```
**Purpose:** Stores all chat messages/blocks (user, agent, shell output)  
**Propósito:** Armazena todas mensagens/blocos do chat (usuário, agente, saída shell)  
**Sync:** Frontend only, saved to backend via SessionService  
**Init:** Empty array `[]`  
**Cleanup:** Auto-saved on change (debounced 2s)

### `input` - User Input Text
```javascript
const [input, setInput] = useState('');
```
**Purpose:** Current user input in textarea  
**Propósito:** Entrada atual do usuário no textarea  
**Sync:** Frontend only  
**Init:** Empty string  
**Cleanup:** Cleared on submit

### `isLoading` - AI Processing State
```javascript
const [isLoading, setLoading] = useState(false);
```
**Purpose:** Indicates if AI is currently generating response  
**Propósito:** Indica se IA está gerando resposta  
**Sync:** Frontend only  
**Init:** `false`  
**Cleanup:** Set to `false` on completion/error

---

## 2️⃣ Connection & Service Status / Status de Conexão e Serviços

### `status` - Global Connection Status
```javascript
const [status, setStatus] = useState('OFFLINE');
```
**Purpose:** Overall backend connection status  
**Propósito:** Status geral de conexão com backend  
**Values:** 'ONLINE' | 'OFFLINE' | 'DISCONNECTED'  
**Sync:** Polled from `/status` endpoint every 5s  
**Init:** 'OFFLINE'

### `serviceStatus` - Individual Service States
```javascript
const [serviceStatus, setServiceStatus] = useState({ 
  flask: false, 
  hexstrike: false, 
  brain: false 
});
```
**Purpose:** Status of each backend service  
**Propósito:** Status de cada serviço do backend  
**Sync:** Updated from `/status` response  
**Init:** All `false`

### `initStatus` - Initialization Progress
```javascript
const [initStatus, setInitStatus] = useState({
  backend: { status: 'pending', message: '', port: null },
  hexstrike: { status: 'pending', message: '', ready: false, port: null },
  brain: { status: 'pending', message: '' },
  config: { status: 'pending', message: '' }
});
```
**Purpose:** Tracks initialization of each component  
**Propósito:** Rastreia inicialização de cada componente  
**States:** 'pending' | 'loading' | 'success' | 'error' | 'warning'  
**Sync:** Updated during app startup sequence

---

## 3️⃣ Input Mode & UI Control / Modo de Entrada e Controle UI

### `inputMode` - Input Type Toggle
```javascript
const [inputMode, setInputMode] = useState('prompt');
```
**Purpose:** Switches between prompt (AI chat) and command (terminal) mode  
**Propósito:** Alterna entre modo prompt (chat IA) e comando (terminal)  
**Values:** 'prompt' | 'command'  
**Init:** 'prompt'

### `autoScroll` - Auto-scroll Toggle
```javascript
const [autoScroll, setAutoScroll] = useState(true);
```
**Purpose:** Controls automatic scrolling to bottom on new messages  
**Propósito:** Controla rolagem automática ao fim em novas mensagens  
**Init:** `true`

---

## 4️⃣ History Management / Gerenciamento de Histórico

### `promptHistory` - Local Prompt History
```javascript
const [promptHistory, setPromptHistory] = useState([]);
```
**Purpose:** Stores recent prompt-mode inputs (local only)  
**Propósito:** Armazena entradas recentes no modo prompt (apenas local)  
**Max Size:** 100 entries  
**Sync:** Frontend only (not persisted)

### `systemHistory` - Shell Command History
```javascript
const [systemHistory, setSystemHistory] = useState([]);
```
**Purpose:** Stores shell command history from backend  
**Propósito:** Armazena histórico de comandos shell do backend  
**Sync:** Loaded from `/history/shell` on mount  
**Max Size:** 100 entries

### `historyIndex` - Prompt History Navigator  
```javascript
const [historyIndex, setHistoryIndex] = useState(-1);
```
**Purpose:** Navigation index for prompt history (Shift+Ctrl+Arrow)  
**Init:** -1 (no history selected)

### `sysHistoryIndex` - System History Navigator
```javascript
const [sysHistoryIndex, setSysHistoryIndex] = useState(-1);
```
**Purpose:** Navigation index for system history (Arrow keys)  
**Init:** -1 (no history selected)

---

## 5️⃣ File Editor State / Estado do Editor de Arquivos

### `openFiles` - Open Files Array
```javascript
const [openFiles, setOpenFiles] = useState([]);
```
**Purpose:** List of currently open files in editor  
**Propósito:** Lista de arquivos atualmente abertos no editor  
**Structure:**
```javascript
[{
  path: string,
  content: string,
  saved: boolean,
  modified: boolean,
  type: string
}]
```

### `activeFileIndex` - Active Tab Index
```javascript
const [activeFileIndex, setActiveFileIndex] = useState(0);
```
**Purpose:** Index of currently active file tab  
**Init:** 0

### `currentSessionName` - Current Session Name
```javascript
const [currentSessionName, setCurrentSessionName] = useState('');
```
**Purpose:** Name of currently loaded session  
**Sync:** Set when session loaded via SessionService  
**Init:** Empty string

---

## 6️⃣ AI Iteration Control / Controle de Iterações da IA

### `autoExecute` - Auto-execute Command Proposals
```javascript
const [autoExecute, setAutoExecute] = useState(false);
```
**Purpose:** Automatically execute command proposals without confirmation  
**Init:** `false` (for safety)

### `maxIterations` - Maximum AI Iterations
```javascript
const [maxIterations, setMaxIterations] = useState(10);
```
**Purpose:** Maximum allowed AI reasoning iterations  
**Sync:** Synced with `aiConfig.ai.max_iterations`  
**Init:** 10

### `unlimitedIterations` - Unlimited Mode Toggle
```javascript
const [unlimitedIterations, setUnlimitedIterations] = useState(false);
```
**Purpose:** Bypass iteration limit  
**Sync:** Synced with `aiConfig.ai.unlimited_iterations`  
**Init:** `false`

### `currentIteration` - Current Iteration Counter
```javascript
const [currentIteration, setCurrentIteration] = useState(0);
```
**Purpose:** Tracks current AI iteration for progress display  
**Init:** 0  
**Reset:** On new chat message

### `showIterationLimitReached` - Limit Dialog Trigger
```javascript
const [showIterationLimitReached, setShowIterationLimitReached] = useState(false);
```
**Purpose:** Shows iteration limit dialog when limit reached  
**Init:** `false`

---

## 7️⃣ Initialization & Loading / Inicialização e Carregamento

### `isInitializing` - App Init State
```javascript
const [isInitializing, setIsInitializing] = useState(true);
```
**Purpose:** Shows loading screen during app initialization  
**Init:** `true`  
**Set to false:** After all components initialized

### `initProgress` - Init Progress Percentage
```javascript
const [initProgress, setInitProgress] = useState(0);
```
**Purpose:** Loading progress (0-100%)  
**Init:** 0

### `initError` - Init Error Object
```javascript
const [initError, setInitError] = useState(null);
```
**Purpose:** Stores initialization errors  
**Init:** `null`

---

## 8️⃣ Refs (DOM & Non-State) / Refs (DOM e Não-Estado)

### `scrollRef` - Main Chat Scroll Container
```javascript
const scrollRef = useRef(null);
```
**Purpose:** Reference to main chat scroll container for auto-scroll  
**Used by:** Auto-scroll logic in useEffect

### `abortControllerRef` - Fetch Abort Controller
```javascript
const abortControllerRef = useRef(null);
```
**Purpose:** Stores AbortController for canceling AI requests  
**Cleanup:** Aborted and nullified on new request or component unmount

### `bottomRef` - Chat Bottom Marker
```javascript
const bottomRef = useRef(null);
```
**Purpose:** Invisible div at chat bottom for scroll-into-view  
**Used by:** Auto-scroll logic

### `codeRef` - Code Block Reference (in SmartBlock)
```javascript
const codeRef = useRef(null);
```
**Scope:** Inside SmartBlock component  
**Purpose:** Reference to code element for syntax highlighting

---

## 9️⃣ Custom Hooks / Hooks Personalizados

### `useTranslation` - Translation Hook
```javascript
const { t, language, setLanguage } = useTranslation();
```
**Returns:**
- `t(key, fallback)` - Translation function
- `language` - Current language code
- `setLanguage(code)` - Change language

**Sync:** Language persisted in `systemConfig.system.language`

### `useSystemConfig` - System Configuration Hook
```javascript
const { 
  systemConfig, 
  loading: systemLoading, 
  error: systemError, 
  saveSystemConfig 
} = useSystemConfig();
```
**State Managed:**
- `systemConfig` - System settings object
- `systemLoading` - Loading boolean
- `systemError` - Error object

**Backend Sync:** Loaded from `/api/system_config`, saved via `/config`

### `useAIConfig` - AI Configuration Hook
```javascript
const { 
  aiConfig, 
  loading: aiLoading, 
  error: aiError, 
  saveAIConfig 
} = useAIConfig();
```
**State Managed:**
- `aiConfig` - AI settings object
- `aiLoading` - Loading boolean
- `aiError` - Error object

**Backend Sync:** Loaded from `/api/ai_config`, saved via `/config`

---

## 🔟 Modal States (via useModalState) / Estados de Modais

All modals use the same `useModalState()` hook pattern:

```javascript
const settingsModal = useModalState();
const helpModal = useModalState();
const sessionModal = useModalState();
const servicesModal = useModalState();
const workflowModal = useModalState();
const shutdownModal = useModalState();
const aiConfigModal = useModalState();
```

**Each provides:**
- `isOpen` - Boolean state
- `open()` - Open modal
- `close()` - Close modal
- `toggle()` - Toggle state

**Total Modal State Variables:** 7 × 5 properties = 35 sub-states

---

## 🔄 State Synchronization Patterns / Padrões de Sincronização

### 1. **Frontend-Only States** (No Backend Sync)
- `input`, `isLoading`, `autoScroll`
- `promptHistory`, `historyIndex`, `sysHistoryIndex`
- `activeFileIndex`, `currentIteration`
- All modal `isOpen` states

### 2. **Backend-Synced States** (Bi-directional)
- `systemConfig` ↔ `/api/system_config`
- `aiConfig` ↔ `/api/ai_config`
- `blocks` ↔ SessionService

### 3. **Backend-Polled States** (Read-only from backend)
- `status`, `serviceStatus` ← `/status` (every 5s)
- `systemHistory` ← `/history/shell` (on mount)

### 4. **Derived States** (Calculated from other states)
- `configLoading = systemLoading || aiLoading`
- `configError = systemError || aiError`

---

## ⚠️ Potential Issues Identified / Problemas Potenciais Identificados

### 1. **State Synchronization Gaps**
```javascript
// maxIterations is not properly synced with aiConfig
const [maxIterations, setMaxIterations] = useState(10);
// Should use: aiConfig?.ai?.max_iterations
```
**Recommendation:** Remove local `maxIterations` state, use config directly

### 2. **Duplicate State Management**
```javascript
const [unlimitedIterations, setUnlimitedIterations] = useState(false);
// Duplicates: aiConfig.ai.unlimited_iterations
```
**Recommendation:** Single source of truth via config

### 3. **Memory Leak Risk**
```javascript
let intervalId; // Global scope in component body!
// Should be: const intervalIdRef = useRef(null);
```
**Recommendation:** Use ref for interval IDs

### 4. **Missing Cleanup**
```javascript
// abortControllerRef cleanup in useEffect lacks dependency array
useEffect(() => {
  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, []); // Missing intervalId in deps
```

---

## ✅ Recommendations / Recomendações

### Priority 1: Remove Duplicate States
1. **Iteration Control:**
   - Remove `maxIterations`, `unlimitedIterations`, `currentIteration`
   - Use `aiConfig.ai.*` directly
   - Create computed getters if needed

2. **Backend URL:**
   - Remove hardcoded `http://localhost:5000`
   - Use `systemConfig.services.flask_url`

### Priority 2: Fix Ref Usage
1. Move `intervalId` to ref: `const intervalIdRef = useRef(null)`
2. Add proper cleanup dependencies

### Priority 3: Centralize Config Sync
1. Create single `useConfig()` hook that combines System + AI config
2. Implement optimistic updates for better UX
3. Add loading/error states per config section

### Priority 4: State Management Refactor
Consider migrating to:
- **Option A:** React Context for config (reduce prop drilling)
- **Option B:** Zustand/Jotai for global state
- **Option C:** Keep useState but extract to custom hooks

---

## 📈 State Complexity Metrics / Métricas de Complexidade

- **Total State Variables:** 40+
- **Nesting Levels:** Up to 3 (e.g., `serviceStatus.flask`)
- **Update Patterns:** 8 different patterns identified
- **Backend Dependencies:** 5 endpoints
- **Potential Race Conditions:** 2 (status polling + config updates)

---

## 🎯 Action Items / Itens de Ação

1. [ ] Refactor iteration control to use config state only
2. [ ] Move interval IDs to refs
3. [ ] Add config sync middleware/hook
4. [ ] Document state flow in diagram (Mermaid)
5. [ ] Add PropTypes/TypeScript for type safety
6. [ ] Implement optimistic UI updates
7. [ ] Add state persistence layer for recovery

---

**Status:** Analysis Complete / Análise Completa  
**Next:** Request user review before implementation / Solicitar revisão do usuário antes da implementação
