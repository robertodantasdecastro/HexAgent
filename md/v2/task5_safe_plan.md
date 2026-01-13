# Task 5: Safe URL Removal - Execution Plan
# Tarefa 5: Remoção Segura de URLs - Plano de Execução

**Date:** 2026-01-11 17:09  
**Status:** EXECUTING SAFELY  
**Backup:** ✅ Created at `.backup/task5_*`

---

## ✅ COMPLETED

### Batch 0: App.jsx
- [x] Line 539: toggleService → `api.post(endpoint)` ✅
- [x] Line 884: sendMessage → `api.baseURL + '/chat'` ✅  
- [x] Line 1186: AI inference → `api.baseURL + '/chat'` ✅

**Result:** 3/23 URLs eliminated (13%)

---

## 📋 REMAINING WORK

### Total: 18 URLs in 11 files

---

## 🎯 BATCH 1: SessionModal.jsx (PRIORITY: HIGH)

**File:** `src/components/SessionModal.jsx`  
**URLs:** 1 remaining (line 45-49 delete function)

### Current State:
```javascript
// Line 1-3: Has partial imports (APIClient + Logger added)
// Line 11-27: fetchSessions already uses APIClient ✅
// Line 42-54: handleDelete STILL uses fetch ❌
```

### Steps:
1. View lines 42-54
2. Replace fetch with: `await api.post('/sessions', { action: 'delete', name })`
3. Build test
4. Mark complete

**Estimated:** 5 min

---

## 🎯 BATCH 2: ServiceManagerModal.jsx (PRIORITY: HIGH)

**File:** `src/components/ServiceManagerModal.jsx`  
**URLs:** 2

### Current Issues:
- No APIClient import
- Line 34: `http://localhost:5000/init_status`
- Line 50: `http://localhost:5000/services/control`

### Steps:
1. Add imports (APIClient, Logger)
2. Get instances in functions
3. Replace line 34: `await api.get('/init_status')`
4. Replace line 50: `await api.post('/services/control', body)`
5. Build test

**Estimated:** 10 min

---

## 🎯 BATCH 3: ShutdownModal.jsx (PRIORITY: HIGH)

**File:** `src/components/ShutdownModal.jsx`  
**URLs:** 2

### Current Issues:
- Line 26: `http://localhost:5000/files/temp` (GET)
- Line 52: `http://localhost:5000/shutdown` (POST)

### Steps:
1. Add imports
2. Replace line 26: `await api.get('/files/temp')`
3. Replace line 52: `await api.post('/shutdown')`
4. Build test

**Estimated:** 10 min

---

## 🎯 BATCH 4: File Operations (PRIORITY: MEDIUM)

### 4A: SaveFilesDialog.jsx
**URL:** 1 (line 45)
- Replace: `await api.post('/session/files/save', body)`

### 4B: ScriptBlock.jsx
**URL:** 1 (line 49)  
- ⚠️ Already partially fixed in Task 1, verify remaining

### 4C: OverwriteConfirmDialog.jsx
**URL:** 1 (line 44)
- Replace: `await api.post('/file/diff', body)`

**Estimated:** 15 min total

---

## 🎯 BATCH 5: Workflow & AI (PRIORITY: MEDIUM)

### 5A: WorkflowManagerModal.jsx
**URL:** 1 (line 73)
- Special case: `'http://localhost:5000' + workflow.endpoint`
- Replace: `api.baseURL + workflow.endpoint` OR `await api.post(workflow.endpoint, body)`

### 5B: AIConfigModal.jsx
**URL:** 1 (line 54)
- Replace: `await api.post('/ai/test', body)`

**Estimated:** 12 min total

---

## 🎯 BATCH 6: UI Components (PRIORITY: LOW)

### 6A: SmartBlock.jsx
**URL:** 1 (line 64)
- Replace: `await api.get('/config/user/ui/block_rules')`

### 6B: BrainSelector.jsx
**URL:** 1 (line 34)
- Replace: `await api.get('/config/user/ai/brains')`

### 6C: LoadingScreen.jsx  
**URL:** 1 (line 42)
- Replace: `await api.post('/execute', body)`

**Estimated:** 15 min total

---

## 🔄 EXECUTION WORKFLOW

### For Each Batch:

```
1. VIEW file current state
   ├─ Check existing imports
   └─ Identify exact URLs

2. ADD imports if missing
   ├─ import APIClient from '../utils/APIClient'
   └─ import Logger from '../utils/Logger' (if needed)

3. GET instances in functions
   ├─ const api = APIClient.getInstance()
   └─ const logger = Logger.getInstance()

4. REPLACE URLs one at a time
   ├─ fetch() → api.get/post/delete()
   ├─ Remove headers (APIClient handles)
   ├─ Remove .json() (APIClient returns data directly)
   └─ Update error handling to use logger

5. BUILD test
   └─ npm run build

6. IF success → NEXT batch
   IF fail → ROLLBACK and fix

7. UPDATE progress tracking
```

---

## 🧪 VALIDATION CHECKLIST

### After Each Batch:
- [ ] npm run build succeeds
- [ ] No syntax errors
- [ ] Bundle size reasonable

### After ALL Batches:
- [ ] Full build passes
- [ ] No hardcoded localhost:5000 in components
- [ ] All imports present
- [ ] Manual smoke test

---

## 📊 PROGRESS TRACKING

| Batch | Files | URLs | Status | Time |
|-------|-------|------|--------|------|
| 0 (App.jsx) | 1 | 3 | ✅ Done | 30 min |
| 1 (SessionModal) | 1 | 1 | ⏳ In Progress | 5 min |
| 2 (Services) | 1 | 2 | ⏳ Pending | 10 min |
| 3 (Shutdown) | 1 | 2 | ⏳ Pending | 10 min |
| 4 (Files) | 3 | 3 | ⏳ Pending | 15 min |
| 5 (Workflow/AI) | 2 | 2 | ⏳ Pending | 12 min |
| 6 (UI) | 3 | 3 | ⏳ Pending | 15 min |
| **TOTAL** | **12** | **18** | **13% done** | **~1.5h remaining** |

---

## 🔙 ROLLBACK PROCEDURE

If any batch fails:

```bash
# 1. Identify failed file
FILE="src/components/FailedComponent.jsx"

# 2. Restore from backup
BACKUP_DIR=$(ls -t .backup/task5_* | head -1)
cp "$BACKUP_DIR/components/$(basename $FILE)" "$FILE"

# 3. Verify restoration
npm run build

# 4. Re-attempt with different approach
```

---

## ✅ SUCCESS CRITERIA

**Phase 1 (100%) Complete When:**
- [ ] Zero `http://localhost:5000` in all components
- [ ] All fetch() use APIClient
- [ ] Build passes
- [ ] No console errors
- [ ] Manual test: chat, sessions, shutdown work

---

## 🚀 STARTING NOW

**Next Action:** Complete Batch 1 (SessionModal.jsx)

---

**Created:** 2026-01-11 17:09  
**Estimated Completion:** 17:10 (1.5 hours)  
**Approach:** Safe, tested, incremental
