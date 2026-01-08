/**
 * CommandService - Command Execution and History Management Service
 * Serviço de Execução de Comandos e Gerenciamento de Histórico
 * 
 * Handles command execution, history management, and autocomplete.
 * Gerencia execução de comandos, gerenciamento de histórico e autocomplete.
 * 
 * @pattern Singleton + Command
 * @dependencies APIClient
 * @author Antigravity AI
 * @version 1.0.0
 */

import APIClient from '../utils/APIClient';

class CommandService {
  /**
   * Singleton instance / Instância Singleton
   * @private
   * @static
   */
  static #instance = null;

  /**
   * API Client instance / Instância do Cliente API
   * @private
   */
  #api;

  /**
   * Local command history / Histórico local de comandos
   * @private
   */
  #localHistory = [];

  /**
   * Shell history from backend / Histórico do shell do backend
   * @private
   */
  #shellHistory = [];

  /**
   * Private constructor (Singleton pattern)
   * Construtor privado (padrão Singleton)
   * @private
   */
  constructor() {
    if (CommandService.#instance) {
      throw new Error(
        'CommandService is a singleton. Use CommandService.getInstance() instead. / ' +
        'CommandService é um singleton. Use CommandService.getInstance() ao invés disso.'
      );
    }
    this.#api = APIClient.getInstance();
  }

  /**
   * Get singleton instance / Obter instância singleton
   * @static
   * @returns {CommandService} CommandService instance / Instância do CommandService
   */
  static getInstance() {
    if (!CommandService.#instance) {
      CommandService.#instance = new CommandService();
    }
    return CommandService.#instance;
  }

  /**
   * Execute a command / Executar um comando
   * @param {string} command - Command to execute / Comando para executar
   * @returns {Promise<Object>} Execution result / Resultado da execução
   * @throws {Error} If execution fails / Se a execução falhar
   */
  async executeCommand(command) {
    if (!command || typeof command !== 'string') {
      throw new Error('Command is required / Comando é obrigatório');
    }

    try {
      console.log(`[CommandService] Executing: ${command}`);
      
      const data = await this.#api.post('/execute', {
        command: command.trim()
      });

      // Add to local history / Adicionar ao histórico local
      this.addToHistory(command);

      console.log('[CommandService] Command executed successfully');
      
      return {
        success: true,
        command,
        output: data.output || data.stdout || '',
        exitCode: data.exit_code || data.exitCode || 0,
        error: data.error || null
      };
    } catch (error) {
      console.error(`[CommandService] Execution failed for "${command}":`, error);
      throw new Error(`Failed to execute command: ${error.message}`);
    }
  }

  /**
   * Load shell history from backend / Carregar histórico do shell do backend
   * @returns {Promise<Array<string>>} Shell history / Histórico do shell
   */
  async loadShellHistory() {
    try {
      console.log('[CommandService] Loading shell history');
      
      const data = await this.#api.get('/history/shell');

      if (data && data.history) {
        this.#shellHistory = data.history;
        console.log(`[CommandService] Loaded ${data.history.length} shell commands`);
        return data.history;
      } else if (data && data.commands) {
        // Fallback for alternative response format
        this.#shellHistory = data.commands;
        console.log(`[CommandService] Loaded ${data.commands.length} shell commands`);
        return data.commands;
      }

      return [];
    } catch (error) {
      console.error('[CommandService] Failed to load shell history:', error);
      return [];
    }
  }

  /**
   * Get autocomplete suggestions / Obter sugestões de autocomplete
   * @param {string} partial - Partial command / Comando parcial
   * @returns {Promise<Array<string>>} Completion suggestions / Sugestões de completação
   */
  async autocomplete(partial) {
    if (!partial || typeof partial !== 'string') {
      return [];
    }

    try {
      console.log(`[CommandService] Autocomplete for: "${partial}"`);
      
      const data = await this.#api.post('/complete', {
        partial_command: partial.trim(),
        context: 'shell'
      });

      if (data && Array.isArray(data.completions)) {
        console.log(`[CommandService] Found ${data.completions.length} completions`);
        return data.completions;
      }

      return [];
    } catch (error) {
      console.error('[CommandService] Autocomplete failed:', error);
      return [];
    }
  }

  /**
   * Get local command history / Obter histórico local de comandos
   * @returns {Array<string>} Local history / Histórico local
   */
  getLocalHistory() {
    return [...this.#localHistory];
  }

  /**
   * Get shell history / Obter histórico do shell
   * @returns {Array<string>} Shell history / Histórico do shell
   */
  getShellHistory() {
    return [...this.#shellHistory];
  }

  /**
   * Add command to local history / Adicionar comando ao histórico local
   * @param {string} command - Command to add / Comando para adicionar
   * @returns {void}
   */
  addToHistory(command) {
    if (!command || typeof command !== 'string') {
      return;
    }

    const trimmed = command.trim();
    if (trimmed.length === 0) {
      return;
    }

    // Avoid duplicates / Evitar duplicatas
    if (this.#localHistory[this.#localHistory.length - 1] !== trimmed) {
      this.#localHistory.push(trimmed);
      console.log(`[CommandService] Added to history: ${trimmed}`);
    }
  }

  /**
   * Clear local history / Limpar histórico local
   * @returns {void}
   */
  clearHistory() {
    this.#localHistory = [];
    console.log('[CommandService] Local history cleared');
  }

  /**
   * Validate command before execution / Validar comando antes da execução
   * @param {string} command - Command to validate / Comando para validar
   * @returns {Object} Validation result / Resultado da validação
   */
  validateCommand(command) {
    if (!command || typeof command !== 'string') {
      return {
        valid: false,
        error: 'Command is required / Comando é obrigatório'
      };
    }

    const trimmed = command.trim();
    
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Command cannot be empty / Comando não pode estar vazio'
      };
    }

    // Check for dangerous commands / Verificar comandos perigosos
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,  // rm -rf /
      /:\(\)\{\s*:\|:&\s*\};:/,  // fork bomb
      /mkfs/,  // format filesystem
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return {
          valid: false,
          error: 'Potentially dangerous command detected / Comando potencialmente perigoso detectado',
          dangerous: true
        };
      }
    }

    return {
      valid: true,
      command: trimmed
    };
  }
}

// Export singleton instance / Exportar instância singleton
export default CommandService;
