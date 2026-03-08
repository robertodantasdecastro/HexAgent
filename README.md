# 🛡️ HexAgentGUI

<div align="center">

<p align="center">
  <img src="public/logo.png" width="300" />
</p>

**An Autonomous AI-Powered Cybersecurity Agent with GUI**

*Powered by HexStrike-AI & Backend Orchestration*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-lightgrey)]()
[![Architecture](https://img.shields.io/badge/arch-ARM64%20%7C%20x64-green)]()

[English](#english) | [Português](#português)

</div>

---

## English

### 🎯 What is HexAgentGUI?

### 🎯 What is HexAgentGUI?

HexAgentGUI is a **Multi-Engine AI Platform** specialized in cybersecurity. It serves as an autonomous intelligence hub that orchestrates **HexStrike-AI** (Kali Linux-based execution engine) while allowing deep personalization of the AI brain.

Acting as a bridge between high-level reasoning and low-level execution, it enables you to switch dynamically between **Online Engines** (OpenAI, DeepSeek, Claude) and **Private Local Models** (LM Studio, Ollama), ensuring flexibility for critical security environments.

### ✨ Key Features

- 🤖 **True Autonomous Agent**: Executes complex tasks with interdependent commands
- 🔄 **HexStrike-AI Integration**: Seamlessly controls local security tools (Nmap, Nuclei, Metasploit, etc.)
- 🛡️ **Offline & Secure**: Works fully offline with local LLMs (LM Studio/Ollama) - No data leaves your machine
- 🔄 **Iterative Feedback Loop**: AI analyzes results and decides next steps (up to 10 iterations)
- 🎨 **Modern Dark UI**: Cyberpunk-inspired interface with color-coded responses
- 🇧🇷 **Portuguese & English**: Bilingual support with automatic detection
- ⚡ **Real-time Streaming**: See AI thinking and command execution in real-time
- 🖥️ **Real-time Hybrid Terminal**: Fully interactive ZSH shell with Deep-Linking from AI responses
- 👻 **Shadow Mode**: Background monitoring of system metrics and network traffic analysis
- 🔧 **Visual Differentiation**: 
  - Cyan: AI explanations
  - Yellow: Command execution
  - **Magenta**: Chain-of-Thought (Thinking Mode)
  - **Terminal**: Realistic shell styling (Green on Black)

### 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Electron Frontend              │
│  ┌───────────────────────────────────┐  │
│  │      React UI (App.jsx)           │  │
│  │  - Dark cyberpunk theme           │  │
│  │  - Real-time streaming display    │  │
│  │  - Hybrid Terminal (xterm.js)     │  │
│  │  - Thinking Block Visualization   │  │
│  │  - State Management (useAIConfig) │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTP/JSON + SSE Loop
┌──────────────▼──────────────────────────┐
│         Flask Backend (Python)          │
│  ┌───────────────────────────────────┐  │
│  │    ChatController (Facade)        │  │
│  └──────────────┬────────────────────┘  │
│                 ▼                       │
│  ┌───────────────────────────────────┐  │
│  │       AgentCore (Director)        │  │
│  │  ┌───────────────┐ ┌───────────┐  │  │
│  │  │  Orchestrator │ │ HexStrike │  │  │
│  │  │ (Block Stream)│ │ (Executor)│  │  │
│  │  └───────┬───────┘ └─────┬─────┘  │  │
│  │          │               │        │  │
│  │  ┌───────▼──────┐        │        │  │
│  │  │  AI Provider │<───────┘        │  │
│  │  └──────────────┘                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/robertodantasdecastro/HexAgent.git
cd HexAgent/HexAgentGUI

# Run automated installer
chmod +x install.sh
./install.sh

# Launch application
hexagent-gui
```

### 📦 Running from Release (Compiled)

If you downloaded a release version (e.g., from GitHub Releases), follow these steps:

#### AppImage (Portable)
1. Make executable: `chmod +x HexAgentGUI-*.AppImage`
2. Run: `./HexAgentGUI-*.AppImage`

#### Debian Package (.deb) (Ubuntu/Kali/Debian)
1. Install: `sudo dpkg -i hexagent-gui_*.deb`
2. Fix dependencies (if any): `sudo apt install -f`
3. Run: `hexagent-gui`

For detailed installation instructions, see [INSTALL.md](INSTALL.md).

### 📚 Documentation

- [Installation Guide](INSTALL.md) - Detailed installation steps
- [User Manual](USER_MANUAL.md) - Complete usage guide
- [Contributing](CONTRIBUTING.md) - Contribution guidelines

### 👤 Developer

**Roberto Dantas de Castro**
- GitHub: [@robertodantasdecastro](https://github.com/robertodantasdecastro)
- Email: `robertodantasdecastro@gmail.com`
- Project: [HexAgent](https://github.com/robertodantasdecastro/HexAgent)

### 💰 Support & Donation

To support continuous development:

**Brazilian PIX**: `robertodantasdecastro@gmail.com`
**Bitcoin Address**: `bc1qekh060wjfgspgt32vclmu3fcfx9fr7jh0akuwu`

<div align="center">
  <img src="public/qrcode.png" width="150" alt="Bitcoin QR Code" />
</div>

### 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## Português

### 🎯 O que é o HexAgentGUI?

### 🎯 O que é o HexAgentGUI?

HexAgentGUI é uma **Plataforma Multi-Motor de IA** especializada em cibersegurança. Ele atua como um hub de inteligência autônoma que orquestra o **HexStrike-AI** (motor de execução baseado em Kali Linux) enquanto permite personalização profunda do cérebro da IA.

Atuando como uma ponte entre o raciocínio de alto nível e a execução de baixo nível, ele permite alternar dinamicamente entre **Motores Online** (OpenAI, DeepSeek, Claude) e **Modelos Locais Privados** (LM Studio, Ollama), garantindo flexibilidade para ambientes de segurança crítica.

### ✨ Recursos Principais

- 🤖 **Agente Verdadeiramente Autônomo**: Executa tarefas complexas com comandos interdependentes
- 🔄 **Integração HexStrike-AI**: Controla perfeitamente ferramentas de segurança locais (Nmap, Nuclei, Metasploit, etc.)
- 🛡️ **Offline e Seguro**: Funciona totalmente offline com LLMs locais (LM Studio/Ollama) - Nenhum dado sai da sua máquina
- 🔄 **Loop Iterativo com Feedback**: IA analisa resultados e decide próximos passos (até 10 iterações)
- 🎨 **Interface Moderna Dark**: Interface inspirada em cyberpunk com respostas codificadas por cores
- 🇧🇷 **Português e Inglês**: Suporte bilíngue com detecção automática
- ⚡ **Streaming em Tempo Real**: Veja o pensamento da IA e execução de comandos em tempo real
- 🖥️ **Terminal Híbrido em Tempo Real**: Shell ZSH totalmente interativo com Deep-Link das respostas da IA
- 👻 **Modo Sombra**: Monitoramento em segundo plano de métricas do sistema e análise de tráfego
- 🔧 **Diferenciação Visual**:
  - Ciano: Explicações da IA
  - Amarelo: Execução de comandos
  - **Terminal**: Estilo shell realista (Verde sobre Preto)

### 🚀 Início Rápido

```bash
# Clonar repositório
git clone https://github.com/robertodantasdecastro/HexAgent.git
cd HexAgent/HexAgentGUI

# Executar instalador automatizado
chmod +x install.sh
./install.sh

# Iniciar aplicação
hexagent-gui
```

### 📦 Executando a Partir do Release

Se você baixou uma versão compilada (ex: do GitHub Releases), siga estes passos:

#### AppImage (Portátil)
1. Tornar executável: `chmod +x HexAgentGUI-*.AppImage`
2. Executar: `./HexAgentGUI-*.AppImage`

#### Pacote Debian (.deb) (Ubuntu/Kali/Debian)
1. Instalar: `sudo dpkg -i hexagent-gui_*.deb`
2. Corrigir dependências (se houver): `sudo apt install -f`
3. Executar: `hexagent-gui`

Para instruções detalhadas de instalação, veja [INSTALL.md](INSTALL.md).

### 📚 Documentação

- [Guia de Instalação](INSTALL.md) - Passos detalhados de instalação
- [Manual do Usuário](USER_MANUAL.md) - Guia completo de uso
- [Contribuindo](CONTRIBUTING.md) - Diretrizes para contribuição

### 👤 Desenvolvedor

**Roberto Dantas de Castro**
- GitHub: [@robertodantasdecastro](https://github.com/robertodantasdecastro)
- Email: `robertodantasdecastro@gmail.com`
- Project: [HexAgent](https://github.com/robertodantasdecastro/HexAgent)

### 📄 Licença

Licença MIT - Veja [LICENSE](LICENSE) para detalhes.
