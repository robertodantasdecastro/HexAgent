#!/bin/bash
# HexAgentGUI - File Management System Installation Script
# Script de Instalação do Sistema de Gerenciamento de Arquivos
#
# This script sets up the file management system and validates installation
# Este script configura o sistema de gerenciamento de arquivos e valida a instalação

set -e  # Exit on error

echo "🚀 HexAgentGUI File Management - Installation"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

# 1. Check Python environment
info "Checking Python environment..."
if ! command -v python3 &> /dev/null; then
    error "Python 3 not found. Please install Python 3.8+"
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
success "Python $PYTHON_VERSION found"

# 2. Check Node.js environment
info "Checking Node.js environment..."
if ! command -v npm &> /dev/null; then
    error "npm not found. Please install Node.js 16+"
fi

NODE_VERSION=$(node --version)
success "Node $NODE_VERSION found"

# 3. Create directory structure
info "Creating directory structure..."
HEXAGENT_DIR="$HOME/.hexagent-gui"

mkdir -p "$HEXAGENT_DIR"/{downloads,projects,tmp/files,backups,logs/{terminal,inference,system,sessions}}

success "Created $HEXAGENT_DIR structure"

# 4. Install Python dependencies (if any)
info "Checking Python dependencies..."
BACKEND_DIR="$(dirname "$0")/../backend"

if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    python3 -m pip install -q -r "$BACKEND_DIR/requirements.txt" || warn "Some dependencies failed to install"
    success "Python dependencies installed"
else
    warn "No requirements.txt found"
fi

# 5. Build frontend
info "Building frontend..."
npm run build > /tmp/hexagent_build.log 2>&1 || {
    error "Frontend build failed. Check /tmp/hexagent_build.log"
}
success "Frontend built successfully"

# 6. Test backend imports
info "Testing backend imports..."
python3 -c "
import sys
sys.path.insert(0, '$BACKEND_DIR')
from managers.file_manager import FileManager
from managers.project_manager import ProjectManager
from utils.path_extractor import PathExtractor
print('All imports successful')
" || error "Backend import test failed"

success "Backend imports validated"

# 7. Test API endpoints (if backend is running)
info "Checking backend status..."
if curl -s http://localhost:5000/status > /dev/null 2>&1; then
    success "Backend is running"
    
    # Quick API test
    info "Testing API endpoints..."
    RESPONSE=$(curl -s http://localhost:5000/project/list)
    if echo "$RESPONSE" | grep -q "projects"; then
        success "API endpoints responding"
    else
        warn "API responded but format unexpected"
    fi
else
    warn "Backend not running. Start with: cd backend && python server.py"
fi

# 8. Validate file structure
info "Validating file structure..."
REQUIRED_FILES=(
    "backend/managers/__init__.py"
    "backend/managers/file_manager.py"
    "backend/managers/project_manager.py"
    "backend/utils/path_extractor.py"
    "src/components/FileTreeView.jsx"
    "src/components/OverwriteConfirmDialog.jsx"
    "src/components/WorkspacePanel.jsx"
    "tests/test_file_management.sh"
    "docs/FILE_MANAGEMENT.md"
)

MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$(dirname "$0")/../$file" ]; then
        warn "Missing: $file"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    success "All required files present"
else
    warn "$MISSING files missing"
fi

# 9. Summary
echo ""
echo "=============================================="
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo "=============================================="
echo ""
echo "Directory Structure:"
echo "  $HEXAGENT_DIR/"
echo "  ├── downloads/     (default save location)"
echo "  ├── projects/      (multi-file projects)"
echo "  ├── tmp/files/     (temporary files)"
echo "  ├── backups/       (automatic backups)"
echo "  └── logs/          (debug logs)"
echo ""
echo "Next Steps:"
echo "  1. Start backend:  cd backend && python server.py"
echo "  2. Start frontend: npm run dev (or already built)"
echo "  3. Run tests:      ./tests/test_file_management.sh"
echo "  4. Read docs:      docs/FILE_MANAGEMENT.md"
echo ""
echo "File Management Features:"
echo "  ✓ Intelligent path resolution"
echo "  ✓ Safe overwrites with diff preview"
echo "  ✓ Automatic backups"
echo "  ✓ Project management"
echo "  ✓ Workspace UI"
echo ""
echo "🎉 Ready to use!"
