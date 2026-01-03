#!/bin/bash

###############################################################################
# HexAgentGUI - Intelligent Installer Script (v2.0)
# Author: Roberto Dantas de Castro
#
# Features:
# - Arch Detection (Strict arm64 support)
# - Robust Cleanup of OLD installations/symlinks (Fixes "File not found" errors)
# - Persistent Installation to ~/.hexagent-gui/app
# - Universal Symlinking (Ensures PATH picks up the new version)
# - Desktop Integration
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths
INSTALL_DIR="$HOME/.hexagent-gui/app"
CONFIG_DIR="$HOME/.hexagent-gui/config"
LOCAL_BIN="$HOME/.local/bin"
DESKTOP_DIR=$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════"
    echo "   🛡️  HexAgentGUI Installer v2.0"
    echo "       Fixing Paths & Permissions..."
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

detect_system() {
    print_info "Detecting system..."
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    raw_arch=$(uname -m)
    case "$raw_arch" in
        aarch64|arm64) ARCH="arm64" ;;
        x86_64|amd64)  ARCH="x64" ;;
        *) print_error "Unsupported architecture: $raw_arch"; exit 1 ;;
    esac
    print_success "Target: $OS ($ARCH)"
}

cleanup_old_versions() {
    print_info "Removing old/broken installations..."
    
    # 1. Remove old wrapper script that causes the "line 3" error
    if [ -f "$LOCAL_BIN/hexagent-gui" ]; then
        rm -f "$LOCAL_BIN/hexagent-gui"
        print_success "Removed old wrapper in ~/.local/bin/"
    fi
    
    # 2. Remove old system symlinks if possible
    if [ -f "/usr/bin/hexagent-gui" ]; then
        if sudo -n true 2>/dev/null; then
            sudo rm -f "/usr/bin/hexagent-gui"
            print_success "Removed old symlink in /usr/bin/"
        fi
    fi
    
    # 3. Clean Project folder desktop files that might be confusing
    rm -f "HexAgentGUI.desktop" "hexagent.desktop"
    
    # 4. Clean Build Artifacts
    rm -rf dist release
}

check_deps() {
    for cmd in node npm python3; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is required."; exit 1
        fi
    done
}

configure_theme() {
    mkdir -p "$CONFIG_DIR"
    THEME="dark"
    if grep -q "Kali" /etc/os-release 2>/dev/null; then THEME="kali-dark"; fi
    if [ "$OS" = "darwin" ]; then THEME="macos-dark"; fi
    
    if [ ! -f "$CONFIG_DIR/config.json" ]; then
        echo "{\"ui\": {\"theme\": \"$THEME\"}}" > "$CONFIG_DIR/config.json"
    fi
}

setup_configs() {
    export HEXAGENT_SETUP_ONLY=1
    python3 backend/server.py > /dev/null 2>&1 || true
}

build_app() {
    print_info "Building optimized binary for $ARCH..."
    npm install
    npm run build
    npx electron-builder --linux --$ARCH --dir
    
    SRC_DIR="dist/linux-$ARCH-unpacked"
    if [ ! -d "$SRC_DIR" ]; then 
        SRC_DIR="dist/linux-unpacked"
        if [ ! -d "$SRC_DIR" ]; then print_error "Build failed."; exit 1; fi
    fi
    
    print_info "Installing to persistent storage..."
    rm -rf "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
    cp -r "$SRC_DIR/"* "$INSTALL_DIR/"
    print_success "Installed to $INSTALL_DIR"
}

create_links() {
    print_info "Updating System Links..."
    BINARY="$INSTALL_DIR/hexagent-gui"
    
    # Always install to ~/.local/bin (Precedence + User Access)
    mkdir -p "$LOCAL_BIN"
    ln -sf "$BINARY" "$LOCAL_BIN/hexagent-gui"
    print_success "Linked: $LOCAL_BIN/hexagent-gui"
    
    # Optional /usr/bin if sudo cached
    if sudo -n true 2>/dev/null; then
        sudo ln -sf "$BINARY" /usr/bin/hexagent-gui
        print_success "Linked: /usr/bin/hexagent-gui"
    fi
}

create_shortcuts() {
    print_info "Creating Desktop Shortcut..."
    APP_FILE="$HOME/.local/share/applications/hexagent-gui.desktop"
    DESKTOP_FILE="$DESKTOP_DIR/hexagent-gui.desktop"

    # Aggressive cleanup of old shortcuts
    rm -f "$APP_FILE"
    rm -f "$DESKTOP_DIR/HexAgentGUI.desktop" 
    rm -f "$DESKTOP_DIR/hexagent.desktop"
    rm -f "$DESKTOP_DIR/hexagent-gui.desktop"

    ICON="$INSTALL_DIR/resources/public/logo.png"
    if [ ! -f "$ICON" ]; then ICON="$(pwd)/public/logo.png"; fi
    
    cat > "$APP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=HexAgentGUI
Comment=Autonomous AI Security Agent
Exec=$INSTALL_DIR/hexagent-gui
Icon=$ICON
Terminal=false
Categories=Development;Security;
EOF
    chmod +x "$APP_FILE"
    
    # Put on Desktop
    if [ -d "$DESKTOP_DIR" ]; then
        cp "$APP_FILE" "$DESKTOP_DIR/"
        chmod +x "$DESKTOP_DIR/hexagent-gui.desktop"
        print_success "Shortcut on Desktop: $DESKTOP_DIR"
    fi
}

main() {
    print_header
    detect_system
    check_deps
    cleanup_old_versions # CRITICAL STEP
    configure_theme
    setup_configs
    build_app
    create_links
    create_shortcuts
    
    echo ""
    echo -e "${GREEN}Fix Complete!${NC}"
    echo "You can now run 'hexagent-gui' from any terminal."
}

main
