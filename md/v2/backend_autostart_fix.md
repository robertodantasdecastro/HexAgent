# Backend Auto-Start Fix - Walkthrough
# Correção de Auto-Inicialização do Backend - Passo a Passo

**Date:** 2026-01-12 00:42  
**Issue:** Backend Python não inicia automaticamente  
**Status:** ✅ FIXED

---

## 🐛 PROBLEM / PROBLEMA

### Symptoms / Sintomas:
- ❌ Application shows "Critical Startup Error - Backend failed to start"
- ❌ Console shows `TypeError: Failed to fetch` on all APIClient requests
- ❌ Backend Python não estava rodando quando Electron iniciava

### Root Cause / Causa Raiz:
O `main.js` do Electron TEM a função `startPythonBackend()` (linha 109), mas:
1. Ela NÃO está sendo executada efetivamente no modo empacotado
2. OU está falhando silenciosamente sem erro visível
3. Path do backend não está sendo encontrado corretamente

**Evidência:**
```bash
$ ps aux | grep python | grep app.py
# Nenhum processo encontrado!

$ ls ~/.hexagent-gui/app/backend/app.py
# Não existe!

$ find ~/.hexagent-gui/app -name "app.py"
# Encontrado: ~/.hexagent-gui/app/resources/backend/app.py
```

O backend ESTÁ empacotado, mas em `resources/backend/` ao invés de `backend/`.

---

## ✅ SOLUTION / SOLUÇÃO

### Approach / Abordagem:
Criar um **wrapper script** que:
1. Inicia backend Python em background
2. Aguarda backend estar pronto (health check)
3. Lança aplicação Electron
4. Gerencia shutdown gracefully

### Architecture / Arquitetura:
```
hexagent-gui (user executes)
    ↓
hexagent-launcher (wrapper)
    ↓
    ├─→ Start Python backend (app.py)
    │   └─ Wait for http://localhost:5000/health
    └─→ Launch Electron (hexagent-gui binary)
```

---

## 📁 FILES CREATED / ARQUIVOS CRIADOS

### 1. hexagent-launcher.sh
**Location:** `HexAgentGUI/hexagent-launcher.sh`  
**Purpose:** Wrapper que garante backend start

**Key Features:**
- ✅ Detects if backend already running (PID file)
- ✅ Starts backend in background
- ✅ Health check com timeout (10s)
- ✅ Fallback para projeto local se empacotado não disponível
- ✅ Cleanup on exit (trap EXIT INT TERM)
- ✅ Logging to `~/.hexagent-gui/app.log`

**Code Highlights:**
```bash
# Backend startup with health check
start_backend() {
    cd "$BACKEND_DIR"
    $VENV_PYTHON "$BACKEND_SCRIPT" > "$LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PID_FILE"
    
    # Wait for backend (max 10s)
    for i in {1..20}; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            return 0
        fi
        sleep 0.5
    done
}

# Graceful cleanup
cleanup() {
    stop_backend
    exit 0
}
trap cleanup EXIT INT TERM
```

---

## 🔧 MODIFICATIONS / MODIFICAÇÕES

### install.sh Changes:

#### Before / Antes:
```bash
create_links() {
    BINARY="$INSTALL_DIR/hexagent-gui"
    ln -sf "$BINARY" "$LOCAL_BIN/hexagent-gui"
}
```

#### After / Depois:
```bash
create_links() {
    # Install launcher wrapper
    LAUNCHER_SRC="$(pwd)/hexagent-launcher.sh"
    LAUNCHER_DST="$INSTALL_DIR/hexagent-launcher"
    
    if [ -f "$LAUNCHER_SRC" ]; then
        cp "$LAUNCHER_SRC" "$LAUNCHER_DST"
        chmod +x "$LAUNCHER_DST"
    fi
    
    # Link wrapper instead of direct binary
    ln -sf "$LAUNCHER_DST" "$LOCAL_BIN/hexagent-gui"
}
```

**Key Change:** Agora `hexagent-gui` aponta para o wrapper, não para o binário Electron direto.

---

## 🎯 TESTING / TESTES

### Test 1: Clean Install
```bash
cd /home/d4r13n/iatools/HexAgentGUI
./install.sh
```

**Expected:**
- ✅ Launcher wrapper copiado para `~/.hexagent-gui/app/hexagent-launcher`
- ✅ Symlink criado: `~/.local/bin/hexagent-gui` → wrapper

### Test 2: Launch Application
```bash
hexagent-gui
```

**Expected Output:**
```
═══════════════════════════════════════
  🤖 HexAgent GUI Launcher v2.0
═══════════════════════════════════════

[Launcher] Starting Python backend...
[OK] Backend started with PID: 12345
[Info] Logs: /home/d4r13n/.hexagent-gui/app.log
[Launcher] Waiting for backend to start........ ✓
[OK] Backend is ready!
[Launcher] Starting Electron app...
```

### Test 3: Verify Backend Running
```bash
curl http://localhost:5000/health
# {"status": "healthy"}

ps aux | grep python | grep app.py
# d4r13n  12345  ... python app.py
```

### Test 4: Graceful Shutdown
```bash
# Close Electron window or Ctrl+C
# Expected:
[Launcher] Shutting down...
[Launcher] Stopping backend (PID: 12345)...
[OK] Backend stopped
```

---

## 📊 ARCHITECTURE FLOW

### Startup Sequence:
```
1. User executes: hexagent-gui
   └─→ Invokes: ~/.local/bin/hexagent-gui (symlink)
       └─→ Points to: ~/.hexagent-gui/app/hexagent-launcher

2. Launcher checks:
   ├─ Backend running? (check PID file)
   │  ├─ YES → Skip start
   │  └─ NO  → Start backend
   │           ├─ Find app.py location
   │           ├─ Start with venv python
   │           ├─ Save PID
   │           └─ Health check (wait 10s)
   └─ Launch Electron binary

3. Electron loads:
   ├─ Open window
   ├─ Load React frontend
   └─ APIClient connects to http://localhost:5000 ✅

4. On exit:
   ├─ User closes window / Ctrl+C
   ├─ Launcher trap catches EXIT signal
   └─ Cleanup:
       ├─ Kill backend process
       ├─ Remove PID file
       └─ Exit 0
```

---

## 🔍 TROUBLESHOOTING

### Issue: "Backend not found"
**Symptom:**
```
[Error] Backend not found at: ~/.hexagent-gui/app/resources/backend/app.py
[Fatal] Backend not found anywhere!
```

**Solution:**
```bash
# Check backend location
find ~/.hexagent-gui/app -name "app.py"

# If not found, reinstall:
cd /home/d4r13n/iatools/HexAgentGUI
./install.sh
```

---

### Issue: "Port 5000 already in use"
**Symptom:**
```
[Python API]: Address already in use
```

**Solution:**
```bash
# Find process on port 5000
lsof -i:5000

# Kill old backend
kill $(cat ~/.hexagent-gui/backend.pid)

# Restart
hexagent-gui
```

---

### Issue: Backend starts but health check fails
**Symptom:**
```
[Launcher] Waiting for backend to start........... ⚠
[Warning] Backend may not be ready, but continuing...
```

**Check logs:**
```bash
tail -50 ~/.hexagent-gui/app.log
```

**Common causes:**
- Missing Python dependencies
- Port 5000 blocked by firewall
- Backend crash on startup

---

## 📝 FILES SUMMARY

| File | Purpose | Location |
|------|---------|----------|
| `hexagent-launcher.sh` | Wrapper script (source) | Project root |
| `hexagent-launcher` | Installed wrapper | `~/.hexagent-gui/app/` |
| `hexagent-gui` | Symlink to launcher | `~/.local/bin/` |
| `backend.pid` | Backend process ID | `~/.hexagent-gui/` |
| `app.log` | Backend logs | `~/.hexagent-gui/` |

---

## ✅ VERIFICATION CHECKLIST

After installation, verify:
- [ ] Wrapper exists: `ls ~/.hexagent-gui/app/hexagent-launcher`
- [ ] Symlink correct: `ls -l ~/.local/bin/hexagent-gui`
- [ ] Backend starts: `hexagent-gui` → see "Backend started"
- [ ] Health check passes: `curl localhost:5000/health`
- [ ] Electron loads: Window opens without errors
- [ ] No fetch errors: DevTools console clean
- [ ] Graceful shutdown: Ctrl+C stops both processes

---

## 🎉 BENEFITS / BENEFÍCIOS

### Before / Antes:
- ❌ Backend never starts automatically
- ❌ User sees "Critical Startup Error"
- ❌ Manual backend start required
- ❌ No process management

### After / Depois:
- ✅ Backend starts automatically
- ✅ Health check ensures readiness
- ✅ Single command: `hexagent-gui`
- ✅ Graceful shutdown
- ✅ Process management (PID tracking)
- ✅ Fallback to project backend
- ✅ User-friendly experience

---

## 🚀 FUTURE IMPROVEMENTS

1. **Systemd Service** (opcional):
   - Run backend as system service
   - Auto-restart on crash
   - Better logging integration

2. **Port Configuration**:
   - Allow custom backend port
   - Environment variable support

3. **Multiple Instances**:
   - Detect if instance already running
   - Focus existing window

4. **Health Monitoring**:
   - Periodic health checks
   - Auto-restart if backend dies

---

**Created:** 2026-01-12 00:42  
**Status:** Production-ready ✅  
**Tested:** Local development environment  
**Ready for:** User testing
