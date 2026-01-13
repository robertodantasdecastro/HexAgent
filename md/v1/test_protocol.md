# Configuration Persistence - Testing Protocol

## Objetivo
Rastrear o valor `debug_mode: true` através de TODO o pipeline para descobrir onde ele se perde.

---

## Lomgging Implementado

### Backend (Python)
```
[AUDIT-A] save_full_config called with keys: [...]
[AUDIT-B] System config debug_mode = True/False
[AUDIT-C] System config saved to file
[AUDIT-D] AI config saved to file
[AUDIT-E] load_full_config called
[AUDIT-F] Loaded debug_mode = True/False
```

### Frontend (JavaScript)
```
[AUDIT-1] useConfig.saveConfigToBackend called
[AUDIT-2] Received config debug_mode: true/false
[AUDIT-3] Config to save debug_mode: true/false
[AUDIT-4] Save successful, reloading from backend...
[AUDIT-5] Reloaded config debug_mode: true/false
[AUDIT-6] State updated in useConfig
```

---

## Teste 1: Fluxo de Salvamento

### Passos:
1. Execute: `hexagent-gui`
2. Abra DevTools (F12) - aba Console
3. Abra o terminal backend (já está aberto)
4. Abra Configurações
5. ✅ Ative `debug_mode`
6. ✅ Selecione idioma `Português`
7. Clique em "Salvar Alterações"

### O que verificar:

**No Console do Frontend:**
```
[AUDIT-1] useConfig.saveConfigToBackend called
[AUDIT-2] Received config debug_mode: TRUE  ← DEVE SER TRUE
[AUDIT-3] Config to save debug_mode: TRUE   ← DEVE SER TRUE
[ConfigManager] Saving to backend: {...}
[ConfigManager] Save response: success
[AUDIT-4] Save successful, reloading...
[AUDIT-5] Reloaded config debug_mode: TRUE  ← DEVE SER TRUE
[AUDIT-6] State updated in useConfig
```

**No Terminal Backend:**
```
[AUDIT-A] save_full_config called with keys: ['system', 'services', ...]
[AUDIT-B] System config debug_mode = True   ← DEVE SER True
[AUDIT-C] System config saved to file
```

**No Arquivo:**
```bash
cat ~/.hexagent-gui/system-config.json | grep debug_mode
# Deve retornar: "debug_mode": true
```

### ⚠️ Se algum desses valores estiver ERRADO, encontramos o ponto de falha!

---

## Teste 2: Fluxo de Carregamento

### Passos:
1. **FECHE o app completamente** (Ctrl+C no terminal)
2. Verifique o arquivo:
   ```bash
   cat ~/.hexagent-gui/system-config.json | grep debug_mode
   ```
   **DEVE mostrar:** `"debug_mode": true`

3. Execute novamente: `hexagent-gui`
4. Observe os logs

### O que verificar:

**No Terminal Backend (durante inicialização):**
```
[AUDIT-E] load_full_config called
[AUDIT-F] Loaded debug_mode = True  ← DEVE SER True
```

**No Console do Frontend:**
```
[ConfigManager] Loading from backend...
[AUDIT-5] Reloaded config debug_mode: TRUE  ← DEVE SER TRUE
```

**Na UI:**
- [ ] Botão "Salvar Chat" DEVE aparecer
- [ ] Idioma DEVE estar em Português
- [ ] Ao abrir Settings, checkbox `debug_mode` DEVE estar marcado

### ⚠️ Se algum desses está errado, encontramos o problema!

---

## Análise dos Resultados

### Cenário A: Falha no Save
Se `[AUDIT-2]` ou `[AUDIT-3]` mostrar `false`:
→ **Problema:** SettingsModal não está passando valor correto

### Cenário B: Falha no Backend
Se `[AUDIT-B]` mostrar `False` quando frontend mandou `true`:
→ **Problema:** Backend está perdendo o valor

### Cenário C: Falha no Arquivo
Se arquivo não mostra `"debug_mode": true`:
→ **Problema:** Escrita no arquivo falhou

### Cenário D: Falha no Load
Se `[AUDIT-F]` mostrar `False` quando arquivo tem `true`:
→ **Problema:** Backend não está lendo corretamente

### Cenário E: Falha no Frontend
Se `[AUDIT-5]` mostrar `false` quando backend retornou `true`:
→ **Problema:** Frontend não está processando resposta

### Cenário F: Falha na UI
Se tudo acima está `true` mas UI mostra `false`:
→ **Problema:** App.jsx não está usando config carregado

---

## Próximos Passos

Após identificar o ponto de falha:
1. Aplicar fix direcionado
2. Testar novamente
3. Confirmar persistência
4. Documentar solução

---

**EXECUTE OS TESTES E COMPARTILHE OS LOGS!**
