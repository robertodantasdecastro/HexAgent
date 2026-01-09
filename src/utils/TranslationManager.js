/**
 * TranslationManager - Singleton class for managing translations
 * TranslationManager - Classe Singleton para gerenciar traduções
 * 
 * Features / Recursos:
 * - Singleton pattern for global access / Padrão Singleton para acesso global
 * - Observer pattern for real-time updates / Padrão Observer para atualizações em tempo real
 * - Auto-detection of missing translations / Auto-detecção de traduções faltantes
 * - LocalStorage persistence / Persistência em LocalStorage
 * 
 * @author Roberto Dantas de Castro
 */

import en from '../locales/en.json';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

class TranslationManager {
  /**
   * Singleton instance / Instância Singleton
   * @private
   */
  static instance = null;

  /**
   * Available translations / Traduções disponíveis
   * @private
   */
  translations = {
    en,
    pt,
    es
  };

  /**
   * Current language / Idioma atual
   * @private
   */
  currentLanguage = 'en';

  /**
   * Observers for language changes / Observadores para mudanças de idioma
   * @private
   */
  observers = [];

  /**
   * Missing translation keys tracker / Rastreador de chaves de tradução faltantes
   * @private
   */
  missingKeys = new Set();

  /**
   * Track used keys for auto-detection / Rastrear chaves usadas para auto-detecção
   * @private
   */
  usedKeys = new Set();

  /**
   * Callback to load language from external config / Callback para carregar idioma de config externa
   * @private
   */
  configLoadCallback = null;

  /**
   * Callback to save language to external config / Callback para salvar idioma em config externa
   * @private
   */
  configSaveCallback = null;

  /**
   * Private constructor (Singleton pattern)
   * Construtor privado (padrão Singleton)
   * @private
   */
  constructor() {
    if (TranslationManager.instance) {
      return TranslationManager.instance;
    }

    // Load language from external config or browser / Carrega idioma de config externa ou navegador
    this.loadLanguage();
    
    // Load missing keys from localStorage / Carrega chaves faltantes do localStorage
    this.loadMissingKeys();

    TranslationManager.instance = this;
  }

  /**
   * Get singleton instance / Obter instância singleton
   * @returns {TranslationManager}
   */
  static getInstance() {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  /**
   * Load language preference from external config or storage
   * Carregar preferência de idioma de config externa ou armazenamento
   * @private
   */
  loadLanguage() {
    // Try external config first / Tentar config externa primeiro
    if (this.configLoadCallback) {
      try {
        const configLang = this.configLoadCallback();
        if (configLang && ['en', 'pt', 'es', 'auto'].includes(configLang)) {
          if (configLang === 'auto') {
            this.currentLanguage = this.detectBrowserLanguage();
          } else {
            this.currentLanguage = configLang;
          }
          return;
        }
      } catch (error) {
        console.warn('[TranslationManager] Config load callback error:', error);
      }
    }
    
    // Fallback to localStorage / Fallback para localStorage
    const stored = localStorage.getItem('hexagent_language');
    if (stored && ['en', 'pt', 'es', 'auto'].includes(stored)) {
      if (stored === 'auto') {
        this.currentLanguage = this.detectBrowserLanguage();
      } else {
        this.currentLanguage = stored;
      }
    } else {
      this.currentLanguage = this.detectBrowserLanguage();
    }
  }

  /**
   * Detect browser language / Detectar idioma do navegador
   * @private
   * @returns {string}
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language.split('-')[0];
    return ['pt', 'es'].includes(browserLang) ? browserLang : 'en';
  }

  /**
   * Load missing keys from localStorage
   * Carregar chaves faltantes do localStorage
   * @private
   */
  loadMissingKeys() {
    try {
      const stored = localStorage.getItem('hexagent_missing_translations');
      if (stored) {
        const missing = JSON.parse(stored);
        this.missingKeys = new Set(missing);
      }
    } catch (error) {
      console.error('[TranslationManager] Failed to load missing keys:', error);
    }
  }

  /**
   * Save missing keys to localStorage
   * Salvar chaves faltantes no localStorage
   * @private
   */
  saveMissingKeys() {
    try {
      const missing = Array.from(this.missingKeys);
      localStorage.setItem('hexagent_missing_translations', JSON.stringify(missing));
    } catch (error) {
      console.error('[TranslationManager] Failed to save missing keys:', error);
    }
  }

  /**
   * Set callback to load language from external config
   * Definir callback para carregar idioma de config externa
   * @param {Function} callback - Function that returns language code
   */
  setConfigLoadCallback(callback) {
    if (typeof callback === 'function') {
      this.configLoadCallback = callback;
      // Reload language from config
      this.loadLanguage();
      this.notifyObservers();
    }
  }

  /**
   * Set callback to save language to external config
   * Definir callback para salvar idioma em config externa
   * @param {Function} callback - Function that receives language code
   */
  setConfigSaveCallback(callback) {
    if (typeof callback === 'function') {
      this.configSaveCallback = callback;
    }
  }

  /**
   * Set current language / Definir idioma atual
   * @param {string} language - Language code (en, pt, es, auto)
   */
  setLanguage(language) {
    let finalLang = language;
    
    if (language === 'auto') {
      finalLang = this.detectBrowserLanguage();
      this.currentLanguage = finalLang;
    } else if (['en', 'pt', 'es'].includes(language)) {
      this.currentLanguage = language;
    } else {
      console.warn(`[TranslationManager] Invalid language: ${language}`);
      return;
    }

    // Save via external callback or localStorage
    if (this.configSaveCallback) {
      try {
        this.configSaveCallback(language); // Save original (may be 'auto')
      } catch (error) {
        console.error('[TranslationManager] Config save callback error:', error);
        // Fallback to localStorage
        localStorage.setItem('hexagent_language', language);
      }
    } else {
      //Fallback to localStorage
      localStorage.setItem('hexagent_language', language);
    }

    // Notify all observers / Notificar todos os observadores
    this.notifyObservers();
  }

  /**
   * Get current language / Obter idioma atual
   * @returns {string}
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get stored language preference (may be 'auto')
   * Obter preferência de idioma armazenada (pode ser 'auto')
   * @returns {string}
   */
  getStoredLanguage() {
    return localStorage.getItem('hexagent_language') || 'auto';
  }

  /**
   * Translate a key / Traduzir uma chave
   * @param {string} key - Translation key (e.g., 'settings.title')
   * @param {string} fallback - Fallback text if translation not found
   * @returns {string}
   */
  translate(key, fallback = null) {
    // Track key usage / Rastrear uso da chave
    this.usedKeys.add(key);

    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (!value || typeof value !== 'object') {
        break;
      }
      value = value[k];
    }

    // If translation not found / Se tradução não encontrada
    if (value === undefined || value === null) {
      // Add to missing keys / Adicionar às chaves faltantes
      if (!this.missingKeys.has(key)) {
        this.missingKeys.add(key);
        this.saveMissingKeys();
        console.warn(`[TranslationManager] Missing translation: ${key} (${this.currentLanguage})`);
      }
      
      return fallback || key;
    }

    return value;
  }

  /**
   * Subscribe to language changes / Inscrever-se para mudanças de idioma
   * @param {Function} callback - Callback function
   */
  subscribe(callback) {
    if (typeof callback === 'function' && !this.observers.includes(callback)) {
      this.observers.push(callback);
    }
  }

  /**
   * Unsubscribe from language changes / Cancelar inscrição de mudanças de idioma
   * @param {Function} callback - Callback function
   */
  unsubscribe(callback) {
    this.observers = this.observers.filter(obs => obs !== callback);
  }

  /**
   * Notify all observers of language change
   * Notificar todos os observadores de mudança de idioma
   * @private
   */
  notifyObservers() {
    this.observers.forEach(callback => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error('[TranslationManager] Observer callback error:', error);
      }
    });
  }

  /**
   * Get missing translation keys / Obter chaves de tradução faltantes
   * @returns {Array<string>}
   */
  getMissingKeys() {
    return Array.from(this.missingKeys);
  }

  /**
   * Get used but missing keys (for development)
   * Obter chaves usadas mas faltantes (para desenvolvimento)
   * @returns {Array<string>}
   */
  detectMissingTranslations() {
    const missing = [];
    this.usedKeys.forEach(key => {
      const keys = key.split('.');
      let value = this.translations[this.currentLanguage];
      
      for (const k of keys) {
        if (!value || typeof value !== 'object') {
          value = undefined;
          break;
        }
        value = value[k];
      }
      
      if (value === undefined) {
        missing.push(key);
      }
    });
    
    return missing;
  }

  /**
   * Export missing translations as JSON
   * Exportar traduções faltantes como JSON
   * @returns {object}
   */
  exportMissingTranslations() {
    const missing = this.getMissingKeys();
    const result = {};
    
    missing.forEach(key => {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (i === keys.length - 1) {
          current[k] = `[TRANSLATE] ${key}`;
        } else {
          current[k] = current[k] || {};
          current = current[k];
        }
      }
    });
    
    return result;
  }

  /**
   * Clear missing keys tracker / Limpar rastreador de chaves faltantes
   */
  clearMissingKeys() {
    this.missingKeys.clear();
    localStorage.removeItem('hexagent_missing_translations');
  }

  /**
   * Get available languages / Obter idiomas disponíveis
   * @returns {Array<{code: string, name: string}>}
   */
  getAvailableLanguages() {
    return [
      { code: 'auto', name: 'Auto Detect / Auto Detectar' },
      { code: 'en', name: 'English' },
      { code: 'pt', name: 'Portuguese / Português' },
      { code: 'es', name: 'Spanish / Español' }
    ];
  }
}

export default TranslationManager;
