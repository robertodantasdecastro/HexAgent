# 🛡️ HexAgentGUI

<div align="center">

![HexAgentGUI Banner](docs/banner.png)

**An Autonomous AI-Powered Cybersecurity Agent with GUI**

*Powered by HexSecGPT Brain & HexStrike Execution Engine*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-lightgrey)]()
[![Architecture](https://img.shields.io/badge/arch-ARM64%20%7C%20x64-green)]()

[English](#english) | [Português](#português)

</div>

---

## English

### 🎯 What is HexAgentGUI?

HexAgentGUI is an **autonomous AI agent specialized in cybersecurity** with a modern graphical interface. It combines the intelligence of **HexSecGPT** (AI brain) with the execution power of **HexStrike** (command execution engine) to create a truly autonomous security assistant.

Unlike simple chatbots, HexAgentGUI **thinks, plans, and executes complex multi-step tasks autonomously**, analyzing results and adapting its approach until the objective is complete.

### ✨ Key Features

- 🤖 **True Autonomous Agent**: Executes complex tasks with interdependent commands
- 🔄 **Iterative Feedback Loop**: AI analyzes results and decides next steps (up to 10 iterations)
- 🎨 **Modern Dark UI**: Cyberpunk-inspired interface with color-coded responses
- 🌐 **Web Search Integration**: Optional real-time web search to enhance AI knowledge
- 🇧🇷 **Portuguese & English**: Bilingual support with automatic detection
- ⚡ **Real-time Streaming**: See AI thinking and command execution in real-time
- 🛑 **Stop Generation**: Instantly abort AI responses with a click
- 📜 **Autoscroll Control**: Toggle auto-scrolling behavior
- 🔧 **Visual Differentiation**: 
  - Cyan: AI explanations
  - Yellow: Command execution
  - **Terminal**: Realistic shell styling (Green on Black)

### 🧬 Project Origin

HexAgentGUI was born from the integration of two powerful projects:

1. **HexSecGPT**: An AI assistant specialized in cybersecurity, created to provide expert guidance on security tasks
2. **HexStrike**: A robust command execution engine designed for security operations

The idea emerged during development sessions with HexSecGPT itself, where the need for a **graphical interface** and **autonomous execution capabilities** became clear. Instead of just suggesting commands, why not execute them autonomously and iterate until the task is complete?

### 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│          Electron Frontend              │
│  ┌───────────────────────────────────┐  │
│  │      React UI (App.jsx)           │  │
│  │  - Dark cyberpunk theme           │  │
│  │  - Real-time streaming display    │  │
│  │  - Web search toggle              │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTP/JSON (localhost:5000)
┌──────────────▼──────────────────────────┐
│         Flask Backend (Python)          │
│  ┌───────────────────────────────────┐  │
│  │      AgentCore                    │  │
│  │  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ HexSecGPT   │  │  HexStrike  │ │  │
│  │  │   (Brain)   │<─>│   (Body)    │ │  │
│  │  └─────────────┘  └─────────────┘ │  │
│  │                                    │  │
│  │  - Autonomous loop (10 iters)     │  │
│  │  - Command parsing & execution    │  │
│  │  - Result feedback to AI          │  │
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

### 🎮 Usage Example

**User:** "Analyze ~/Downloads folder, find Google Chrome installer, if not found search for ARM64 version online, download and install it"

**HexAgentGUI Response:**

```
Iteration 1:
[AI] Analyzing ~/Downloads folder...
🔧 Executing: ls -la ~/Downloads
[Terminal] [list of files...]

Iteration 2:
[AI] Chrome not found. Searching for ARM64 version...
🔧 Executing: wget https://[chrome-arm64-url]
[Terminal] Download complete

Iteration 3:
[AI] Installing Chrome...
🔧 Executing: sudo dpkg -i chrome-arm64.deb
[Terminal] Installation successful
✅ Task completed!
```

### 👤 Developer

**Roberto Dantas de Castro**
- GitHub: [@robertodantasdecastro](https://github.com/robertodantasdecastro)
- Email: `robertodantasdecastro@gmail.com`
- Project: [HexAgent](https://github.com/robertodantasdecastro/HexAgent)

### 💰 Support & Donation

To support continuous development:

**Bitcoin Address**: `bc1qekh060wjfgspgt32vclmu3fcfx9fr7jh0akuwu`

<div align="center">
  <img src="public/qrcode.png" width="150" alt="Bitcoin QR Code" />
</div>

### 📄 License

MIT License - See [LICENSE](LICENSE) for details.

### 🙏 Acknowledgments

- HexSecGPT: AI brain for cybersecurity expertise
- HexStrike: Powerful command execution engine
- OpenRouter: AI model routing

---

## Português

### 🎯 O que é o HexAgentGUI?
<div align="center">
  <img src="public/logo.png" width="100" />
</div>

HexAgentGUI é um **agente de IA autônomo especializado em cibersegurança** com interface gráfica moderna. Ele combina a inteligência do **HexSecGPT** (cérebro de IA) com o poder de execução do **HexStrike** (motor de execução de comandos) para criar um assistente de segurança verdadeiramente autônomo.

Diferente de chatbots simples, o HexAgentGUI **pensa, planeja e executa tarefas complexas de múltiplas etapas autonomamente**, analisando resultados e adaptando sua abordagem até o objetivo ser completo.

### ✨ Recursos Principais

- 🤖 **Agente Verdadeiramente Autônomo**: Executa tarefas complexas com comandos interdependentes
- 🔄 **Loop Iterativo com Feedback**: IA analisa resultados e decide próximos passos (até 10 iterações)
- 🎨 **Interface Moderna Dark**: Interface inspirada em cyberpunk com respostas codificadas por cores
- 🌐 **Integração com Busca Web**: Busca web opcional em tempo real para enriquecer conhecimento da IA
- 🇧🇷 **Português e Inglês**: Suporte bilíngue com detecção automática
- ⚡ **Streaming em Tempo Real**: Veja o pensamento da IA e execução de comandos em tempo real
- 🛑 **Parar Geração**: Aborte respostas da IA instantaneamente com um clique
- 📜 **Controle de Autoscroll**: Alterne o comportamento de rolagem automática
- 🔧 **Diferenciação Visual**:
  - Ciano: Explicações da IA
  - Amarelo: Execução de comandos
  - **Terminal**: Estilo shell realista (Verde sobre Preto)

### 🧬 Origem do Projeto

HexAgentGUI nasceu da integração de dois projetos poderosos:

1. **HexSecGPT**: Um assistente de IA especializado em cibersegurança, criado para fornecer orientação especializada em tarefas de segurança
2. **HexStrike**: Um robusto motor de execução de comandos projetado para operações de segurança

A ideia surgiu durante sessões de desenvolvimento com o próprio HexSecGPT, onde a necessidade de uma **interface gráfica** e **capacidades de execução autônoma** ficou clara. Em vez de apenas sugerir comandos, por que não executá-los autonomamente e iterar até a tarefa estar completa?

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

### 💰 Suporte & Doação

Para apoiar o desenvolvimento contínuo:

**Bitcoin Address**: `bc1qekh060wjfgspgt32vclmu3fcfx9fr7jh0akuwu`

<div align="center">
  <img src="public/qrcode.png" width="150" alt="Bitcoin QR Code" />
</div>

### 📄 Licença

Licença MIT - Veja [LICENSE](LICENSE) para detalhes.

### 🙏 Agradecimentos

- HexSecGPT: Cérebro de IA para expertise em cibersegurança
- HexStrike: Poderoso motor de execução de comandos
- OpenRouter: Roteamento de modelos de IA

---

## Português

### 🎯 O que é o HexAgentGUI?

HexAgentGUI é um **agente de IA autônomo especializado em cibersegurança** com interface gráfica moderna. Ele combina a inteligência do **HexSecGPT** (cérebro de IA) com o poder de execução do **HexStrike** (motor de execução de comandos) para criar um assistente de segurança verdadeiramente autônomo.

Diferente de chatbots simples, o HexAgentGUI **pensa, planeja e executa tarefas complexas de múltiplas etapas autonomamente**, analisando resultados e adaptando sua abordagem até o objetivo ser completo.

### ✨ Recursos Principais

- 🤖 **Agente Verdadeiramente Autônomo**: Executa tarefas complexas com comandos interdependentes
- 🔄 **Loop Iterativo com Feedback**: IA analisa resultados e decide próximos passos (até 10 iterações)
- 🎨 **Interface Moderna Dark**: Interface inspirada em cyberpunk com respostas codificadas por cores
- 🌐 **Integração com Busca Web**: Busca web opcional em tempo real para enriquecer conhecimento da IA
- 🇧🇷 **Português e Inglês**: Suporte bilíngue com detecção automática
- ⚡ **Streaming em Tempo Real**: Veja o pensamento da IA e execução de comandos em tempo real
- 🛑 **Parar Geração**: Aborte respostas da IA instantaneamente com um clique
- 📜 **Controle de Autoscroll**: Alterne o comportamento de rolagem automática
- 🔧 **Diferenciação Visual**:
  - Ciano: Explicações da IA
  - Amarelo: Execução de comandos
  - **Terminal**: Estilo shell realista (Verde sobre Preto)

### 🧬 Origem do Projeto

HexAgentGUI nasceu da integração de dois projetos poderosos:

1. **HexSecGPT**: Um assistente de IA especializado em cibersegurança, criado para fornecer orientação especializada em tarefas de segurança
2. **HexStrike**: Um robusto motor de execução de comandos projetado para operações de segurança

A ideia surgiu durante sessões de desenvolvimento com o próprio HexSecGPT, onde a necessidade de uma **interface gráfica** e **capacidades de execução autônoma** ficou clara. Em vez de apenas sugerir comandos, por que não executá-los autonomamente e iterar até a tarefa estar completa?

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
- Email: robertodantasdecastro@gmail.com
- Projeto: [HexAgent](https://github.com/robertodantasdecastro/HexAgent)

### 📄 Licença

Licença MIT - Veja [LICENSE](LICENSE) para detalhes.

### 🙏 Agradecimentos

- HexSecGPT: Cérebro de IA para expertise em cibersegurança
- HexStrike: Poderoso motor de execução de comandos
- OpenRouter: Roteamento de modelos de IA
