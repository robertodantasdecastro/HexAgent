# LiveMemory — HexAgentGUI

## Estado Atual: v2.1-stable ✅

**Data**: 2026-03-09

---

## Arquitetura Ativa

- **Backend**: Flask (porta 5001) + Python 3 no venv dedicado
- **Frontend**: React (Electron) — bundle em `~/.hexagent-gui/app/`
- **HexStrike-AI**: Servidor Python paralelo (porta 8888)
- **Config root**: `~/.hexagent-gui/`
- **Install**: `HexAgentGUI/install.sh` (fonte única de verdade)
- **Execução**: `export DISPLAY=:0 && hexagent-gui`

---

## Recursos Implementados (v2.1-stable)

### Sudo Mode (Fase 7)
- Modal `SudoModal.jsx`: senha + checkbox de risco obrigatório
- Botão `🛡️ Root Access` no `InferencePanel` ao lado de `Auto-Exec`
- `SecurityService`: credencial em RAM apenas (sem disco)
- Interceptor automático em `HexStrikeClient.execute_command()` E `CommandExecutor.execute_streaming()`
- Endpoint: `POST /security/sudo` (autenticar), `DELETE /security/sudo` (revogar), `GET /security/sudo` (status)

### Bugs Críticos Corrigidos
- `persona_service.get_persona()` → `load_persona()` (causava AgentCore = None)
- Leitura de `res.elevated` → `res.data?.elevated` (envelope JSON desalinhado)
- Interceptor sudo faltando no `HexStrikeClient` (comandos iam sem senha)

---

## Próximas Etapas

1. **Testes de Instalação** em ambiente experimental limpo
2. **Fase 8**: GAP Analysis — análise diferencial de recursos
3. **Fase 9**: Pipeline de pós-treino — dados para fine-tuning

---

## Regras de Sessão
- Config path: `~/.hexagent-gui/`
- Compilar/instalar: SEMPRE via `./install.sh`
- Executar: `export DISPLAY=:0 && hexagent-gui`
- Sudo root: interface normal + autenticação in-app
