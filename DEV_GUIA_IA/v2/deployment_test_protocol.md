# Pre-Deployment Testing Protocol
# Protocolo de Testes Pré-Deploy

**Date:** 2026-01-12 02:40  
**Version:** 1.0.0  
**Status:** Ready for Execution  

---

## 🎯 Test Objectives

Verify all critical functionality before production deployment:
- ✅ Application startup
- ✅ Backend integration
- ✅ Iteration controls
- ✅ Configuration persistence
- ✅ Core features (chat, sessions)
- ✅ Graceful shutdown

---

## 📋 Test Categories

### Category A: Critical Path (MUST PASS)
Required for production deployment

### Category B: Important (SHOULD PASS)
Desirable but not blocking

### Category C: Optional (NICE TO HAVE)
Future improvements

---

## ✅ CATEGORY A: CRITICAL PATH

### Test 1: Application Startup
**Priority:** CRITICAL  
**Time:** 2 minutes

#### Test Steps:
1. Close any running instances
2. Execute: `hexagent-gui`
3. Observe terminal output
4. Wait for window to appear

#### Expected Results:
```
[Electron] Starting HexAgentGUI...
[Electron] isPackaged: true
[Backend] App path: /home/d4r13n/.hexagent-gui/app
[Backend] ✓ Using Python at: .../resources/venv/bin/python
[Backend] Starting: .../resources/backend/app.py
[Backend] ✅ Started successfully
[Python]: 🚀 Starting HexAgentGUI Backend on 127.0.0.1:5000
```

✅ **Pass Criteria:**
- [ ] Terminal shows backend logs
- [ ] Backend uses venv Python (not system)
- [ ] No ModuleNotFoundError
- [ ] Window opens within 5 seconds
- [ ] No "Critical Startup Error"

❌ **Fail Criteria:**
- Backend exits with code 1
- Window shows error modal
- Console shows fetch errors

---

### Test 2: Iteration Controls - Increase
**Priority:** CRITICAL  
**Time:** 1 minute

#### Test Steps:
1. Locate iteration display (shows `0/10`)
2. Click **+** button 5 times rapidly
3. Observe UI updates
4. Wait 2 seconds
5. Check console logs

#### Expected Results:
- Display updates instantly: `0/10` → `0/11` → `0/12` → ... → `0/15`
- After 1 second: `[App] Saving iterations to backend (debounced)...`
- Console shows: `[useAIConfig] Save successful, reloaded`

✅ **Pass Criteria:**
- [ ] UI updates <16ms (instant)
- [ ] Final value is 15
- [ ] Only ONE save to backend (debounced)
- [ ] No console errors
- [ ] No "[AIConfigManager] Save error"

---

### Test 3: Iteration Controls - Decrease
**Priority:** CRITICAL  
**Time:** 1 minute

#### Test Steps:
1. Current value: 15
2. Click **-** button until value is 1
3. Try clicking **-** again

#### Expected Results:
- Display decrements: `0/15` → `0/14` → ... → `0/1`
- At value 1, further clicks do nothing (minimum enforced)

✅ **Pass Criteria:**
- [ ] Decrements correctly
- [ ] Stops at minimum (1)
- [ ] Cannot go below 1
- [ ] Debounced save after 1 second

---

### Test 4: Iteration Controls - Unlimited Mode
**Priority:** CRITICAL  
**Time:** 1 minute

#### Test Steps:
1. Click **∞** button
2. Observe display change
3. Try clicking **+** and **-**
4. Click **∞** again

#### Expected Results:
- First click: Display shows `∞`
- Buttons +/- become disabled (grayed out)
- Second click: Display shows `0/1` (restored)
- Buttons +/- become enabled

✅ **Pass Criteria:**
- [ ] Toggle works instantly
- [ ] Display shows ∞ symbol
- [ ] +/- buttons disabled when unlimited
- [ ] Saves to backend

---

### Test 5: Configuration Persistence
**Priority:** CRITICAL  
**Time:** 2 minutes

#### Test Steps:
1. Set iterations to 25
2. Click ∞ to enable unlimited
3. Wait 2 seconds (ensure save)
4. Close app (Ctrl+C or window close)
5. Wait 5 seconds
6. Reopen: `hexagent-gui`
7. Check display

#### Expected Results:
- Display shows `∞` (unlimited persisted)
- Value 25 saved (if toggle unlimited off, shows 0/25)

✅ **Pass Criteria:**
- [ ] Settings survive restart
- [ ] Backend saves correctly
- [ ] Frontend loads correctly

---

### Test 6: Backend Health
**Priority:** CRITICAL  
**Time:** 1 minute

#### Test Steps:
1. With app running, execute:
```bash
curl http://localhost:5000/health
```

2. Check response

#### Expected Results:
```json
{"status":"healthy"}
```

✅ **Pass Criteria:**
- [ ] Returns 200 OK
- [ ] JSON response valid
- [ ] Status is "healthy"

---

### Test 7: Graceful Shutdown
**Priority:** CRITICAL  
**Time:** 2 minutes

#### Test Steps:
1. With app running, note backend PID:
```bash
ps aux | grep python | grep app.py
```

2. Close app (Ctrl+C or window close)
3. Wait 3 seconds
4. Check for orphan processes:
```bash
ps aux | grep python | grep app.py
```

#### Expected Results:
- Terminal shows:
```
[Electron] Shutting down...
[Backend] Stopping Python process...
[Backend] ✓ Stopped
```
- No processes found after shutdown

✅ **Pass Criteria:**
- [ ] Backend killed properly
- [ ] No orphan processes
- [ ] Graceful shutdown logs

---

## 📊 CATEGORY B: IMPORTANT FEATURES

### Test 8: Chat Input
**Priority:** HIGH  
**Time:** 1 minute

#### Test Steps:
1. Type message in chat input
2. Press Enter or click Send
3. Wait for response

✅ **Pass Criteria:**
- [ ] Message appears in chat
- [ ] API call succeeds
- [ ] Response received

---

### Test 9: Session Management
**Priority:** HIGH  
**Time:** 2 minutes

#### Test Steps:
1. Save current session
2. Load previous session
3. Delete a session

✅ **Pass Criteria:**
- [ ] Save works (uses APIClient)
- [ ] Load works
- [ ] Delete works

---

### Test 10: Service Controls
**Priority:** HIGH  
**Time:** 1 minute

#### Test Steps:
1. Open Service Manager
2. Check service status
3. Start/stop a service

✅ **Pass Criteria:**
- [ ] Status polling works
- [ ] Control commands work
- [ ] Uses APIClient (no hardcoded URLs)

---

## 🔧 CATEGORY C: OPTIONAL

### Test 11: Multi-Language
**Priority:** MEDIUM  
**Time:** 30 seconds

Switch between EN/PT/ES and verify UI updates

### Test 12: Memory Leaks
**Priority:** MEDIUM  
**Time:** 5 minutes

Open DevTools → Performance → Record → Use app → Stop → Check memory

---

## 📈 Results Summary

### Critical Tests (A):
- [ ] Test 1: Startup
- [ ] Test 2: Increase
- [ ] Test 3: Decrease
- [ ] Test 4: Unlimited
- [ ] Test 5: Persistence
- [ ] Test 6: Health
- [ ] Test 7: Shutdown

**Required:** 7/7 PASS

### Important Tests (B):
- [ ] Test 8: Chat
- [ ] Test 9: Sessions
- [ ] Test 10: Services

**Target:** 3/3 PASS (100%)

### Optional Tests (C):
- [ ] Test 11: Languages
- [ ] Test 12: Memory

**Target:** 2/2 PASS (nice to have)

---

## ✅ Deployment Criteria

**PASS if:**
- Critical: 7/7 ✅
- Important: ≥2/3 ✅
- No crashes
- No console errors

**FAIL if:**
- Any critical test fails
- Backend doesn't start
- Configuration doesn't persist

---

**Execute:** Run all Category A tests  
**Document:** Record results  
**Decision:** PASS → Deploy / FAIL → Debug
