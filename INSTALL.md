# 📦 Installation Guide / Guia de Instalação

[English](#english-installation) | [Português](#instalação-em-português)

---

## English Installation

### System Requirements

- **Operating System**: Linux (Debian/Ubuntu/Kali) or macOS
- **Architecture**: ARM64 or x64/AMD64
- **Node.js**: v18 or higher
- **Python**: 3.9 or higher
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk Space**: 2GB free space

### Prerequisites

#### Ubuntu/Debian/Kali Linux

```bash
# Update package list
sudo apt update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv

# Install build essentials
sudo apt install -y build-essential git wget
```

#### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Python
brew install python@3.9
```

### Method 1: Automated Installation (Recommended)

```bash
# Clone repository
git clone https://github.com/robertodantasdecastro/HexAgent.git
cd HexAgent/HexAgentGUI

# Make installer executable
chmod +x install.sh

# Run installer
./install.sh
```

The installer will:
1. Detect your OS and architecture
2. Install all dependencies
3. Setup Python virtual environment
4. Build the application
5. Create desktop shortcut (Linux only)
6. Add `hexagent-gui` command to PATH

### Method 2: Manual Installation

#### Step 1: Clone Repository

```bash
git clone https://github.com/robertodantasdecastro/HexAgent.git
cd HexAgent/HexAgentGUI
```

#### Step 2: Install Node Dependencies

```bash
npm install
```

#### Step 3: Setup Python Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS

# Install Python dependencies
pip install -r backend/requirements.txt
```

#### Step 4: Setup HexAgent Dependencies

```bash
# Copy HexAgent and HexStrike to project
cp -r ../HexAgent backend/
cp -r ../hexstrike-ai backend/
cp -r ../HexSecGPT-main backend/
```

#### Step 5: Build Application

```bash
# Build frontend and package Electron app
npm run electron:build
```

#### Step 6: Install Globally (Optional)

```bash
# Create symlink
sudo ln -s $(pwd)/dist/linux-arm64-unpacked/hexagent-gui /usr/local/bin/hexagent-gui

# Or for macOS
sudo ln -s $(pwd)/dist/mac-arm64/HexAgentGUI.app/Contents/MacOS/HexAgentGUI /usr/local/bin/hexagent-gui
```

### API Keys Configuration

HexAgentGUI requires an API key for the AI model (OpenRouter).

1. Get your API key from [OpenRouter](https://openrouter.ai/)
2. Create API key file:

```bash
# Create .HexSec file in HexSecGPT-main directory
echo "YOUR_API_KEY_HERE" > ~/iatools/HexAgent/HexSecGPT-main/.HexSec

# Or use environment variable
export OPENROUTER_API_KEY="YOUR_API_KEY_HERE"
```

### Running the Application

```bash
# If installed globally
hexagent-gui

# Or from build directory
export DISPLAY=:0  # Linux only
./dist/linux-arm64-unpacked/hexagent-gui
```

### Troubleshooting

#### Application doesn't start

```bash
# Check if backend Python dependencies are installed
source venv/bin/activate
pip list | grep flask

# Reinstall dependencies if needed
pip install -r backend/requirements.txt
```

#### "Brain not initialized" error

- Ensure `.HexSec` file exists with valid API key
- Check backend logs: `cat ~/.hexagent/backend.log`

#### HexStrike not starting

```bash
# Manually start HexStrike server
cd backend/hexstrike-ai
python hexstrike_server.py

# Check if port 8888 is available
netstat -tuln | grep 8888
```

#### Permission denied on Linux

```bash
# Make executable
chmod +x dist/linux-arm64-unpacked/hexagent-gui

# If still issues, try running with sudo for first launch only
sudo dist/linux-arm64-unpacked/hexagent-gui
```

---

## Instalação em Português

### Requisitos do Sistema

- **Sistema Operacional**: Linux (Debian/Ubuntu/Kali) ou macOS
- **Arquitetura**: ARM64 ou x64/AMD64
- **Node.js**: v18 ou superior
- **Python**: 3.9 ou superior
- **Memória**: 4GB RAM mínimo (8GB recomendado)
- **Espaço em Disco**: 2GB livres

### Pré-requisitos

#### Ubuntu/Debian/Kali Linux

```bash
# Atualizar lista de pacotes
sudo apt update

# Instalar Node.js e npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Python 3 e pip
sudo apt install -y python3 python3-pip python3-venv

# Instalar ferramentas de build
sudo apt install -y build-essential git wget
```

#### macOS

```bash
# Instalar Homebrew (se não instalado)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node

# Instalar Python
brew install python@3.9
```

### Método 1: Instalação Automatizada (Recomendado)

```bash
# Clonar repositório
git clone https://github.com/robertodantasdecastro/HexAgent.git
cd HexAgent/HexAgentGUI

# Tornar instalador executável
chmod +x install.sh

# Executar instalador
./install.sh
```

O instalador irá:
1. Detectar seu SO e arquitetura
2. Instalar todas as dependências
3. Configurar ambiente virtual Python
4. Construir a aplicação
5. Criar atalho na área de trabalho (apenas Linux)
6. Adicionar comando `hexagent-gui` ao PATH

### Método 2: Instalação Manual

#### Passo 1: Clonar Repositório

```bash
git clone https://github.com/robertodantasdecastro/HexAgent.git
cd HexAgent/HexAgentGUI
```

#### Passo 2: Instalar Dependências Node

```bash
npm install
```

#### Passo 3: Configurar Ambiente Python

```bash
# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate  # Linux/macOS

# Instalar dependências Python
pip install -r backend/requirements.txt
```

#### Passo 4: Configurar Dependências HexAgent

```bash
# Copiar HexAgent e HexStrike para o projeto
cp -r ../HexAgent backend/
cp -r ../hexstrike-ai backend/
cp -r ../HexSecGPT-main backend/
```

#### Passo 5: Construir Aplicação

```bash
# Construir frontend e empacotar app Electron
npm run electron:build
```

#### Passo 6: Instalar Globalmente (Opcional)

```bash
# Criar link simbólico
sudo ln -s $(pwd)/dist/linux-arm64-unpacked/hexagent-gui /usr/local/bin/hexagent-gui

# Ou para macOS
sudo ln -s $(pwd)/dist/mac-arm64/HexAgentGUI.app/Contents/MacOS/HexAgentGUI /usr/local/bin/hexagent-gui
```

### Configuração de Chaves API

HexAgentGUI requer uma chave API para o modelo de IA (OpenRouter).

1. Obtenha sua chave API em [OpenRouter](https://openrouter.ai/)
2. Crie arquivo de chave API:

```bash
# Criar arquivo .HexSec no diretório HexSecGPT-main
echo "SUA_CHAVE_API_AQUI" > ~/iatools/HexAgent/HexSecGPT-main/.HexSec

# Ou usar variável de ambiente
export OPENROUTER_API_KEY="SUA_CHAVE_API_AQUI"
```

### Executando a Aplicação

```bash
# Se instalado globalmente
hexagent-gui

# Ou do diretório de build
export DISPLAY=:0  # Apenas Linux
./dist/linux-arm64-unpacked/hexagent-gui
```

### Solução de Problemas

#### Aplicação não inicia

```bash
# Verificar se dependências Python do backend estão instaladas
source venv/bin/activate
pip list | grep flask

# Reinstalar dependências se necessário
pip install -r backend/requirements.txt
```

#### Erro "Brain not initialized"

- Certifique-se que arquivo `.HexSec` existe com chave API válida
- Verifique logs do backend: `cat ~/.hexagent/backend.log`

#### HexStrike não inicia

```bash
# Iniciar servidor HexStrike manualmente
cd backend/hexstrike-ai
python hexstrike_server.py

# Verificar se porta 8888 está disponível
netstat -tuln | grep 8888
```

#### Permissão negada no Linux

```bash
# Tornar executável
chmod +x dist/linux-arm64-unpacked/hexagent-gui

# Se ainda houver problemas, tente executar com sudo apenas no primeiro lançamento
sudo dist/linux-arm64-unpacked/hexagent-gui
```

---

## Support / Suporte

For issues and questions:
- GitHub Issues: https://github.com/robertodantasdecastro/HexAgent/issues
- Email: robertodantasdecastro@gmail.com

Para problemas e dúvidas:
- GitHub Issues: https://github.com/robertodantasdecastro/HexAgent/issues
- Email: robertodantasdecastro@gmail.com
