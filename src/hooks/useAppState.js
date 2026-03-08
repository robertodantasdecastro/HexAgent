/**
 * useAppState - React Hook for StateManager Integration
 * Hook React para Integração com StateManager
 * 
 * Provides reactive state management using StateManager with automatic re-renders.
 * Fornece gerenciamento de estado reativo usando StateManager com re-renderizações automáticas.
 * 
 * @author Antigravity AI
 * @version 1.0.0
 */

import { useCallback, useEffect, useState } from 'react';
import StateManager from '../utils/StateManager';

/**
 * React hook for accessing and managing application state
 * Hook React para acessar e gerenciar estado da aplicação
 * 
 * @param {string} slice - State slice name (session, ui, interaction, history, initialization)
 * @returns {Object} State slice and update functions
 * 
 * @example
 * const { state, setState, setMultiple } = useAppState('ui');
 * setState('isLoading', true);
 */
export function useAppState(slice) {
  const stateManager = StateManager.getInstance();
  
  // Initialize with current state / Inicializar com estado atual
  const [state, setLocalState] = useState(() => stateManager.getState(slice));

  // Update state / Atualizar estado
  const setState = useCallback((key, value) => {
    stateManager.setState(slice, key, value);
  }, [stateManager, slice]);

  // Update multiple values / Atualizar múltiplos valores
  const setMultiple = useCallback((updates) => {
    stateManager.setMultiple(slice, updates);
  }, [stateManager, slice]);

  // Subscribe to state changes / Inscrever-se para mudanças de estado
  useEffect(() => {
    const unsubscribe = stateManager.subscribe(slice, () => {
      // Update local state when StateManager changes
      // Atualizar estado local quando StateManager mudar
      setLocalState(stateManager.getState(slice));
    });

    // Cleanup on unmount / Limpar ao desmontar
    return unsubscribe;
  }, [stateManager, slice]);

  return {
    state,
    setState,
    setMultiple
  };
}

/**
 * Hook for accessing entire application state
 * Hook para acessar estado completo da aplicação
 * 
 * @returns {Object} All state slices and manager instance
 */
export function useGlobalAppState() {
  const stateManager = StateManager.getInstance();
  const [state, setLocalState] = useState(() => stateManager.getState());

  useEffect(() => {
    // Subscribe to all slices / Inscrever-se em todas as fatias
    const unsubscribers = [
      'session',
      'ui',
      'interaction',
      'history',
      'initialization'
    ].map(slice =>
      stateManager.subscribe(slice, () => {
        setLocalState(stateManager.getState());
      })
    );

    // Cleanup / Limpar
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [stateManager]);

  return {
    state,
    stateManager
  };
}

export default useAppState;
