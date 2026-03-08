/**
 * StateManager - Centralized Application State Management
 * Gerenciador de Estado Centralizado da Aplicação
 * 
 * Manages all application state with observer pattern for reactive updates.
 * Gerencia todo o estado da aplicação com padrão observer para atualizações reativas.
 * 
 * @pattern Singleton + Observer + State
 * @author Antigravity AI
 * @version 1.0.0
 */

class StateManager {
  /**
   * Singleton instance / Instância Singleton
   * @private
   * @static
   */
  static _instance = null;

  /**
   * State store / Armazém de estado
   * @private
   */
  _state = {
    // Session state / Estado da sessão
    session: {
      blocks: [],
      currentSessionName: '',
      openFiles: [],
      activeFileIndex: 0
    },
    
    // UI state / Estado da interface
    ui: {
      input: '',
      isLoading: false,
      status: 'OFFLINE',
      serviceStatus: { flask: false, hexstrike: false, brain: false },
      inputMode: 'prompt',
      autoScroll: true
    },
    
    // Interaction state / Estado de interação
    interaction: {
      autoExecute: false,
      maxIterations: 10,
      unlimitedIterations: false,
      currentIteration: 0,
      showIterationLimitReached: false
    },
    
    // History state / Estado de histórico
    history: {
      promptHistory: [],
      systemHistory: [],
      historyIndex: -1,
      sysHistoryIndex: -1
    },
    
    // Initialization state / Estado de inicialização
    initialization: {
      isInitializing: true,
      initProgress: 0,
      initError: null,
      initStatus: {
        flask: false,
        hexstrike: false,
        brain: false
      }
    }
  };

  /**
   * Observers for state changes / Observadores para mudanças de estado
   * @private
   */
  _observers = new Map();

  /**
   * Private constructor (Singleton pattern)
   * Construtor privado (padrão Singleton)
   * @private
   */
  constructor() {
    if (StateManager._instance) {
      throw new Error(
        'StateManager is a singleton. Use StateManager.getInstance() instead. / ' +
        'StateManager é um singleton. Use StateManager.getInstance() ao invés disso.'
      );
    }
  }

  /**
   * Get singleton instance / Obter instância singleton
   * @static
   * @returns {StateManager} StateManager instance / Instância do StateManager
   */
  static getInstance() {
    if (!StateManager._instance) {
      StateManager._instance = new StateManager();
    }
    return StateManager._instance;
  }

  /**
   * Get state slice / Obter fatia de estado
   * @param {string} slice - State slice name (session, ui, interaction, history, initialization)
   * @returns {Object} State slice / Fatia de estado
   */
  getState(slice) {
    if (slice && this._state[slice]) {
      return { ...this._state[slice] };
    }
    // Return entire state if no slice specified
    return {
      session: { ...this._state.session },
      ui: { ...this._state.ui },
      interaction: { ...this._state.interaction },
      history: { ...this._state.history },
      initialization: { ...this._state.initialization }
    };
  }

  /**
   * Set state value / Definir valor de estado
   * @param {string} slice - State slice name
   * @param {string} key - State key
   * @param {any} value - New value
   * @returns {void}
   */
  setState(slice, key, value) {
    if (!this._state[slice]) {
      console.warn(`[StateManager] Unknown slice: ${slice}`);
      return;
    }

    const oldValue = this._state[slice][key];
    
    if (oldValue === value) {
      return; // No change, skip notification
    }

    this._state[slice][key] = value;
    
    // Notify observers / Notificar observadores
    this._notify(slice, key, value, oldValue);
  }

  /**
   * Set multiple state values at once / Definir múltiplos valores de estado de uma vez
   * @param {string} slice - State slice name
   * @param {Object} updates - Object with key-value pairs to update
   * @returns {void}
   */
  setMultiple(slice, updates) {
    if (!this._state[slice]) {
      console.warn(`[StateManager] Unknown slice: ${slice}`);
      return;
    }

    Object.keys(updates).forEach(key => {
      const oldValue = this._state[slice][key];
      const newValue = updates[key];
      
      if (oldValue !== newValue) {
        this._state[slice][key] = newValue;
        this._notify(slice, key, newValue, oldValue);
      }
    });
  }

  /**
   * Subscribe to state changes / Inscrever-se para mudanças de estado
   * @param {string} slice - State slice to observe
   * @param {Function} callback - Callback function (slice, key, newValue, oldValue)
   * @returns {Function} Unsubscribe function / Função para cancelar inscrição
   */
  subscribe(slice, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function / Callback deve ser uma função');
    }

    const observerId = `${slice}_${Date.now()}_${Math.random()}`;
    
    if (!this._observers.has(slice)) {
      this._observers.set(slice, new Map());
    }
    
    this._observers.get(slice).set(observerId, callback);
    
    // Return unsubscribe function / Retornar função de cancelamento
    return () => {
      if (this._observers.has(slice)) {
        this._observers.get(slice).delete(observerId);
      }
    };
  }

  /**
   * Notify observers of state change / Notificar observadores de mudança de estado
   * @private
   * @param {string} slice - State slice
   * @param {string} key - State key
   * @param {any} newValue - New value
   * @param {any} oldValue - Old value
   * @returns {void}
   */
  _notify(slice, key, newValue, oldValue) {
    if (!this._observers.has(slice)) {
      return;
    }

    const sliceObservers = this._observers.get(slice);
    
    sliceObservers.forEach(callback => {
      try {
        callback(slice, key, newValue, oldValue);
      } catch (error) {
        console.error('[StateManager] Observer error:', error);
      }
    });
  }

  /**
   * Reset state slice to defaults / Resetar fatia de estado para padrões
   * @param {string} slice - State slice to reset
   * @returns {void}
   */
  resetSlice(slice) {
    const defaults = {
      session: {
        blocks: [],
        currentSessionName: '',
        openFiles: [],
        activeFileIndex: 0
      },
      ui: {
        input: '',
        isLoading: false,
        status: 'OFFLINE',
        serviceStatus: { flask: false, hexstrike: false, brain: false },
        inputMode: 'prompt',
        autoScroll: true
      },
      interaction: {
        autoExecute: false,
        maxIterations: 10,
        unlimitedIterations: false,
        currentIteration: 0,
        showIterationLimitReached: false
      },
      history: {
        promptHistory: [],
        systemHistory: [],
        historyIndex: -1,
        sysHistoryIndex: -1
      },
      initialization: {
        isInitializing: true,
        initProgress: 0,
        initError: null,
        initStatus: {
          flask: false,
          hexstrike: false,
          brain: false
        }
      }
    };

    if (defaults[slice]) {
      Object.keys(defaults[slice]).forEach(key => {
        this.setState(slice, key, defaults[slice][key]);
      });
      console.log(`[StateManager] Reset slice: ${slice}`);
    }
  }

  /**
   * Clear all observers / Limpar todos os observadores
   * @returns {void}
   */
  clearObservers() {
    this._observers.clear();
    console.log('[StateManager] All observers cleared');
  }
}

// Export singleton instance / Exportar instância singleton
export default StateManager;
