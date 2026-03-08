# 📊 Auditoria de Código do Backend (AUDIT_REPORT.md)

**Data:** 2026-02-22  
**Escopo:** `backend/` (Controllers, Services, Core, Utils, Providers)  
**Objetivo:** Identificar dependências, funções sem documentação (docstrings) e mapear "dead code" (stubs, TODOs, lógicas fantasmas) em preparação para as refatorações da **Fase A**.

---

## 1. Resumo Executivo
A análise estática via AST cobriu aproximadamente 50 arquivos Python. A estrutura arquitetural segue um padrão aceitável de Delegação (Controllers → Services/Core), porém **diversos endpoints e modos operacionais consistem apenas de stubs** não funcionais. A falta de docstrings em classes centrais de roteamento de resposta dificulta a inteligência do orquestrador.

## 2. Mapa de Dependências (Highlights)
* **`app.py`:** Atua como Registro Global. Importa diretamente `16 controllers` e diversos `services` (`hexstrike_manager`, `system_config_service`, `ai_config_service`, `process_monitor_service`). **Ponto Positivo:** Os controllers estão isolando bem as rotas do Flask.
* **`AgentCore` e `Orchestrator`:** Estão no centro do grafo de dependências, consumindo `CommandExecutor`, `HexStrikeClient`, `MCPManager`, `MemoryService` e `MonitoringService`.
* **Fluxo de Configuração:** Todos os controllers importam e dependem de implementações concretas de serviços de config (ex: `SystemConfigService`, `AIConfigService`), que herdam de `BaseConfigService`. **Ponto Positivo:** DRY bem aplicado nas configs.

## 3. Identificação de Stubs (Dead Code & TODOs)
Diversos controllers registrados em `app.py` têm métodos publicos, mas na verdade são "cascas vazias" aguardando implementação:

* **Stubs em Controllers (Ghost Endpoints):**
  * `controllers/project_controller.py`: **100% Stub**. `create_project`, `list_projects`, `delete_project`, e `get_project_tree` respondem com TODOs não funcionais.
  * `controllers/history_controller.py`: `get_shell_history` e `get_system_history` não têm implementação de leitura.
  * `controllers/system_controller.py`: `cleanup_system` exibe `# TODO: Implement actual cleanup logic` mas apenas envia uma resposta hardcoded.
* **Providers Fantasmas:**
  * `core/providers/ollama_strategy.py`: Todos os hooks de integração de stream, teste de conexão e discovery de modelos são assinalados com TODOs pendentes de desenvolvimento para Ollama local.
  * `core/providers/claude_strategy.py`: Rastro de `# TODO: Monitorar API Anthropic para futura capacidade de listagem`.

## 4. Dívida Técnica: Ausência de Docstrings
As seguintes camadas críticas carecem de docstrings (excluindo os `__init__` comuns):

* **Formatação de Resposta (`core/response_strategy.py`):**
  Todos os formatadores vitais carecem de payload mapping: `format()`, `create_text()`, `create_proposal()`, `create_result()`, `create_error()`, `create_block_start/end()`. A ausência prejudica iterações automáticas.
* **Classes de Domínio (`core/domain/response_block.py`):**
  Os inicializadores de subclasses `TextBlock`, `CommandProposalBlock`, `ExecutionResultBlock` não têm assinaturas tipadas ou docstrings, apesar de serem a espinha dorsal do frontend.
* **Provedores Genéricos:**
  Alguns métodos vitais como `get_provider_name` e `validate_config` em `OllamaStrategy`, `ClaudeStrategy`, e `FiveireStrategy` não possuem descrição do contrato.

## 5. Recomendação e Ordem Segura de Modificação (Fase A)
Dado este panorama, a execução das próximas etapas da Fase A deve seguir esta ordem restrita para evitar regressões nas áreas não cobertas por testes automatizados robustos:

1. **(A2)** Modificar `HexStrikeClient` primeiro, pois ele não expõe handlers Flask diretamente. A inserção de `execute_async` não afeta dependentes stubs.
2. **(A3)** Implementar streaming no `CommandExecutor`, atualizando as docstrings ausentes ao fazê-lo.
3. **(A4 / A5)** Criar a rota `POST /chat/abort` isoladamente no `chat_controller` e só invocar as integrações no `Orchestrator` quando os primitivos estiverem 100% testados, já que o Orchestrator acopla 9 dependências maiores.
