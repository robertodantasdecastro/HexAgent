# HexAgent Integration Automation Plan
# Plano de Automação da Integração HexAgent

**Date:** 2026-01-12 20:56  
**Strategy:** Programmatic modification with safety checks  
**Goal:** 100% automated completion

---

## 🎯 AUTOMATION STRATEGY

### Why Python Script Instead of Edits:

**Problems with manual edits:**
- 1813 lines in App.jsx
- Multiple non-contiguous changes
- High error rate with automated edits
- Difficult to rollback

**Python script benefits:**
- Parse file once
- Make all changes in memory
- Validate before writing
- Atomic operation (all or nothing)
- Easy rollback

---

## 📋 AUTOMATION STEPS

### STEP 1: Create Integration Script (10min)

**File:** `scripts/integrate_app_jsx.py`

**Functions:**
1. `read_app_jsx()` - Read current file
2. `find_insertion_point(pattern)` - Find where to insert code
3. `add_event_handlers()` - Add useEffect after line 772
4. `add_get_context()` - Add helper before handleSubmit
5. `modify_handle_submit()` - Replace fetch with ChatService
6. `modify_handle_continue()` - Replace fetch with ChatService
7. `add_command_proposal_render()` - Add rendering
8. `add_command_handlers()` - Add approve/reject
9. `update_stop_generation()` - Add abort call
10. `write_app_jsx()` - Write modified file
11. `backup_original()` - Create backup first

**Safety:**
- Backup original to App.jsx.backup
- Validate syntax before writing
- Check for required imports
- Dry-run option

---

### STEP 2: Create Test Scripts (5min)

**Backend Test:** `scripts/test_backend.sh`
```bash
#!/bin/bash
# Test backend endpoints

echo "Testing backend..."
curl -s http://localhost:5000/health | jq .
curl -s -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","context":[],"stream":false}' | jq .
```

**Frontend Test:** `scripts/test_frontend.sh`
```bash
#!/bin/bash
# Build and check for errors

cd /home/d4r13n/iatools/HexAgentGUI
npm run build 2>&1 | tee build.log
grep -i "error" build.log && exit 1 || exit 0
```

---

### STEP 3: Execute Automation (15min)

1. Run integration script with dry-run
2. Review proposed changes
3. Execute actual integration
4. Run frontend build test
5. Run backend test
6. Validate success

---

## 🔧 IMPLEMENTATION

Creating `scripts/integrate_app_jsx.py` now...
