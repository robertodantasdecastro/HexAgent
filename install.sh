#!/bin/bash

###############################################################################
# HexAgentGUI - Intelligent Installer Script (v3.0)
# HexAgentGUI - Script Instalador Inteligente (v3.0)
#
# Author / Autor: Roberto Dantas de Castro
#
# Features / Recursos:
# - Arch Detection (Strict arm64 support) / Detecção de Arquitetura
# - Robust Cleanup of OLD installations / Limpeza Robusta de instalações antigas
# - Persistent Installation to ~/.hexagent-gui/app / Instalação Persistente
# - Universal Symlinking / Criação de Links Simbólicos
# - Desktop Integration / Integração com Desktop
# - NEW: Temporary File Analysis & Cleanup / NOVO: Análise e Limpeza de Arquivos Temporários
###############################################################################

set -e

# Colors / Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Paths / Caminhos
INSTALL_DIR="$HOME/.hexagent-gui/app"
CONFIG_DIR="$HOME/.hexagent-gui/config"
LOCAL_BIN="$HOME/.local/bin"
DESKTOP_DIR=$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")

print_logo() {
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo ""
# Try to display logo using jp2a / Tenta exibir logo usando jp2a
    cat logo.txt
    # Display HEXAGENT text (smaller, proportional) / Exibe texto HEXAGENT (menor, proporcional)
    echo -e "${CYAN}"
    cat << 'EOF'
       _  _ ___ __  __   _   ___ ___ _  _ _____ 
      | || | __|\ \/ /  /_\ / __| __| \| |_   _|
      | __ | _|  >  <  / _ \ (_ | _|| .` | | |  
      |_||_|___|/_/\_\/_/ \_\___|___|_|\_| |_|  
EOF
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
echo ""
}

print_header() {
    clear
    echo ""
    echo -e "${NC}"
    echo -e "           ${GREEN}🤖 Intelligent Installer ${CYAN}v3.0${NC}"
    echo -e "          ${YELLOW}═══════════════════════════════${NC}"
    echo -e "           ${BLUE}AI Security Agent${NC}"
    echo ""
    print_logo;
    echo ""
}

print_info() { echo -e "${YELLOW}ℹ  $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${MAGENTA}⚠  $1${NC}"; }

# Developer information / Informações do desenvolvedor
aboutdev() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}            👨‍💻 Developer Information / Desenvolvedor${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Name / Nome:${NC}       Roberto Dantas de Castro"
    echo -e "${YELLOW}Email:${NC}             robertodantasdecastro@gmail.com"
    echo -e "${YELLOW}GitHub Project:${NC}    https://github.com/robertodantasdecastro/HexAgent"
    echo ""
    echo -e "${CYAN}───────────────────────────────────────────────────────${NC}"
    echo -e "${GREEN}        💰 Support the Project / Apoie o Projeto${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────${NC}"
    echo ""
    echo -e "${YELLOW}PIX (Brasil):${NC}      robertodantasdecastro@gmail.com"
    echo -e "${YELLOW}Bitcoin (BTC):${NC}     bc1qekh060wjfgspgt32vclmu3fcfx9fr7jh0akuwu"
    echo ""
}

# System Detection / Detecção de Sistema
detect_system() {
    print_info "Detecting system / Detectando sistema..."
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    raw_arch=$(uname -m)
    case "$raw_arch" in
        aarch64|arm64) ARCH="arm64" ;;
        x86_64|amd64)  ARCH="x64" ;;
        *) print_error "Unsupported architecture / Arquitetura não suportada: $raw_arch"; exit 1 ;;
    esac
    print_success "Target / Alvo: $OS ($ARCH)"
}

# Cleanup OLD versions / Limpeza de versões antigas
cleanup_old_versions() {
    print_info "Removing old/broken installations / Removendo instalações antigas/quebradas..."
    
    # Remove old wrapper script / Remove script wrapper antigo
    if [ -f "$LOCAL_BIN/hexagent-gui" ]; then
        rm -f "$LOCAL_BIN/hexagent-gui"
        print_success "Removed old wrapper in ~/.local/bin/ / Removido wrapper antigo"
    fi
    
    # Remove old system symlinks if possible / Remove symlinks antigos se possível
    if [ -f "/usr/bin/hexagent-gui" ]; then
        if sudo -n true 2>/dev/null; then
            sudo rm -f "/usr/bin/hexagent-gui"
            print_success "Removed old symlink in /usr/bin/ / Removido symlink antigo"
        fi
    fi
    
    # Clean project desktop files / Limpa desktop files do projeto
    rm -f "HexAgentGUI.desktop" "hexagent.desktop"
}

# Check dependencies / Verifica dependências
check_deps() {
    print_info "Checking dependencies / Verificando dependências..."
    for cmd in node npm python3; do
        if ! command -v $cmd &> /dev/null; then
            print_error "$cmd is required / $cmd é necessário."; exit 1
        fi
    done
    print_success "All dependencies found / Todas dependências encontradas"
}

# Configure theme based on OS / Configura tema baseado no SO
configure_theme() {
    mkdir -p "$CONFIG_DIR"
    THEME="dark"
    if grep -q "Kali" /etc/os-release 2>/dev/null; then THEME="kali-dark"; fi
    if [ "$OS" = "darwin" ]; then THEME="macos-dark"; fi
    
    if [ ! -f "$CONFIG_DIR/config.json" ]; then
        echo "{\"ui\": {\"theme\": \"$THEME\"}}" > "$CONFIG_DIR/config.json"
    fi
}

# Setup user configuration / Configura configuração de usuário
setup_user_config() {
    echo ""
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
    print_info "Setting up user configuration / Configurando usuário..."
    
    # Create config directories / Cria diretórios de configuração
    USER_CONFIG_DIR="$HOME/.hexagent-gui"
    mkdir -p "$USER_CONFIG_DIR/sessions"
    mkdir -p "$USER_CONFIG_DIR/logs"
    
    # 1. Install system-config.json
    if [ ! -f "$USER_CONFIG_DIR/system-config.json" ]; then
        if [ -f "config_templates/system-config.json" ]; then
            cp "config_templates/system-config.json" "$USER_CONFIG_DIR/system-config.json"
            print_success "Created default system-config.json"
        fi
    fi

    # 2. Install config.json (AI)
    if [ ! -f "$USER_CONFIG_DIR/config.json" ]; then
        if [ -f "config_templates/config.json" ]; then
             cp "config_templates/config.json" "$USER_CONFIG_DIR/config.json"
             print_success "Created default config.json (AI)"
        fi
    fi

    # 3. Cleanup Legacy 'config/' folder if it exists
    # Limpeza da pasta 'config/' legada se existir
    if [ -d "$USER_CONFIG_DIR/config" ]; then
        print_info "Migrating legacy config folder..."
        # If specific valuable jsons exist, we might want to tell user, but for now we archive or remove
        # We will separate AI keys if found, otherwise just warn
        if [ -f "$USER_CONFIG_DIR/config/config.json" ] && [ ! -f "$USER_CONFIG_DIR/config.json" ]; then
             cp "$USER_CONFIG_DIR/config/config.json" "$USER_CONFIG_DIR/config.json"
             print_success "Migrated legacy config.json"
        fi
        
        # Rename legacy folder to backup
        mv "$USER_CONFIG_DIR/config" "$USER_CONFIG_DIR/config_legacy_backup_$(date +%s)"
        print_success "Backed up legacy config folder"
    fi
    
    print_success "User configuration ready / Configuração do usuário pronta"
    
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
    echo ""
}

# Setup backend configs / Configura backend
setup_configs() {
    print_info "Initializing backend configs / Inicializando configs do backend..."
    export HEXAGENT_SETUP_ONLY=1
    
    # Ensure venv exists and deps are installed / Garante que venv existe e deps instaladas
    setup_python_env
    
    # Run setup with venv python / Executa setup com python do venv
    ./venv/bin/python3 backend/app.py > /dev/null 2>&1 || true
}

# Setup Python Environment / Configura Ambiente Python
setup_python_env() {
    print_info "Setting up Python environment / Configurando ambiente Python..."
    
    if [ ! -d "venv" ]; then
        print_info "Creating virtual environment (venv)..."
        python3 -m venv venv
    fi
    
    print_info "Installing backend dependencies..."
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install -r backend/requirements.txt
    print_success "Python environment ready / Ambiente Python pronto"
}

# Build application / Compila aplicação
build_app() {
    print_info "Building standalone application for $ARCH / Compilando aplicação standalone..."
    print_info "Note: App is now fully self-contained / App é agora totalmente autônomo"
    
    # Install dependencies efficiently / Instala dependências eficientemente
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules/.package-lock.json ]; then
        print_info "Installing dependencies (including test framework) / Instalando dependências (incluindo framework de testes)..."
        npm install --prefer-offline --no-audit
        print_success "Dependencies installed / Dependências instaladas"
    fi
    
    # Build frontend / Compila frontend
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}Building frontend (with relative paths for Electron) / Compilando frontend${NC}"
    npm run build
    echo -e "${BLUE}══════════════════════════════════════════════════════${NC}"
    
    # Build electron package / Compila pacote electron
    print_info "Packaging Electron app (standalone mode) / Empacotando app Electron..."
    npx electron-builder --linux --$ARCH --dir
    
    # Find build output / Encontra saída do build
    SRC_DIR="dist/linux-$ARCH-unpacked"
    if [ ! -d "$SRC_DIR" ]; then 
        SRC_DIR="dist/linux-unpacked"
        if [ ! -d "$SRC_DIR" ]; then 
            print_error "Build failed / Build falhou."; exit 1
        fi
    fi
    
    # Install to persistent storage / Instala em armazenamento persistente
    print_info "Installing standalone app to persistent storage / Instalando..."
    rm -rf "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR"
    cp -r "$SRC_DIR/"* "$INSTALL_DIR/"
    print_success "Installed to / Instalado em: $INSTALL_DIR"
    print_success "App is STANDALONE (no external dependencies) / App é AUTÔNOMO"
}

# Create system links / Cria links do sistema
create_links() {
    print_info "Creating system links / Criando links do sistema..."
    BINARY="$INSTALL_DIR/hexagent-gui"
    
    # Always install to ~/.local/bin / Sempre instala em ~/.local/bin
    mkdir -p "$LOCAL_BIN"
    ln -sf "$BINARY" "$LOCAL_BIN/hexagent-gui"
    print_success "Linked / Linkado: $LOCAL_BIN/hexagent-gui"
    
    # Optional /usr/bin if sudo cached / Opcional /usr/bin se sudo disponível
    if sudo -n true 2>/dev/null; then
        sudo ln -sf "$BINARY" /usr/bin/hexagent-gui
        print_success "Linked / Linkado: /usr/bin/hexagent-gui"
    fi
}

# Create desktop shortcuts / Cria atalhos do desktop
create_shortcuts() {
    print_info "Creating desktop shortcuts / Criando atalhos..."
    APP_FILE="$HOME/.local/share/applications/hexagent-gui.desktop"
    DESKTOP_FILE="$DESKTOP_DIR/hexagent-gui.desktop"

    # Cleanup old shortcuts / Limpa atalhos antigos
    rm -f "$APP_FILE"
    rm -f "$DESKTOP_DIR/HexAgentGUI.desktop" 
    rm -f "$DESKTOP_DIR/hexagent.desktop"
    rm -f "$DESKTOP_DIR/hexagent-gui.desktop"

    # Find icon / Encontra ícone
    ICON="$INSTALL_DIR/resources/public/logo.png"
    if [ ! -f "$ICON" ]; then ICON="$(pwd)/public/logo.png"; fi
    
    # Create desktop entry / Cria entrada do desktop
    cat > "$APP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=HexAgentGUI
Comment=Autonomous AI Security Agent
Exec=env DISPLAY=:0 $INSTALL_DIR/hexagent-gui
Icon=$ICON
Terminal=false
Categories=Development;Security;
EOF
    chmod +x "$APP_FILE"
    
    # Put on Desktop / Coloca no Desktop
    if [ -d "$DESKTOP_DIR" ]; then
        cp "$APP_FILE" "$DESKTOP_DIR/"
        chmod +x "$DESKTOP_DIR/hexagent-gui.desktop"
        print_success "Desktop shortcut created / Atalho criado"
    fi
}

# NEW: Analyze temporary and unnecessary files / NOVO: Analisa arquivos temporários e desnecessários
analyze_temp_files() {
    echo ""
    echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}   📊 Temporary Files Analysis / Análise de Temporários${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    declare -A temp_files
    total_size=0
    
    # Analyze dist/ - Build output (can be removed after install)
    # Analisa dist/ - Saída do build (pode ser removido após instalação)
    if [ -d "dist" ]; then
        size=$(du -sh dist 2>/dev/null | awk '{print $1}')
        temp_files["dist"]="Build output (already installed to ~/.hexagent-gui) | Saída do build (já instalado)|$size|yes"
    fi
    
    # Analyze release/ - Electron packager temp
    # Analisa release/ - Temp do electron packager
    if [ -d "release" ]; then
        size=$(du -sh release 2>/dev/null | awk '{print $1}')
        temp_files["release"]="Electron temp files | Arquivos temp do Electron|$size|yes"
    fi
    
    # Analyze node_modules/ - Dependencies (needed for dev, not for use)
    # Analisa node_modules/ - Dependências (necessário para dev, não para uso)
    if [ -d "node_modules" ]; then
        size=$(du -sh node_modules 2>/dev/null | awk '{print $1}')
        temp_files["node_modules"]="NPM dependencies (only needed for development) | Dependências NPM (só necessário para desenvolvimento)|$size|maybe"
    fi
    
    # Analyze Log_Console/ - Old logs
    # Analisa Log_Console/ - Logs antigos
    if [ -d "Log_Console" ]; then
        log_count=$(find Log_Console -type f 2>/dev/null | wc -l)
        if [ $log_count -gt 0 ]; then
            size=$(du -sh Log_Console 2>/dev/null | awk '{print $1}')
            temp_files["Log_Console"]="Old console logs ($log_count files) | Logs antigos do console|$size|yes"
        fi
    fi
    
    # Analyze .electron/ cache
    # Analisa cache do .electron
    if [ -d ".electron" ]; then
        size=$(du -sh .electron 2>/dev/null | awk '{print $1}')
        temp_files[".electron"]="Electron cache | Cache do Electron|$size|yes"
    fi
    
    # Analyze npm cache in project
    # Analisa cache do npm no projeto
    if [ -d ".npm" ]; then
        size=$(du -sh .npm 2>/dev/null | awk '{print $1}')
        temp_files[".npm"]="NPM cache | Cache NPM|$size|yes"
    fi
    
    # Display results / Exibe resultados
    if [ ${#temp_files[@]} -eq 0 ]; then
        print_success "No temporary files found / Nenhum arquivo temporário encontrado! ✨"
        return
    fi
    
    echo -e "${YELLOW}Found temporary/unnecessary files: / Encontrados arquivos temporários:${NC}"
    echo ""
    
    local idx=1
    for path in "${!temp_files[@]}"; do
        IFS='|' read -r desc size recommend <<< "${temp_files[$path]}"
        
        if [ "$recommend" = "yes" ]; then
            status="${GREEN}[SAFE TO DELETE / SEGURO DELETAR]${NC}"
        else
            status="${YELLOW}[KEEP FOR DEV / MANTER P/ DEV]${NC}"
        fi
        
        echo -e "  ${BLUE}$idx. $path${NC} ($size)"
        echo -e "     $desc"
        echo -e "     $status"
        echo ""
        ((idx++))
    done
    
    # Interactive cleanup prompt with auto-timeout / Prompt interativo com timeout automático
    echo -e "${CYAN}Would you like to clean up these files? / Deseja limpar estes arquivos?${NC}"
    echo -e "${YELLOW}Options / Opções:${NC}"
    echo "  1) Clean all safe files (dist/, release/, logs, caches) / Limpar todos arquivos seguros"
    echo "  2) Clean everything including node_modules (free max space) / Limpar tudo incluindo node_modules"
    echo -e "  -> 3) Keep all files (good for development) ${GREEN}[DEFAULT]${NC} / Manter todos ${GREEN}[PADRÃO]${NC}"
    echo ""
    
    # Countdown timer / Timer de contagem regressiva
    echo -e "${YELLOW}Auto-selecting option 3 in / Auto-selecionando opção 3 em:${NC}"
    choice=""
    for i in {15..1}; do
        echo -ne "\r⏱️  ${RED}$i ⏱️ ${CYAN}seconds... / segundos...${NC} (Press 1-3 to choose / Pressione 1-3 para escolher)  "
        read -t 1 -n 1 choice && break
    done
    echo "" # New line after countdown / Nova linha após contagem
    
    # Default to option 3 if no input / Padrão para opção 3 se sem entrada
    if [ -z "$choice" ]; then
        choice="3"
        echo -e "${GREEN}⏱️  Auto-selected option 3 (Keep files) / Auto-selecionado opção 3 (Manter arquivos)${NC}"
    fi
    
    case $choice in

        1)
            print_info "Cleaning safe temporary files / Limpando arquivos temporários seguros..."
            rm -rf dist release Log_Console .electron .npm 2>/dev/null || true
            print_success "Safe cleanup complete / Limpeza segura concluída!"
            ;;
        2)
            print_info "Cleaning ALL temporary files / Limpando TODOS arquivos temporários..."
            rm -rf dist release Log_Console .electron .npm node_modules 2>/dev/null || true
            print_success "Full cleanup complete / Limpeza completa concluída!"
            print_warning "Run 'npm install' before next build / Execute 'npm install' antes do próximo build"
            ;;
        3)
            print_info "Keeping all files / Mantendo todos arquivos"
            ;;
        *)
            print_warning "Invalid choice, keeping all files / Escolha inválida, mantendo arquivos"
            ;;
    esac
}

# Main installation flow / Fluxo principal de instalação
main() {
    print_header
    detect_system
    check_deps
    cleanup_old_versions
    configure_theme
    setup_user_config
    setup_configs
    build_app
    create_links
    create_shortcuts
    
    # NEW: Analyze and clean temporary files / NOVO: Analisa e limpa temporários
    analyze_temp_files
    
    # Show developer information / Mostra informações do desenvolvedor
    aboutdev
    
    echo ""
    echo ""
    print_logo
    echo ""
    echo -e "${BLUE}      ════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}   ✅ Installation Complete! / Instalação Completa!${NC}"
    echo -e "${BLUE}      ════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${CYAN}   Run / Execute: ${YELLOW}hexagent-gui${NC}"
    echo ""
}

main
