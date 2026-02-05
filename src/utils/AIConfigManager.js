/**
 * AI Configuration Manager - Handles ONLY AI engine and API settings
 * Gerenciador de Configuração de IA - Gerencia APENAS configurações de IA e API
 * 
 * Part of clean OOP separation between System and AI configurations
 * Parte da separação limpa POO entre configurações de Sistema e IA
 */

import APIClient from './APIClient';

class AIConfigManager {
  /**
   * Singleton instance / Instância singleton
   */
  static instance = null;

  /**
   * Get singleton instance / Obter instância singleton
   */
  static getInstance() {
    if (!AIConfigManager.instance) {
      AIConfigManager.instance = new AIConfigManager();
    }
    return AIConfigManager.instance;
  }

  constructor() {
    if (AIConfigManager.instance) {
      return AIConfigManager.instance;
    }

    this.config = null;
    this.api = APIClient.getInstance();
    AIConfigManager.instance = this;
  }

  /**
   * Load AI configuration from backend
   * Carregar configuração de IA do backend
   */
  async load() {
    try {
      console.log('[AIConfigManager] Loading from backend...');
      
      const result = await this.api.retry(
          () => this.api.get('/config/ai'),
          5, // attempts
          1000 // delay
      );
      
      if (result.success && result.data && result.data.config) {
        this.config = result.data.config;
        
        // Log what we loaded (protect API key!)
        const hasKey = !!this.config?.ai?.api_key;
        const model = this.config?.ai?.model;
        console.log(`[AIConfigManager] Loaded model=${model}, has_api_key=${hasKey}`);
        
        return this.config;
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('[AIConfigManager] Load error:', error);
      throw error;
    }
  }

  /**
   * Save AI configuration to backend
   * Salvar configuração de IA no backend
   */
  async save(configToSave) {
    try {
      const dataToSave = configToSave || this.config;
      
      // Log what we're saving (protect API key!)
      const hasKey = !!dataToSave?.ai?.api_key;
      const model = dataToSave?.ai?.model;
      console.log(`[AIConfigManager] Saving model=${model}, has_api_key=${hasKey}`);
      
      const result = await this.api.post('/config/ai', {config: dataToSave});
      
      if (result.success) {
        console.log('[AIConfigManager] Save successful');
        // Force reload to ensure synchronization with backend state
        await this.load(); 
        return true;
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (error) {
      console.error('[AIConfigManager] Save error:', error);
      throw error;
    }
  }

  /**
   * Get all AI configuration
   * Obter toda configuração de IA
   */
  getAll() {
    return this.config ? {...this.config} : null;
  }

  /**
   * Get specific value using dot notation
   * Obter valor específico usando notação de ponto
   */
  get(path) {
    if (!this.config) return undefined;
    
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  }

  /**
   * Set specific value using dot notation
   * Definir valor específico usando notação de ponto
   */
  set(path, value) {
    if (!this.config) this.config = {};
    
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}

export default AIConfigManager;
