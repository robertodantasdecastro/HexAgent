/**
 * ScriptManager - Singleton for script file operations
 * ScriptManager - Singleton para operações com arquivos de script
 * 
 * Manages script file operations: save, execute, debug
 * Gerencia operações com arquivos de script: salvar, executar, depurar
 * 
 * Design Pattern: Singleton
 * Uses APIClient for all HTTP requests
 * 
 * @example
 * const scriptManager = ScriptManager.getInstance();
 * await scriptManager.saveScript('/path/to/script.sh', '#!/bin/bash\necho "Hello"', true);
 * 
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 2.0.0 (Refactored to Singleton)
 */

import APIClient from './APIClient';

class ScriptManager {
  /**
   * Singleton instance / Instância Singleton
   * @private
   * @static
   */
  static #instance = null;

  /**
   * API Client instance / Instância do APIClient
   * @private
   */
  #api = null;

  /**
   * Get Singleton instance / Obter instância Singleton
   * 
   * @returns {ScriptManager} Singleton instance / Instância singleton
   * @static
   */
  static getInstance() {
    if (!ScriptManager.#instance) {
      ScriptManager.#instance = new ScriptManager();
    }
    return ScriptManager.#instance;
  }

  /**
   * Private constructor - Prevents direct instantiation
   * Construtor privado - Previne instanciação direta
   * 
   * Use ScriptManager.getInstance() instead.
   * Use ScriptManager.getInstance().
   * 
   * @private
   * @throws {Error} If attempting direct instantiation / Se tentar instanciação direta
   */
  constructor() {
    if (ScriptManager.#instance) {
      throw new Error(
        'ScriptManager is a singleton. Use ScriptManager.getInstance() instead. / ' +
        'ScriptManager é um singleton. Use ScriptManager.getInstance().'
      );
    }

    // Initialize APIClient / Inicializar APIClient
    this.#api = APIClient.getInstance();
  }

  /**
   * Save script to file system / Salvar script no sistema de arquivos
   * 
   * @param {string} path - File path where script should be saved / Caminho onde salvar
   * @param {string} content - Script content / Conteúdo do script
   * @param {boolean} [makeExecutable=false] - Make file executable / Tornar executável
   * @param {boolean} [overwrite=false] - Overwrite existing file / Sobrescrever arquivo existente
   * @returns {Promise<Object>} API response with success status / Resposta da API
   * 
   * @example
   * const result = await scriptManager.saveScript(
   *   '/home/user/test.sh',
   *   '#!/bin/bash\necho "test"',
   *   true
   * );
   */
  async saveScript(path, content, makeExecutable = false, overwrite = false) {
    try {
      const response = await this.#api.post('/file/write', {
        path,
        content,
        make_executable: makeExecutable,
        overwrite: overwrite,
        is_temp: false
      });

      return response;
    } catch (error) {
      // APIClient already logs errors, just re-throw
      // APIClient já loga erros, apenas re-lançar
      throw new Error(`Failed to save script: ${error.message}`);
    }
  }

  /**
   * Execute script and capture output / Executar script e capturar saída
   * 
   * @param {string} path - Path to script file / Caminho do arquivo de script
   * @param {Array<string>} [args=[]] - Script arguments / Argumentos do script
   * @param {string|null} [workingDir=null] - Working directory / Diretório de trabalho
   * @returns {Promise<Object>} Execution result with stdout/stderr / Resultado com stdout/stderr
   * 
   * @example
   * const result = await scriptManager.executeScript('/path/to/script.sh', ['arg1', 'arg2']);
   * console.log(result.stdout);
   */
  async executeScript(path, args = [], workingDir = null) {
    try {
      const response = await this.#api.post('/script/execute', {
        path,
        args,
        working_dir: workingDir
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to execute script: ${error.message}`);
    }
  }

  /**
   * Execute script in debug mode (with verbose output)
   * Executar script em modo debug (com saída verbosa)
   * 
   * @param {string} path - Path to script file / Caminho do arquivo de script
   * @param {Array<string>} [args=[]] - Script arguments / Argumentos do script
   * @returns {Promise<Object>} Debug execution result / Resultado da execução em debug
   * 
   * @example
   * const result = await scriptManager.debugScript('/path/to/script.sh');
   */
  async debugScript(path, args = []) {
    try {
      const response = await this.#api.post('/script/debug', {
        path,
        args
      });

      return response;
    } catch (error) {
      throw new Error(`Failed to debug script: ${error.message}`);
    }
  }

  /**
   * Suggest appropriate save path based on context
   * Sugerir caminho apropriado baseado no contexto
   * 
   * @param {string} filename - Script filename / Nome do arquivo
   * @param {Object} [context={}] - Context information / Informações de contexto
   * @param {string} [context.mentionedPath] - Explicitly mentioned path / Caminho explícito
   * @param {string} [context.projectRoot] - Project root directory / Diretório raiz do projeto
   * @returns {string} Suggested file path / Caminho sugerido
   * 
   * @example
   * const path = scriptManager.suggestPath('test.sh', { projectRoot: '/home/user/project' });
   * // Returns: '/home/user/project/test.sh'
   */
  suggestPath(filename, context = {}) {
    // If context has a mentioned path, use it
    // Se contexto tem caminho mencionado, usar
    if (context.mentionedPath) {
      return context.mentionedPath;
    }

    // If there's a project root, save there
    // Se há raiz do projeto, salvar lá
    if (context.projectRoot) {
      return `${context.projectRoot}/${filename}`;
    }

    // Default to ~/scripts
    // Padrão para ~/scripts
    return `~/scripts/${filename}`;
  }

  /**
   * Get file extension from filename
   * Obter extensão do arquivo
   * 
   * @param {string} filename - Filename / Nome do arquivo
   * @returns {string} File extension without dot / Extensão sem ponto
   * 
   * @example
   * scriptManager.getExtension('test.sh'); // Returns 'sh'
   * scriptManager.getExtension('script');  // Returns ''
   */
  getExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Determine if file needs execute permission (shebang present)
   * Determinar se arquivo precisa de permissão de execução (shebang presente)
   * 
   * @param {string} content - Script content / Conteúdo do script
   * @returns {boolean} True if shebang found / True se shebang encontrado
   * 
   * @example
   * scriptManager.needsExecutePermission('#!/bin/bash\necho "test"'); // Returns true
   * scriptManager.needsExecutePermission('echo "test"'); // Returns false
   */
  needsExecutePermission(content) {
    return content.trim().startsWith('#!');
  }
}

export default ScriptManager;
