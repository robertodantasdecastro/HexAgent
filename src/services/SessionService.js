/**
 * SessionService - Session Management Service
 * Serviço de Gerenciamento de Sessões
 * 
 * Handles all session-related operations including save, load, list, delete, and auto-save.
 * Gerencia todas as operações relacionadas a sessões incluindo salvar, carregar, listar, deletar e auto-salvamento.
 * 
 * @pattern Singleton + Repository
 * @dependencies APIClient
 * @author Antigravity AI
 * @version 1.0.0
 */

import BaseService from './BaseService';

class SessionService extends BaseService {
  /**
   * Singleton instance / Instância Singleton
   * @private
   * @static
   */
  static #instance = null;

  /**
   * Current session name / Nome da sessão atual
   * @private
   */
  #currentSessionName = '';

  /**
   * Auto-save timer ID / ID do temporizador de auto-salvamento
   * @private
   */
  #autoSaveTimer = null;

  /**
   * Private constructor (Singleton pattern)
   * Construtor privado (padrão Singleton)
   * @private
   */
  constructor() {
    super();
    if (SessionService.#instance) {
      throw new Error(
        'SessionService is a singleton. Use SessionService.getInstance() instead. / ' +
        'SessionService é um singleton. Use SessionService.getInstance() ao invés disso.'
      );
    }
  }

  /**
   * Get singleton instance / Obter instância singleton
   * @static
   * @returns {SessionService} SessionService instance / Instância do SessionService
   */
  static getInstance() {
    if (!SessionService.#instance) {
      SessionService.#instance = new SessionService();
    }
    return SessionService.#instance;
  }

  /**
   * Load a session by name / Carregar uma sessão por nome
   * @param {string} name - Session name / Nome da sessão
   * @returns {Promise<Object>} Session data with blocks / Dados da sessão com blocos
   * @throws {Error} If session load fails / Se o carregamento falhar
   */
  async loadSession(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Session name is required / Nome da sessão é obrigatório');
    }

    try {
      this._logger.info(`SessionService: Loading session: ${name}`);
      
      const data = await this._api.get(`/load_session?name=${encodeURIComponent(name)}`);
      
      if (data && data.blocks) {
        this.#currentSessionName = name;
        this._logger.info(`SessionService: Session "${name}" loaded successfully`);
        return {
          success: true,
          name,
          blocks: data.blocks
        };
      } else {
        throw new Error('No blocks found in session / Nenhum bloco encontrado na sessão');
      }
    } catch (error) {
      this._logger.error(`SessionService: Failed to load session "${name}":`, error);
      throw new Error(`Failed to load session: ${error.message}`);
    }
  }

  /**
   * Save a session / Salvar uma sessão
   * @param {string} name - Session name / Nome da sessão
   * @param {Array} blocks - Chat blocks to save / Blocos de chat para salvar
   * @returns {Promise<Object>} Save result / Resultado do salvamento
   * @throws {Error} If session save fails / Se o salvamento falhar
   */
  async saveSession(name, blocks) {
    if (!name || typeof name !== 'string') {
      throw new Error('Session name is required / Nome da sessão é obrigatório');
    }

    if (!Array.isArray(blocks)) {
      throw new Error('Blocks must be an array / Blocos devem ser um array');
    }

    try {
      this._logger.info(`SessionService: Saving session: ${name}`);
      
      await this._api.post('/sessions', {
        name,
        blocks
      });

      this.#currentSessionName = name;
      this._logger.info(`SessionService: Session "${name}" saved successfully`);
      
      return {
        success: true,
        name,
        blockCount: blocks.length
      };
    } catch (error) {
      this._logger.error(`SessionService: Failed to save session "${name}":`, error);
      throw new Error(`Failed to save session: ${error.message}`);
    }
  }

  /**
   * List all available sessions / Listar todas as sessões disponíveis
   * @returns {Promise<Array<string>>} Array of session names / Array de nomes de sessões
   * @throws {Error} If listing fails / Se a listagem falhar
   */
  async listSessions() {
    try {
      this._logger.debug('SessionService: Listing all sessions');
      
      const data = await this._api.post('/sessions', {
        action: 'list'
      });

      if (data && Array.isArray(data.sessions)) {
        this._logger.debug(`SessionService: Found ${data.sessions.length} sessions`);
        return data.sessions;
      } else {
        this._logger.warn('SessionService: No sessions found');
        return [];
      }
    } catch (error) {
      this._logger.error('SessionService: Failed to list sessions:', error);
      throw new Error(`Failed to list sessions: ${error.message}`);
    }
  }

  /**
   * Delete a session / Deletar uma sessão
   * @param {string} name - Session name to delete / Nome da sessão para deletar
   * @returns {Promise<Object>} Delete result / Resultado da deleção
   * @throws {Error} If deletion fails / Se a deleção falhar
   */
  async deleteSession(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Session name is required / Nome da sessão é obrigatório');
    }

    try {
      this._logger.info(`SessionService: Deleting session: ${name}`);
      
      await this._api.post('/sessions', {
        action: 'delete',
        name
      });

      if (this.#currentSessionName === name) {
        this.#currentSessionName = '';
      }

      this._logger.info(`SessionService: Session "${name}" deleted successfully`);
      
      return {
        success: true,
        name
      };
    } catch (error) {
      this._logger.error(`SessionService: Failed to delete session "${name}":`, error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  /**
   * Auto-save current session with debouncing / Auto-salvar sessão atual com debounce
   * @param {Array} blocks - Current chat blocks / Blocos de chat atuais
   * @param {number} [delay=2000] - Debounce delay in ms / Atraso do debounce em ms
   * @returns {void}
   */
  autoSave(blocks, delay = 2000) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return;
    }

    // Clear existing timer / Limpar temporizador existente
    if (this.#autoSaveTimer) {
      clearTimeout(this.#autoSaveTimer);
    }

    // Set new timer / Definir novo temporizador
    this.#autoSaveTimer = setTimeout(async () => {
      try {
        const autoSaveName = 'autosave';
        this._logger.debug('SessionService: Auto-saving session...');
        
        await this._api.post('/save_session', {
          name: autoSaveName,
          blocks
        });

        this._logger.debug('SessionService: Auto-save successful');
      } catch (error) {
        this._logger.error('SessionService: Auto-save failed:', error);
      }
    }, delay);
  }

  /**
   * Save session on window close / Salvar sessão ao fechar janela
   * @param {Array} blocks - Current chat blocks / Blocos de chat atuais
   * @returns {Promise<void>}
   */
  async saveBeforeClose(blocks) {
    if (!Array.isArray(blocks) || blocks.length === 0) {
      return;
    }

    try {
      const closeSaveName = `auto-save-${Date.now()}`;
      this._logger.info('SessionService: Saving session before close...');
      
      await this._api.post('/save_session', {
        name: closeSaveName,
        blocks
      });

      this._logger.info(`SessionService: Session saved as "${closeSaveName}"`);
    } catch (error) {
      this._logger.error('SessionService: Save before close failed:', error);
    }
  }

  /**
   * Get current session name / Obter nome da sessão atual
   * @returns {string} Current session name / Nome da sessão atual
   */
  getCurrentSessionName() {
    return this.#currentSessionName;
  }

  /**
   * Set current session name / Definir nome da sessão atual
   * @param {string} name - Session name / Nome da sessão
   * @returns {void}
   */
  setCurrentSessionName(name) {
    if (typeof name === 'string') {
      this.#currentSessionName = name;
      this._logger.debug(`SessionService: Current session set to: ${name}`);
    }
  }

  /**
   * Clear auto-save timer / Limpar temporizador de auto-salvamento
   * @returns {void}
   */
  clearAutoSaveTimer() {
    if (this.#autoSaveTimer) {
      clearTimeout(this.#autoSaveTimer);
      this.#autoSaveTimer = null;
    }
  }
}

// Export singleton instance / Exportar instância singleton
export default SessionService;
