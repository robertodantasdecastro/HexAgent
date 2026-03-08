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
  static _instance = null;

  /**
   * Current session name / Nome da sessão atual
   * @private
   */
  _currentSessionName = '';

  /**
   * Auto-save timer ID / ID do temporizador de auto-salvamento
   * @private
   */
  _autoSaveTimer = null;

  /**
   * Private constructor (Singleton pattern)
   * Construtor privado (padrão Singleton)
   * @private
   */
  constructor() {
    super();
    if (SessionService._instance) {
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
    if (!SessionService._instance) {
      SessionService._instance = new SessionService();
    }
    return SessionService._instance;
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
      
      const session_name = encodeURIComponent(name);
      // Correct param: session_name
      // Backend expects: /load_session?session_name=...
      const data = await this._api.get(`/load_session?session_name=${session_name}`);
      
      // Backend returns { success, data: { session_data: { ... } } } if using BaseController/SuccessResponse
      // But verify_structure showed { success, data } nesting.
      // Wait, verify_structure output: "✅ Structure confirmed: root -> data -> sessions"
      // So load_session success is likely { success: true, data: { session_data: { ... } } }
      // Or maybe just { session_data: ... } ?
      // Let's assume standard response wrapper: result = data.data.session_data
      // Or maybe { blocks: ... } directly in data?
      
      // Let's check verify_session.py logic...
      // It expects data.blocks.
      // But Backend controller explicitly returns:
      // data={"session_data": session_data}
      
      // So valid response is: response.data.session_data
      // And inside session_data: { blocks: [...] } or just dict?
      // SessionService (BE) load_session returns dict loaded from JSON.
      
      // So standard wrapper:
      // response -> { success: true, data: { session_data: { ...file_content... } } }
      
      let sessionContent = null;
      if (data && data.data && data.data.session_data) {
          sessionContent = data.data.session_data;
      } else if (data && data.session_data) { 
          sessionContent = data.session_data; 
      } else if (data && data.blocks) {
          sessionContent = data;
      }

      if (sessionContent && sessionContent.blocks) {
        this._currentSessionName = name;
        this._logger.info(`SessionService: Session "${name}" loaded successfully`);
        return {
          success: true,
          name,
          blocks: sessionContent.blocks
        };
      } else if (sessionContent && Array.isArray(sessionContent)) { 
          // Legacy format fallback if file is just array
        this._currentSessionName = name;
        return { success: true, name, blocks: sessionContent };
      } else {
        // If empty or corrupted, return empty context
        this._logger.warn(`Session "${name}" seems empty or invalid structure.`);
        return { success: true, name, blocks: [] };
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
      
      await this._api.post('/save_session', {  // Correct Endpoint
        session_name: name,                    // Correct Param
        session_data: { blocks }               // Correct Param (session_data wrapper)
      });

      this._currentSessionName = name;
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

      // Handle wrapped response: data.data.sessions
      if (data && data.data && Array.isArray(data.data.sessions)) {
         this._logger.debug(`SessionService: Found ${data.data.sessions.length} sessions`);
         return data.data.sessions;
      } else if (data && Array.isArray(data.sessions)) {
        this._logger.debug(`SessionService: Found ${data.sessions.length} sessions`);
        return data.sessions;
      } else {
        this._logger.warn('SessionService: No sessions found or invalid response');
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
        session_name: name
      });

      if (this._currentSessionName === name) {
        this._currentSessionName = '';
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
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
    }

    // Set new timer / Definir novo temporizador
    this._autoSaveTimer = setTimeout(async () => {
      try {
        const autoSaveName = 'autosave';
        this._logger.debug('SessionService: Auto-saving session...');
        
        await this._api.post('/save_session', {
          session_name: autoSaveName,
          session_data: { blocks }
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
        session_name: closeSaveName,
        session_data: { blocks }
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
    return this._currentSessionName;
  }

  /**
   * Set current session name / Definir nome da sessão atual
   * @param {string} name - Session name / Nome da sessão
   * @returns {void}
   */
  setCurrentSessionName(name) {
    if (typeof name === 'string') {
      this._currentSessionName = name;
      this._logger.debug(`SessionService: Current session set to: ${name}`);
    }
  }

  /**
   * Clear auto-save timer / Limpar temporizador de auto-salvamento
   * @returns {void}
   */
  clearAutoSaveTimer() {
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  }
}

// Export singleton instance / Exportar instância singleton
export default SessionService;
