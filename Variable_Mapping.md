# Variable Mapping & Synchronization Report
# Relatório de Mapeamento e Sincronização de Variáveis

> **Generated/Generado:** 2026-01-21
> **Status:** Synchronized (Sincronizado)

## 1. System Configuration (Configuração do Sistema)

| GUI State (Hook: `useSystemConfig`) | Backend Key (`system-config.json`) | Status | Access Path |
|-----------------------------------|------------------------------------|--------|-------------|
| `systemConfig.system.theme`       | `system.theme`                     | ✅ Sync | `SystemConfigService.load_system_config()` |
| `systemConfig.system.language`    | `system.language`                  | ✅ Sync | `SystemConfigService.load_system_config()` |
| `systemConfig.system.debug_mode`  | `system.debug_mode`                | ✅ Sync | `SystemConfigService.load_system_config()` |
| `systemConfig.ui.animations_enabled` | `ui.animations_enabled`         | ✅ Sync | `SystemConfigService.load_system_config()` |
| `systemConfig.services.hexstrike_port` | `services.hexstrike_port`     | ✅ Sync | `SystemConfigService.load_system_config()` |

## 2. AI Configuration (Configuração de IA)

| GUI State (Hook: `useAIConfig`)   | Backend Key (`ai-config.json`)     | Status | Access Path |
|-----------------------------------|------------------------------------|--------|-------------|
| `aiConfig.ai.engine`              | `ai.engine`                        | ✅ Sync | `AIConfigService.load_ai_config()` |
| `aiConfig.ai.model`               | `ai.model`                         | ✅ Sync | `AIConfigService.load_ai_config()` |
| `aiConfig.ai.api_key`             | `ai.api_key`                       | ✅ Sync | `AIConfigService.load_ai_config()` |
| `aiConfig.ai.temperature`         | `ai.temperature`                   | ✅ Sync | `AIConfigService.load_ai_config()` |
| `aiConfig.ai.max_tokens`          | `ai.max_tokens`                    | ✅ Sync | `AIConfigService.load_ai_config()` |
| `aiConfig.ai.host` (LM Studio)    | `ai.host`                          | ✅ Sync | `AIConfigService.load_ai_config()` |

## 3. Runtime State (Estado de Execução)

| GUI State (Hook: `useBackendInit`) | Backend Service                   | Status | Mechanism |
|------------------------------------|-----------------------------------|--------|-----------|
| `status` ("ONLINE"/"OFFLINE")      | `server.py` (Health Check)        | ✅ Sync | `APIClient.healthCheck()` |
| `serviceStatus.hexstrike`          | `HexStrike Client`                | ✅ Sync | `/status` endpoint |
| `serviceStatus.brain`              | `AgentCore`                       | ✅ Sync | `/status` endpoint |

## 4. OOP Architecture Alignment (Alinhamento Arquitetura POO)

- **Frontend**: 
    - `APIClient` (Singleton) -> Centralized HTTP
    - `SessionService` (Singleton/Repository) -> Manages `sessions`
    - `BaseService` (Abstract) -> Enforces Logging/API injection causes
- **Backend**:
    - `ConfigController` -> Separates `System` vs `AI` concerns
    - `AgentCore` -> Encapsulates Intelligence Logic
    - `HexStrikeClient` -> Encapsulates Execution Logic

## 5. Identified Bugs/Redundancies (Bugs/Redundâncias Identificadas)
- **Fixed**: `backend/services/config_service.py` was procedural and redundant (Deleted).
- **Fixed**: `install.sh` contained legacy migration logic (Refactored).
- **Verified**: `start_hexstrike.sh` now enforces unique VENV usage.
