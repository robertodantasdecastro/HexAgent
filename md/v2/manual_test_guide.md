# Quick Manual Test Guide
# Guia Rápido de Teste Manual

**Date:** 2026-01-12 18:26  
**Purpose:** Verify chat works via UI  
**Time:** 2 minutes

---

## 🧪 Manual Test Steps

### Setup (if not running):
```bash
export OPENROUTER_API_KEY="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"
export DISPLAY=:0
hexagent-gui
```

---

### Test 1: Simple Chat Message

**Steps:**
1. Open HexAgentGUI (should already be running)
2. In chat input, type: `Hello, please respond with one sentence`
3. Press Enter or click Send
4. Wait ~3-5 seconds

**Expected:**
- ✅ Your message appears in chat
- ✅ AI responds with one sentence
- ✅ Response displays correctly
- ✅ No error messages

**If it works:** Backend integration is working! ✅

**If error appears:**
- Check if message says "AI features disabled"
- If yes → API key not configured
- If connection error → Backend not running

---

### Test 2: Conversation Context

**Steps:**
1. Type: `My name is Bob`
2. Wait for response
3. Type: `What's my name?`
4. Wait for response

**Expected:**
- ✅ AI remembers "Bob" from previous message
- ✅ Responds with something like "Your name is Bob"

**If it works:** Context handling is working! ✅

---

### Test 3: Continue Button (if available)

**Steps:**
1. Send a message
2. Look for Continue button
3. Click it

**Expected:**
- ✅ AI continues conversation
- ✅ Uses standardized payload format

---

## ✅ Success Criteria

**Minimum (Test 1):**
- [  ] AI responds to simple message

**Good (Test 1 + 2):**
- [ ] AI responds
- [ ] AI remembers context

**Excellent (All 3):**
- [ ] AI responds
- [ ] Context works
- [ ] Continue works

---

## 📊 Results Template

```
Test 1 (Simple): ✅/❌
Test 2 (Context): ✅/❌  
Test 3 (Continue): ✅/❌

Overall: PASS / FAIL

Notes:
- [any observations]
```

---

**If all pass:** Backend implementation is working! Ready for streaming.

**If any fail:** Note which failed and we can debug.
