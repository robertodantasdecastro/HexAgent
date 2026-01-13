# AI Engine Selection System - Implementation Plan
# Sistema de Seleção de Engine IA - Plano de Implementação

**Date:** 2026-01-12 21:46  
**Goal:** Multi-engine AI support with API key management

---

## 🎯 REQUIREMENTS

1. **Configure API key** from keyhexseck2.txt
2. **Alert on API key errors** (modal notification)
3. **Engine selection modal** - Choose between:
   - HexSecGPT
   - ChatGPT (OpenAI)
   - DeepSeek
4. **Model selection** per engine
5. **Save config** to ~/.hexagent-gui/

---

## 📋 IMPLEMENTATION STEPS

### Step 1: Update Config Structure (Backend)

**File:** `backend/services/config_service.py`

**New config schema:**
```json
{
  "ai": {
    "engine": "hexsecgpt",  // or "openai", "deepseek"
    "api_key": "sk-...",
    "model": "auto",
    "max_iterations": 10,
    "auto_execute": false
  }
}
```

**Supported engines:**
- `hexsecgpt` → HexSecGPT API
- `openai` → OpenAI/ChatGPT
- `deepseek` → DeepSeek AI

---

### Step 2: Configure Initial API Key

**Action:** Read from keyhexseck2.txt and save to config

```bash
# Read key
API_KEY=$(cat ~/iatools/keyhexseck2.txt | head -1)

# Save to config
echo '{
  "ai": {
    "engine": "hexsecgpt",
    "api_key": "'$API_KEY'",
    "model": "auto",
    "max_iterations": 10,
    "auto_execute": false
  }
}' > ~/.hexagent-gui/config.json
```

---

### Step 3: Backend - Engine Abstraction

**File:** `backend/core/hex_brain.py`

**Modify to support multiple engines:**

```python
class HexBrain:
    ENGINES = {
        'hexsecgpt': 'https://api.hexsecgpt.com/v1',
        'openai': 'https://api.openai.com/v1',
        'deepseek': 'https://api.deepseek.com/v1'
    }
    
    MODELS = {
        'hexsecgpt': ['hexsec-gpt-4', 'hexsec-gpt-3.5'],
        'openai': ['gpt-4', 'gpt-3.5-turbo'],
        'deepseek': ['deepseek-chat', 'deepseek-coder']
    }
    
    def __init__(self, engine='hexsecgpt', api_key=None, model='auto'):
        base_url = self.ENGINES.get(engine)
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.engine = engine
        self.model = model or self.MODELS[engine][0]
```

---

### Step 4: Backend - API Key Error Detection

**File:** `backend/controllers/chat_controller.py`

**Add error handling:**

```python
@chat_bp.route('/chat', methods=['POST'])
def chat():
    try:
        # ... existing code ...
        response = agent_core.process_request(...)
        
    except AuthenticationError as e:
        # API Key invalid
        return jsonify({
            'error': 'invalid_api_key',
            'message': 'API Key invalid or expired',
            'message_pt': 'API Key inválida ou expirada'
        }), 401
        
    except Exception as e:
        return jsonify({
            'error': 'unknown',
            'message': str(e)
        }), 500
```

---

### Step 5: Frontend - Engine Selection Modal

**File:** `src/components/AIEngineModal.jsx` (NEW)

**Features:**
- Select engine (HexSecGPT, OpenAI, DeepSeek)
- Enter API key
- Select model (dynamic list per engine)
- Save config

**UI:**
```
┌─────────────────────────────────────┐
│  🤖 AI Engine Configuration         │
├─────────────────────────────────────┤
│                                     │
│  Engine:  [HexSecGPT ▼]            │
│                                     │
│  API Key: [sk-...************]     │
│           [📋 Paste]               │
│                                     │
│  Model:   [hexsec-gpt-4 ▼]         │
│                                     │
│  [ Test Connection ]               │
│                                     │
│  [Cancel]           [Save]         │
└─────────────────────────────────────┘
```

---

### Step 6: Frontend - Error Alert System

**File:** `src/components/ErrorAlert.jsx` (NEW)

**Trigger on:**
- API key errors (401)
- Connection errors
- Other errors

**Actions:**
- Show error message
- Button to open AIEngineModal
- Auto-open on API key error

---

### Step 7: Integration

**App.jsx changes:**
1. Import AIEngineModal
2. Handle API errors from ChatService
3. Show ErrorAlert on errors
4. Open AIEngineModal when API key invalid

---

## 🗂️ FILES TO CREATE/MODIFY

### Backend:
- ✅ `~/.hexagent-gui/config.json` (configure now)
- ⚠️ `backend/core/hex_brain.py` (add engine support)
- ⚠️ `backend/controllers/chat_controller.py` (add error codes)

### Frontend:
- ⚠️ `src/components/AIEngineModal.jsx` (NEW)
- ⚠️ `src/components/AIEngineModal.css` (NEW)
- ⚠️ `src/components/ErrorAlert.jsx` (NEW)
- ⚠️ `src/App.jsx` (integrate modals + error handling)

---

## 🚀 QUICK START (Now)

**Immediate action - Configure API key:**

```bash
# Configure with HexSecGPT engine
cat > ~/.hexagent-gui/config.json << 'EOF'
{
  "ai": {
    "engine": "hexsecgpt",
    "api_key": "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",
    "model": "auto",
    "max_iterations": 10,
    "auto_execute": false
  },
  "system": {
    "theme": "dark",
    "language": "pt-BR"
  }
}
EOF
```

---

## 📝 NOTES

**API Key from keyhexseck2.txt:**
- Current: OpenRouter compatible
- Works with HexSecGPT endpoint
- Can support multiple engines

**Future engines:**
- Claude (Anthropic)
- Gemini (Google)
- Local models (Ollama)

---

**Status:** Plan ready  
**Next:** Configure API key now, then implement modals  
**Priority:** API key config (5min) → Backend changes (30min) → Frontend modals (1h)
