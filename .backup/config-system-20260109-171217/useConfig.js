/**
 * useConfig - Custom React hook for reactive configuration access
 * useConfig - Hook React personalizado para acesso reativo à configuração
 * 
 * Provides reactive access to ConfigManager with automatic updates when configuration changes.
 * Fornece acesso reativo ao ConfigManager com atualizações automáticas quando configuração muda.
 * 
 * Features / Recursos:
 * - Automatic subscription to config changes / Inscrição automática em mudanças
 * - Loading and error states / Estados de carregamento e erro
 * - Helper methods for common operations / Métodos auxiliares para operações comuns
 * 
 * @example
 * function MyComponent() {
 *   const { config, loading, error, updateConfig, resetConfig } = useConfig();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <div>
 *       <p>Language: {config.ai.language}</p>
 *       <button onClick={() => updateConfig('ai.language', 'pt')}>
 *         Switch to Portuguese
 *       </button>
 *     </div>
 *   );
 * }
 * 
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import ConfigManager from '../utils/ConfigManager';

/**
 * React hook for configuration management / Hook React para gerenciamento de configuração
 * 
 * @returns {Object} Configuration state and methods / Estado e métodos de configuração
 * @property {Object|null} config - Current configuration / Configuração atual
 * @property {boolean} loading - Loading state / Estado de carregamento
 * @property {Error|null} error - Error state / Estado de erro
 * @property {Function} updateConfig - Update config value / Atualizar valor de config
 * @property {Function} resetConfig - Reset to defaults / Resetar para padrões
 * @property {Function} saveConfig - Save to backend / Salvar no backend
 * @property {Function} get - Get config value / Obter valor de config
 */
export const useConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get ConfigManager singleton / Obter singleton do ConfigManager
  const cm = ConfigManager.getInstance();

  useEffect(() => {
    /**
     * Load initial configuration / Carregar configuração inicial
     */
    const loadInitialConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        await cm.load();
        setConfig(cm.getAll());
      } catch (err) {
        console.error('[useConfig] Load error:', err);
        setError(err);
        // Use defaults on error / Usar padrões em caso de erro
        setConfig(cm.getDefaults());
      } finally {
        setLoading(false);
      }
    };

    loadInitialConfig();

    /**
     * Observer callback for config changes / Callback observer para mudanças de config
     * @param {string} key - Changed key / Chave alterada
     * @param {*} newValue - New value / Novo valor
     */
    const handleConfigChange = (key, newValue) => {
      // Update state with latest config / Atualizar estado com config mais recente
      setConfig(cm.getAll());
    };

    // Subscribe to changes / Inscrever-se em mudanças
    cm.subscribe(handleConfigChange);

    // Cleanup subscription on unmount / Limpar inscrição ao desmontar
    return () => {
      cm.unsubscribe(handleConfigChange);
    };
  }, []);

  /**
   * Update configuration value / Atualizar valor de configuração
   * 
   * @param {string} key - Configuration key (dot notation) / Chave de configuração
   * @param {*} value - New value / Novo valor
   * @param {boolean} [autoSave=false] - Auto-save after update / Salvar automaticamente após atualizar
   */
  const updateConfig = async (key, value, autoSave = false) => {
    try {
      cm.set(key, value);
      
      if (autoSave) {
        await cm.save();
      }
    } catch (err) {
      console.error('[useConfig] Update error:', err);
      setError(err);
      throw err;
    }
  };

  /**
   * Reset configuration to defaults / Resetar configuração para padrões
   * 
   * @param {boolean} [autoSave=false] - Auto-save after reset / Salvar automaticamente após resetar
   */
  const resetConfig = async (autoSave = false) => {
    try {
      cm.reset();
      setConfig(cm.getAll());
      
      if (autoSave) {
        await cm.save();
      }
    } catch (err) {
      console.error('[useConfig] Reset error:', err);
      setError(err);
      throw err;
    }
  };

  const saveConfigToBackend = async (newConfig) => {
    try {
      console.log('[AUDIT-1] useConfig.saveConfigToBackend called');
      console.log('[AUDIT-2] Received config debug_mode:', newConfig?.system?.debug_mode);
      
      // Use provided config or current state
      const configToSave = newConfig || cm.getAll();
      console.log('[AUDIT-3] Config to save debug_mode:', configToSave?.system?.debug_mode);
      
      const success = await cm.save(configToSave);
      
      if (success) {
        console.log('[AUDIT-4] Save successful, reloading from backend...');
        
        // Reload from backend
        await cm.load();
        const updatedConfig = cm.getAll();
        
        console.log('[AUDIT-5] Reloaded config debug_mode:', updatedConfig?.system?.debug_mode);
        
        setConfig(updatedConfig);
        console.log('[AUDIT-6] State updated in useConfig');
      }
      
      return success;
    } catch (err) {
      console.error('[useConfig] Save error:', err);
      setError(err);
      return false;
    }
  };

  /**
   * Get configuration value / Obter valor de configuração
   * 
   * @param {string} key - Configuration key (dot notation) / Chave de configuração
   * @param {*} [defaultValue] - Default value / Valor padrão
   * @returns {*} Configuration value / Valor de configuração
   */
  const get = (key, defaultValue) => {
    return cm.get(key, defaultValue);
  };

  // Return hook interface / Retornar interface do hook
  return {
    config,
    loading,
    error,
    updateConfig,
    resetConfig,
    saveConfig: saveConfigToBackend,  // Export as both names for compatibility
    saveConfigToBackend,
    get
  };
};

export default useConfig;
