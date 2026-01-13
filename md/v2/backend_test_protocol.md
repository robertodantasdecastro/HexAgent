# Backend Chat Testing Protocol
# Protocolo de Teste do Chat Backend

**Date:** 2026-01-12 18:10  
**Objective:** Verify backend chat works end-to-end  
**Duration:** 30 minutes

---

## 🎯 Test Objectives

1. ✅ Verify API key is configured
2. ✅ Test backend endpoint responds
3. ✅ Validate OpenRouter integration
4. ✅ Confirm frontend receives response
5. ✅ Document any issues

---

## 📋 PRE-TEST CHECKLIST

### Step 1: Check API Key
```bash
# Check if API key is set
echo $OPENROUTER_API_KEY | head -c 20

# If not set, configure it:
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"

# Verify:
echo "API Key configured: ${OPENROUTER_API_KEY:0:20}..."
```

**Expected:** Shows first 20 chars of key

---

### Step 2: Verify Backend is Running
```bash
# Check if backend process exists
ps aux | grep "python.*app.py" | grep -v grep

# If not running, start app:
hexagent-gui
```

**Expected:** Python process visible

---

### Step 3: Test Health Endpoint
```bash
curl http://localhost:5000/health
```

**Expected:**
```json
{"status":"healthy"}
```

---

## 🧪 TEST SUITE

### Test 1: Direct API Call (No API Key)
**Purpose:** Verify graceful degradation

```bash
# Temporarily unset API key
unset OPENROUTER_API_KEY

# Call endpoint
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, test message"}' \
  2>/dev/null | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "response": "⚠️ AI features are currently disabled...",
    "standalone": true,
    "iterations": 0
  }
}
```

**Pass Criteria:**
- [  ] Returns 200 OK
- [ ] Contains helpful error message
- [ ] Has "standalone": true
- [ ] No Python traceback

---

### Test 2: Direct API Call (With API Key)
**Purpose:** Verify OpenRouter integration

```bash
# Set API key
export OPENROUTER_API_KEY="your-key-here"

# Call endpoint
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Say hello in one sentence",
    "context": [],
    "stream": false
  }' \
  2>/dev/null | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hello! How can I assist you today?",
    "iterations": 1,
    "model": "google/gemini-2.0-flash-exp:free"
  },
  "message": "Chat processed successfully"
}
```

**Pass Criteria:**
- [ ] Returns 200 OK
- [ ] Has "response" with AI text
- [ ] Has "iterations": 1
- [ ] Has "model" field
- [ ] Response is coherent

---

### Test 3: API Call with Context
**Purpose:** Verify context handling

```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What did I just ask?",
    "context": [
      {"role": "user", "content": "My name is Alice"},
      {"role": "assistant", "content": "Hello Alice!"}
    ],
    "stream": false
  }' \
  2>/dev/null | jq .
```

**Expected Response:**
Should reference "Alice" or "asked about name"

**Pass Criteria:**
- [ ] Response mentions context
- [ ] Shows understanding of previous messages

---

### Test 4: Frontend Integration Test
**Purpose:** End-to-end user flow

**Steps:**
1. Open HexAgentGUI
2. Type: "Hello, this is a test"
3. Press Enter
4. Wait for response

**Expected:**
- Message appears in chat immediately
- AI response appears within 5 seconds
- No console errors
- Response is displayed correctly

**Pass Criteria:**
- [ ] User message displays
- [ ] Loading indicator shows
- [ ] AI response displays
- [ ] No errors in DevTools console (F12)

---

### Test 5: Error Handling (Invalid Key)
**Purpose:** Verify error messages

```bash
export OPENROUTER_API_KEY="invalid-key-test"

curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' \
  2>/dev/null | jq .
```

**Expected:**
Error response with status 500 or 503

**Pass Criteria:**
- [ ] Returns error status
- [ ] Has clear error message
- [ ] No crash/traceback

---

### Test 6: Timeout Handling
**Purpose:** Verify timeout works

```bash
# This will timeout after 30s
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Please write a very long story"}' \
  --max-time 35 \
  2>/dev/null | jq .
```

**Expected:**
Either response within 30s OR timeout error

**Pass Criteria:**
- [ ] Returns within 30s OR
- [ ] Returns timeout error (504)

---

## 📊 EXPECTED RESULTS

### Successful Test Results:
```
✅ Test 1: Standalone mode message
✅ Test 2: AI response received
✅ Test 3: Context understood
✅ Test 4: Frontend displays correctly
✅ Test 5: Invalid key handled gracefully
✅ Test 6: Timeout handled

Overall: 6/6 PASS
```

### If Tests Fail:

#### Test 2 Fails (No Response):
**Check:**
1. Is API key valid?
2. Is OpenRouter API accessible?
3. Check backend logs

**Debug:**
```bash
# Check backend logs
tail -f ~/.hexagent-gui/app.log
```

#### Test 4 Fails (Frontend):
**Check:**
1. Is fetch URL correct?
2. Are there CORS errors?
3. Check browser console

**Debug:**
Open DevTools (F12) → Console tab

---

## 🔍 DEBUGGING GUIDE

### Issue: "Connection refused"
**Cause:** Backend not running  
**Fix:**
```bash
hexagent-gui  # Start app
```

### Issue: "API timeout"
**Cause:** OpenRouter slow/down  
**Fix:** Wait and retry, or check https://status.openrouter.ai

### Issue: "Invalid API key"
**Cause:** Wrong/expired key  
**Fix:**
```bash
# Get new key from https://openrouter.ai/keys
export OPENROUTER_API_KEY="new-key-here"
```

### Issue: "No response in frontend"
**Cause:** Payload mismatch  
**Fix:** Check if using `prompt` not `message`

---

## ✅ TEST COMPLETION CHECKLIST

After running all tests:

- [ ] All 6 tests passed
- [ ] Documented any failures
- [ ] API key is valid
- [ ] Backend responds < 5s
- [ ] Frontend displays correctly
- [ ] No console errors
- [ ] Ready for next phase

---

## 📝 TEST RESULTS TEMPLATE

```markdown
## Test Execution - [Date]

### Test Environment:
- OS: Linux ARM64
- Backend: Python 3.13
- Frontend: Vite + React
- API: OpenRouter (Gemini 2.0 Flash Free)

### Results:
- Test 1 (No Key): ✅/❌ [notes]
- Test 2 (With Key): ✅/❌ [notes]
- Test 3 (Context): ✅/❌ [notes]
- Test 4 (Frontend): ✅/❌ [notes]
- Test 5 (Invalid Key): ✅/❌ [notes]
- Test 6 (Timeout): ✅/❌ [notes]

### Overall: PASS / FAIL
**Score:** X/6

### Issues Found:
1. [Issue description]
2. [Issue description]

### Next Steps:
- [ ] Fix issues
- [ ] Retest
- [ ] Proceed to streaming
```

---

## 🚀 AFTER TESTING

### If All Pass ✅:
1. Document success
2. Proceed to **Option 2: Padronizar Payloads**
3. Archive test results

### If Some Fail ⚠️:
1. Document failures
2. Fix critical issues
3. Retest
4. Then proceed

### If All Fail ❌:
1. Review implementation
2. Check API key
3. Check network
4. Debug thoroughly before proceeding

---

**Created:** 2026-01-12 18:10  
**Duration:** 30 minutes  
**Status:** Ready to Execute
