# HexAgentGUI Standalone Migration Plan
**Date:** 2026-01-08 12:54  
**Objective:** Eliminate ALL external dependencies and make HexAgentGUI fully self-contained

---

## Problem Analysis

**Current Issues:**
1. ✅ **FIXED:** Asset paths (added `base: './'` to vite.config.js)
2. ❌ **PENDING:** External backend dependencies
3. ❌ **PENDING:** Hardcoded resource paths
4. ❌ **PENDING:** App won't start without external @HexAgent

**Root Cause:**
- `electron/main.js` references `process.resourcesPath` for backend/venv
- Missing or broken paths cause initialization failure

---

## Solution Strategy

### Phase 1: Fix Backend Path Resolution ✅ PRIORITY

**Current Code (electron/main.js):**
```javascript
if (app.isPackaged) {
    scriptPath = path.join(process.resourcesPath, 'backend', 'server.py');
    const bundledPython = path.join(process.resourcesPath, 'venv', 'bin', 'python');
}
```

**Problem:** `process.resourcesPath` não existe ou está vazio

**Solution:**
Use paths relative to app installation directory:
```javascript
const appPath = app.isPackaged 
    ? path.join(process.resourcesPath, '..') 
    : path.join(__dirname, '..');

scriptPath = path.join(appPath, 'backend', 'server.py');
pythonCmd = path.join(appPath, 'venv', 'bin', 'python');
```

### Phase 2: Verify Backend Structure

**Required Structure:**
```
HexAgentGUI/
├── backend/
│   ├── server.py           ✅ EXISTS
│   ├── config/            ✅ EXISTS
│   └── ...
├── venv/                   ✅ EXISTS
│   └── bin/python         ✅ EXISTS
└── electron/
    └── main.js
```

### Phase 3: Add Fallback Logic

**Safer Initialization:**
1. Try local venv first
2. Fallback to system python3
3. Log all attempts
4. Provide clear error messages

---

## Implementation Plan

### Task 1: Fix electron/main.js ⏰

**Changes Needed:**
```javascript
function startPythonBackend() {
    const appPath = app.isPackaged 
        ? path.dirname(process.execPath)
        : path.join(__dirname, '..');
    
    let scriptPath = path.join(appPath, 'backend', 'server.py');
    let pythonCmd;
    
    // Try local venv
    const localVenv = path.join(appPath, 'venv', 'bin', 'python');
    if (fs.existsSync(localVenv)) {
        pythonCmd = localVenv;
        console.log(`[Backend] Using local venv: ${localVenv}`);
    } else {
        pythonCmd = 'python3';
        console.log(`[Backend] Fallback to system python3`);
    }
    
    // Verify backend exists
    if (!fs.existsSync(scriptPath)) {
        console.error(`[Backend] server.py not found at: ${scriptPath}`);
        // Try alternative paths...
    }
    
    console.log(`[Backend] Starting: ${scriptPath} with ${pythonCmd}`);
    pythonProcess = spawn(pythonCmd, [scriptPath]);
}
```

### Task 2: Add Error Handling ⏰

**Graceful Degradation:**
- Show user-friendly error if backend fails
- Allow frontend to work in "offline" mode
- Provide troubleshooting tips

### Task 3: Update package.json ⏰

**Ensure electron-builder includes backend:**
```json
"build": {
  "files": [
    "dist/**/*",
    "electron/**/*",
    "backend/**/*",
    "!backend/__pycache__",
    "!backend/*.pyc"
  ],
  "extraResources": [
    {
      "from": "backend",
      "to": "backend"
    }
  ]
}
```

### Task 4: Test Build ⏰

**Verification Steps:**
1. Clean build: `rm -rf dist`
2. Rebuild: `npm run build`
3. Package: `npx electron-builder --dir`
4. Test packaged app
5. Verify backend starts correctly

---

## Success Criteria

✅ App starts without @HexAgent dependency  
✅ Backend initializes from local paths  
✅ No hardcoded external paths  
✅ Clear error messages if components missing  
✅ Works as standalone package  

---

## Next Actions (Priority Order)

1. **IMMEDIATE:** Fix electron/main.js backend paths
2. **HIGH:** Add error handling and logging
3. **MEDIUM:** Update electron-builder config
4. **LOW:** Update documentation

---

**Status:** Ready to implement fixes
