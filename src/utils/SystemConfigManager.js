/**
 * System Configuration Manager - Handles ONLY system, services, UI, and terminal settings
 * Gerenciador de Configuração do Sistema - Gerencia APENAS configurações de sistema, serviços, UI e terminal
 * 
 * Part of clean OOP separation between System and AI configurations
 * Parte da separação limpa POO entre configurações de Sistema e IA
 */

import APIClient from './APIClient';

class SystemConfigManager {
  /**
   * Singleton instance / Instância singleton
   */
  static instance = null;

  /**
   * Get singleton instance / Obter instância singleton
   */
  static getInstance() {
    if (!SystemConfigManager.instance) {
      SystemConfigManager.instance = new SystemConfigManager();
    }
    return SystemConfigManager.instance;
  }

  constructor() {
    if (SystemConfigManager.instance) {
      return SystemConfigManager.instance;
    }

    this.config = null;
    this.api = APIClient.getInstance();
    SystemConfigManager.instance = this;
  }

  /**
   * Load system configuration from backend
   * Carregar configuração do sistema do backend
   */
  async load() {
    try {
      console.log('[SystemConfigManager] Loading from backend...');
      
      const result = await this.api.get('/config/system');
      
      if (result.success && result.data && result.data.config) {
        this.config = result.data.config;
        
        // Log what we loaded
        const debugMode = this.config?.system?.debug_mode;
        console.log(`[SystemConfigManager] Loaded debug_mode = ${debugMode}`);
        
        return this.config;
      } else {
        throw new Error(result.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('[SystemConfigManager] Load error:', error);
      throw error;
    }
  }

  /**
   * Save system configuration to backend
   * Salvar configuração do sistema no backend
   */
  async save(configToSave) {
    try {
      const dataToSave = configToSave || this.config;
      
      // Log what we're saving
      const debugMode = dataToSave?.system?.debug_mode;
      console.log(`[SystemConfigManager] Saving debug_mode = ${debugMode}`);
      console.log('[SystemConfigManager] Payload:', JSON.stringify(dataToSave, null, 2));
      
      const result = await this.api.post('/config/system', {config: dataToSave});
      
      if (result.success) {
        console.log('[SystemConfigManager] Save successful');
        this.config = dataToSave;
        return true;
      } else {
        throw new Error(result.message || 'Save failed');
      }
    } catch (error) {
      console.error('[SystemConfigManager] Save error:', error);
      throw error;
    }
  }

  /**
   * Get all system configuration
   * Obter toda configuração do sistema
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

export default SystemConfigManager;
