# 📖 User Manual / Manual do Usuário

# 📖 User Manual / Manual do Usuário

![Banner](public/banner.jpg)
<p align="center">
  <img src="public/logo.png" width="100" />
</p>

[English](#english-manual) | [Português](#manual-em-português)

---

## English Manual

### Table of Contents

1. [First Launch](#first-launch)
2. [Interface Overview](#interface-overview)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Autonomous Agent Behavior](#autonomous-agent-behavior)
6. [Configuration & Data](#configuration--data)
7. [Troubleshooting](#troubleshooting)

### First Launch

1. **Start the application**:
   - **Desktop Shortcut**: Click "HexAgent GUI" in your applications menu.
   - **Terminal**: Type `hexagent` or `hexagent-gui`.
   ```bash
   hexagent
   ```

2. **Wait for initialization** (15-20 seconds):
   - Backend Flask server starts
   - HexSecGPT Brain initializes
   - Status indicator shows connection state

3. **Check status**:
   - **Green "ON" + ONLINE**: Fully operational
   - **Red "OFF" + OFFLINE**: Brain not initialized (check API key)

### Interface Overview

```
┌────────────────────────────────────┐
│  🛡️  HEXAGENT GUI    [ON] [ONLINE] │  ← Header
├────────────────────────────────────┤
│                                    │
│   [User Message]                   │  ← Conversation
│   ├ Cyan: AI response              │     Area
│   ├ Yellow: Command execution      │
│   └ Green: Terminal output         │
│                                    │
├────────────────────────────────────┤
│  [Input] 🌐 📤                     │  ← Input Area
│  HexSecGPT Connected • Web Search  │     + Controls
└────────────────────────────────────┘
```

#### UI Elements

- **🛡️ Shield Icon**: Application logo
- **Power Button (⚡)**: Start/stop HexStrike execution engine
- **Status Dot**: Connection health indicator
- **🌐 Globe Button**: Toggle web search (enhances AI with real-time info)
- **📤 Send Button**: Submit message (or press Enter)

### Basic Usage

#### Simple Question

1. Type your question in the input field
2. Press **Enter** or click **Send**
3. AI responds in **cyan color**

**Example:**
```
User: What is a SQL injection attack?

AI: [Cyan text explaining SQL injection with examples]
```

#### Execute Single Command

1. Ask AI to execute a command
2. AI suggests command in code block
3. System automatically executes it
4. Result appears in **green terminal output**

**Example:**
```
User: List files in current directory

AI: I'll list the files for you.
```bash
ls -la
```

🔧 Executing: ls -la
[Green] Command Executed in /home/user:
total 48
drwxr-xr-x  4 user user 4096 Jan  2 14:00 .
...
```

### Advanced Features

#### 🌐 Web Search Mode

Enable web search for questions requiring current information:

1. Click the **globe icon** (it turns blue)
2. Ask your question
3. AI receives top 3 web search results as context
4. More accurate and up-to-date responses

**When to use:**
- Current events: "Latest CVE vulnerabilities in 2026"
- Tool versions: "Download link for latest Metasploit"
- Documentation: "How to use nmap for port scanning"

**Example:**
```
[Globe ON]
User: What are the latest Kali Linux tools for 2026?

[AI receives web context]:
1. "Top 20 New Kali Linux Tools in 2026"
2. "Kali Linux 2026.1 Release Notes"
3. "Best Penetration Testing Tools 2026"

AI: Based on recent information, the latest Kali Linux...
```

#### ✏️ Multi-line Input

- **Enter**: Send message
- **Shift + Enter**: New line
- Input auto-expands to 2 lines
- **Shift + Enter**: New line

#### 🛑 Stop Generation
- **Stop Button**: Appears during response generation (pulsing red square).
- **Function**: Click to immediately cancel the current AI response.
- **Use case**: If the AI is misunderstanding the task or generating a long undesired output.

#### 📜 Autoscroll Control
- **Toggle**: Button above input area ("AutoScroll: ON/OFF").
- **ON**: Viewport follows new messages automatically.
- **OFF**: Manual scrolling (useful for reading past messages while generation continues).

#### ⚙️ Auto-Execute Control
- **Icon**: `Play` (Auto) / `Pause` (Manual) via "Auto-Exec: ON/OFF" button.
- **ON**: The agent automatically executes generated commands (default autonomous behavior).
- **OFF**: The agent proposes commands but waits for your confirmation. A "Command Proposal" block will appear with an "Execute" button, allowing you to edit the command before running.

#### ⌨️ Input Mode
- **Icon**: `ChevronRight` ("Mode: CHAT/PROMPT").
- **CHAT**: Standard AI interaction mode. Natural language queries.
- **PROMPT**: Direct system shell mode.
    - **? Help Button**: Click to see available terminal commands.
    - **Commands**:
        - `ls -la`: Direct bash execution.
        - `/help`: Show available commands list.
        - `/clear`: Clear terminal output.
        - `/exit`: Safely shutdown application.
        - `/save session [name]`: Save current conversation history.
        - `/open session [name]`: Load a saved session.
        - `/stop service [name]`: Stop a service (e.g., hexstrike).
        - `/ai <query>`, `@<query>`, `#<query>`: Send query to AI Agent (e.g., `@scan network`).

### Autonomous Agent Behavior

HexAgentGUI is a **true autonomous agent**, not just a chatbot. It can execute complex multi-step tasks independently.

#### How It Works

```
Goal: Install Google Chrome ARM64

Iteration 1:
  User: "Install Google Chrome for ARM64"
  AI: "I'll check if it's already downloaded"
  Execute: ls ~/Downloads
  Result: [files listed, no Chrome found]

Iteration 2:
  AI analyzes: "Chrome not found, searching web for ARM64 version"
  Execute: wget https://chrome-arm64.deb
  Result: [download successful]

Iteration 3:
  AI: "Now installing the package"
  Execute: sudo dpkg -i chrome-arm64.deb
  Result: [installed]
  
  AI: ✅ Task completed! Chrome ARM64 installed successfully.
```

#### Iteration Limits

- Maximum: **10 iterations** per task (default)
- Prevents infinite loops.
- **Continuing**: When limit is reached, you can choose to continue for +5 or +10 iterations.

#### 🚪 Graceful Shutdown
- When you close the application, a status modal appears.
- It ensures services (HexStrike, Brain) are closed properly.

#### Task Completion

AI ends loop when:
- Task objective achieved
- No more commands needed
- Detects error that can't be resolved
- Maximum iterations reached

### Configuration & Data

All application data is centralized in your home directory: `~/.hexagent-gui/`

- **config/**: Configuration files (`config.json`).
- **log/**: Application logs.
- **sessions/**: Saved conversation history.
- **agents/**: Agent profiles.

### Response Color Coding

| Color | Meaning | Content |
|-------|---------|---------|
| **Cyan** | AI thinking/explaining | Analysis, suggestions, explanations |
| **Yellow** | Command execution | `🔧 Executing: command` |
| **Green** | Terminal output | Real command results |

### Best Practices

1. **Be Specific**: "Install Chrome ARM64 to /opt" vs "Install Chrome"
2. **One Task Per Message**: Let AI complete before new task
3. **Use Web Search**: Enable for questions needing current info
4. **Monitor Iterations**: Watch progress markers
5. **Review Commands**: AI shows what it will execute

### Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in input
- **Ctrl + C**: Copy selected text (in conversation)

---

## Manual em Português

### Índice

1. [Primeiro Uso](#primeiro-uso)
2. [Visão Geral da Interface](#visão-geral-da-interface)
3. [Uso Básico](#uso-básico)
4. [Recursos Avançados](#recursos-avançados)
5. [Comportamento Autônomo](#comportamento-autônomo)
6. [Configuração e Dados](#configuração-e-dados)
7. [Solução de Problemas](#solução-de-problemas-manual)

### Primeiro Uso

1. **Iniciar aplicação**:
   - **Atalho Desktop**: Menu de aplicativos > "HexAgent GUI".
   - **Terminal**: `hexagent` ou `hexagent-gui`.
   ```bash
   hexagent
   ```

2. **Aguardar inicialização** (15-20 segundos):
   - Servidor Flask backend inicia
   - Cérebro HexSecGPT inicializa
   - Indicador de status mostra estado da conexão

3. **Verificar status**:
   - **Verde "ON" + ONLINE**: Totalmente operacional
   - **Vermelho "OFF" + OFFLINE**: Brain não inicializado (verificar chave API)

### Visão Geral da Interface

```
┌────────────────────────────────────┐
│  🛡️  HEXAGENT GUI    [ON] [ONLINE] │  ← Cabeçalho
├────────────────────────────────────┤
│                                    │
│   [Mensagem Usuário]               │  ← Área de
│   ├ Ciano: Resposta IA             │     Conversa
│   ├ Amarelo: Execução comando      │
│   └ Verde: Saída terminal          │
│                                    │
├────────────────────────────────────┤
│  [Entrada] 🌐 📤                   │  ← Área Entrada
│  HexSecGPT Conectado • Web Search  │     + Controles
└────────────────────────────────────┘
```

#### Elementos da UI

- **🛡️ Ícone Escudo**: Logo da aplicação
- **Botão Power (⚡)**: Iniciar/parar motor de execução HexStrike
- **Ponto de Status**: Indicador de saúde da conexão
- **🌐 Botão Globo**: Ativar/desativar busca web (enriquece IA com info em tempo real)
- **📤 Botão Enviar**: Submeter mensagem (ou pressionar Enter)

### Uso Básico

#### Pergunta Simples

1. Digite sua pergunta no campo de entrada
2. Pressione **Enter** ou clique em **Enviar**
3. IA responde em **cor ciano**

**Exemplo:**
```
Usuário: O que é um ataque SQL injection?

IA: [Texto ciano explicando SQL injection com exemplos]
```

#### Executar Comando Único

1. Peça para IA executar um comando
2. IA sugere comando em bloco de código
3. Sistema executa automaticamente
4. Resultado aparece em **saída terminal verde**

**Exemplo:**
```
Usuário: Liste arquivos no diretório atual

IA: Vou listar os arquivos para você.
```bash
ls -la
```

🔧 Executando: ls -la
[Verde] Comando Executado em /home/usuario:
total 48
drwxr-xr-x  4 usuario usuario 4096 Jan  2 14:00 .
...
```

### Recursos Avançados

#### 🌐 Modo Busca Web

Habilite busca web para perguntas que requerem informação atual:

1. Clique no **ícone globo** (fica azul)
2. Faça sua pergunta
3. IA recebe top 3 resultados de busca como contexto
4. Respostas mais precisas e atualizadas

**Quando usar:**
- Eventos atuais: "Últimas vulnerabilidades CVE em 2026"
- Versões de ferramentas: "Link de download do Metasploit mais recente"
- Documentação: "Como usar nmap para varredura de portas"

#### ✏️ Entrada Multi-linha

- **Enter**: Enviar mensagem
- **Shift + Enter**: Nova linha
- Entrada expande automaticamente para 2 linhas
- **Shift + Enter**: Nova linha

#### 🛑 Parar Geração (Stop Generation)
- **Botão Stop**: Aparece durante a geração da resposta (quadrado vermelho pulsante).
- **Função**: Clique para cancelar imediatamente a resposta atual da IA.
- **Caso de uso**: Se a IA estiver entendendo mal a tarefa ou gerando uma saída longa indesejada.

#### 📜 Controle de Autoscroll
- **Toggle**: Botão acima da área de entrada ("AutoScroll: ON/OFF").
- **ON**: A visualização segue novas mensagens automaticamente.
- **OFF**: Rolagem manual (útil para ler mensagens passadas enquanto a geração continua).

#### ⚙️ Controle de Auto-Execução
- **Ícone**: `Play`/`Pause` via botão "Auto-Exec".
- **ON**: O agente executa comandos automaticamente (comportamento autônomo padrão).
- **OFF**: O agente propõe comandos e aguarda sua confirmação. Um bloco de "Proposta de Comando" aparecerá com um botão "Executar", permitindo edição antes da execução.

#### ⌨️ Modo de Entrada
- **Ícone**: `ChevronRight` ("Mode: CHAT/PROMPT").
- **CHAT**: Modo padrão de interação com IA (Linguagem natural).
- **PROMPT**: Modo de shell direto do sistema.
    - **Botão ? Ajuda**: Clique para ver comandos disponíveis.
    - **Comandos**:
        - `ls -la`: Execução direta bash.
        - `/help`: Mostrar lista de comandos.
        - `/clear`: Limpar tela.
        - `/exit`: Encerrar aplicação com segurança.
        - `/save session [nome]`: Salvar histórico da conversa.
        - `/open session [nome]`: Abrir sessão salva.
        - `/stop service [nome]`: Parar um serviço (ex: hexstrike).
        - `/ai <query>`, `@<query>`, `#<query>`: Enviar para Agente IA (ex: `@escanear rede`).

### Comportamento Autônomo

HexAgentGUI é um **agente verdadeiramente autônomo**, não apenas um chatbot. Pode executar tarefas complexas de múltiplas etapas independentemente.

#### Como Funciona

```
Objetivo: Instalar Google Chrome ARM64

Iteração 1:
  Usuário: "Instalar Google Chrome para ARM64"
  IA: "Vou verificar se já foi baixado"
  Executa: ls ~/Downloads
  Resultado: [arquivos listados, Chrome não encontrado]

Iteração 2:
  IA analisa: "Chrome não encontrado, buscando versão ARM64 na web"
  Executa: wget https://chrome-arm64.deb
  Resultado: [download bem-sucedido]

Iteração 3:
  IA: "Agora instalando o pacote"
  Executa: sudo dpkg -i chrome-arm64.deb
  Resultado: [instalado]
  
  IA: ✅ Tarefa concluída! Chrome ARM64 instalado com sucesso.
```

#### Limites de Iteração

- Máximo: **10 iterações** por tarefa (padrão)
- **Continuar**: Ao atingir o limite, você pode escolher continuar por +5 ou +10 iterações.

#### 🚪 Encerramento Gracioso
- Ao fechar a janela, uma tela de status mostra o progresso do encerramento.
- Garante fechamento limpo de serviços e processos.

### Codificação por Cores de Resposta

| Cor | Significado | Conteúdo |
|-----|-------------|----------|
| **Ciano** | IA pensando/explicando | Análise, sugestões, explicações |
| **Amarelo** | Execução de comando | `🔧 Executando: comando` |
| **Verde** | Saída de terminal | Resultados reais de comandos |

### Configuração e Dados

Todos os dados da aplicação são centralizados no seu diretório home: `~/.hexagent-gui/`

- **config/**: Arquivos de configuração (`config.json`).
- **log/**: Logs da aplicação.
- **sessions/**: Histórico de conversas salvas.
- **agents/**: Perfis de agentes.

### Melhores Práticas

1. **Seja Específico**: "Instalar Chrome ARM64 em /opt" vs "Instalar Chrome"
2. **Uma Tarefa Por Mensagem**: Deixe IA completar antes de nova tarefa
3. **Use Busca Web**: Habilite para perguntas que precisam de info atual
4. **Monitore Iterações**: Observe marcadores de progresso
5. **Revise Comandos**: IA mostra o que vai executar

### Atalhos de Teclado

- **Enter**: Enviar mensagem
- **Shift + Enter**: Nova linha na entrada
- **Ctrl + C**: Copiar texto selecionado (na conversa)

---

## Support / Suporte

**Developer / Desenvolvedor**: Roberto Dantas de Castro
- Email: robertodantasdecastro@gmail.com
- GitHub: [@robertodantasdecastro](https://github.com/robertodantasdecastro)
- Project: [HexAgent](https://github.com/robertodantasdecastro/HexAgent)
