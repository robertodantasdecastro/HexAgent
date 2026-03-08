# Complete Project Integration Implementation Plan
# Plano Completo de Implementação da Integração do Projeto

**Date:** 2026-01-12 20:24  
**Objective:** Full AgentCore integration with clean POO architecture  
**Status:** PLANNING

---

## 📊 ANALYSIS RESULTS

### ✅ Good News - No Major Conflicts:

1. **No duplicate Brain/Agent classes** in backend
2. **OpenAI only used in** `hex_brain.py` (our code)
3. **Clean backend structure** - ready for integration
4. **Modals exist** for configuration

### 🎯 Files Requiring Integration:

**Backend:**
- ✅ `backend/core/*` - Already created
- ✅ `backend/app.py` - Already integrated
- ✅ `backend/controllers/chat_controller.py` - Already integrated
- ⚠️ `backend/services/ai_config_service.py` - May need update
- ⚠️ `backend/config_loader.py` - May need update

**Frontend:**
- ⚠️ `src/App.jsx` - Uses /chat in 3 places (lines 836, 916, 1223)
- ⚠️ `src/components/SettingsModal.jsx` - AI configuration
- ⚠️ `src/components/ServiceManagerModal.jsx` - Service management
- ⚠️ `src/components/AIConfigModal.jsx` - AI settings (if exists)

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Backend Cleanup & Integration ✅

**Status:** COMPLETE

Files modified:
- [x] `backend/core/hex_brain.py`
- [x] `backend/core/hex_strike_client.py`
- [x] `backend/core/agent_core.py`
- [x] `backend/controllers/chat_controller.py`
- [x] `backend/app.py`

---

### Phase 2: Frontend SSE Integration (CURRENT)

#### Step 1: Update App.jsx for SSE Streaming

**File:** `src/App.jsx`

**Changes needed:**

1. **Replace fetch() calls with EventSource for SSE:**

```javascript
// OLD (lines 916-930, 1223-1237):
const response = await fetch(api.baseURL + '/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({prompt, context, stream: false}),
});

// NEW:
const eventSource = new EventSource(
  `${api.baseURL}/chat?` + new URLSearchParams({
    prompt: cmd,
    auto_execute: autoExecute,
    max_iterations: maxIterations
  })
);

eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data);
  
  switch(chunk.type) {
    case 'text':
      // Append AI text to current message
      setBlocks(prev => appendToLastBlock(prev, chunk.content));
      break;
    
    case 'command_proposal':
      // Show proposed command
      setBlocks(prev => [...prev, {
        type: 'command_proposal',
        content: chunk.content,
        metadata: chunk.metadata
      }]);
      break;
    
    case 'command_result':
      // Show command output
      setBlocks(prev => [...prev, {
        type: 'output',
        content: chunk.content,
        success: chunk.metadata.success
      }]);
      break;
    
    case 'complete':
      // Iteration complete
      eventSource.close();
      setIsProcessing(false);
      break;
  }
};
```

2. **Add SSE helper functions:**

```javascript
// Helper to append to last block
// Helper para adicionar ao último bloco
const appendToLastBlock = (blocks, content) => {
  const newBlocks = [...blocks];
  const lastBlock = newBlocks[newBlocks.length - 1];
  
  if (lastBlock && lastBlock.type === 'ai') {
    lastBlock.content += content;
  } else {
    newBlocks.push({
      type: 'ai',
      content: content,
      timestamp: new Date().toISOString()
    });
  }
  
  return newBlocks;
};
```

3. **Update handleSubmit to use SSE:**

Location: Line ~1220  
Replace entire fetch block with SSE implementation

4. **Update handleContinue to use SSE:**

Location: Line ~916  
Replace entire fetch block with SSE implementation

**Complexity:** HIGH (197 lines function)  
**Estimated Time:** 1-2 hours

---

#### Step 2: Add Command Approval UI

**New Component:** `src/components/CommandProposal.jsx`

```javascript
/**
 * Command Proposal Component
 * Componente de Proposta de Comando
 * 
 * Displays proposed commands with approve/reject buttons
 * Exibe comandos propostos com botões aprovar/rejeitar
 */
import React from 'react';

export const CommandProposal = ({ command, onApprove, onReject, metadata }) => {
  return (
    <div className="command-proposal">
      <div className="command-header">
        <span className="icon">💻</span>
        <span>Proposed Command / Comando Proposto</span>
      </div>
      
      <pre className="command-code">
        <code>{command}</code>
      </pre>
      
      <div className="command-meta">
        <span>Iteration: {metadata.iteration}/{metadata.max_iterations}</span>
        {metadata.hexstrike_available ? (
          <span className="status-ok">✓ HexStrike Available</span>
        ) : (
          <span className="status-warn">⚠ HexStrike Offline</span>
        )}
      </div>
      
      {metadata.auto_execute ? (
        <div className="auto-execute-info">
          <span>⚡ Auto-executing...</span>
        </div>
      ) : (
        <div className="command-actions">
          <button onClick={onApprove} className="btn-approve">
            ✓ Execute / Executar
          </button>
          <button onClick={onReject} className="btn-reject">
            ✗ Skip / Pular
          </button>
        </div>
      )}
    </div>
  );
};
```

**Integration in App.jsx:**

```javascript
// Import at top
import { CommandProposal } from './components/CommandProposal';

// In render section, when block.type === 'command_proposal':
{block.type === 'command_proposal' && (
  <CommandProposal
    command={block.content}
    metadata={block.metadata}
    onApprove={() => handleCommandApprove(block)}
    onReject={() => handleCommandReject(block)}
  />
)}
```

**Estimated Time:** 30 minutes

---

### Phase 3: GUI Settings Integration

#### Step 1: Update SettingsModal.jsx

**File:** `src/components/SettingsModal.jsx`

**Add AI Configuration Section:**

```javascript
// Add to SettingsModal tabs
{activeTab === 'ai' && (
  <div className="ai-settings">
    <h3>AI Configuration / Configuração IA</h3>
    
    {/* API Key Section */}
    <div className="setting-group">
      <label>OpenRouter API Key</label>
      <input
        type="password"
        value={config.ai.api_key || ''}
        onChange={(e) => updateConfig('ai.api_key', e.target.value)}
        placeholder="sk-or-v1-..."
      />
      <small>Get key at: https://openrouter.ai/keys</small>
    </div>
    
    {/* Model Selection */}
    <div className="setting-group">
      <label>AI Model / Modelo IA</label>
      <select
        value={config.ai.model || 'google/gemini-2.0-flash-exp:free'}
        onChange={(e) => updateConfig('ai.model', e.target.value)}
      >
        <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash (Free)</option>
        <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
        <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
      </select>
    </div>
    
    {/* Max Iterations */}
    <div className="setting-group">
      <label>
        Max Iterations / Máx Iterações
        <span className="help-text">
          Maximum AI→Command loops per request
        </span>
      </label>
      <input
        type="number"
        min="1"
        max="50"
        value={config.ai.max_iterations || 10}
        onChange={(e) => updateConfig('ai.max_iterations', parseInt(e.target.value))}
      />
    </div>
    
    {/* Auto Execute */}
    <div className="setting-group">
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={config.ai.auto_execute || false}
          onChange={(e) => updateConfig('ai.auto_execute', e.target.checked)}
        />
        <span>Auto-execute proposed commands</span>
        <span className="help-text">
          ⚠️ WARNING: Commands will run without confirmation
        </span>
      </label>
    </div>
    
    {/* AgentCore Status */}
    <div className="setting-group status-section">
      <h4>AgentCore Status</h4>
      <div className="status-grid">
        <div className="status-item">
          <span className="label">AI Brain:</span>
          <span className={`value ${agentStatus.brain_ready ? 'ok' : 'error'}`}>
            {agentStatus.brain_ready ? '✓ Ready' : '✗ Offline'}
          </span>
        </div>
        <div className="status-item">
          <span className="label">HexStrike:</span>
          <span className={`value ${agentStatus.hexstrike_available ? 'ok' : 'warn'}`}>
            {agentStatus.hexstrike_available ? '✓ Available' : '⚠ Unavailable'}
          </span>
        </div>
        <div className="status-item">
          <span className="label">Model:</span>
          <span className="value">{agentStatus.model}</span>
        </div>
      </div>
    </div>
  </div>
)}
```

**Add Status Fetching:**

```javascript
// In SettingsModal component
const [agentStatus, setAgentStatus] = useState({
  brain_ready: false,
  hexstrike_available: false,
  model: 'unknown'
});

useEffect(() => {
  // Fetch AgentCore status
  fetch(`${api.baseURL}/status/agent`)
    .then(r => r.json())
    .then(data => setAgentStatus(data.status))
    .catch(err => console.error('Failed to fetch agent status:', err));
}, []);
```

**Estimated Time:** 1 hour

---

#### Step 2: Update ServiceManagerModal.jsx

**File:** `src/components/ServiceManagerModal.jsx`

**Add AgentCore Service:**

```javascript
// Add to services list
const services = [
  {
    id: 'agent_core',
    name: 'AgentCore',
    description: 'AI Brain + HexStrike Integration',
    status: agentStatus.brain_ready ? 'running' : 'stopped',
    type: 'core'
  },
  {
    id: 'hex_brain',
    name: 'HexBrain (AI)',
    description: 'AI Inference Engine',
    status: agentStatus.brain_ready ? 'running' : 'stopped',
    type: 'ai',
    details: {
      model: agentStatus.model,
      messages: agentStatus.conversation_length
    }
  },
  {
    id: 'hexstrike',
    name: 'HexStrike',
    description: 'Command Execution Server',
    status: agentStatus.hexstrike_available ? 'running' : 'stopped',
    type: 'execution',
    details: {
      url: agentStatus.hexstrike_url
    }
  },
  // ... existing services
];
```

**Estimated Time:** 30 minutes

---

### Phase 4: Backend Configuration Integration

#### Update config_loader.py

**File:** `backend/config_loader.py`

**Add AgentCore configuration:**

```python
def load_agent_config():
    """
    Load AgentCore configuration
    Carrega configuração AgentCore
    """
    config = {
        'ai': {
            'api_key': os.getenv('OPENROUTER_API_KEY') or os.getenv('API_KEY') or '',
            'model': os.getenv('AI_MODEL', 'google/gemini-2.0-flash-exp:free'),
            'max_iterations': int(os.getenv('MAX_ITERATIONS', '10')),
            'auto_execute': os.getenv('AUTO_EXECUTE', 'false').lower() == 'true'
        },
        'hexstrike': {
            'url': os.getenv('HEXSTRIKE_URL', 'http://localhost:8888'),
            'enabled': os.getenv('HEXSTRIKE_ENABLED', 'true').lower() == 'true',
            'timeout': int(os.getenv('HEXSTRIKE_TIMEOUT', '60'))
        }
    }
    
    # Merge with user config if exists
    user_config_path = os.path.join(os.path.expanduser('~'), '.hexagent', 'agent_config.json')
    if os.path.exists(user_config_path):
        with open(user_config_path, 'r') as f:
            user_config = json.load(f)
            config = {**config, **user_config}
    
    return config
```

**Estimated Time:** 30 minutes

---

## 📝 FILES TO MODIFY - COMPLETE LIST

### Backend (Python):
1. ✅ `backend/core/hex_brain.py` - DONE
2. ✅ `backend/core/hex_strike_client.py` - DONE
3. ✅ `backend/core/agent_core.py` - DONE
4. ✅ `backend/controllers/chat_controller.py` - DONE
5. ✅ `backend/app.py` - DONE
6. ⚠️ `backend/config_loader.py` - Phase 4
7. ⚠️ `backend/services/ai_config_service.py` - May need update

### Frontend (JavaScript/JSX):
1. ⚠️ `src/App.jsx` - Phase 2 (CRITICAL - 200+ lines change)
2. ⚠️ `src/components/SettingsModal.jsx` - Phase 3
3. ⚠️ `src/components/ServiceManagerModal.jsx` - Phase 3
4. ⚠️ `src/components/CommandProposal.jsx` - Phase 2 (NEW FILE)
5. ⚠️ `src/App.css` - Add CommandProposal styles

---

## ⏱️ TIME ESTIMATES

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 1 (Backend) | ✅ COMPLETE | HIGH |
| Phase 2 (Frontend SSE) | 2-3 hours | VERY HIGH |
| Phase 3 (GUI Settings) | 1.5 hours  | MEDIUM |
| Phase 4 (Config) | 0.5 hours | LOW |
| Testing | 1 hour | MEDIUM |
| **TOTAL** | **5-6 hours** | - |

---

## 🎯 PRIORITY ORDER

1. **Phase 2 - Frontend SSE** (HIGHEST)
   - Without this, AgentCore features won't work
   
2. **Phase 3 - GUI Settings** (HIGH)
   - Users need to configure API keys
   
3. **Phase 4 - Config Integration** (MEDIUM)
   - Nice to have, can be done later

---

## ✅ ACCEPTANCE CRITERIA

- [ ] SSE streaming works in App.jsx
- [ ] Command proposals display correctly
- [ ] Settings modal shows AI configuration
- [ ] AgentCore status visible in GUI
- [ ] Max iterations configurable
- [ ] Auto-execute toggle works
- [ ] All endpoints use AgentCore
- [ ] No duplicate code
- [ ] All comments bilingual (EN/PT-BR)
- [ ] End-to-end test passes

---

**Status:** Ready to implement  
**Next:** Start Phase 2 - Frontend SSE Integration  
**Critical File:** src/App.jsx
