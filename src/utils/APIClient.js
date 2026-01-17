/**
 * APIClient - Singleton Facade for HTTP API communication
 * APIClient - Facade Singleton para comunicação HTTP com API
 * 
 * Design Patterns / Padrões de Projeto:
 * - Singleton: Single instance for all HTTP requests / Instância única para todas requisições HTTP
 * - Facade: Simplified interface for fetch API / Interface simplificada para fetch API
 * 
 * Features / Recursos:
 * - Centralized error handling / Tratamento centralizado de erros
 * - Automatic retry logic / Lógica automática de retry
 * - Request/response interceptors / Interceptadores de request/response
 * - Timeout support / Suporte a timeout
 * - Request cancellation / Cancelamento de requisições
 * - Unified logging / Logging unificado
 * 
 * @example
 * // Get singleton instance / Obter instância singleton
 * const api = APIClient.getInstance();
 * 
 * // Simple GET request / Requisição GET simples
 * const config = await api.get('/config');
 * 
 * // POST with data / POST com dados
 * await api.post('/config', { theme: 'dark' });
 * 
 * // With retry / Com retry
 * const data = await api.retry(() => api.get('/status'));
 * 
 * // With timeout / Com timeout
 * const data = await api.get('/data', { timeout: 5000 });
 * 
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 */

class APIClient {
  /**
   * Singleton instance / Instância Singleton
   * @private
   * @static
   */
  static instance = null;

  /**
   * Base URL for all API requests / URL base para todas requisições API
   * @private
   */
  baseURL = 'http://localhost:5000';

  /**
   * Default request timeout in milliseconds / Timeout padrão em milissegundos
   * @private
   */
  defaultTimeout = 30000; // 30 seconds

  /**
   * Default retry attempts / Tentativas de retry padrão
   * @private
   */
  defaultRetryAttempts = 3;

  /**
   * Default retry delay in milliseconds / Delay de retry padrão em milissegundos
   * @private
   */
  defaultRetryDelay = 1000;

  /**
   * Request interceptors / Interceptadores de requisição
   * @private
   */
  requestInterceptors = [];

  /**
   * Response interceptors / Interceptadores de resposta
   * @private
   */
  responseInterceptors = [];

  /**
   * Active abort controllers for request cancellation / Controllers ativos para cancelamento
   * @private
   */
  abortControllers = new Map();

  /**
   * Get Singleton instance / Obter instância Singleton
   * 
   * @returns {APIClient} Singleton instance / Instância singleton
   * @static
   */
  static getInstance() {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  /**
   * Private constructor / Construtor privado
   * 
   * @private
   */
  constructor() {
    if (APIClient.instance) {
      throw new Error(
        'APIClient is a Singleton. Use APIClient.getInstance() instead. / ' +
        'APIClient é um Singleton. Use APIClient.getInstance().'
      );
    }
  }

  /**
   * Perform GET request / Executar requisição GET
   * 
   * @param {string} endpoint - API endpoint (e.g., '/config') / Endpoint da API
   * @param {Object} [options={}] - Request options / Opções da requisição
   * @returns {Promise<any>} Response data / Dados da resposta
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * Perform POST request / Executar requisição POST
   * 
   * @param {string} endpoint - API endpoint / Endpoint da API
   * @param {any} data - Request body data / Dados do corpo da requisição
   * @param {Object} [options={}] - Request options / Opções da requisição
   * @returns {Promise<any>} Response data / Dados da resposta
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * Perform PUT request / Executar requisição PUT
   * 
   * @param {string} endpoint - API endpoint / Endpoint da API
   * @param {any} data - Request body data / Dados do corpo da requisição
   * @param {Object} [options={}] - Request options / Opções da requisição
   * @returns {Promise<any>} Response data / Dados da resposta
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * Perform DELETE request / Executar requisição DELETE
   * 
   * @param {string} endpoint - API endpoint / Endpoint da API
   * @param {Object} [options={}] - Request options / Opções da requisição
   * @returns {Promise<any>} Response data / Dados da resposta
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  /**
   * Perform PATCH request / Executar requisição PATCH
   * 
   * @param {string} endpoint - API endpoint / Endpoint da API
   * @param {any} data - Request body data / Dados do corpo da requisição
   * @param {Object} [options={}] - Request options / Opções da requisição
   * @returns {Promise<any>} Response data / Dados da resposta
   */
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  /**
   * Core request method / Método central de requisição
   * 
   * @param {string} method - HTTP method / Método HTTP
   * @param {string} endpoint - API endpoint / Endpoint da API
   * @param {any} data - Request body data / Dados do corpo
   * @param {Object} options - Request options / Opções
   * @returns {Promise<any>} Response data / Dados da resposta
   * @private
   */
  async request(method, endpoint, data, options = {}) {
    const url = this.buildURL(endpoint);
    const requestId = `${method}-${endpoint}-${Date.now()}`;
    
    // Create abort controller / Criar controller de cancelamento
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    // Build request config / Construir config da requisição
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: controller.signal,
      ...options
    };

    // Add body for methods that support it / Adicionar corpo para métodos que suportam
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    // Apply request interceptors / Aplicar interceptadores de requisição
    let interceptedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      interceptedConfig = await interceptor(interceptedConfig, url);
    }

    // Setup timeout / Configurar timeout
    const timeout = options.timeout || this.defaultTimeout;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      console.log(`[APIClient] ${method} ${endpoint}`);
      
      const response = await fetch(url, interceptedConfig);
      
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      // Check response status / Verificar status da resposta
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Parse response / Parsear resposta
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Apply response interceptors / Aplicar interceptadores de resposta
      let interceptedResponse = responseData;
      for (const interceptor of this.responseInterceptors) {
        interceptedResponse = await interceptor(interceptedResponse, response);
      }

      console.log(`[APIClient] ${method} ${endpoint} - Success`);
      return interceptedResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      // Handle different error types / Tratar diferentes tipos de erro
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      this.handleError(error, method, endpoint);
      throw error;
    }
  }

  /**
   * Build full URL from endpoint / Construir URL completa do endpoint
   * 
   * @param {string} endpoint - API endpoint / Endpoint da API
   * @returns {string} Full URL / URL completa
   * @private
   */
  buildURL(endpoint) {
    // If endpoint is already a full URL, return it
    // Se endpoint já é uma URL completa, retornar
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Ensure endpoint starts with / / Garantir que endpoint começa com /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${normalizedEndpoint}`;
  }

  /**
   * Parse error response / Parsear resposta de erro
   * 
   * @param {Response} response - Fetch response / Resposta do fetch
   * @returns {Promise<Object>} Error data / Dados do erro
   * @private
   */
  async parseErrorResponse(response) {
    try {
      return await response.json();
    } catch {
      return {
        error: response.statusText,
        status: response.status
      };
    }
  }

  /**
   * Centralized error handling / Tratamento centralizado de erros
   * 
   * @param {Error} error - Error object / Objeto de erro
   * @param {string} method - HTTP method / Método HTTP
   * @param {string} endpoint - API endpoint / Endpoint da API
   * @private
   */
  handleError(error, method, endpoint) {
    console.error(`[APIClient] ${method} ${endpoint} - Error:`, error);
    
    // You can add custom error handling here, e.g.:
    // - Toast notifications
    // - Error tracking (Sentry, etc.)
    // - Retry logic
    // - User-friendly error messages
  }

  /**
   * Retry a request with exponential backoff / Retentar requisição com backoff exponencial
   * 
   * @param {Function} requestFn - Async function to retry / Função async para retentar
   * @param {number} [attempts=3] - Number of retry attempts / Número de tentativas
   * @param {number} [delay=1000] - Initial delay in ms / Delay inicial em ms
   * @returns {Promise<any>} Response data / Dados da resposta
   * 
   * @example
   * const data = await api.retry(() => api.get('/status'), 5, 2000);
   */
  async retry(requestFn, attempts = this.defaultRetryAttempts, delay = this.defaultRetryDelay) {
    let lastError;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (i < attempts - 1) {
          // Exponential backoff / Backoff exponencial
          const backoffDelay = delay * Math.pow(2, i);
          console.log(`[APIClient] Retry attempt ${i + 1}/${attempts} after ${backoffDelay}ms`);
          await this.sleep(backoffDelay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep utility / Utilitário de sleep
   * 
   * @param {number} ms - Milliseconds to sleep / Milissegundos para dormir
   * @returns {Promise<void>}
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cancel a specific request / Cancelar uma requisição específica
   * 
   * @param {string} requestId - Request identifier / Identificador da requisição
   */
  cancel(requestId) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
      console.log(`[APIClient] Request ${requestId} cancelled`);
    }
  }

  /**
   * Cancel all pending requests / Cancelar todas requisições pendentes
   */
  cancelAll() {
    for (const [requestId, controller] of this.abortControllers.entries()) {
      controller.abort();
    }
    this.abortControllers.clear();
    console.log('[APIClient] All requests cancelled');
  }

  /**
   * Add request interceptor / Adicionar interceptador de requisição
   * 
   * @param {Function} interceptor - Interceptor function / Função interceptadora
   * 
   * @example
   * api.addRequestInterceptor(async (config, url) => {
   *   config.headers['X-Custom-Header'] = 'value';
   *   return config;
   * });
   */
  addRequestInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.requestInterceptors.push(interceptor);
    }
  }

  /**
   * Add response interceptor / Adicionar interceptador de resposta
   * 
   * @param {Function} interceptor - Interceptor function / Função interceptadora
   * 
   * @example
   * api.addResponseInterceptor(async (data, response) => {
   *   // Transform response data
   *   return data;
   * });
   */
  addResponseInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.responseInterceptors.push(interceptor);
    }
  }

  /**
   * Set base URL / Definir URL base
   * 
   * @param {string} url - Base URL / URL base
   */
  setBaseURL(url) {
    this.baseURL = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Get base URL / Obter URL base
   * 
   * @returns {string} Base URL / URL base
   */
  getBaseURL() {
    return this.baseURL;
  }

  /**
   * Set default timeout / Definir timeout padrão
   * 
   * @param {number} ms - Timeout in milliseconds / Timeout em milissegundos
   */
  setTimeout(ms) {
    this.defaultTimeout = ms;
  }

  /**
   * Health check endpoint / Endpoint de verificação de saúde
   * 
   * @returns {Promise<boolean>} True if backend is healthy / True se backend está saudável
   */
  async healthCheck() {
    try {
      await this.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API status / Obter status da API
   * 
   * @returns {Promise<Object>} Status information / Informações de status
   */
  async getStatus() {
    return await this.get('/status');
  }
}

// Export singleton instance / Exportar instância singleton
export default APIClient;
