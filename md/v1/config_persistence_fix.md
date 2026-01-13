# Configuration Persistence Bug - Complete Fix

**Date:** 2026-01-09  
**Issue:** Settings don't persist after app restart

---

## 🔍 Problem Identified

User saves settings in SettingsModal:
- ✅ Debug mode: ON
- ✅ Language: Portuguese  
- ✅ Clicks "Salvar Alterações"

But after restarting app:
- ❌ Settings revert to defaults
- ❌ File shows `debug_mode: false`

---

## 🕵️ Root Cause Analysis

### Issue #1: SettingsModal doesn't pass config

**File:** `src/components/SettingsModal.jsx` Line 569

```jsx
// BEFORE - onClick without arguments
<button onClick={onSave}>
  Salvar Alterações
</button>

// onSave() called with NO config!
```

**Why this breaks:**
- SettingsModal has local state with user changes
- Button calls `onSave()` with zero arguments
- useConfig.saveConfigToBackend expects config data
- Backend saves EMPTY/DEFAULT config

**Fix Applied:**
```jsx
// AFTER - Pass local config state
<button onClick={() => {
  console.log('[SettingsModal] Saving:', config);
  onSave(config);  // ← Pass local state!
}}>
```

---

### Issue #2: useConfig doesn't handle config parameter

**File:** `src/hooks/useConfig.js` Lines 136-166

```javascript
// BEFORE - No parameter handling
const saveConfig = async () => {
  await cm.save();  // ← Uses internal state only
}
```

**Why this breaks:**
- Receives config from Modal but ignores it
- Always saves old ConfigManager state
- New user changes never reach backend

**Fix Applied:**
```javascript
// AFTER - Accept and use config parameter
const saveConfigToBackend = async (newConfig) => {
  const configToSave = newConfig || cm.getAll();
  await cm.save(configToSave);  // ← Save provided config!
  
  // Reload from backend to confirm
  await cm.load();
  setConfig(cm.getAll());
}
```

---

### Issue #3: ConfigManager.save() hardcoded to use this.config

**File:** `src/utils/ConfigManager.js` Lines 195-216

```javascript
// BEFORE - Always uses internal state
async save() {
  body: JSON.stringify({ 
    config: this.config  // ← Hardcoded!
  })
}
```

**Why this breaks:**
- Even if useConfig passes new config
- ConfigManager ignores it
- Always saves old internal state

**Fix Applied:**
```javascript
// AFTER - Accept optional config parameter
async save(configToSave) {
  const dataToSave = configToSave || this.config;
  console.log('[ConfigManager] Saving:', dataToSave);
  
  body: JSON.stringify({ config: dataToSave })
}
```

---

### Issue #4: useConfig doesn't export saveConfig

**File:** `src/hooks/useConfig.js` Line 191-195

```javascript
// BEFORE - Function renamed but export not updated
return {
  updateConfig,
  resetConfig,
  saveConfig  // ← ReferenceError! Function was renamed!
}
```

**Why this breaks:**
- Function renamed to `saveConfigToBackend`
- Return statement still references old name
- `ReferenceError: saveConfig is not defined`
- **App crashes on load!**

**Fix Applied:**
```javascript
// AFTER - Export both names for compatibility
return {
  updateConfig,
  resetConfig,
  saveConfig: saveConfigToBackend,  // ← Alias!
  saveConfigToBackend,  // Also export new name
  get
}
```

---

## ✅ Complete Fix Summary

### Files Modified: 3

1. **SettingsModal.jsx**
   - Line 569: Pass `config` to `onSave(config)`
   
2. **useConfig.js**  
   - Lines 136-166: Accept `newConfig` parameter
   - Lines 191-195: Export `saveConfig` as alias
   
3. **ConfigManager.js**
   - Lines 195-216: Accept optional `configToSave` parameter

---

## 🧪 Testing Flow

### Before Fix:
```
1. User changes: debug_mode = true
2. SettingsModal → onSave()  [no args]
3. useConfig → saveConfigToBackend()  [no args]
4. ConfigManager → save()  [uses old state]
5. Backend saves: debug_mode = false  ❌
```

### After Fix:
```
1. User changes: debug_mode = true
2. SettingsModal → onSave(config)  [✅ passes config]
3. useConfig → saveConfigToBackend(config)  [✅ receives it]
4. ConfigManager → save(config)  [✅ uses new state]
5. Backend saves: debug_mode = true  ✅
6. useConfig → load()  [✅ reloads from file]
7. UI updates with saved values  ✅
```

---

## 🔧 Verification Steps

1. ✅ Build successful (no syntax errors)
2. ✅ App loads without crashes
3. ⏳ Test save/load cycle:
   - Open Settings
   - Enable debug mode
   - Change language to PT
   - Click "Salvar Alterações"
   - **Close app completely**
   - Reopen app
   - Open Settings
   - **Verify settings persisted**

4. ⏳ Check file:
```bash
cat ~/.hexagent-gui/system-config.json
# Should show:
# "debug_mode": true
# (not false)
```

---

## 🎯 Status

**Code Changes:** ✅ Complete  
**Build:** ✅ Successful  
**Installation:** 🔄 In progress  
**Testing:** ⏳ Pending user verification

---

## 📝 Lessons Learned

1. **Always pass state explicitly** - Don't rely on closure scope
2. **Parameters over globals** - Functions should accept what they need
3. **Reload after save** - Verify persistence by reloading from source
4. **Export aliases** - Maintain backwards compatibility during refactoring
5. **Log extensively** - Console logs helped identify the exact breakage point

---

**Next:** User should test save/load cycle to confirm fix works end-to-end.
