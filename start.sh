#!/bin/bash
# HexAgentGUI - Complete Startup Script
# Script de Inicialização Completa do HexAgent GUI
#
# Sequence / Sequência:
# 1. Config Check
# 2. HexStrike AI (Port 8888)
# 3. Backend (Port 5000)
# 4. AgentCore (Initialized by Backend)
# 5. Frontend (Electron/React)

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

echo "🚀 HexAgentGUI - Complete Startup"
echo "=================================="

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Cleanup Function
cleanup() {
    echo ""
    info "Shutting down services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        info "Stopping Backend (PID $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Stop HexStrike if we started it or if it's running
    if pgrep -f "hexstrike_server.py" > /dev/null; then
        info "Stopping HexStrike AI..."
        pkill -f "hexstrike_server.py" 2>/dev/null || true
    fi
    
    success "Shutdown complete."
}

# Trap signals
trap cleanup EXIT INT TERM

# 0. Environment Setup
info "Setting up environment..."

# Activate unified venv / Ativar venv unificado
if [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
    info "Using unified venv: $SCRIPT_DIR/venv"
else
    warn "Unified venv not found at $SCRIPT_DIR/venv - trying system python"
fi

# 1. Start HexStrike AI (Dependency for Backend)
info "Step 1/3: Starting HexStrike AI (Port 8888)..."

# Locate HexStrike script
HEXSTRIKE_DIR="$SCRIPT_DIR/../hexstrike-ai"
HEXSTRIKE_SCRIPT="$HEXSTRIKE_DIR/start_hexstrike.sh"

if [ ! -f "$HEXSTRIKE_SCRIPT" ]; then
    error "HexStrike script not found at $HEXSTRIKE_SCRIPT"
fi

# Check if already running
if curl -s http://localhost:8888/status > /dev/null 2>&1; then
    warn "HexStrike already running."
else
    # Enforce Localhost Binding (Firewall Rule)
    export HEXSTRIKE_HOST="127.0.0.1"
    
    # Start HexStrike using its script provided with port
    bash "$HEXSTRIKE_SCRIPT" 8888 &
    
    # Wait for HexStrike
    info "Waiting for HexStrike..."
    for i in {1..30}; do
        if curl -s http://localhost:8888/status > /dev/null 2>&1; then
            success "HexStrike AI ready!"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            error "HexStrike failed to start. Check $HEXSTRIKE_DIR/hexstrike_startup.log"
        fi
    done
fi

# 2. Start Backend (Port 5001)
info "Step 2/3: Starting Backend Server (Port 5001)..."

cd backend

# Kill existing if any
if pgrep -f "python.*app.py" > /dev/null; then
    warn "Stopping existing backend..."
    pkill -f "python.*app.py"
    sleep 1
fi

nohup python3 app.py > /tmp/hexagent_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

success "Backend process started (PID: $BACKEND_PID)"

# Wait for backend
info "Waiting for Backend..."
for i in {1..15}; do
    if curl -s http://localhost:5001/status > /dev/null 2>&1; then
        success "Backend ready!"
        break
    fi
    sleep 1
    if [ $i -eq 15 ]; then
        error "Backend failed to start. Check /tmp/hexagent_backend.log"
    fi
done


# 3. Start Frontend
info "Step 3/3: Starting Frontend Application..."
echo "---------------------------------------------------"
echo "HexAgentGUI is running. Close the window to exit."
echo "---------------------------------------------------"

# We use direct execution here, but we want the trap to fire.
# If we 'exec', the shell is replaced and trap might be lost/handled differently depending on shell.
# Better to run it as a child and wait.
hexagent-gui

# When hexagent-gui closes, script continues to cleanup via trap
