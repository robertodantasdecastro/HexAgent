/**
 * Logger - Production Logging Utility
 * Utilitário de Log para Produção
 * 
 * Centralized logging with different levels.
 * Log centralizado com diferentes níveis.
 */

class Logger {
  static #instance = null;

  constructor() {
    if (Logger.#instance) {
      throw new Error('Logger is a singleton');
    }
  }

  static getInstance() {
    if (!Logger.#instance) {
      Logger.#instance = new Logger();
    }
    return Logger.#instance;
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };

    // Console log in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${level}] ${message}`, data);
    }

    // Send to logging service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service
      this.sendToService(logEntry);
    }
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  debug(message, data) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('DEBUG', message, data);
    }
  }

  sendToService(logEntry) {
    // Implement external logging service integration
    // Example: send to Sentry, LogRocket, etc.
  }
}

export default Logger;
