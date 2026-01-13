# Task 5: Remove Hardcoded URLs - Implementation Plan
# Tarefa 5: Remover URLs Hardcoded - Plano de Implementação

**Date:** 2026-01-11 16:59  
**Status:** PLANNING  
**Priority:** HIGH (Finish Phase 1)

---

## 📊 Audit Results / Resultados da Auditoria

### Total Found: **23 hardcoded URLs** in **14 files**

**Breakdown:**
- App.jsx: 3 URLs
- Components: 9 files, 15 URLs
- Utils (Managers): 4 files, 4 URLs  
- APIClient: 1 URL (baseURL - OK!)

---

## 🔴 CRITICAL Priority (App.jsx)

### File: `src/App.jsx`
| Line | URL | Context | Action |
|------|-----|---------|--------|
| 539 | `http://localhost:5000${endpoint}` | Service toggle | Replace with `api.post(endpoint)` |
| 884 | `http://localhost:5000/chat` | Send message | Replace with `api.post('/chat')` |
| 1186 | `http://localhost:5000/chat` | AI inference | Replace with `api.post('/chat')` |

**Impact:** HIGH - Main app flow  
**Effort:** 30 minutes  
**Dependency:** APIClient already available

---

## 🟡 HIGH Priority (Components - Direct User Impact)

### 1. ServiceManagerModal.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 34 | `http://localhost:5000/init_status` | init_status | Use APIClient |
| 50 | `http://localhost:5000/services/control` | services/control | Use APIClient |

### 2. SessionModal.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 14 | `http://localhost:5000/sessions` | sessions (GET) | Use APIClient |
| 46 | `http://localhost:5000/sessions` | sessions (DELETE) | Use APIClient |

### 3. ScriptBlock.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 49 | `http://localhost:5000/file/write` | file/write | ⚠️ PARTIAL FIX - still hardcoded |

### 4. WorkflowManagerModal.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 73 | `http://localhost:5000` + endpoint | workflow endpoints | Use APIClient |

### 5. SaveFilesDialog.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 45 | `http://localhost:5000/session/files/save` | session/files/save | Use APIClient |

### 6. ShutdownModal.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 26 | `http://localhost:5000/files/temp` | files/temp (GET) | Use APIClient |
| 52 | `http://localhost:5000/shutdown` | shutdown (POST) | Use APIClient |

### 7. AIConfigModal.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 54 | `http://localhost:5000/ai/test` | ai/test | Use APIClient |

### 8. OverwriteConfirmDialog.jsx
| Line | URL | Endpoint | Action |
|------|-----|----------|--------|
| 44 | `http://localhost:5000/file/diff` | file/diff | Use APIClient |

### 9. SmartBlock.jsx, BrainSelector.jsx, LoadingScreen.jsx
| File | Line | Endpoint |
|------|------|----------|
| SmartBlock.jsx | 64 | /config/user/ui/block_rules |
| BrainSelector.jsx | 34 | /config/user/ai/brains |
| LoadingScreen.jsx | 42 | /execute |

**Total Components:** 9 files, 15 URLs  
**Effort:** 1.5 hours  
**Risk:** Medium (need testing)

---

## 🟢 MEDIUM Priority (Managers - Internal)

### 1. SystemConfigManager.js
| Line | Code | Fix |
|------|------|-----|
| 9 | `const API_BASE = 'http://localhost:5000/config/system'` | Use APIClient singleton |

### 2. AIConfigManager.js
| Line | Code | Fix |
|------|------|-----|
| 9 | `const API_BASE = 'http://localhost:5000/config/ai'` | Use APIClient singleton |

### 3. ConfigManager.js
| Line | Code | Fix |
|------|------|-----|
| 44 | `const CONFIG_API_BASE = 'http://localhost:5000/config'` | Use APIClient singleton |

### 4. tempFileManager.js
| Line | URL | Fix |
|------|-----|-----|
| 29 | `http://localhost:5000/config/user/ui/temp_files` | Use APIClient |
| 131 | `http://localhost:5000/session/files` | Use APIClient |

**Total Managers:** 4 files, 6 URLs  
**Effort:** 45 minutes  
**Risk:** Low (already working)

---

## ✅ LOW Priority (Constants - OK to keep for now)

### APIClient.js (Line 49)
```javascript
baseURL = 'http://localhost:5000';
```

**Status:** ✅ ACCEPTABLE  
**Reason:** This is the SINGLE source of truth  
**Future:** Could be configurable from systemConfig

---

## 🎯 Implementation Strategy / Estratégia

### Phase A: App.jsx (Critical) ✅
**Files:** 1  
**Changes:** 3

```javascript
// Before:
await fetch('http://localhost:5000/chat', {...})

// After:
await api.post('/chat', {...})
```

### Phase B: Components (High Priority) ✅
**Files:** 9  
**Changes:** 15

**Pattern for all:**
1. Import APIClient at top:
   ```javascript
   import APIClient from '../utils/APIClient';
   ```

2. Get instance in component:
   ```javascript
   const api = APIClient.getInstance();
   ```

3. Replace fetch with api methods:
   ```javascript
   // GET
   const data = await api.get('/endpoint');
   
   // POST
   const data = await api.post('/endpoint', body);
   
   // DELETE
   const data = await api.delete('/endpoint');
   ```

### Phase C: Managers (Medium Priority) ✅
**Files:** 4  
**Changes:** 6

**Strategy:** Replace constants with APIClient methods

```javascript
// Before:
const API_BASE = 'http://localhost:5000/config/system';
const response = await fetch(API_BASE, {...});

// After:
const api = APIClient.getInstance();
const data = await api.post('/config/system', {...});
```

---

## 📋 Step-by-Step Execution / Execução Passo a Passo

### Step 1: App.jsx (30 min)
- [ ] Line 539: toggleService → `api.post(endpoint)`
- [ ] Line 884: sendMessage → `api.post('/chat')`
- [ ] Line 1186: handleAIInference → `api.post('/chat')`
- [ ] Test: Chat flow works

### Step 2: Critical Components (45 min)
- [ ] SessionModal.jsx → Import APIClient, replace 2 URLs
- [ ] ServiceManagerModal.jsx → Import APIClient, replace 2 URLs
- [ ] ShutdownModal.jsx → Import APIClient, replace 2 URLs
- [ ] Test: Session, service, shutdown work

### Step 3: Secondary Components (30 min)
- [ ] ScriptBlock.jsx → Fix remaining URL (line 49)
- [ ] WorkflowManagerModal.jsx → Replace URL
- [ ] SaveFilesDialog.jsx → Replace URL
- [ ] AIConfigModal.jsx → Replace URL
- [ ] Test: Script, workflow, save work

### Step 4: Tertiary Components (15 min)
- [ ] OverwriteConfirmDialog.jsx
- [ ] SmartBlock.jsx
- [ ] BrainSelector.jsx
- [ ] LoadingScreen.jsx
- [ ] Test: Edge cases

### Step 5: Managers (45 min)
- [ ] SystemConfigManager.js
- [ ] AIConfigManager.js
- [ ] ConfigManager.js
- [ ] tempFileManager.js
- [ ] Test: Config persistence works

### Step 6: Build & Integration Test (30 min)
- [ ] `npm run build`
- [ ] Manual test all flows
- [ ] Verify no regressions
- [ ] Update documentation

---

## ⚠️ Risks & Mitigation / Riscos e Mitigação

### Risk 1: Breaking Changes
**Mitigation:** Test each phase incrementally

### Risk 2: APIClient Method Mismatch
**Mitigation:** APIClient already supports GET/POST/DELETE

### Risk 3: Error Handling Differences
**Mitigation:** Keep same try-catch patterns

### Risk 4: Response Format Changes
**Mitigation:** APIClient returns same JSON

---

## 🧪 Testing Checklist / Checklist de Testes

### After App.jsx:
- [ ] Send message works
- [ ] AI inference works
- [ ] Service toggle works

### After Components:
- [ ] Session load/save/delete works
- [ ] Service manager works
- [ ] Shutdown flow works
- [ ] Script save/execute works
- [ ] Workflows work
- [ ] File save dialogs work

### After Managers:
- [ ] Config loads on startup
- [ ] Config saves on change
- [ ] Temp files work

### Final:
- [ ] Full integration test
- [ ] No console errors
- [ ] All features work

---

## 📊 Success Criteria / Critérios de Sucesso

- [ ] Zero `http://localhost:5000` in components
- [ ] Zero `fetch(` with hardcoded URLs
- [ ] All fetch() use APIClient
- [ ] Build successful
- [ ] All tests pass
- [ ] No regressions

---

## ⏱️ Time Estimate / Estimativa de Tempo

| Phase | Time | Cumulative |
|-------|------|------------|
| App.jsx | 30 min | 30 min |
| Critical Components | 45 min | 1h 15min |
| Secondary Components | 30 min | 1h 45min |
| Tertiary Components | 15 min | 2h |
| Managers | 45 min | 2h 45min |
| Build & Test | 30 min | **3h 15min** |

**Total:** ~3 hours (with testing)  
**Fast Track:** ~2 hours (if no issues)

---

## 🚀 Next Action / Próxima Ação

**START WITH:** App.jsx (highest impact)  
**Then:** Components (user-facing)  
**Finally:** Managers (internal)

**Ready to begin?**

---

**Created:** 2026-01-11 16:59  
**Status:** Ready for execution  
**Priority:** Complete Phase 1 (80%→100%)
