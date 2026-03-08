# Development Roadmap - HexAgentGUI
# Roadmap de Desenvolvimento - HexAgentGUI  

**Updated:** 2026-01-13  
**Based on:** Deep analysis + POO audit

---

## 🎯 PHASE 1: Critical Refactoring (Priority 1)

**Goal:** Fix God Object anti-pattern in App.jsx  
**Timeline:** 2-3 weeks

### Task 1.1: Extract ChatStateManager ⭐
**Priority:** CRITICAL  
**Effort:** 3 days  

```javascript
class ChatStateManager {
  static #instance = null;
  #blocks = [];
  #isLoading = false;
  
  addBlock(block) {...}
  updateBlock(id, data) {...}
  getContext() {...}
}
```

**Impact:** Reduces App.jsx by ~300 lines

### Task 1.2: Extract FileStateManager
**Priority:** HIGH  
**Effort:** 2 days

```javascript
class FileStateManager {
  #openFiles = [];
  #activeIndex = 0;
  #dirtyMap = new Map();
  
  openFile(path) {...}
  closeFile(index) {...}
  markDirty(index) {...}
}
```

**Impact:** Centralizes file state, fixes sync issues

### Task 1.3: Extract UIPreferencesManager  
**Priority:** MEDIUM  
**Effort:** 1 day

```javascript
class UIPreferencesManager {
  #autoScroll = true;
  #expandedFolders = new Set();
  
  persist() {...}
  hydrate() {...}
}
```

**Impact:** Persists UI state across sessions

---

## 🔧 PHASE 2: Backend Enhancements  

**Goal:** Multi-engine AI support, better error handling  
**Timeline:** 1-2 weeks

### Task 2.1: Implement Multi-Engine Support ✅ PLANNED
**Priority:** HIGH  
**Effort:** 3 days

- Update HexBrain to support engines (hexsecgpt, openai, deepseek)
- Create AIEngineModal.jsx for configuration
- Add error alerts for API key issues

**Files:**
- `backend/core/hex_brain.py`
- `src/components/AIEngineModal.jsx`
- `src/components/ErrorAlert.jsx`

### Task 2.2: Enhance Error Handling
**Priority:** MEDIUM  
**Effort:** 2 days

- Add structured error responses (401, 403, 500)
- Create ErrorBoundary for frontend
- Implement retry logic

---

## 📊 PHASE 3: State Synchronization

**Goal:** Fix all state sync issues identified in analysis  
**Timeline:** 1 week

### Task 3.1: FileTreeView ↔ OpenFiles Sync
**Status:** ⚠️ BROKEN  
**Fix:** Use FileStateManager as single source of truth

### Task 3.2: Persist Execution Results
**Status:** ⚠️ LOST ON UNMOUNT  
**Fix:** ExecutionHistoryService with localStorage

### Task 3.3: Auto-save File Edits
**Status:** ⚠️ MANUAL ONLY  
**Fix:** Debounced auto-save in FileEditorPanel

---

## 🚀 PHASE 4: New Features

**Goal:** Enhance user experience  
**Timeline:** 2-3 weeks

### Task 4.1: Command History Search
Filter and search past commands

### Task 4.2: Session Templates
Save and load session templates

### Task 4.3: Export/Import
Export chat history, configs

### Task 4.4: Dark/Light Theme Toggle
Complete theme system

---

## 📝 PHASE 5: Documentation & i18n

**Goal:** Complete multilingual docs  
**Timeline:** 1 week

### Task 5.1: Audit All .md Files ✅ DONE  
- README.md
- FEATURES.md  
- USER_MANUAL.md
- All updated to EN/PT-BR

### Task 5.2: Complete Code Comments
Ensure all classes have bilingual docstrings

### Task 5.3: Update Logo & Links
Preserve developer info, donation links

---

## 🧪 PHASE 6: Testing & QA

**Goal:** Comprehensive test coverage  
**Timeline:** 2 weeks

### Task 6.1: Unit Tests
- Backend: pytest for all services
- Frontend: Jest/Vitest for components

### Task 6.2: Integration Tests
- E2E chat flows
- File operations
- Session management

### Task 6.3: Performance Testing
- Load testing /chat endpoint
- Memory leak detection
- Render performance

---

## 📈 SUCCESS METRICS

| Phase | Completion | Impact |
|-------|-----------|--------|
| Phase 1 | 0% | App.jsx < 1000 lines |
| Phase 2 | 30% | Multi-engine AI |  
| Phase 3 | 0% | Zero state sync bugs |
| Phase 4 | 0% | +5 features |
| Phase 5 | 80% | 100% docs |
| Phase 6 | 0% | 80% test coverage |

---

## 🎯 IMMEDIATE NEXT STEPS (This Week)

1. ✅ Complete deep analysis (DONE)
2. ⏳ Create ChatStateManager service
3. ⏳ Extract 50% of App.jsx state
4. ⏳ Test integration
5. ⏳ Document changes

---

## ⚠️ BLOCKERS & RISKS

**Current Blockers:**
- Backend Flask not starting properly (flask port 5000)  
- Need to investigate Electron spawn

**Risks:**
- Breaking changes during refactoring
- State sync bugs during migration

**Mitigation:**
- Incremental refactoring
- Comprehensive testing
- Feature flags

---

**Status:** Ready to execute Phase 1  
**Owner:** Development team (human + AI)  
**Review:** Weekly progress check
