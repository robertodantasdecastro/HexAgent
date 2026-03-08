/**
 * BaseService - Abstract Base Class for Services
 * BaseService - Classe Base Abstrata para Serviços
 * 
 * Standardizes Singleton pattern, API client access, and Logger integration.
 * Padroniza padrão Singleton, acesso ao cliente API e integração com Logger.
 * 
 * @abstract
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 */

import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';

class BaseService {
  /**
   * Protected API Client instance
   * @protected
   */
  _api;

  /**
   * Protected Logger instance
   * @protected
   */
  _logger;

  constructor() {
    if (this.constructor === BaseService) {
      throw new Error("Abstract class 'BaseService' cannot be instantiated directly.");
    }
    
    // Lazy load or safe access
    try {
      this._api = APIClient.getInstance();
      this._logger = Logger.getInstance();
      
      this._logger.debug(`${this.constructor.name} service initialized`);
    } catch (error) {
      console.error(`Failed to initialize dependencies in ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Get Singleton Instance helper
   * Helper para obter instância Singleton
   * 
   * Note: This must be implemented by subclasses to store the instance statically
   * Nota: Isso deve ser implementado pelas subclasses para armazenar a instância estaticamente
   */
  static getInstance() {
    throw new Error("Method 'getInstance()' must be implemented by subclass.");
  }
}

export default BaseService;
