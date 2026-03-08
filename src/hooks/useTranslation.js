/**
 * useTranslation Hook - React hook for translations using OOP TranslationManager
 * useTranslation Hook - Hook React para traduções usando TranslationManager POO
 * 
 * Features / Recursos:
 * - Real-time language switching / Troca de idioma em tempo real
 * - Auto-detection of missing translations / Auto-detecção de traduções faltantes  
 * - Integration with TranslationManager / Integração com TranslationManager
 * 
 * @author Roberto Dantas de Castro
 */

import { useEffect, useState } from 'react';
import TranslationManager from '../utils/TranslationManager';

/**
 * Hook for translation with real-time updates
 * Hook para tradução com atualizações em tempo real
 * 
 * @returns {Object} Translation utilities / Utilitários de tradução
 */
export const useTranslation = () => {
  // Get singleton instance / Obter instância singleton
  const tm = TranslationManager.getInstance();
  
  // State for current language / Estado para idioma atual
  const [currentLang, setCurrentLang] = useState(tm.getLanguage());
  
  /**
   * Subscribe to language changes for real-time updates
   * Inscrever-se para mudanças de idioma para atualizações em tempo real
   */
  useEffect(() => {
    const handleLanguageChange = (newLanguage) => {
      setCurrentLang(newLanguage);
    };
    
    // Subscribe / Inscrever
    tm.subscribe(handleLanguageChange);
    
    // Cleanup / Limpeza
    return () => {
      tm.unsubscribe(handleLanguageChange);
    };
  }, [tm]);

  /**
   * Translation function / Função de tradução
   * @param {string} key - Translation key (e.g., 'settings.title')
   * @param {string} fallback - Optional fallback text
   * @returns {string} Translated text
   */
  const t = (key, fallback) => {
    return tm.translate(key, fallback);
  };

  /**
   * Set language and persist / Definir idioma e persistir
   * @param {string} lang - Language code (en, pt, es, auto)
   */
  const setLanguage = (lang) => {
    tm.setLanguage(lang);
  };

  /**
   * Get stored language preference (can be 'auto')
   * Obter preferência de idioma armazenada (pode ser 'auto')
   * @returns {string}
   */
  const getStoredLanguage = () => {
    return tm.getStoredLanguage();
  };

  return {
    t,                              // Translation function / Função de tradução
    language: currentLang,          // Current language / Idioma atual
    setLanguage,                    // Set language / Definir idioma
    getStoredLanguage,             // Get stored preference / Obter preferência armazenada
    availableLanguages: tm.getAvailableLanguages(), // Available languages / Idiomas disponíveis
    getMissingKeys: () => tm.getMissingKeys(),      // Get missing translations / Obter traduções faltantes
    exportMissing: () => tm.exportMissingTranslations() // Export missing / Exportar faltantes
  };
};
