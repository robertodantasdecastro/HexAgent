#!/bin/bash
# Test script for verifying JavaScript initialization without X11
# Script de teste para verificar inicialização JavaScript sem X11

echo "═══════════════════════════════════════"
echo "  🧪 HexAgent GUI - Test Mode"
echo "═══════════════════════════════════════"
echo ""

# Start backend
echo "[1/3] Starting backend..."
cd "$(dirname "$0")"
python3 backend/app.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend
echo "[2/3] Waiting for backend..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✓ Backend is running"
else
    echo "✗ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start Vite dev server (no Electron, just browser)
echo "[3/3] Starting Vite dev server..."
echo ""
echo "═══════════════════════════════════════"
echo "  ✅ Test server ready!"
echo "═══════════════════════════════════════"
echo ""
echo "Access the app at: http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""

npm run dev

# Cleanup
kill $BACKEND_PID 2>/dev/null
