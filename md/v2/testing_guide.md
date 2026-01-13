# HexAgentGUI - Phase 1 Testing Guide
# HexAgentGUI - Guia de Testes Fase 1

**Date:** 2026-01-11 17:24  
**Version:** Phase 1 - 87% Complete  
**Purpose:** Verify critical functionality before production

---

## 🎯 TEST OBJECTIVES / OBJETIVOS DOS TESTES

### Primary Goals:
1. ✅ Verify all critical features work
2. ✅ Confirm Phase 1 refactorings successful
3. ✅ Identify any blocking issues
4. ✅ Validate production readiness

### What to Test:
- **MUST TEST:** Chat, sessions, config (critical paths)
- **NICE TO TEST:** Services, shutdown, scripts

---

## 🚀 INSTALLATION INSTRUCTIONS

### Step 1: Run Installation
```bash
cd /home/d4r13n/iatools/HexAgentGUI
./install.sh
```

**Expected Output:**
- ✅ Frontend build succeeds
- ✅ Electron packaging completes
- ✅ Binary installed to `~/.local/bin/hexagent-gui`
- ✅ Desktop shortcut created

**If Error:** Check `/tmp/install_log.txt`

### Step 2: Launch Application
```bash
hexagent-gui
```

**OR**

```bash
export DISPLAY=:0 && hexagent-gui
```

**Expected:**
- ✅ Window opens
- ✅ Loading screen appears
- ✅ Backend initializes
- ✅ Main interface loads

---

## ✅ TEST SUITE 1: CRITICAL FEATURES

### Test 1.1: Chat Messaging (HIGH PRIORITY)
**What to Test:** Basic chat functionality

**Steps:**
1. Type a message in input box
2. Press Enter or click Send
3. Wait for AI response

**Expected Results:**
- ✅ Message appears in chat
- ✅ Backend processes request
- ✅ AI response appears
- ✅ No errors in console

**What Was Refactored:**
- ✅ Uses `APIClient.post('/chat')`
- ✅ No hardcoded URLs
- ✅ Logger instead of console

**Success Criteria:**
- [ ] Messages sent successfully
- [ ] Responses received
- [ ] No console errors

---

### Test 1.2: Session Management (HIGH PRIORITY)
**What to Test:** Save/load/delete sessions

**Steps:**
1. Click History button (top bar)
2. Enter session name: "test_session_1"
3. Click Save
4. Send a few messages
5. Click History again
6. Click Load on "test_session_1"
7. Verify messages restored
8. Click Delete on session
9. Confirm deletion

**Expected Results:**
- ✅ Session saves successfully
- ✅ Session list refreshes
- ✅ Session loads correctly
- ✅ Messages restored
- ✅ Delete works

**What Was Refactored:**
- ✅ Uses `APIClient.post('/sessions')`
- ✅ Both list and delete use APIClient (Quick Fix applied)

**Success Criteria:**
- [ ] Save works
- [ ] Load restores messages
- [ ] Delete removes session

---

### Test 1.3: Configuration Persistence (MEDIUM PRIORITY)
**What to Test:** Settings persist across restarts

**Steps:**
1. Note current iteration count (bottom right)
2. Click "-" button twice (should decrease by 2)
3. Note new value
4. Close application (Ctrl+C in terminal)
5. Restart: `hexagent-gui`
6. Check iteration count

**Expected Results:**
- ✅ Value decreases when clicking "-"
- ✅ Value persists after restart
- ✅ Stored in `~/.hexagent-gui/ai-config.json`

**What Was Refactored:**
- ✅ Removed duplicate state
- ✅ Uses `aiConfig` as source of truth
- ✅ Saves to backend via `saveAIConfig()`

**Success Criteria:**
- [ ] Increment/decrement works
- [ ] Value persists on restart

**Verify Config File:**
```bash
cat ~/.hexagent-gui/ai-config.json
# Should show: "max_iterations": <your value>
```

---

### Test 1.4: Unlimited Iterations Toggle (MEDIUM PRIORITY)
**What to Test:** Unlimited mode toggle

**Steps:**
1. Find ∞ icon (bottom right, next to iteration counter)
2. Click ∞ icon
3. Verify display changes to "∞"
4. Verify +/- buttons disabled
5. Click ∞ again to toggle off

**Expected Results:**
- ✅ Icon color changes (yellow when active)
- ✅ Display shows "∞" symbol
- ✅ Increment/decrement buttons disabled
- ✅ Toggle back to number works

**What Was Refactored:**
- ✅ Uses `updateAIConfig('ai.unlimited_iterations')`
- ✅ Persists to backend

**Success Criteria:**
- [ ] Toggle works visually
- [ ] Buttons disable/enable
- [ ] Setting persists

---

## ✅ TEST SUITE 2: SERVICE MANAGEMENT

### Test 2.1: Service Manager Modal (LOW PRIORITY)
**What to Test:** Service status and control

**Steps:**
1. Click "Services" button (top bar)
2. Check status of:
   - Backend (should be green/running)
   - Brain (may be offline - OK)
   - HexStrike (may be offline - OK)
3. Try starting/stopping a service (if available)

**Expected Results:**
- ✅ Modal opens
- ✅ Status displays correctly
- ✅ No errors in modal

**What Was Refactored:**
- ✅ Uses `APIClient.getInstance()`
- ✅ Uses `api.baseURL + '/init_status'`
- ✅ Uses `api.baseURL + '/services/control'`

**Success Criteria:**
- [ ] Modal displays status
- [ ] No JavaScript errors

---

## ✅ TEST SUITE 3: ADVANCED FEATURES (OPTIONAL)

### Test 3.1: Script Save (OPTIONAL)
**What to Test:** Saving script files

**Steps:**
1. Send a message that generates code
2. Wait for code block with "Save" button
3. Click Save
4. Provide file path
5. Confirm save

**Expected Results:**
- ✅ Save dialog appears
- ✅ File saves successfully

**Note:** ScriptBlock still uses hardcoded URL (non-critical)

---

### Test 3.2: Shutdown Dialog (OPTIONAL)
**What to Test:** Application shutdown

**Steps:**
1. Click Settings → Shutdown (if available)
2. Check temp file count
3. Proceed with shutdown

**Expected Results:**
- ✅ Dialog shows temp file count
- ✅ Shutdown completes

**Note:** Uses hardcoded URLs (non-critical)

---

## 🐛 TROUBLESHOOTING

### Issue: Application Won't Start
**Symptoms:** No window appears

**Checks:**
```bash
# 1. Check if backend is running
ps aux | grep python | grep app.py

# 2. Check logs
tail -50 ~/.hexagent-gui/app.log

# 3. Try frontend only
cd /home/d4r13n/iatools/HexAgentGUI
npm run dev
```

**Solution:** Reinstall via `./install.sh`

---

### Issue: "Logger is not defined" Error
**Symptoms:** Console shows ReferenceError

**Check:** Open DevTools (F12), look for error

**Solution:** Already fixed! If you see this, report immediately.

**Verify Fix:**
```bash
grep "import Logger" /home/d4r13n/iatools/HexAgentGUI/src/App.jsx
# Should show: import Logger from './utils/Logger';
```

---

### Issue: Session Delete Not Working
**Symptoms:** Delete confirmation appears but session not deleted

**Check:** Open DevTools console, look for network errors

**Solution:** Quick fix applied! Should work now.

**Verify:**
```bash
grep "APIClient" /home/d4r13n/iatools/HexAgentGUI/src/components/SessionModal.jsx
# Should show APIClient import and usage
```

---

### Issue: Config Not Persisting
**Symptoms:** Settings reset on restart

**Check Config File:**
```bash
cat ~/.hexagent-gui/ai-config.json
```

**Expected Content:**
```json
{
  "ai": {
    "max_iterations": 10,
    "unlimited_iterations": false,
    ...
  }
}
```

**Solution:** If file missing, backend not saving. Check backend logs.

---

## 📊 SUCCESS CRITERIA

### Minimum Passing Grade (Production Ready):
- [x] Build passed (✅ Done)
- [ ] Application launches
- [ ] Chat messaging works
- [ ] Session save works
- [ ] Session load works
- [ ] Config persists

**If ALL above pass:** ✅ Production Ready

### Full Passing Grade (Excellent):
- [ ] All minimum criteria
- [ ] Session delete works
- [ ] Service manager loads
- [ ] Unlimited toggle works
- [ ] No console errors
- [ ] No visual glitches

**If ALL pass:** 🎉 Excellent Quality!

---

## 📝 TEST REPORTING

### Fill Out This Checklist:

**Environment:**
- OS: Kali Linux (ARM64)
- Node Version: ___
- Python Version: ___
- Display: :0

**Test Results:**
```
✅ = Pass
❌ = Fail
⏭️ = Skipped

[ ] 1.1 Chat Messaging
[ ] 1.2 Session Save
[ ] 1.3 Session Load
[ ] 1.4 Session Delete
[ ] 1.5 Config Persistence
[ ] 1.6 Unlimited Toggle
[ ] 2.1 Service Manager
[ ] 3.1 Script Save (optional)
```

**Issues Found:**
```
1. [Severity: HIGH/MEDIUM/LOW] Description...
2. ...
```

**Screenshots:**
- Attach any error screenshots
- DevTools console logs (F12)

---

## 🎯 WHAT TO REPORT BACK

### If Everything Works:
✅ "All critical tests passed! Ready for production."

### If Issues Found:
⚠️ "Found issues in [test name]:
- Error message: ...
- Console output: ...
- Steps to reproduce: ..."

### Logs to Share:
```bash
# Backend log
tail -100 ~/.hexagent-gui/app.log

# Frontend console (from DevTools F12)
# Screenshot or copy errors
```

---

## 🚀 NEXT STEPS AFTER TESTING

### If Tests Pass:
1. ✅ Mark Phase 1 as Production Ready
2. 🚀 Deploy to staging/production
3. 📝 Document known limitations
4. ⏭️ Plan Phase 2

### If Tests Fail:
1. 🐛 Report issues found
2. 🔧 Apply fixes
3. 🔄 Retest
4. ✅ Proceed when stable

---

## 📋 QUICK REFERENCE

### Commands:
```bash
# Install
cd /home/d4r13n/iatools/HexAgentGUI && ./install.sh

# Run
hexagent-gui

# Build only
npm run build

# Dev mode (frontend only)
npm run dev

# Check version
hexagent-gui --version

# View logs
tail -f ~/.hexagent-gui/app.log
```

### Config Locations:
- AI Config: `~/.hexagent-gui/ai-config.json`
- System Config: `~/.hexagent-gui/config.json`
- App Data: `~/.hexagent-gui/app/`
- Logs: `~/.hexagent-gui/app.log`

---

**Created:** 2026-01-11 17:24  
**Purpose:** Validate Phase 1 completion  
**Status:** Ready for user testing  
**Estimated Time:** 15-30 minutes
