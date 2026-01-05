/**
 * useConfig - Configuration management hook
 * Manages app configuration and color themes
 * 
 * useConfig - Hook de gerenciamento de configuração
 * Gerencia configuração da aplicação e temas de cores
 */

import { useCallback, useEffect, useState } from 'react';
import { APIService } from '../services';

/**
 * useConfig Hook
 * Manages configuration state and persistence
 * 
 * Hook useConfig
 * Gerencia estado de configuração e persistência
 * 
 * @returns {object} Config state and methods / Estado e métodos de configuração
 */
export function useConfig() {
  // State / Estado
  const [config, setConfig] = useState(null);
  const [colors, setColors] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load configuration from backend
   * Carregar configuração do backend
   */
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await APIService.loadConfig();
      
      setConfig(data);
      setColors(data?.ui || {});
      
    } catch (err) {
      console.error('[useConfig] loadConfig failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save configuration to backend
   * Salvar configuração no backend
   * 
   * @param {object} newConfig - New configuration / Nova configuração
   */
  const saveConfig = useCallback(async (newConfig) => {
    try {
      setError(null);
      
      await APIService.saveConfig(newConfig);
      
      setConfig(newConfig);
      setColors(newConfig?.ui || {});
      
    } catch (err) {
      console.error('[useConfig] saveConfig failed:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Update configuration locally
   * Atualizar configuração localmente
   * 
   * @param {object|function} updater - Update object or function / Objeto ou função de atualização
   */
  const updateConfig = useCallback((updater) => {
    setConfig(prev => {
      if (typeof updater === 'function') {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  }, []);

  /**
   * Update colors
   * Atualizar cores
   * 
   * @param {object} newColors - New colors / Novas cores
   */
  const updateColors = useCallback((newColors) => {
    setColors(prev => ({ ...prev, ...newColors }));
    updateConfig(prev => ({
      ...prev,
      ui: { ...prev?.ui, ...newColors }
    }));
  }, [updateConfig]);

  /**
   * Reset to default configuration
   * Resetar para configuração padrão
   */
  const resetConfig = useCallback(async () => {
    try {
      setError(null);
      
      // Default config / Configuração padrão
      const defaultConfig = {
        ai: {
          language: 'auto',
          model: 'openai/gpt-4-turbo',
          temperature: 0.7,
          max_iterations: 10,
          unlimited_iterations: false
        },
        ui: {
          theme: 'dark',
          show_iteration_markers: true
        }
      };
      
      await saveConfig(defaultConfig);
      
    } catch (err) {
      console.error('[useConfig] resetConfig failed:', err);
      setError(err.message);
      throw err;
    }
  }, [saveConfig]);

  /**
   * Get specific config value
   * Obter valor específico de configuração
   * 
   * @param {string} path - Config path (e.g., 'ai.model') / Caminho de configuração
   * @param {any} defaultValue - Default value / Valor padrão
   * @returns {any} Config value / Valor de configuração
   */
  const getConfigValue = useCallback((path, defaultValue = null) => {
    if (!config) return defaultValue;
    
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }, [config]);

  // Load config on mount / Carregar configuração ao montar
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    // State / Estado
    config,
    colors,
    isLoading,
    error,
    
    // Methods / Métodos
    loadConfig,
    saveConfig,
    updateConfig,
    updateColors,
    resetConfig,
    getConfigValue
  };
}
