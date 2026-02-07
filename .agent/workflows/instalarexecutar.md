---
description: Install and launch HexAgentGUI on virtual machine
---

# /exec Workflow — Install & Launch HexAgentGUI

Execute the complete installation and launch sequence for HexAgentGUI on the virtual machine.

## Steps

1. **Run installation script**
```bash
bash install.sh
```

// turbo
2. **Launch application with DISPLAY export**
```bash
export DISPLAY=:0 && hexagent-gui
```

## Notes

- `export DISPLAY=:0` is required for X11 forwarding on virtual machines
- Application will launch in GUI mode after installation completes
- Installation includes: Python venv, frontend build, Electron packaging, system links, desktop shortcuts

## Expected Output

- Installation complete message
- Application window opens
- Backend server starts on `http://localhost:5000`
