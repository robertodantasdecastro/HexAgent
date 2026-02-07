# HexAgentGUI - Features Documentation
## Documentação de Recursos

> **Complete guide to all HexAgentGUI features**  
> **Guia completo de todos os recursos do HexAgentGUI**

---

## 🎯 Core Features / Recursos Principais

### 1. Autonomous AI Agent / Agente de IA Autônomo

**English:**
HexAgentGUI is not just a chatbot - it's a true autonomous agent that can execute complex multi-step tasks. The AI:
- Plans task execution strategies
- Executes shell commands automatically
- Analyzes command outputs
- Adapts approach based on results
- Iterates up to 10 times to complete objectives

**Português:**
HexAgentGUI não é apenas um chatbot - é um agente verdadeiramente autônomo que pode executar tarefas complexas de múltiplas etapas. A IA:
- Planeja estratégias de execução de tarefas
- Executa comandos shell automaticamente
- Analisa saídas de comandos
- Adapta abordagem baseada em resultados
- Itera até 10 vezes para completar objetivos

**Usage Example / Exemplo de Uso:**
```
User: "Find all Python files in ~/projects, count lines of code, and generate a report"

AI will autonomously:
1. Execute: find ~/projects -name "*.py"
2. For each file: wc -l [file]
3. Aggregate results
4. Generate formatted report
```

---

## 🎨 Smart Block System / Sistema de Blocos Inteligentes

### Overview / Visão Geral

**English:**
The Smart Block system intelligently detects and renders different content types with appropriate formatting and actions.

**Português:**
O sistema de Blocos Inteligentes detecta e renderiza inteligentemente diferentes tipos de conteúdo com formatação e ações apropriadas.

### Block Types / Tipos de Blocos

#### 1. **CODE Blocks**
- **Detection:** Markdown code fences (\`\`\`language)
- **Features:**
  - Syntax highlighting (Python, JavaScript, Bash, JSON, etc.)
  - Line numbers
  - Copy button
  - Execute button (for executable code)
  - Save to file
  - Edit inline

#### 2. **SHELL/TERMINAL Blocks**
- **Detection:** Command patterns, terminal prompts ($, #)
- **Features:**
  - Terminal-style rendering (green on black)
  - ANSI color support
  - Copy command
  - Execute button
  - **NEW:** Real-time streaming output

#### 3. **OUTPUT Blocks**
- **Detection:** `[Output]:` marker or `Command Executed` text
- **Features:**
  - **ANSI color rendering** (directories blue, executables green, etc.)
  - Dark background for readability
  - **Word wrapping** (no horizontal scroll)
  - Copy button
  - Save to file

#### 4. **THINKING Blocks**
- **Detection:** `<thinking>` tags, reasoning markers
- **Features:**
  - Collapsible by default
  - Italic/dimmed text style
  - Shows AI's internal reasoning process

#### 5. **ERROR Blocks**
- **Detection:** Error keywords, stack traces, exception patterns
- **Features:**
  - Red border and background
  - Warning icon
  - Monospace font for stack traces
  - Copy error for debugging

#### 6. **LOG Blocks**
- **Detection:** Timestamp patterns, log levels (INFO, DEBUG, ERROR)
- **Features:**
  - Colored log levels
  - Timestamp highlighting
  - ANSI color support
  - Searchable content

#### 7. **SCRIPT Blocks**
- **Detection:** Shebang (`#!/bin/`), `.metadata.isScript` flag
- **Features:**
  - **Save with auto-path suggestion** (`~/scripts/`)
  - **Execute directly** with argument input
  - **Debug mode** with language-specific flags
  - Real-time execution output
  - Exit code display (green=success, red=failure)

---

## 🌈 ANSI Color Rendering / Renderização de Cores ANSI

### What is it? / O que é?

**English:**
ANSI color rendering transforms raw terminal escape codes (`\x1b[31m`, `[0m`, etc.) into beautiful, readable colored output - just like a real terminal.

**Português:**
A renderização de cores ANSI transforma códigos de escape brutos do terminal (`\x1b[31m`, `[0m`, etc.) em saída colorida bonita e legível - como um terminal real.

### Supported Colors / Cores Suportadas

| Code | Color EN | Cor PT | Example Use |
|------|----------|--------|-------------|
| 30-37 | Standard colors | Cores padrão | Text, errors |
| 90-97 | Bright colors | Cores brilhantes | Highlights |
| 31 | Red | Vermelho | Errors, warnings |
| 32 | Green | Verde | Success, executables |
| 33 | Yellow | Amarelo | Commands, warnings |
| 34 | Blue | Azul | Directories, links |
| 35 | Magenta | Magenta | Special files |
| 36 | Cyan | Ciano | AI responses |

### Automatic Detection / Detecção Automática

The system automatically detects ANSI codes in:
- Shell command outputs (`ls -la`, `grep --color`)
- Log files with colored output
- Script execution results
- Any text containing `\x1b[` patterns

O sistema detecta automaticamente códigos ANSI em:
- Saídas de comandos shell (`ls -la`, `grep --color`)
- Arquivos de log com saída colorida
- Resultados de execução de scripts
- Qualquer texto contendo padrões `\x1b[`

---

## 📜 Script Management System / Sistema de Gerenciamento de Scripts

### Features / Recursos

**English:**
Complete lifecycle management for AI-generated scripts:

1. **Detection:** AI-generated code is automatically detected as scripts if:
   - Contains shebang (`#!/bin/bash`, `#!/usr/bin/env python3`)
   - Has `.metadata.isScript` flag
   - Filename ends with common script extensions

2. **Saving:**
   - Auto-suggests save path (`~/scripts/[name]`)
   - Creates directories if needed
   - Sets executable permissions (`chmod +x`)
   - Validates against path traversal attacks

3. **Execution:**
   - Run with custom arguments
   - Real-time output streaming
   - Exit code display
   - ANSI color support

4. **Debugging:**
   - Language-specific debug flags:
     - Python: `-v` (verbose)
     - Bash: `-x` (trace)
     - Node.js: `--inspect`
   - Enhanced error output

**Português:**
Gerenciamento completo do ciclo de vida para scripts gerados pela IA:

1. **Detecção:** Código gerado pela IA é automaticamente detectado como script se:
   - Contém shebang (`#!/bin/bash`, `#!/usr/bin/env python3`)
   - Tem flag `.metadata.isScript`
   - Nome do arquivo termina com extensões comuns de script

2. **Salvando:**
   - Sugere automaticamente caminho de salvamento (`~/scripts/[nome]`)
   - Cria diretórios se necessário
   - Define permissões executáveis (`chmod +x`)
   - Valida contra ataques de path traversal

3. **Execução:**
   - Executar com argumentos personalizados
   - Streaming de saída em tempo real
   - Exibição de código de saída
   - Suporte a cores ANSI

4. **Depuração:**
   - Flags de debug específicas da linguagem:
     - Python: `-v` (verboso)
     - Bash: `-x` (trace)
     - Node.js: `--inspect`
   - Saída de erro aprimorada

---

## 🔄 Iteration Control / Controle de Iterações

### What is it? / O que é?

**English:**
The iteration control system limits how many times the AI can autonomously execute commands and analyze results. This prevents infinite loops and controls resource usage.

**Português:**
O sistema de controle de iterações limita quantas vezes a IA pode executar comandos e analisar resultados autonomamente. Isso previne loops infinitos e controla uso de recursos.

### UI Controls / Controles da Interface

Located in the top-right corner / Localizado no canto superior direito:

```
∞ [-] 3/10 [+]
│  │   │   │
│  │   │   └─ Increment / Incrementar
│  │   └───── Current/Max (Atual/Máximo)
│  └───────── Decrement / Decrementar
└──────────── Unlimited mode toggle / Alternar modo ilimitado
```

### AI Provider Support
- **OpenRouter** – Access to 100+ models
- **Claude** (Anthropic)
- **OpenAI** (GPT-4, o1)
- **DeepSeek**
- **LM Studio** – Local models
- **Ollama** – Local open-source models ⭐ NEW
- **5ire** (via local servers)

### Features / Recursos

- **Default:** 10 iterations maximum
- **Unlimited Mode:** Toggle ∞ for no limit (use with caution!)
- **Live Counter:** Shows current iteration during execution
- **Quick Adjust:** +/- buttons for fast changes
- **Dialog:** Click counter to open detailed settings

**Padrão:** Máximo de 10 iterações
**Modo Ilimitado:** Alternar ∞ para sem limite (use com cuidado!)
**Contador Ao Vivo:** Mostra iteração atual durante execução
**Ajuste Rápido:** Botões +/- para mudanças rápidas
**Diálogo:** Clicar no contador abre configurações detalhadas

---

## 💾 Session Management / Gerenciamento de Sessões

### Features / Recursos

**English:**
- **Auto-save:** Conversations automatically saved as `autosave`
- **Named sessions:** Save conversations with custom names
- **Load sessions:** Resume previous conversations with full context
- **Session list:** View all saved sessions with timestamps
- **Delete sessions:** Remove old or unwanted conversations

**Português:**
- **Auto-salvamento:** Conversas salvas automaticamente como `autosave`
- **Sessões nomeadas:** Salvar conversas com nomes personalizados
- **Carregar sessões:** Retomar conversas anteriores com contexto completo
- **Lista de sessões:** Ver todas as sessões salvas com timestamps
- **Deletar sessões:** Remover conversas antigas ou indesejadas

### Usage / Uso

1. **Save current session:**
   - Click History icon (📜)
   - Enter session name
   - Click "Save"

2. **Load previous session:**
   - Click History icon
   - Select session from list
   - Click "Load"

---

## ⚙️ Configuration System / Sistema de Configuração

### Hierarchical Config / Configuração Hierárquica

**English:**
HexAgentGUI uses a flexible 3-tier configuration system:

1. **Templates** (`config_templates/`) - Default values
2. **User Config** (`~/.hexagent-gui/config/`) - User overrides
3. **Runtime** - Temporary session changes

**Português:**
HexAgentGUI usa um sistema de configuração flexível de 3 camadas:

1. **Templates** (`config_templates/`) - Valores padrão
2. **Config do Usuário** (`~/.hexagent-gui/config/`) - Sobrescritas do usuário
3. **Runtime** - Mudanças temporárias da sessão

### Configuration Files / Arquivos de Configuração

```
config_templates/
├── ai/
│   ├── main.json           # AI model, temperature, max tokens
│   ├── brain.json          # Brain/persona settings
│   └── web_search.json     # Web search toggle
├── ui/
│   ├── block_rules.json    # Block rendering rules
│   ├── temp_files.json     # Temporary file management
│   └── theme.json          # Color scheme, fonts
├── features/
│   └── auto_execute.json   # Command auto-execution settings
└── system/
    └── paths.json          # Directory locations
```

### Accessing Settings / Acessando Configurações

- Click ⚙️ icon in top-right
- Tabs: General, AI, Appearance, Advanced
- Changes apply immediately
- Click "Reset to Defaults" to revert

---

## 🎨 Customization / Personalização

### Themes / Temas

**Available / Disponíveis:**
- Dark (default) - Cyberpunk inspired
- Light - High contrast for daylight
- Kali - Kali Linux terminal theme
- Custom - Define your own colors

### ANSI Color Customization / Personalização de Cores ANSI

Edit `~/.hexagent-gui/config/ui/theme.json`:

```json
{
  "custom_ansi": {
    "31": "#ff0000",  // Red / Vermelho
    "32": "#00ff00",  // Green / Verde
    "34": "#0000ff"   // Blue / Azul
  }
}
```

### Block Rules / Regras de Blocos

Customize block behavior in `block_rules.json`:

```json
{
  "CODE": {
    "syntax_highlight": true,
    "show_line_numbers": true,
    "actions": ["copy", "execute", "save"]
  }
}
```

---

## 🔧 Advanced Features / Recursos Avançados

### 1. Temporary File Tracking

**English:**
All AI-generated files are tracked during the session. On exit, you're prompted to:
- Save to permanent location
- Discard changes
- Review each file individually

**Português:**
Todos os arquivos gerados pela IA são rastreados durante a sessão. Ao sair, você é solicitado a:
- Salvar em local permanente
- Descartar mudanças
- Revisar cada arquivo individualmente

### 2. Real-time Streaming

**English:**
See AI thinking and command execution in real-time as tokens are generated, not after completion.

**Português:**
Veja o pensamento da IA e execução de comandos em tempo real conforme tokens são gerados, não após conclusão.

### 3. Stop Generation

**English:**
Instantly abort AI responses mid-generation with the Stop (⏹) button.

**Português:**
Abortar instantaneamente respostas da IA no meio da geração com o botão Stop (⏹).

### 4. Web Search Integration

**English:**
Enable optional real-time web search to enhance AI knowledge with current information.

**Português:**
Habilitar busca web opcional em tempo real para enriquecer conhecimento da IA com informações atuais.

### 5. Bilingual Support

**English:**
Full Portuguese and English support with:
- Automatic language detection
- Translated UI elements
- Bilingual error messages
- Language-aware AI responses

**Português:**
Suporte completo a Português e Inglês com:
- Detecção automática de idioma
- Elementos de UI traduzidos
- Mensagens de erro bilíngues
- Respostas da IA com consciência de idioma

---

## 📊 Performance Features / Recursos de Performance

### Code Splitting (NEW)

**English:**
Large components are lazy-loaded to reduce initial bundle size and improve load times.

**Português:**
Componentes grandes são carregados sob demanda para reduzir tamanho do bundle inicial e melhorar tempos de carregamento.

### Memoization (NEW)

**English:**
React.memo, useMemo, and useCallback optimize re-renders for better performance.

**Português:**
React.memo, useMemo e useCallback otimizam re-renders para melhor performance.

---

## 🐛 Debugging / Depuração

### Browser Console

Access detailed logs:
- Frontend: F12 → Console tab
- Backend: Check `app.log` or `~/.hexagent-gui/logs/`

### Common Issues / Problemas Comuns

See README.md Troubleshooting section / Veja seção de Solução de Problemas no README.md

---

## 🚀 Keyboard Shortcuts / Atalhos de Teclado

| Shortcut | Action EN | Ação PT |
|----------|-----------|---------|
| `Ctrl+Enter` | Send message | Enviar mensagem |
| `Ctrl+K` | Clear conversation | Limpar conversa |
| `Ctrl+S` | Save session | Salvar sessão |
| `Ctrl+,` | Open settings | Abrir configurações |
| `Esc` | Close modal | Fechar modal |
| `Ctrl+Shift+D` | Toggle debug mode | Alternar modo debug |

---

## 📝 Tips & Best Practices / Dicas e Melhores Práticas

**English:**
1. **Be specific:** Detailed prompts get better results
2. **Use iterations:** Let AI analyze and adapt
3. **Check outputs:** Review command results before proceeding
4. **Name sessions:** Easy to find and resume later
5. **Customize limits:** Adjust iterations based on task complexity

**Português:**
1. **Seja específico:** Prompts detalhados obtêm melhores resultados
2. **Use iterações:** Deixe a IA analisar e adaptar
3. **Verifique saídas:** Revise resultados de comandos antes de prosseguir
4. **Nomeie sessões:** Fácil de encontrar e retomar depois
5. **Personalize limites:** Ajuste iterações baseado na complexidade da tarefa

---

**For more help, see:**
- [User Manual](USER_MANUAL.md)
- [Installation Guide](INSTALL.md)
- [Contributing](CONTRIBUTING.md)

**Para mais ajuda, veja:**
- [Manual do Usuário](USER_MANUAL.md)
- [Guia de Instalação](INSTALL.md)
- [Contribuindo](CONTRIBUTING.md)


---

## 🧠 Cognitive Pipeline & TagDetector

### Stream Tag Detector (Phase 3.1)

**TagDetector** handles split XML-like tags during AI response streaming.

**Features:**
- Buffer management for split tags
- Multiple tag support (`<thinking>`, `</thinking>`)
- Zero data loss during streaming

**Status:** ✅ INTEGRATED (orchestrator.py)

---

### Cognitive Agents (Phase 2-3)

**7-Stage Pipeline:**
1. Build Context → 2. Stream AI → 3. Extract Commands → 4. Decide Plan → 5. Execute → 6. Build Feedback → 7. Check Continue

**Interfaces (Q2 2026):**
- PersonaProcessor (NULL) - Profile adaptation
- StrategyAnalyzer (NULL) - Response analysis
- RiskEvaluator (NULL) - Security assessment
- ExecutionRouter (✅) - Command routing

---

