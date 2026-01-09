/**
 * useAIConfig Hook - Manages ONLY AI configuration state
 * Hook useAIConfig - Gerencia estado de configuração de IA APENAS
 * 
 * Provides: AI engine, API, parameters settings
 * Fornece: configurações de engine IA, API, parâmetros
 */

import { useCallback, useEffect, useState } from 'react';
import AIConfigManager from '../utils/AIConfigManager';

const useAIConfig = () => {
  const [aiConfig, setAIConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get manager instance / Obter instância do gerenciador
  const manager = AIConfigManager.getInstance();

  /**
   * Load AI configuration on mount
   * Carregar configuração de IA na montagem
   */
  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('[useAIConfig] Initial load...');
        setLoading(true);
        setError(null);
        
        const config = await manager.load();
        setAIConfig(config);
        
        console.log('[useAIConfig] Loaded successfully');
      } catch (err) {
        console.error('[useAIConfig] Load error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  /**
   * Save AI configuration to backend and reload
   * Salvar configuração de IA no backend e recarregar
   */
  const saveAIConfig = useCallback(async (newConfig) => {
    try {
      console.log('[useAIConfig] Saving config...');
      setError(null);
      
      const configToSave = newConfig || aiConfig;
      
      // Log what we're saving (protect API key!)
      const hasKey = !!configToSave?.ai?.api_key;
      const model = configToSave?.ai?.model;
      console.log(`[useAIConfig] model=${model}, has_api_key=${hasKey}`);
      
      // Save to backend
      await manager.save(configToSave);
      
      // Reload from backend to ensure sync
      const reloaded = await manager.load();
      setAIConfig(reloaded);
      
      console.log('[useAIConfig] Save successful, reloaded');
      return true;
      
    } catch (err) {
      console.error('[useAIConfig] Save error:', err);
      setError(err);
      return false;
    }
  }, [aiConfig, manager]);

  /**
   * Update specific value in config (local state only, call save to persist)
   * Atualizar valor específico no config (apenas estado local, chamar save para persistir)
   */
  const updateAIConfig = useCallback((path, value) => {
    setAIConfig(prev => {
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
    aiConfig,
    loading,
    error,
    saveAIConfig,
    updateAIConfig,
    reloadAIConfig: () => manager.load().then(setAIConfig)
  };
};

export default useAIConfig;
