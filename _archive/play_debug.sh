#!/bin/bash
# PlayDebug Script
# Installs, enables debug mode, and runs the application

echo "--- [PlayDebug] Starting Sequence ---"

# 1. Run Install
echo "--- [1/3] Running Install Script ---"
./install.sh

if [ $? -ne 0 ]; then
    echo "❌ Install failed! Aborting."
    exit 1
fi

# 2. Enable Debug Mode
echo "--- [2/3] Enabling Debug Mode ---"
python3 scripts/debug_tools.py --enable

# 3. Launch App
echo "--- [3/3] Launching HexAgentGUI ---"
export DISPLAY=:0 && hexagent-gui
