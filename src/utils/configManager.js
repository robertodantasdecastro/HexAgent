/**
 * Config Manager Utility for HexAgentGUI Frontend
 * Gerenciador de Configurações para o Frontend do HexAgentGUI
 * 
 * Handles loading, saving, and validating config data from backend
 * Gerencia carregamento, salvamento e validação de dados de config do backend
 */

const CONFIG_API_BASE = 'http://localhost:5000/config';

/**
 * Load a specific config from backend
 * Carregar uma config específica do backend
 * @param {string} type - Config type (e.g., 'ai/models', 'core/general')
 * @returns {Promise<object>} Config data
 */
export async function loadConfig(type) {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/user/${type}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${type}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[ConfigManager] Load error for ${type}:`, error);
    return null;
  }
}

/**
 * Save config to backend
 * Salvar config no backend
 * @param {string} type - Config type
 * @param {object} data - Config data to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveConfig(type, data) {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/user/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Save failed');
    }
    
    return true;
  } catch (error) {
    console.error(`[ConfigManager] Save error for ${type}:`, error);
    throw error;
  }
}

/**
 * Validate config data
 * Validar dados de config
 * @param {string} type - Config type
 * @param {object} data - Config data to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateConfig(type, data) {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    
    return await response.json();
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Merge config with existing
 * Mesclar config com existente
 * @param {string} type - Config type
 * @param {object} data - New data to merge
 * @returns {Promise<object>} Merged config
 */
export async function mergeConfig(type, data) {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.merged;
  } catch (error) {
    console.error(`[ConfigManager] Merge error:`, error);
    throw error;
  }
}

/**
 * List available backups
 * Listar backups disponíveis
 * @returns {Promise<Array>} List of backups
 */
export async function listBackups() {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/backup/list`);
    const data = await response.json();
    return data.backups || [];
  } catch (error) {
    console.error(`[ConfigManager] List backups error:`, error);
    return [];
  }
}

/**
 * Restore config from backup
 * Restaurar config de backup
 * @param {string} timestamp - Backup timestamp
 * @returns {Promise<boolean>} Success status
 */
export async function restoreBackup(timestamp) {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/restore/${timestamp}`, {
      method: 'POST'
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return true;
  } catch (error) {
    console.error(`[ConfigManager] Restore error:`, error);
    throw error;
  }
}

/**
 * Get full config tree
 * Obter árvore completa de configs
 * @returns {Promise<object>} Config tree
 */
export async function getConfigTree() {
  try {
    const response = await fetch(`${CONFIG_API_BASE}/tree`);
    const data = await response.json();
    return data.tree || {};
  } catch (error) {
    console.error(`[ConfigManager] Tree error:`, error);
    return {};
  }
}

/**
 * Load multiple configs at once
 * Carregar múltiplas configs de uma vez
 * @param {Array<string>} types - Array of config types
 * @returns {Promise<object>} Object with all configs
 */
export async function loadMultipleConfigs(types) {
  const configs = {};
  
  await Promise.all(
    types.map(async (type) => {
      configs[type] = await loadConfig(type);
    })
  );
  
  return configs;
}

export default {
  loadConfig,
  saveConfig,
  validateConfig,
  mergeConfig,
  listBackups,
  restoreBackup,
  getConfigTree,
  loadMultipleConfigs
};
