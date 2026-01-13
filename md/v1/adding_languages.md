# Adding New Languages to HexAgentGUI
# Adicionando Novos Idiomas ao HexAgentGUI

**Date | Data:** 2026-01-10  
**System:** Automatic Language Detection  
**Current Languages:** English, Portuguese, Spanish

---

## Quick Start | Início Rápido

Adding a new language is as simple as adding a JSON file! The system automatically detects and loads it.

Adicionar um novo idioma é tão simples quanto adicionar um arquivo JSON! O sistema detecta e carrega automaticamente.

---

## Step-by-Step Guide | Guia Passo a Passo

### Step 1: Create Language File | Passo 1: Criar Arquivo de Idioma

**Location | Local:** `/src/locales/[language-code].json`

**Example for French | Exemplo para Francês:**
```bash
cp src/locales/en.json src/locales/fr.json
```

**Supported Language Codes:**
- `en` - English
- `pt` - Portuguese
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `ja` - Japanese
- `zh` - Chinese
- `ru` - Russian

---

### Step 2: Translate Content | Passo 2: Traduzir Conteúdo

Open the new file and translate all values (keep keys unchanged):

Abra o novo arquivo e traduza todos os valores (mantenha as chaves iguais):

**Before | Antes:**
```json
{
    "common": {
        "settings": "Settings",
        "save": "Save"
    }
}
```

**After (French) | Depois (Francês):**
```json
{
    "common": {
        "settings": "Paramètres",
        "save": "Enregistrer"
    }
}
```

---

### Step 3: Import in TranslationManager | Passo 3: Importar no TranslationManager

**File | Arquivo:** `/src/utils/TranslationManager.js`

**Add import at the top | Adicione import no topo:**
```javascript
import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';
import fr from '../locales/fr.json'; // NEW LANGUAGE
```

**Add to translations object | Adicione ao objeto translations:**
```javascript
translations = {
  en,
  pt,
  es,
  fr  // NEW LANGUAGE
};
``` **That's it! | É isso!** The language will automatically appear in the dropdown.

---

## Complete Checklist | Checklist Completo

### Before Adding Language | Antes de Adicionar Idioma
- [ ] Decide language code (ISO 639-1: `en`, `pt`, `es`, etc.)
- [ ] Check if language is in `languageNames` map in TranslationManager
- [ ] If not, add it to the mapping (see below)

### Adding Language | Adicionando Idioma
- [ ] Copy `en.json` to `[code].json`
- [ ] Translate all values in the JSON file
- [ ] Verify JSON is valid (use JSONLint.com)
- [ ] Import in `TranslationManager.js`
- [ ] Add to `translations` object
- [ ] (Optional) Add to `languageNames` map if not present

### Testing | Testando
- [ ] Build the app (`npm run build`)
- [ ] Install (`./install.sh`)
- [ ] Open settings modal
- [ ] Check new language appears in dropdown
- [ ] Select the language
- [ ] Verify UI updates to new language
- [ ] Check all components (modals, buttons, tooltips)

---

## Translation File Structure | Estrutura do Arquivo de Tradução

All language files must follow this structure:

Todos os arquivos de idioma devem seguir esta estrutura:

```json
{
    "common": {
        "hexagent_gui": "...",
        "settings": "...",
        "status": {
            "online": "...",
            "offline": "...",
            "disconnected": "..."
        },
        "copy": "...",
        "copy_text": "...",
        "copy_command": "...",
        "execute": "...",
        "executed": "...",
        "cancel": "...",
        "save": "...",
        "close": "...",
        "shutdown": "..."
    },
    "nav": {
        "history": "...",
        "services": "...",
        "workflows": "...",
        "help": "...",
        "settings": "..."
    },
    "block": { ... },
    "input": { ... },
    "settings": { ... },
    "appearance": { ... },
    "brain": { ... },
    "workflow": { ... },
    "loading": { ... }
}
```

**IMPORTANT | IMPORTANTE:** Keep all keys in English, translate only the values!

---

## Adding Language to TranslationManager Map | Adicionar Idioma ao Mapa

If adding a language not in the list, add it to `languageNames`:

Se adicionar um idioma não na lista, adicione ao `languageNames`:

**File | Arquivo:** `/src/utils/TranslationManager.js` (around line 340)

```javascript
const languageNames = {
  'en': 'English',
  'pt': 'Portuguese / Português',
  'es': 'Spanish / Español',
  'fr': 'French / Français',
  'de': 'German / Deutsch',
  'it': 'Italian / Italiano',
  'ja': 'Japanese / 日本語',
  'zh': 'Chinese / 中文',
  'ru': 'Russian / Русский',
  'ar': 'Arabic / العربية',      // ADD NEW LANGUAGES HERE
  'ko': 'Korean / 한국어'           // ADICIONE NOVOS IDIOMAS AQUI
};
```

---

## Browser Language Auto-Detection | Auto-Detecção de Idioma do Navegador

The system automatically detects the browser language on first run.

O sistema detecta automaticamente o idioma do navegador na primeira execução.

**Supported for auto-detection | Suportado para auto-detecção:**
- Portuguese (`pt`)
- Spanish (`es`)
- All others default to English (`en`)

**To add a language to auto-detection:**

**File:** `/src/utils/TranslationManager.js` (line ~124)

```javascript
detectBrowserLanguage() {
  const browserLang = navigator.language.split('-')[0];
  return ['pt', 'es', 'fr'].includes(browserLang) ? browserLang : 'en';
  //                    ^^ ADD NEW LANGUAGE CODE HERE
}
```

---

## Translation Keys Reference | Referência de Chaves de Tradução

### Required Sections | Seções Obrigatórias

1. **common** - Common UI elements
   - settings, status, buttons (copy, save, cancel, close, shutdown)

2. **nav** - Navigation buttons
   - history, services, workflows, help, settings

3. **block** - Chat blocks
   - Command proposals, iteration limits

4. **input** - Input area
   - Placeholder, modes, controls

5. **settings** - Settings modal
   - Tabs, options, descriptions

6. **appearance** - Appearance settings
   - Colors, themes

7. **brain** - AI configuration
   - Provider, model, API keys

8. **workflow** - Workflow manager
   - Workflow types, descriptions

9. **loading** - Loading screen
   - Component names, status messages

---

## Testing Translations | Testando Traduções

### Manual Testing | Teste Manual

1. Change language in settings
2. Check each modal:
   - Settings Modal
   - Services Modal
   - Workflow Modal
   - Help Modal
   - AI Config Modal
3. Verify navigation buttons
4. Check tooltips on hover
5. Test error messages

### Automated Detection | Detecção Automatizada

The TranslationManager tracks missing translations:

```javascript
// In browser console / No console do navegador
const tm = TranslationManager.getInstance();
console.log(tm.getMissingKeys());
```

This will show all translation keys used but not found.

Isso mostrará todas as chaves de tradução usadas mas não encontradas.

---

## Best Practices | Melhores Práticas

### DO | FAÇA
✅ Keep keys consistent across all language files  
✅ Use concise, clear translations  
✅ Test thoroughly before committing  
✅ Maintain same JSON structure  
✅ Use native speakers for translation when possible

### DON'T | NÃO FAÇA
❌ Change key names  
❌ Remove keys (keep empty string if not translated)  
❌ Break JSON formatting  
❌ Use machine translation without review  
❌ Forget to test in actual UI

---

## Common Issues | Problemas Comuns

### Language not appearing in dropdown
**Cause:** Not imported in TranslationManager  
**Fix:** Add import and add to translations object

### UI not updating after language change
**Cause:** Component not using `useTranslation` hook  
**Fix:** Import and use the hook in component

### Missing translations show as keys
**Cause:** Translation key doesn't exist in language file  
**Fix:** Add the key with translated value

### Language reverts to English
**Cause:** Invalid language code or localStorage error  
**Fix:** Check browser console, verify language code

---

## Future Enhancements | Melhorias Futuras

### Planned Features
- [ ] Online translation editor
- [ ] Crowdsourced translations
- [ ] Translation export/import
- [ ] Real-time preview
- [ ] Translation coverage percentage
- [ ] Automated testing

---

## Contributing Translations | Contribuindo Traduções

We welcome translation contributions!

Aceitamos contribuições de traduções!

**How to contribute | Como contribuir:**

1. Fork the repository
2. Create language file following this guide
3. Test thoroughly
4. Submit pull request
5. Include screenshots of UI in new language

**Translation Credits | Créditos de Tradução:**
- English: Roberto Dantas de Castro
- Portuguese: Roberto Dantas de Castro
- Spanish: Roberto Dantas de Castro
- [Your Language]: [Your Name]

---

##Example: Adding French | Exemplo: Adicionando Francês

**Complete Steps:**

```bash
# 1. Create file
cp src/locales/en.json src/locales/fr.json

# 2. Edit file
nano src/locales/fr.json
# Translate all values...

# 3. Edit TranslationManager
nano src/utils/TranslationManager.js
```

**TranslationManager.js changes:**
```javascript
// Line ~14
import fr from '../locales/fr.json';

// Line ~29
translations = {
  en,
  pt,
  es,
  fr
};

// Already in languageNames map (line ~340), no change needed!
```

```bash
# 4. Build and install
npm run build
./install.sh

# 5. Test
hexagent-gui
# Settings → Language → Select "French / Français"
```

---

**Created by:** Antigravity AI + Roberto Dantas de Castro  
**Last Updated:** 2026-01-10  
**Version:** 1.0.0
