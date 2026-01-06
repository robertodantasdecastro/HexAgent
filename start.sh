#!/bin/bash
# HexAgentGUI - Complete Startup Script
# Script de Inicialização Completa do HexAgent GUI
#
# This script starts both backend and frontend
# Este script inicia tanto backend quanto frontend

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
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check if backend is already running
info "Checking backend status..."
if pgrep -f "python.*server.py" > /dev/null; then
    warn "Backend already running. Restarting..."
    pkill -f "python.*server.py"
    sleep 2
fi

# 2. Start backend in background
info "Starting backend server..."
cd backend
nohup python3 server.py > /tmp/hexagent_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

success "Backend started (PID: $BACKEND_PID)"
info "Backend log: /tmp/hexagent_backend.log"

# 3. Wait for backend to be ready
info "Waiting for backend..."
for i in {1..10}; do
    if curl -s http://localhost:5000/status > /dev/null 2>&1; then
        success "Backend ready!"
        break
    fi
    sleep 1
    if [ $i -eq 10 ]; then
        error "Backend failed to start. Check /tmp/hexagent_backend.log"
    fi
done

# 4. Start frontend
info "Starting frontend application..."
exec hexagent-gui

# Note: Frontend will block here
# When user closes app, this script ends
