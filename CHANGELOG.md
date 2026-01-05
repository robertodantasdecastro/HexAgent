# Changelog / Registro de Alterações
All notable changes to HexAgentGUI will be documented in this file.  
Todas as mudanças notáveis no HexAgentGUI serão documentadas neste arquivo.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-01-05

### Added / Adicionado
- **📚 Comprehensive Documentation** / **Documentação Abrangente**
  - Created `FEATURES.md` with bilingual feature descriptions
  - Created `ARCHITECTURE.md` with system architecture diagrams
  - Added `CHANGELOG.md` for version tracking
  - Enhanced code comments (EN/PT) throughout codebase
  
- **🎨 Smart Block System** / **Sistema de Blocos Inteligentes**
  - Intelligent block type detection (CODE, SHELL, LOG, ERROR, etc.)
  - Context-aware action buttons
  - Automatic ANSI color rendering
  - Line wrapping for long outputs
  
- **📜 Script Management** / **Gerenciamento de Scripts**
  - Save scripts with auto-path suggestion
  - Execute scripts with custom arguments
  - Debug mode with language-specific flags
  - Real-time execution output with ANSI colors
  
- **🔄 Iteration Controls** / **Controles de Iteração**
  - Quick access iteration counter in UI
  - Increment/decrement buttons
  - Unlimited mode toggle
  - Detailed settings dialog

### Changed / Modificado
- **⚡ Performance Improvements** / **Melhorias de Performance**
  - Added bilingual JSDoc comments to all major functions
  - Optimized ANSI rendering with better caching
  - Improved block detection logic
  - Enhanced code organization and readability

### Fixed / Corrigido
- **🐛 Bug Fixes** / **Correções de Bugs**
  - Fixed ANSI color rendering in shell outputs (colors now display correctly)
  - Fixed line wrapping in OUTPUT blocks (no more horizontal scroll)
  - Fixed missing `hasAnsiCodes` import causing crashes
  - Fixed `config_dir` undefined error in backend
  - Removed duplicate `AnsiRenderer` implementation

---

## [1.0.0] - 2026-01-04

### Initial Release / Lançamento Inicial

**English:**
First public release of HexAgentGUI - An autonomous AI-powered cybersecurity agent with modern GUI.

**Português:**
Primeiro lançamento público do HexAgentGUI - Um agente de IA autônomo para cibersegurança com interface gráfica moderna.

### Features / Recursos

#### Core / Núcleo
- ✅ Autonomous AI agent with iterative feedback loop
- ✅ Real-time streaming responses
- ✅ Command execution with output capture
- ✅ Bilingual support (English/Portuguese)
- ✅ Dark mode cyberpunk-inspired UI

#### AI & Execution / IA e Execução
- ✅ HexSecGPT brain integration
- ✅ HexStrike execution engine
- ✅ OpenRouter API support
- ✅ Web search integration (optional)
- ✅ Up to  10 autonomous iterations
- ✅ Stop generation button

#### UI Components / Componentes da UI
- ✅ Main chat interface
- ✅ Settings modal (General, AI, Appearance, Advanced)
- ✅ Session management (Save/Load/Delete)
- ✅ Help modal with documentation
- ✅ Loading screen with initialization status
- ✅ Welcome dialog for first-run setup
- ✅ Shutdown modal with graceful exit

#### Session & Config / Sessão e Configuração
- ✅ Auto-save sessions
- ✅ Named session support
- ✅ Hierarchical configuration system (templates → user → runtime)
- ✅ JSON-based config files
- ✅ Per-user configuration directory (`~/.hexagent-gui/config/`)

#### Developer Features / Recursos para Desenvolvedores
- ✅ Electron-based desktop app
- ✅ React 18 frontend
- ✅ Flask Python backend
- ✅ Vite build system
- ✅ TailwindCSS styling
- ✅ Cross-platform support (Linux, macOS, Windows)

---

## [0.9.0] - 2026-01-03 (Beta)

### Added / Adicionado
- Beta release for internal testing
- Basic autonomous agent functionality
- Simple UI with message history
- Command execution support

### Known Issues / Problemas Conhecidos
- ❌ ANSI colors not rendering in outputs
- ❌ No line wrapping in long outputs
- ❌ Missing iteration controls in UI
- ❌ Limited documentation

---

## Upgrade Guide / Guia de Atualização

### From 1.0.0 to 1.1.0 / De 1.0.0 para 1.1.0

**English:**
1. Pull latest changes: `git pull origin main`
2. Run installer: `./install.sh`
3. Restart HexAgentGUI
4. No configuration changes required - backward compatible!

**Português:**
1. Puxar últimas mudanças: `git pull origin main`
2. Executar instalador: `./install.sh`
3. Reiniciar HexAgentGUI
4. Nenhuma mudança de configuração necessária - compatível com versão anterior!

---

## Future Roadmap / Roteiro Futuro

### v1.2.0 (Planned / Planejado)
- TypeScript migration
- Unit test coverage
- Plugin system for custom blocks
- Enhanced performance optimizations

### v1.3.0
- Multi-language support (Spanish, French, German)
- Cloud sync for sessions
- Mobile app (React Native)

### v2.0.0
- Local LLM support (Ollama, LM Studio)
- Collaborative mode (multi-user)
- Advanced security features
- Enterprise deployment options

---

## Support / Suporte

**English:**
For issues, feature requests, or questions:
- GitHub Issues: https://github.com/robertodantasdecastro/HexAgent/issues
- Email: robertodantasdecastro@gmail.com

**Português:**
Para problemas, solicitações de recursos ou perguntas:
- Issues no GitHub: https://github.com/robertodantasdecastro/HexAgent/issues
- Email: robertodantasdecastro@gmail.com

---

**Maintained by / Mantido por:** Roberto Dantas de Castro  
**License / Licença:** MIT  
**Repository / Repositório:** https://github.com/robertodantasdecastro/HexAgent
