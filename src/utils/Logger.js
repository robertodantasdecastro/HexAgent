/**
 * Logger - Production Logging Utility with Level Control
 * Utilitário de Log para Produção com Controle de Níveis
 * 
 * Centralized logging with configurable levels and environment-based filtering.
 * Log centralizado com níveis configuráveis e filtragem por ambiente.
 * 
 * @example
 * import Logger from './utils/Logger';
 * 
 * const logger = Logger.getInstance();
 * logger.debug('Detailed info', { user: 'john' });
 * logger.info('General info', { action: 'login' });  
 * logger.warn('Warning message', { code: 123 });
 * logger.error('Error occurred', { error: err });
 * 
 * // Change log level
 * Logger.setLevel('ERROR'); // Only ERROR logs in production
 * 
 * @version 2.0.0
 */

class Logger {
  static _instance = null;

  /**
   * Log levels with priority / Níveis de log com prioridade
   */
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  };

  /**
   * Current log level / Nível atual de log
   * Defaults based on environment / Padrão baseado no ambiente
   */
  static _currentLevel = process.env.NODE_ENV === 'production' 
    ? Logger.LEVELS.ERROR 
    : Logger.LEVELS.DEBUG;

  /**
   * Color codes for console output / Códigos de cor para saída no console
   */
  static _colors = {
    DEBUG: '\x1b[36m',    // Cyan
    INFO: '\x1b[32m',     // Green
    WARN: '\x1b[33m',     // Yellow
    ERROR: '\x1b[31m',    // Red
    RESET: '\x1b[0m'
  };

  constructor() {
    if (Logger._instance) {
      throw new Error(
        'Logger is a singleton. Use Logger.getInstance() instead. / ' +
        'Logger é um singleton. Use Logger.getInstance().'
      );
    }
  }

  /**
   * Get singleton instance / Obter instância singleton
   * @returns {Logger} Logger instance
   */
  static getInstance() {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    return Logger._instance;
  }

  /**
   * Set global log level / Definir nível global de log
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR, NONE)
   */
  static setLevel(level) {
    if (Logger.LEVELS.hasOwnProperty(level)) {
      Logger._currentLevel = Logger.LEVELS[level];
    } else {
      console.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Get current log level / Obter nível atual de log
   * @returns {number} Current level number
   */
  static getLevel() {
    return Logger._currentLevel;
  }

  /**
   * Core logging method / Método central de log
   * @private
   */
  _log(level, message, context = {}) {
    // Check if this level should be logged / Verificar se este nível deve ser logado
    if (Logger.LEVELS[level] < Logger._currentLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };

    // Format console output / Formatar saída do console
    const color = Logger._colors[level] || '';
    const reset = Logger._colors.RESET;
    const contextStr = Object.keys(context).length > 0 
      ? JSON.stringify(context, null, 2) 
      : '';

    // Console output (only in development or for ERROR in production)
    // Saída no console (apenas em desenvolvimento ou para ERROR em produção)
    if (process.env.NODE_ENV !== 'production' || level === 'ERROR') {
      const consoleMethod = level === 'ERROR' ? console.error :
                           level === 'WARN' ? console.warn :
                           console.log;

      if (contextStr) {
        consoleMethod(`${color}[${level}] ${timestamp}${reset} ${message}`, contextStr);
      } else {
        consoleMethod(`${color}[${level}] ${timestamp}${reset} ${message}`);
      }
    }

    // Send to external service in production / Enviar para serviço externo em produção
    if (process.env.NODE_ENV === 'production' && level === 'ERROR') {
      this._sendToService(logEntry);
    }

    return logEntry;
  }

  /**
   * Log debug message (only in development)
   * Logar mensagem de debug (apenas em desenvolvimento)
   * 
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context data
   * 
   * @example
   * logger.debug('User data loaded', { userId: 123, items: 5 });
   */
  debug(message, context = {}) {
    return this._log('DEBUG', message, context);
  }

  /**
   * Log informational message
   * Logar mensagem informativa
   * 
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context data
   * 
   * @example
   * logger.info('Session started', { sessionId: 'abc123' });
   */
  info(message, context = {}) {
    return this._log('INFO', message, context);
  }

  /**
   * Log warning message
   * Logar mensagem de aviso
   * 
   * @param {string} message - Log message
   * @param {Object} [context={}] - Additional context data
   * 
   * @example
   * logger.warn('API rate limit approaching', { remaining: 10 });
   */
  warn(message, context = {}) {
    return this._log('WARN', message, context);
  }

  /**
   * Log error message
   * Logar mensagem de erro
   * 
   * @param {string} message - Log message
   * @param {Error|Object} [errorOrContext={}] - Error object or context
   * 
   * @example
   * logger.error('Failed to save data', { error: err, userId: 123 });
   */
  error(message, errorOrContext = {}) {
    // Handle Error objects / Tratar objetos Error
    let context = errorOrContext;
    if (errorOrContext instanceof Error) {
      context = {
        error: errorOrContext.message,
        stack: errorOrContext.stack,
        name: errorOrContext.name
      };
    }

    return this._log('ERROR', message, context);
  }

  /**
   * Send log entry to external service
   * Enviar entrada de log para serviço externo
   * @private
   */
  _sendToService(logEntry) {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, Datadog, CloudWatch
    // 
    // For now, just store in sessionStorage for debugging
    // Por enquanto, apenas armazenar em sessionStorage para debug
    try {
      const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);
      // Keep only last 100 logs / Manter apenas últimos 100 logs
      if (logs.length > 100) {
        logs.shift();
      }
      sessionStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (e) {
      // Silently fail if storage is full / Falhar silenciosamente se storage está cheio
    }
  }

  /**
   * Get stored logs (for debugging)
   * Obter logs armazenados (para debug)
   * @returns {Array} Array of log entries
   */
  getLogs() {
    try {
      return JSON.parse(sessionStorage.getItem('app_logs') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear stored logs
   * Limpar logs armazenados
   */
  clearLogs() {
    sessionStorage.removeItem('app_logs');
  }

  /**
   * Generate and download complete debug dump
   * Gerar e baixar dump completo de debug
   * 
   * @param {Object} systemConfig - System configuration
   * @param {Object} aiConfig - AI configuration  
   * @param {Array} chatBlocks - Chat history blocks
   */
  downloadDump(systemConfig, aiConfig, chatBlocks) {
    const timestamp = new Date().toISOString();
    const dumpData = {
      timestamp,
      version: '2.1',
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      systemConfig: {
        theme: systemConfig?.theme,
        system: systemConfig?.system,
        debug_mode: systemConfig?.system?.debug_mode
      },
      aiConfig: {
        engine: aiConfig?.ai?.engine,
        model: aiConfig?.ai?.model,
        host: aiConfig?.ai?.host,
        port: aiConfig?.ai?.port,
        has_api_key: !!aiConfig?.ai?.api_key,
        max_iterations: aiConfig?.ai?.max_iterations,
        unlimited_iterations: aiConfig?.ai?.unlimited_iterations
      },
      chatHistory: {
        totalBlocks: chatBlocks?.length || 0,
        blocks: (chatBlocks || []).map(block => ({
          id: block.id,
          type: block.type,
          content: block.type === 'command' ? block.content : (block.content?.substring(0, 200) + '...'),
          timestamp: block.timestamp
        }))
      },
      logs: this.getLogs() // sessionStorage logs
    };

    // Create Blob and trigger download
    const jsonStr = JSON.stringify(dumpData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `hexagent-debug-${timestamp.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.info('Debug dump downloaded', { filename: link.download });
  }
}

export default Logger;
