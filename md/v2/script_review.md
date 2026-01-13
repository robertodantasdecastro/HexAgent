# Script Review - Critical Issues Found
# Revisão do Script - Problemas Críticos Encontrados

**File:** replace_urls.sh  
**Date:** 2026-01-11 17:08  
**Status:** ⚠️ UNSAFE - DO NOT RUN AS-IS

---

## 🔴 CRITICAL ISSUES / PROBLEMAS CRÍTICOS

### Issue 1: sed Syntax Breaking
**Problem:** Using `sed` to replace complex JavaScript code is DANGEROUS

```bash
# This line is WRONG:
sed -i "s|await fetch('http://localhost:5000/sessions'|const api = APIClient.getInstance(); await api.post('/sessions'|g"
```

**Why it fails:**
- `sed` is line-by-line, but JavaScript spans multiple lines
- Quotes inside quotes cause escaping issues
- Won't handle different formatting (spaces, newlines)
- Will break on similar patterns

**Example of what breaks:**
```javascript
// Original:
const res = await fetch('http://localhost:5000/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'list' })
});

// sed tries to replace but gets:
const res = const api = APIClient.getInstance(); await api.post('/sessions', {  // BROKEN!
```

---

### Issue 2: Missing Imports
**Problem:** Script doesn't add required imports

```javascript
// Every file needs:
import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';  // if using logger
```

**Impact:** Runtime error "APIClient is not defined"

---

### Issue 3: No Validation
**Problem:** Script doesn't verify:
- Backup actually worked
- Substitutions were successful
- Files still have valid syntax
- Build still works

---

### Issue 4: Wrong HTTP Methods
**Problem:** Some replacements use wrong methods

```bash
# Example - this is wrong:
sed -i "s|await fetch('http://localhost:5000/init_status')|const api = APIClient.getInstance(); await api.get('/init_status')|g"
```

**Why:** The original might be POST, not GET!

---

### Issue 5: Incomplete Replacements
**Problem:** Script doesn't handle:
- Response format differences (`response.json()` vs direct data)
- Error handling changes
- Header removal
- Body transformation

---

## ✅ SAFE ALTERNATIVE APPROACH

### Strategy: Controlled Manual Replacements

**Phase 1: Prepare Import Helper**
Create a tool to inject imports safely

**Phase 2: File-by-File Replacement**
For each file:
1. Add imports
2. Replace ONE URL at a time
3. Verify syntax
4. Build test
5. If pass → next file
6. If fail → rollback

**Phase 3: Validation**
- Full build test
- Manual smoke test
- Compare backup with new

---

## 📋 CORRECT IMPLEMENTATION PLAN

### Step 1: Create Safe Helper Script

```bash
#!/bin/bash
# add_imports.sh - Safely add imports to files

add_imports_to_file() {
    local file=$1
    local has_apiclient=$(grep -c "import APIClient" "$file" || true)
    local has_logger=$(grep -c "import Logger" "$file" || true)
    
    if [ $has_apiclient -eq 0 ]; then
        # Find last import line and add after it
        sed -i "/^import.*from/a import APIClient from '../utils/APIClient';" "$file"
    fi
    
    if [ $has_logger -eq 0 ]; then
        sed -i "/^import.*from/a import Logger from '../utils/Logger';" "$file"
    fi
}
```

### Step 2: Manual Replacements with Validation

```bash
# For each file:
1. Backup original
2. Add imports via helper
3. Replace URLs manually (view file, edit properly)
4. npm run build
5. If success → commit
6. If fail → restore backup
```

---

## 🎯 RECOMMENDED ACTION

**DO NOT RUN `replace_urls.sh` AS-IS**

**Instead:**
1. I'll create a safer approach
2. Process files in small batches
3. Test after each batch
4. Manual verification

**Estimated time:** Still ~2 hours, but SAFE

---

## 📝 FILES THAT NEED CHANGES

### Batch 1: Critical (already done)
- [x] App.jsx (3 URLs) ✅

### Batch 2: Sessions & Services
- [ ] SessionModal.jsx (2 URLs)
- [ ] ServiceManagerModal.jsx (2 URLs)

### Batch 3: Shutdown & Files
- [ ] ShutdownModal.jsx (2 URLs)
- [ ] SaveFilesDialog.jsx (1 URL)

### Batch 4: Scripts & Workflows
- [ ] ScriptBlock.jsx (1 URL)
- [ ] WorkflowManagerModal.jsx (1 URL)

### Batch 5: Config & AI
- [ ] AIConfigModal.jsx (1 URL)
- [ ] OverwriteConfirmDialog.jsx (1 URL)

### Batch 6: UI Components
- [ ] SmartBlock.jsx (1 URL)
- [ ] BrainSelector.jsx (1 URL)
- [ ] LoadingScreen.jsx (1 URL)

**Total:** 11 files, 15 URLs (excluding App.jsx already done)

---

## ⚠️ RECOMMENDATION

**Option A: Safe Manual (2h)**
- Controlled, tested, reliable
- I do it file-by-file
- Build validation each step

**Option B: Risk Script (30min but may break)**
- Fast but dangerous
- Could break entire app
- Hard to recover

**I STRONGLY RECOMMEND: Option A**

Should I proceed with the safe approach?

---

**Created:** 2026-01-11 17:08  
**Status:** Awaiting decision  
**Risk Assessment:** Script as-is = 🔴 HIGH RISK
