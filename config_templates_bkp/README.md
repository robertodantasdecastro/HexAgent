# HexAgentGUI Configuration Templates

This directory contains default configuration templates that are copied to the user's home directory (`~/.hexagent-gui/config/`) during installation.

## Structure

```
config_templates/
├── core/              # Core application settings
├── ai/                # AI model & provider configs
├── terminal/          # Terminal & shell settings
├── deps/              # Dependency configurations
├── features/          # Feature flags & settings
├── preferences/       # User preferences
└── ui/                # UI/UX configurations
```

## Files

### Core (`core/`)
- **general.json** - Main application settings
- **api_keys.json** - API keys (kept empty for security)
- **servers.json** - Server ports and hosts

### AI (`ai/`)
- **models.json** - Available AI models
- **providers.json** - AI provider configurations (OpenAI, OpenRouter, etc.)
- **brain.json** - AI brain/agent settings

### Terminal (`terminal/`)
- **commands.json** - System commands (/exit, /clean, @)
- **shell.json** - Shell configuration
- **history.json** - Command history settings

### Dependencies (`deps/`)
- **hexstrike.json** - HexStrike AI configuration
- **hexsecgpt.json** - HexSecGPT configuration

### Features (`features/`)
- **auto_execute.json** - Auto-execution settings
- **iterations.json** - Iteration limits
- **web_search.json** - Web search configuration
- **sessions.json** - Session management

### Preferences (`preferences/`)
- **user.json** - User preferences
- **shortcuts.json** - Keyboard shortcuts
- **language.json** - Language settings

### UI (`ui/`)
- **colors.json** - ANSI & UI colors
- **theme.json** - Theme configuration
- **layout.json** - UI layout
- **animations.json** - Animation settings

## How It Works

1. **Installation:** Templates are copied to `~/.hexagent-gui/config/`
2. **Updates:** New variables are merged into existing configs
3. **Preservation:** User customizations are never overwritten
4. **Backup:** Automatic backups before any merge operation

## Customization

Edit files in `~/.hexagent-gui/config/` to customize your installation. Never edit files in this `config_templates/` directory directly.

## Validation

All config files are validated against JSON schema during load. Invalid configs will fall back to defaults.
