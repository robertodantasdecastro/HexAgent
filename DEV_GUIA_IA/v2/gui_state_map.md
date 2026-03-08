# GUI State Map - HexAgentGUI
# Mapa de Estado GUI - HexAgentGUI

**Date:** 2026-01-13  
**Components:** 26 React files analyzed  
**Total States:** 96+ useState hooks

---

## 🎯 CRITICAL STATE VARIABLES

### App.jsx (Main Component)
**Core Chat State:**
- `blocks` - Chat history array ✅ Synced with backend
- `input` - User input text ✅ Local state
- `isLoading` - Request status ✅ Synced with requests
- `status` - Connection status ('OFFLINE'/'ONLINE') ✅ Backend sync
- `serviceStatus` - {flask, hexstrike, brain} ✅ Backend polling

**AI Configuration:**
- `maxIterations` ✅ Synced with AIConfig service
- `unlimitedIterations` ✅ Local override
- `autoExecute` ✅ Synced with backend config
- `currentIteration` ✅ Runtime counter

**Navigation & UI:**
- `inputMode` - 'prompt' | 'command' ✅ Local
- `autoScroll` ✅ Persisted
- `openFiles` ⚠️ Partial backend sync
- `activeFileIndex` ✅ Local
- `currentSessionName` ✅ Synced with SessionService

**History:**
- `promptHistory` ✅ Local persistence
- `systemHistory` ✅ Backend sync via /history/shell
- `historyIndex` / `sysHistoryIndex` ✅ Local navigation

---

## 📊 COMPONENT STATE SUMMARY

### AIConfigModal.jsx
- `activeTab` - 'engine' tab selection ✅
- `aiConfig` - {engine, apiKey, model, ...} ✅ Backend sync

### ServiceManagerModal.jsx
- `activeTab` - Service tabs ✅
- `services` - Service status object ✅ Backend polling
- `loading` - Fetch state ✅

### SessionModal.jsx
- `sessions` - List from backend ✅ Synced
- `loading` - Fetch state ✅
- `newSessionName` - Input ✅

### ScriptBlock.jsx
- `savePath` - File path ✅ ScriptManager
- `isExecuting` - Execution state ✅
- `executionResult` - Result obj ⚠️ Not persisted
- `isSaving` / `saved` - Save states ✅

### FileEditorPanel.jsx
- `content` - File content ✅ Backend sync
- `isDirty` - Unsaved changes ⚠️ Needs auto-save

### FileTreeView.jsx
- `expandedFolders` - Set of paths ⚠️ Not persisted
- `selectedFile` ⚠️ Not synced with openFiles

---

## ⚠️ SYNCHRONIZATION ISSUES

### 1. File Editor State
**Issue:** `FileEditorPanel.isDirty` not synced with auto-save  
**Impact:** User may lose unsaved changes  
**Fix:** Hook into auto-save service

### 2. File Tree Expansion
**Issue:** `expandedFolders` Set not persisted  
**Impact:** Tree resets on app restart  
**Fix:** Persist to localStorage or config

### 3. Execution Results
**Issue:** `ScriptBlock.executionResult` not stored  
**Impact:** Results lost on component unmount  
**Fix:** Move to parent state or service

### 4. File Selection
**Issue:** `FileTreeView.selectedFile` doesn't sync with `App.openFiles`  
**Impact:** Inconsistent UI state  
**Fix:** Lift state or use shared service

---

## ✅ POO ENCAPSULATION PATTERNS

### Services (Singleton Pattern)
```javascript
// Well encapsulated - Good POO
SessionService.getInstance()
APIClient.getInstance()
ChatService.getInstance()
```

### Hooks (React Pattern)
```javascript
// Good encapsulation
useAIConfig()      - AI configuration state
useSystemConfig()  - System configuration state
useModalState()    - Modal open/close state
useTranslation()   - i18n state
```

### Anti-patterns Found
```javascript
// ❌ Direct state manipulation in multiple places
setBlocks(prev => [...prev, newBlock])  // Scattered across App.jsx

// ✅ Should be:
ChatStateManager.addBlock(newBlock)
```

---

## 🔧 RECOMMENDATIONS

### High Priority
1. **Create ChatStateManager service**
   - Centralize blocks manipulation
   - Handle auto-save
   - Manage history

2. **FileStateManager service**
   - Sync openFiles with FileTreeView
   - Handle isDirty states
   - Centralize file operations

3. **Persist UI preferences**
   - expandedFolders
   - activeTab states
   - Window positions

### Medium Priority
4. **ExecutionHistoryService**
   - Store script execution results
   - Query past executions
   - Export/import

5. **StateHydration**
   - Load all state from config on mount
   - Periodic state persistence

---

## 📈 STATE HEALTH SCORE

**Overall:** 7.5/10

**Strengths:**
- ✅ Services use Singleton pattern
- ✅ Most critical states synced with backend
- ✅ Clear separation of concerns

**Weaknesses:**
- ⚠️ Some states not persisted
- ⚠️ File-related states fragmented
- ⚠️ Direct state manipulation anti-pattern

---

**Next:** Implement suggested StateManagers
