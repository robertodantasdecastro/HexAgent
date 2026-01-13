# Phase 3: Service Layer Implementation Plan
**Date:** 2026-01-08  
**Status:** Planning  
**Estimated Time:** 8-12 hours

---

## Phase 2 Completion Summary ✅

**Achieved:**
- 18/19 non-streaming endpoints migrated (94%)
- 6/6 modals unified (100%)
- 4 OOP classes created
- 296 LOC dead code removed
- Build: 979.85 KB, 3.38s, 0 errors

**Remaining:** 2 streaming `/chat` endpoints (intentionally kept as fetch())

---

## Phase 3 Objectives

Extract business logic from components into dedicated Service classes following OOP patterns established in Phases 1-2.

### Goals
1. Create SessionService for session management
2. Create WorkflowService for workflow operations
3. Create CommandService for command execution
4. Reduce App.jsx complexity
5. Improve testability and maintainability

---

## Service Classes Design

### 1. SessionService

**Responsibility:** Manage chat sessions (save, load, list, delete)

**Pattern:** Singleton + Repository  
**Dependencies:** APIClient  
**LOC Estimate:** 200-250

**Methods:**
```javascript
class SessionService {
  static getInstance()
  
  // CRUD operations
  async loadSession(name)
  async saveSession(name, blocks)
  async listSessions()
  async deleteSession(name)
  async autoSave(blocks)
  
  // Utility
  getCurrentSessionName()
  setCurrentSessionName(name)
}
```

**Integration Points:**
- Replace `handleLoadSession()` in App.jsx
- Replace `handleSaveSession()` in App.jsx
- Replace `handleSessionCommand()` logic

### 2. WorkflowService

**Responsibility:** Manage AI workflows

**Pattern:** Singleton + Strategy  
**Dependencies:** APIClient  
**LOC Estimate:** 150-200

**Methods:**
```javascript
class WorkflowService {
  static getInstance()
  
  async listWorkflows()
  async executeWorkflow(name, params)
  async createWorkflow(definition)
  async updateWorkflow(name, definition)
  async deleteWorkflow(name)
}
```

**Integration Points:**
- WorkflowManagerModal
- Replace workflow fetch() calls

### 3. CommandService

**Responsibility:** Execute shell commands and manage command history

**Pattern:** Singleton + Command  
**Dependencies:** APIClient  
**LOC Estimate:** 250-300

**Methods:**
```javascript
class CommandService {
  static getInstance()
  
  async executeCommand(command)
  async getCommandHistory()
  async autocomplete(partial)
  async validateCommand(command)
  
  // Command history management
  getLocalHistory()
  addToHistory(command)
  clearHistory()
}
```

**Integration Points:**
- Replace `handleExecuteProposal()` in App.jsx
- Replace command history logic
- Replace autocomplete logic

---

## Implementation Order

### Priority 1: SessionService (4-5 hours)
**Why first:** Most isolated, clear responsibility, high impact

**Steps:**
1. Create `src/services/SessionService.js`
2. Implement Singleton pattern
3. Add session CRUD methods
4. Integrate APIClient
5. Add bilingual documentation
6. Update App.jsx to use SessionService
7. Test session operations

### Priority 2: CommandService (3-4 hours)
**Why second:** Reduces App.jsx complexity significantly

**Steps:**
1. Create `src/services/CommandService.js`
2. Implement command execution
3. Add history management
4. Add autocomplete support
5. Update App.jsx integration
6. Test command flows

### Priority 3: WorkflowService (2-3 hours)
**Why last:** Lower complexity, fewer integration points

**Steps:**
1. Create `src/services/WorkflowService.js`
2. Implement workflow operations
3. Integrate with WorkflowManagerModal
4. Test workflow execution

---

## Success Criteria

### Code Quality
- [ ] All services follow Singleton pattern
- [ ] 100% bilingual documentation
- [ ] Consistent error handling
- [ ] Build passes with 0 errors

### Architecture
- [ ] Business logic extracted from components
- [ ] Single Responsibility Principle applied
- [ ] APIClient used for all HTTP calls
- [ ] No duplicate code

### Integration
- [ ] App.jsx LOC reduced by 200+
- [ ] All existing functionality preserved
- [ ] No breaking changes
- [ ] Service classes independently testable

---

## File Structure

```
src/
├── services/
│   ├── SessionService.js    ✨ NEW
│   ├── CommandService.js    ✨ NEW
│   └── WorkflowService.js   ✨ NEW
├── utils/
│   ├── APIClient.js         ✅ Exists
│   └── ConfigManager.js     ✅ Exists
└── components/
    └── App.jsx             📝 Will be refactored
```

---

## Risk Assessment

### Low Risk ✅
- Service classes are isolated
- Can implement incrementally
- Easy to test independently

### Medium Risk ⚠️
- Integration with existing App.jsx logic
- State management coordination
- Backward compatibility

### Mitigation
- Implement one service at a time
- Test thoroughly before moving to next
- Keep old code commented until verified

---

## Next Actions

1. Create `src/services/` directory
2. Implement SessionService
3. Update App.jsx to use SessionService
4. Test and verify
5. Move to CommandService

---

**Plan Status:** ✅ READY TO EXECUTE  
**Estimated Completion:** 8-12 hours  
**Start Date:** 2026-01-08

*Phase 3 Plan by Antigravity AI*
