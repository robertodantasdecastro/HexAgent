#!/bin/bash
# HexAgentGUI Launcher Wrapper
# Launches backend then Electron app
# Inicia backend e depois o app Electron

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

INSTALL_DIR="$HOME/.hexagent-gui/app"
BACKEND_DIR="$INSTALL_DIR/resources/backend"
VENV_PYTHON="$INSTALL_DIR/resources/venv/bin/python"
BACKEND_SCRIPT="$BACKEND_DIR/app.py"
ELECTRON_BIN="$INSTALL_DIR/hexagent-gui"
PID_FILE="$HOME/.hexagent-gui/backend.pid"
LOG_FILE="$HOME/.hexagent-gui/app.log"

# Function to check if backend is running
# Função para verificar se backend está rodando
is_backend_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0  # Running
        fi
    fi
    return 1  # Not running
}

# Function to start backend
# Função para iniciar backend
start_backend() {
    echo -e "${YELLOW}[Launcher]${NC} Starting Python backend..."
    
    # Check if backend exists
    if [ ! -f "$BACKEND_SCRIPT" ]; then
        echo -e "${RED}[Error]${NC} Backend not found at: $BACKEND_SCRIPT"
        echo -e "${YELLOW}[Info]${NC} Trying alternative location..."
        
        # Try project directory as fallback
        PROJECT_BACKEND="/home/d4r13n/iatools/HexAgentGUI/backend/app.py"
        if [ -f "$PROJECT_BACKEND" ]; then
            echo -e "${GREEN}[OK]${NC} Using project backend: $PROJECT_BACKEND"
            BACKEND_SCRIPT="$PROJECT_BACKEND"
            BACKEND_DIR=$(dirname "$PROJECT_BACKEND")
            VENV_PYTHON="python3"  # Use system python
        else
            echo -e "${RED}[Fatal]${NC} Backend not found anywhere!"
            exit 1
        fi
    fi
    
    # Start backend in background
    cd "$BACKEND_DIR"
    $VENV_PYTHON "$BACKEND_SCRIPT" > "$LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    
    # Save PID
    echo $BACKEND_PID > "$PID_FILE"
    
    echo -e "${GREEN}[OK]${NC} Backend started with PID: $BACKEND_PID"
    echo -e "${YELLOW}[Info]${NC} Logs: $LOG_FILE"
    
    # Wait for backend to be ready (max 10 seconds)
    echo -n "[Launcher] Waiting for backend to start"
    for i in {1..20}; do
        if curl -s http://localhost:5000/health > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            echo -e "${GREEN}[OK]${NC} Backend is ready!"
            return 0
        fi
        echo -n "."
        sleep 0.5
    done
    
    echo -e " ${YELLOW}⚠${NC}"
    echo -e "${YELLOW}[Warning]${NC} Backend may not be ready, but continuing..."
    return 0
}

# Function to stop backend
# Função para parar backend
stop_backend() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}[Launcher]${NC} Stopping backend (PID: $PID)..."
            kill $PID 2>/dev/null || true
            rm -f "$PID_FILE"
            echo -e "${GREEN}[OK]${NC} Backend stopped"
        else
            rm -f "$PID_FILE"
        fi
    fi
}

# Cleanup on exit
# Limpeza ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}[Launcher]${NC} Shutting down..."
    stop_backend
    exit 0
}

trap cleanup EXIT INT TERM

# Main execution
# Execução principal
echo ""
echo "═══════════════════════════════════════"
echo "  🤖 HexAgent GUI Launcher v2.0"
echo "═══════════════════════════════════════"
echo ""

# Check if backend is already running
if is_backend_running; then
    PID=$(cat "$PID_FILE")
    echo -e "${GREEN}[OK]${NC} Backend already running (PID: $PID)"
else
    start_backend
fi

# Launch Electron app
echo -e "${YELLOW}[Launcher]${NC} Starting Electron app..."
if [ -f "$ELECTRON_BIN" ]; then
    exec "$ELECTRON_BIN" "$@"
else
    echo -e "${RED}[Error]${NC} Electron binary not found: $ELECTRON_BIN"
    exit 1
fi
