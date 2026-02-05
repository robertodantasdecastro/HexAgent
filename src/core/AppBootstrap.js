/**
 * AppBootstrap - Centralized Application Initialization System
 * Sistema Centralizado de Inicialização da Aplicação
 * 
 * Manages deterministic, stage-based initialization to prevent race conditions
 * Gerencia inicialização determinística em estágios para prevenir condições de corrida
 * 
 * Design Pattern: Orchestrator / Padrão de Projeto: Orquestrador
 * 
 * @module AppBootstrap
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 * 
 * @example
 * import AppBootstrap from './core/AppBootstrap';
 * 
 * // Register callback for specific stage
 * AppBootstrap.onStage(AppBootstrap.stages.API_CLIENT, async () => {
 *   await APIClient.getInstance().healthCheck();
 * });
 * 
 * // Start bootstrap sequence
 * await AppBootstrap.boot();
 */

class AppBootstrap {
  /**
   * Initialization stages in order / Estágios de inicialização em ordem
   * @readonly
   */
  stages = {
    API_CLIENT: 'api_client',
    SYSTEM_CONFIG: 'system_config',
    AI_CONFIG: 'ai_config',
    UI_COMPONENTS: 'ui_components',
    READY: 'ready'
  };

  /**
   * Current stage / Estágio atual
   * @private
   */
  currentStage = null;

  /**
   * Is bootstrap complete? / Bootstrap completo?
   * @private
   */
  isBootstrapped = false;

  /**
   * Stage callbacks / Callbacks de estágios
   * @private
   */
  stageCallbacks = new Map();

  /**
   * Stage completion status / Status de conclusão de estágios
   * @private
   */
  stageStatus = new Map();

  /**
   * Bootstrap error / Erro de bootstrap
   * @private
   */
  bootstrapError = null;

  constructor() {
    // Initialize stage status / Inicializar status de estágios
    Object.values(this.stages).forEach(stage => {
      this.stageCallbacks.set(stage, []);
      this.stageStatus.set(stage, 'pending');
    });
  }

  /**
   * Execute full bootstrap sequence / Executar sequência completa de bootstrap
   * @returns {Promise<void>}
   * @throws {Error} If any stage fails / Se qualquer estágio falhar
   */
  async boot() {
    if (this.isBootstrapped) {
      console.warn('[AppBootstrap] Already bootstrapped, skipping...');
      return;
    }

    console.log('[AppBootstrap] Starting bootstrap sequence...');
    const startTime = performance.now();

    try {
      // Execute stages in order / Executar estágios em ordem
      await this.runStage(this.stages.API_CLIENT);
      await this.runStage(this.stages.SYSTEM_CONFIG);
      await this.runStage(this.stages.AI_CONFIG);
      await this.runStage(this.stages.UI_COMPONENTS);
      await this.runStage(this.stages.READY);

      this.isBootstrapped = true;
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(`[AppBootstrap] ✓ Bootstrap complete in ${duration}ms`);

    } catch (error) {
      this.bootstrapError = error;
      console.error('[AppBootstrap] ✗ Bootstrap failed:', error);
      throw error;
    }
  }

  /**
   * Execute a specific stage / Executar um estágio específico
   * @param {string} stage - Stage identifier / Identificador do estágio
   * @returns {Promise<void>}
   * @private
   */
  async runStage(stage) {
    if (!Object.values(this.stages).includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`);
    }

    console.log(`[AppBootstrap] → Stage: ${stage}`);
    this.currentStage = stage;
    this.stageStatus.set(stage, 'running');

    const callbacks = this.stageCallbacks.get(stage) || [];
    
    try {
      // Execute all callbacks for this stage / Executar todos callbacks deste estágio
      for (const callback of callbacks) {
        await callback();
      }

      this.stageStatus.set(stage, 'complete');
      console.log(`[AppBootstrap] ✓ Stage complete: ${stage}`);

    } catch (error) {
      this.stageStatus.set(stage, 'error');
      console.error(`[AppBootstrap] ✗ Stage failed: ${stage}`, error);
      throw error;
    }
  }

  /**
   * Register callback for a stage / Registrar callback para um estágio
   * @param {string} stage - Stage identifier / Identificador do estágio
   * @param {Function} callback - Async callback function / Função callback async
   * 
   * @example
   * AppBootstrap.onStage('api_client', async () => {
   *   console.log('Initializing API...');
   * });
   */
  onStage(stage, callback) {
    if (!Object.values(this.stages).includes(stage)) {
      throw new Error(`Invalid stage: ${stage}`);
    }

    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.stageCallbacks.get(stage).push(callback);
  }

  /**
   * Get current stage / Obter estágio atual
   * @returns {string|null} Current stage or null / Estágio atual ou null
   */
  getCurrentStage() {
    return this.currentStage;
  }

  /**
   * Get stage status / Obter status do estágio
   * @param {string} stage - Stage identifier / Identificador do estágio
   * @returns {string} Status: 'pending', 'running', 'complete', 'error'
   */
  getStageStatus(stage) {
    return this.stageStatus.get(stage) || 'unknown';
  }

  /**
   * Check if bootstrap is complete / Verificar se bootstrap está completo
   * @returns {boolean}
   */
  isComplete() {
    return this.isBootstrapped;
  }

  /**
   * Get bootstrap error if any / Obter erro de bootstrap se houver
   * @returns {Error|null}
   */
  getError() {
    return this.bootstrapError;
  }

  /**
   * Reset bootstrap state (for testing) / Resetar estado de bootstrap (para testes)
   */
  reset() {
    this.currentStage = null;
    this.isBootstrapped = false;
    this.bootstrapError = null;
    
    Object.values(this.stages).forEach(stage => {
      this.stageCallbacks.set(stage, []);
      this.stageStatus.set(stage, 'pending');
    });
    
    console.log('[AppBootstrap] Reset complete');
  }
}

// Export singleton instance / Exportar instância singleton
export default new AppBootstrap();
