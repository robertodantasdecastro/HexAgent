#!/bin/bash

###############################################################################
# HexAgentGUI - Automated Installation Script
# Author: Roberto Dantas de Castro (robertodantasdecastro@gmail.com)
# GitHub: https://github.com/robertodantasdecastro/HexAgent
# 
# This script automates the installation of HexAgentGUI on Linux and macOS
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════"
    echo "   🛡️  HexAgentGUI Installation Script"
    echo "   Developer: Roberto Dantas de Castro"
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Detect OS and Architecture
detect_system() {
    print_info "Detecting system..."
    
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case "$ARCH" in
        aarch64|arm64) ARCH="arm64" ;;
        x86_64|amd64)  ARCH="x64" ;;
        *) print_error "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    
    print_success "OS: $OS, Architecture: $ARCH"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js v18+"
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 not found. Please install Python 3.9+"
        exit 1
    fi
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm not found"
        exit 1
    fi
    print_success "npm found"
    
    # Check if in project directory
    if [ ! -f "package.json" ]; then
        print_error "Not in HexAgentGUI directory. Please cd to project root."
        exit 1
    fi
    print_success "Project directory verified"
}

# Install Node dependencies
install_node_deps() {
    print_info "Installing Node.js dependencies..."
    npm install
    print_success "Node dependencies installed"
}

# Setup Python environment
setup_python_env() {
    print_info "Setting up Python virtual environment..."
    
    # Create venv if doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_info "Virtual environment already exists"
    fi
    
    # Activate and install dependencies
    source venv/bin/activate
    
    print_info "Installing Python dependencies..."
    pip install --upgrade pip
    
    if [ -f "backend/requirements.txt" ]; then
        pip install -r backend/requirements.txt
        print_success "Python dependencies installed"
    else
        print_error "backend/requirements.txt not found"
        exit 1
    fi
}

# Initialize Configuration Templates
setup_configs() {
    print_info "Initializing configuration templates..."
    export HEXAGENT_SETUP_ONLY=1
    if command -v python3 &> /dev/null; then
        python3 backend/server.py
        print_success "Config templates created/updated in ~/.hexagent-gui/"
    else
        print_error "Python3 not found (unexpected), skipping config init."
    fi
}

# Build application
build_app() {
    print_info "Building HexAgentGUI..."
    npm run electron:build
    print_success "Application built successfully"
}

# Create symlink for global access
install_globally() {
    print_info "Installing globally..."
    
    BUILD_DIR=""
    if [ "$OS" = "linux" ]; then
        BUILD_DIR="dist/linux-$ARCH-unpacked/hexagent-gui"
    elif [ "$OS" = "darwin" ]; then
        BUILD_DIR="dist/mac-$ARCH/HexAgentGUI.app/Contents/MacOS/HexAgentGUI"
    fi
    
    if [ -f "$BUILD_DIR" ]; then
        sudo ln -sf "$(pwd)/$BUILD_DIR" /usr/local/bin/hexagent-gui
        print_success "Added hexagent-gui to PATH"
    else
        print_error "Build output not found: $BUILD_DIR"
        exit 1
    fi
}

# Create desktop shortcut (Linux only)
create_desktop_shortcut() {
    if [ "$OS" != "linux" ]; then
        return
    fi
    
    print_info "Creating desktop shortcut..."
    
    DESKTOP_FILE="$HOME/.local/share/applications/hexagent-gui.desktop"
    ICON_PATH="$(pwd)/icon.png"
    EXEC_PATH="/usr/local/bin/hexagent-gui"
    
    mkdir -p "$HOME/.local/share/applications"
    
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=HexAgentGUI
Comment=Autonomous AI-Powered Cybersecurity Agent
Exec=$EXEC_PATH
Icon=$ICON_PATH
Terminal=false
Categories=Security;
Keywords=security;ai;agent;cybersecurity;
EOF
    
    chmod +x "$DESKTOP_FILE"
    print_success "Desktop shortcut created"
}

# Final instructions
print_final_instructions() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════"
    echo "   ✓ Installation Complete!"
    echo "═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Configure API key:"
    echo "   echo 'YOUR_OPENROUTER_KEY' > ~/iatools/HexAgent/HexSecGPT-main/.HexSec"
    echo ""
    echo "2. Run HexAgentGUI:"
    echo "   hexagent-gui"
    echo ""
    echo -e "${YELLOW}Documentation:${NC}"
    echo "   - User Manual: cat USER_MANUAL.md"
    echo "   - Installation Guide: cat INSTALL.md"
    echo ""
    echo -e "${BLUE}Developer: Roberto Dantas de Castro"
    echo "Email: robertodantasdecastro@gmail.com"
    echo "GitHub: github.com/robertodantasdecastro/HexAgent${NC}"
    echo ""
}

# Main installation flow
main() {
    print_header
    
    detect_system
    check_prerequisites
    install_node_deps
    setup_python_env
    setup_configs
    build_app
    install_globally
    create_desktop_shortcut
    
    print_final_instructions
}

# Run main
main
