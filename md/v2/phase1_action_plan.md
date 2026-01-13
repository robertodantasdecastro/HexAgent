# Phase 1 Critical Refactoring - Action Plan
# Fase 1 Refatoração Crítica - Plano de Ação

**Start Date:** 2026-01-10 17:38  
**Target Completion:** 2026-01-17 (1 week)  
**Status:** 🔴 READY TO START  
**Total Estimated Effort:** 10-12 hours

---

## 📊 Project Context Recap / Recapitulação do Contexto

### Recent Accomplishments / Conquistas Recentes:
✅ **Multi-language Implementation** (90% coverage)
- 13 components fully translated
- 700+ translation keys (EN/PT/ES)
- Dynamic language detection working

✅ **Deep Project Analysis Completed**
- 40+ state variables mapped
- 12 OOP classes identified (62% adoption)
- Critical issues documented
- Comprehensive roadmap created

### Current State / Estado Atual:
- **OOP Adoption:** 62% (B+ grade)
- **Test Coverage:** ~15%
- **Bundle Size:** 845 KB
- **App.jsx:** 1,740 lines (too large!)
- **Console.log:** 58 instances in production
- **Critical Issues:** 5 identified

---

## 🎯 Phase 1 Objectives / Objetivos da Fase 1

**Goal:** Fix critical issues that impact stability, maintainability, and testability.

**Success Criteria:**
- [ ] Zero hardcoded URLs
- [ ] Zero memory leaks
- [ ] Zero duplicate state  
- [ ] Zero console.log in production
- [ ] ScriptManager follows Singleton pattern
- [ ] All critical tests passing

---

## 🔴 TASK 1: Fix ScriptManager Anti-Pattern
**Priority:** CRITICAL  
**Estimated Effort:** 2 hours  
**Status:** 📋 TODO

### Problem Analysis:
```javascript
// ❌ CURRENT (Bad):
export class ScriptManager {
  static async saveScript(path, content) {
    await fetch('http://localhost:5000/script/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, make_executable: makeExecutable })
    });
  }
}
```

**Issues:**
1. Not using APIClient
2. Not implementing Singleton pattern
3. Hardcoded URL (http://localhost:5000)
4. Cannot mock for testing
5. Inconsistent with other Managers

### Implementation Steps:

#### Step 1.1: Refactor to Singleton (30 min)
```javascript
// ✅ TARGET (Good):
class ScriptManager {
  static #instance = null;
  #api = null;

  constructor() {
    if (ScriptManager.#instance) {
      throw new Error(
        'ScriptManager is a singleton. Use ScriptManager.getInstance() instead. / ' +
        'ScriptManager é um singleton. Use ScriptManager.getInstance().'
      );
    }
    this.#api = APIClient.getInstance();
  }

  static getInstance() {
    if (!ScriptManager.#instance) {
      ScriptManager.#instance = new ScriptManager();
    }
    return ScriptManager.#instance;
  }

  async saveScript(path, content, makeExecutable = false) {
    return await this.#api.post('/script/save', {
      path,
      content,
      make_executable: makeExecutable
    });
  }

  async executeScript(path, args = [], workingDir = null) {
    return await this.#api.post('/script/execute', {
      path,
      args,
      working_dir: workingDir
    });
  }

  async debugScript(path, args = []) {
    return await this.#api.post('/script/debug', {
      path,
      args
    });
  }
}

export default ScriptManager;
```

#### Step 1.2: Update All Usages (30 min)
Search for all `ScriptManager` usages and update:
```javascript
// Before:
import { ScriptManager } from './utils/scriptManager';
await ScriptManager.saveScript(path, content);

// After:
import ScriptManager from './utils/scriptManager';
const scriptManager = ScriptManager.getInstance();
await scriptManager.saveScript(path, content);
```

#### Step 1.3: Add Unit Tests (1 hour)
Create `__tests__/scriptManager.test.js`:
```javascript
describe('ScriptManager', () => {
  it('should be a singleton', () => {
    const instance1 = ScriptManager.getInstance();
    const instance2 = ScriptManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should use APIClient for requests', async () => {
    const sm = ScriptManager.getInstance();
    const mockApi = jest.spyOn(APIClient.getInstance(), 'post');
    
    await sm.saveScript('/test.sh', 'echo "test"', true);
    
    expect(mockApi).toHaveBeenCalledWith('/script/save', {
      path: '/test.sh',
      content: 'echo "test"',
      make_executable: true
    });
  });
});
```

### Acceptance Criteria:
- [ ] ScriptManager implements Singleton pattern
- [ ] All methods use APIClient (no fetch() calls)
- [ ] No hardcoded URLs
- [ ] Tests pass (>90% coverage)
- [ ] Documentation updated
- [ ] All usages updated

---

## 🔴 TASK 2: Activate Logger Class
**Priority:** HIGH  
**Estimated Effort:** 3 hours  
**Status:** 📋 TODO

### Problem Analysis:
- 58 console.log/error/warn statements in App.jsx
- Production logs leaking sensitive data
- No log level control
- No environment-based filtering

### Implementation Steps:

#### Step 2.1: Review Existing Logger (15 min)
Check `utils/Logger.js` implementation and ensure it's ready.

#### Step 2.2: Configure Log Levels (30 min)
Update Logger to support environment-based filtering:
```javascript
class Logger {
  static #instance = null;
  static #logLevel = process.env.NODE_ENV === 'production' ? 'ERROR' : 'DEBUG';
  
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  };

  static setLevel(level) {
    this.#logLevel = level;
  }

  static debug(message, context = {}) {
    if (this.LEVELS[this.#logLevel] <= this.LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  static info(message, context = {}) {
    if (this.LEVELS[this.#logLevel] <= this.LEVELS.INFO) {
      console.log(`[INFO] ${message}`, context);
    }
  }

  static warn(message, context = {}) {
    if (this.LEVELS[this.#logLevel] <= this.LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  static error(message, error = null, context = {}) {
    if (this.LEVELS[this.#logLevel] <= this.LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, error, context);
    }
  }
}
```

#### Step 2.3: Replace console.log in App.jsx (2 hours)
Replace all 58 instances:
```javascript
// ❌ Before:
console.log('[App] Loading session...');
console.error('[App] Load session error:', error);

// ✅ After:
import Logger from './utils/Logger';

Logger.info('Loading session...', { component: 'App' });
Logger.error('Load session error', error, { component: 'App' });
```

#### Step 2.4: Add Production Filter (15 min)
In production build, set log level to ERROR only.

### Acceptance Criteria:
- [ ] Logger class fully functional
- [ ] All console.log replaced with Logger
- [ ] Environment-based filtering working
- [ ] Production builds = ERROR level only
- [ ] No sensitive data in logs

---

## 🔴 TASK 3: Remove Duplicate State
**Priority:** CRITICAL  
**Estimated Effort:** 2 hours  
**Status:** 📋 TODO

### Problem Analysis:
State variables duplicate config values:
```javascript
// ❌ Duplicates:
const [maxIterations, setMaxIterations] = useState(10);
const [unlimitedIterations, setUnlimitedIterations] = useState(false);
const [currentIteration, setCurrentIteration] = useState(0);

// Already exists in:
aiConfig.ai.max_iterations
aiConfig.ai.unlimited_iterations
```

### Implementation Steps:

#### Step 3.1: Remove State Declarations (15 min)
Delete duplicate state variables from App.jsx.

#### Step 3.2: Update All References (1.5 hours)
Find and update all usages:
```javascript
// ❌ Before:
if (currentIteration >= maxIterations && !unlimitedIterations) {
  setShowIterationLimitReached(true);
}

// ✅ After:
if (currentIteration >= (aiConfig?.ai?.max_iterations || 10) && 
    !aiConfig?.ai?.unlimited_iterations) {
  setShowIterationLimitReached(true);
}
```

#### Step 3.3: Test Synchronization (30 min)
Verify that changes in AIConfigModal immediately affect App logic.

### Acceptance Criteria:
- [ ] `maxIterations` state removed
- [ ] `unlimitedIterations` state removed
- [ ] All references updated to use `aiConfig.ai.*`
- [ ] Config changes immediately reflected in UI
- [ ] No state desync issues

---

## 🔴 TASK 4: Fix Memory Leaks
**Priority:** CRITICAL  
**Estimated Effort:** 1 hour  
**Status:** 📋 TODO

### Problem Analysis:
```javascript
// ❌ PROBLEM: intervalId in component scope
let intervalId; // Memory leak on unmount!

useEffect(() => {
  intervalId = setInterval(() => checkStatus(), 5000);
  return () => clearInterval(intervalId);
}, []);
```

### Implementation Steps:

#### Step 4.1: Move to useRef (15 min)
```javascript
// ✅ FIX:
const intervalIdRef = useRef(null);

useEffect(() => {
  intervalIdRef.current = setInterval(() => checkStatus(), 5000);
  return () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };
}, []);
```

#### Step 4.2: Fix All Intervals (30 min)
Search for all `setInterval`, `setTimeout` and convert to refs.

#### Step 4.3: Fix useEffect Dependencies (15 min)
Add missing dependencies to all useEffect hooks.

### Acceptance Criteria:
- [ ] All intervals/timeouts use refs
- [ ] Proper cleanup in all useEffect
- [ ] No memory leaks (verify with React DevTools Profiler)
- [ ] All dependency arrays correct

---

## 🔴 TASK 5: Remove Hardcoded URLs
**Priority:** HIGH  
**Estimated Effort:** 2 hours  
**Status:** 📋 TODO

### Problem Analysis:
15+ instances of hardcoded `http://localhost:5000`:
- ScriptManager (3 instances - FIXED in Task 1)
- Direct fetch() calls (12+ instances)

### Implementation Steps:

#### Step 5.1: Find All Hardcoded URLs (15 min)
```bash
grep -rn "http://localhost" src/
```

#### Step 5.2: Replace with APIClient (1.5 hours)
```javascript
// ❌ Before:
const response = await fetch('http://localhost:5000/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// ✅ After:
const api = APIClient.getInstance();
const response = await api.post('/api/endpoint', data);
```

#### Step 5.3: Configure Backend URL (15 min)
Add to systemConfig:
```json
{
  "system": {
    "backend_url": "http://localhost:5000"
  }
}
```

### Acceptance Criteria:
- [ ] Zero hardcoded URLs in codebase
- [ ] All network requests use APIClient
- [ ] Backend URL configurable
- [ ] Tests pass

---

## 📅 Timeline / Cronograma

| Day | Task | Hours | Status |
|-----|------|-------|--------|
| Day 1 (Mon) | Task 1: ScriptManager | 2h | 📋 |
| Day 2 (Tue) | Task 2: Logger (Part 1) | 2h | 📋 |
| Day 3 (Wed) | Task 2: Logger (Part 2) | 1h | 📋 |
| Day 3 (Wed) | Task 3: Duplicate State | 2h | 📋 |
| Day 4 (Thu) | Task 4: Memory Leaks | 1h | 📋 |
| Day 4 (Thu) | Task 5: Hardcoded URLs | 2h | 📋 |
| Day 5 (Fri) | Testing & Documentation | 2h | 📋 |

**Total: 12 hours over 5 days**

---

## ✅ Phase 1 Verification Checklist

### Code Quality Checks:
- [ ] ESLint passes with zero warnings
- [ ] No console.log in production code
- [ ] No hardcoded URLs
- [ ] All singletons properly implemented
- [ ] Memory leak tests pass

### Functional Tests:
- [ ] All existing features still work
- [ ] Config changes immediately reflected
- [ ] Language switching works
- [ ] No regressions

### Documentation:
- [ ] ScriptManager documented
- [ ] Logger usage documented
- [ ] State management patterns documented
- [ ] Updated architecture.md

---

## 🚀 Next Steps After Phase 1

### Phase 2 Preview (Weeks 2-3):
1. Extract ContentParser class
2. Create ChatController  
3. Create BaseManager
4. Remove duplicate dependencies

**Estimated: 15-20 hours**

---

## 📝 Notes / Notas

### Key Decisions:
- Using existing Logger class (no external library)
- Keeping APIClient as-is (working well)
- Not migrating to TypeScript yet (Phase 3-4)

### Risks:
- Breaking changes during state refactor
  - **Mitigation:** Comprehensive manual testing
  
- Missed hardcoded URLs
  - **Mitigation:** Automated grep search

---

**Ready to begin?** Let's start with Task 1: ScriptManager Refactor!

**Próximo passo:** Refatorar ScriptManager
