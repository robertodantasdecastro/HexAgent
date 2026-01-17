/**
 * useSystemConfig Hook - Manages ONLY system configuration state
 * Hook useSystemConfig - Gerencia estado de configuração do sistema APENAS
 * 
 * Provides: system, services, UI, terminal settings
 * Fornece: configurações de sistema, serviços, UI, terminal
 */

import { useCallback, useEffect, useState } from 'react';
import Logger from '../utils/Logger';
import SystemConfigManager from '../utils/SystemConfigManager';

const useSystemConfig = () => {
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get manager instance / Obter instância do gerenciador
  const manager = SystemConfigManager.getInstance();
  const logger = Logger.getInstance();

  /**
   * Load system configuration on mount
   * Carregar configuração do sistema na montagem
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        logger.debug('[useSystemConfig] Initial load...');
        setLoading(true);
        setError(null);
        
        const config = await manager.load();
        setSystemConfig(config);
        
        logger.debug('[useSystemConfig] Loaded successfully');
      } catch (err) {
        logger.error('[useSystemConfig] Load error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  /**
   * Save system configuration to backend and reload
   * Salvar configuração do sistema no backend e recarregar
   */
  const saveSystemConfig = useCallback(async (newConfig) => {
    try {
      logger.debug('[useSystemConfig] Saving config...');
      setError(null);
      
      const configToSave = newConfig || systemConfig;
      
      // Log what we're saving
      const debugMode = configToSave?.system?.debug_mode;
      logger.debug(`[useSystemConfig] debug_mode = ${debugMode}`);
      
      // Save to backend
      await manager.save(configToSave);
      
      // Reload from backend to ensure sync
      const reloaded = await manager.load();
      setSystemConfig(reloaded);
      
      logger.info('[useSystemConfig] Save successful, reloaded');
      return true;
      
    } catch (err) {
      logger.error('[useSystemConfig] Save error:', err);
      setError(err);
      return false;
    }
  }, [systemConfig, manager]);

  /**
   * Update specific value in config (local state only, call save to persist)
   * Atualizar valor específico no config (apenas estado local, chamar save para persistir)
   */
  const updateSystemConfig = useCallback((path, value) => {
    setSystemConfig(prev => {
      if (!prev) return null;
      
      const updated = {...prev};
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) current[key] = {};
        current[key] = {...current[key]};
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  }, []);

  return {
    systemConfig,
    loading,
    error,
    saveSystemConfig,
    updateSystemConfig,
    reloadSystemConfig: () => manager.load().then(setSystemConfig)
  };
};

export default useSystemConfig;
