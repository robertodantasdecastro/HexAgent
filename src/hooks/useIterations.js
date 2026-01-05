/**
 * useIterations - Iteration management hook
 * Manages max iterations and current count
 * 
 * useIterations - Hook de gerenciamento de iterações
 * Gerencia máximo de iterações e contagem atual
 */

import { useCallback, useState } from 'react';

/**
 * useIterations Hook
 * Manages iteration limits and controls
 * 
 * Hook useIterations
 * Gerencia limites e controles de iteração
 * 
 * @param {number} initialMax - Initial max iterations / Máximo inicial de iterações
 * @returns {object} Iteration state and methods / Estado e métodos de iteração
 */
export function useIterations(initialMax = 10) {
  // State / Estado
  const [maxIterations, setMaxIterations] = useState(initialMax);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);

  /**
   * Increment iteration count
   * Incrementar contagem de iteração
   */
  const increment = useCallback(() => {
    if (isUnlimited) {
      setCurrentIteration(prev => prev + 1);
    } else {
      setCurrentIteration(prev => Math.min(prev + 1, maxIterations));
    }
  }, [isUnlimited, maxIterations]);

  /**
   * Decrement iteration count
   * Decrementar contagem de iteração
   */
  const decrement = useCallback(() => {
    setCurrentIteration(prev => Math.max(prev - 1, 0));
  }, []);

  /**
   * Reset iteration count
   * Resetar contagem de iteração
   */
  const reset = useCallback(() => {
    setCurrentIteration(0);
  }, []);

  /**
   * Set max iterations
   * Definir máximo de iterações
   * 
   * @param {number} max - New max value / Novo valor máximo
   */
  const setMax = useCallback((max) => {
    const validMax = Math.max(1, Math.min(max, 100)); // Limit 1-100
    setMaxIterations(validMax);
    if (currentIteration > validMax) {
      setCurrentIteration(validMax);
    }
  }, [currentIteration]);

  /**
   * Toggle unlimited mode
   * Alternar modo ilimitado
   */
  const toggleUnlimited = useCallback(() => {
    setIsUnlimited(prev => !prev);
  }, []);

  /**
   * Check if limit reached
   * Verificar se limite foi atingido
   * 
   * @returns {boolean} Is limit reached / Limite foi atingido
   */
  const isLimitReached = useCallback(() => {
    return !isUnlimited && currentIteration >= maxIterations;
  }, [isUnlimited, currentIteration, maxIterations]);

  /**
   * Get remaining iterations
   * Obter iterações restantes
   * 
   * @returns {number} Remaining iterations / Iterações restantes
   */
  const getRemaining = useCallback(() => {
    if (isUnlimited) return Infinity;
    return Math.max(0, maxIterations - currentIteration);
  }, [isUnlimited, maxIterations, currentIteration]);

  /**
   * Get progress percentage
   * Obter porcentagem de progresso
   * 
   * @returns {number} Progress 0-100 / Progresso 0-100
   */
  const getProgress = useCallback(() => {
    if (isUnlimited || maxIterations === 0) return 0;
    return Math.round((currentIteration / maxIterations) * 100);
  }, [isUnlimited, currentIteration, maxIterations]);

  return {
    // State / Estado
    maxIterations,
    currentIteration,
    isUnlimited,
    
    // Setters / Setters
    setMaxIterations: setMax,
    setCurrentIteration,
    setIsUnlimited,
    
    // Methods / Métodos
    increment,
    decrement,
    reset,
    toggleUnlimited,
    isLimitReached,
    getRemaining,
    getProgress
  };
}
