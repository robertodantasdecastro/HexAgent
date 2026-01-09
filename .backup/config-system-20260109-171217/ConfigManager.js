/**
 * ConfigManager - Singleton class for managing application configuration
 * ConfigManager - Classe Singleton para gerenciar configuração da aplicação
 * 
 * Design Patterns / Padrões de Projeto:
 * - Singleton: Ensures single source of truth for configuration / Garante fonte única de verdade para configuração
 * - Observer: Notifies subscribers of configuration changes / Notifica assinantes de mudanças na configuração
 * 
 * Features / Recursos:
 * - Centralized config management / Gerenciamento centralizado de configuração
 * - Real-time change notifications / Notificações de mudanças em tempo real
 * - Dot notation access (e.g., 'ai.language') / Acesso com notação de pontos
 * - Automatic persistence / Persistência automática
 * - Validation layer / Camada de validação
 * - Default values fallback / Fallback para valores padrão
 * 
 * @example
 * // Get singleton instance / Obter instância singleton
 * const cm = ConfigManager.getInstance();
 * 
 * // Load configuration / Carregar configuração
 * await cm.load();
 * 
 * // Access values / Acessar valores
 * const language = cm.get('ai.language');
 * const port = cm.get('services.flask_port', 5000); // with default
 * 
 * // Update values / Atualizar valores
 * cm.set('ai.language', 'pt');
 * cm.set('system.theme', 'dark');
 * 
 * // Save to backend / Salvar no backend
 * await cm.save();
 * 
 * // Subscribe to changes / Inscrever-se em mudanças
 * cm.subscribe((key, value) => {
 *   console.log(`Config changed: ${key} = ${value}`);
 * });
 * 
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 */

const CONFIG_API_BASE = 'http://localhost:5000/config';

class ConfigManager {
  /**
   * Singleton instance / Instância Singleton
   * @private
   * @static
   */
  static instance = null;

  /**
   * Configuration data / Dados de configuração
   * @private
   */
  config = null;

  /**
   * Default configuration structure / Estrutura de configuração padrão
   * @private
   */
  defaults = {
    ai: {
      language: 'auto',
      model: 'openai/gpt-4-turbo',
      api_key: '',
      api_url: '',
      max_iterations: 10,
      web_search_enabled: false
    },
    services: {
      flask_port: 5000,
      hexstrike_port: 8888,
      backend_host: '127.0.0.1'
    },
    system: {
      theme: 'dark',
      auto_save_session: true,
      debug_mode: false
    },
    ui: {
      custom_colors: {},
      animations_enabled: true,
      compact_mode: false
    },
    terminal: {
      shell_type: 'auto',
      history_path: ''
    }
  };

  /**
   * Observer subscribers / Assinantes do observer
   * @private
   */
  observers = [];

  /**
   * Loading state / Estado de carregamento
   * @private
   */
  loading = false;

  /**
   * Error state / Estado de erro
   * @private
   */
  error = null;

  /**
   * Get Singleton instance / Obter instância Singleton
   * 
   * Returns the single instance of ConfigManager. Creates it if it doesn't exist.
   * Retorna a instância única do ConfigManager. Cria se não existir.
   * 
   * @returns {ConfigManager} Singleton instance / Instância singleton
   * @static
   */
  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Private constructor / Construtor privado
   * 
   * Prevents direct instantiation. Use getInstance() instead.
   * Previne instanciação direta. Use getInstance().
   * 
   * @private
   */
  constructor() {
    if (ConfigManager.instance) {
      throw new Error(
        'ConfigManager is a Singleton. Use ConfigManager.getInstance() instead. / ' +
        'ConfigManager é um Singleton. Use ConfigManager.getInstance().'
      );
    }
    
    // Initialize with defaults / Inicializar com padrões
    this.config = this.deepCopy(this.defaults);
  }

  /**
   * Load configuration from backend / Carregar configuração do backend
   * 
   * Fetches configuration from the backend API and merges with defaults.
   * Busca configuração da API backend e mescla com padrões.
   * 
   * @returns {Promise<Object>} Loaded configuration / Configuração carregada
   * @throws {Error} If load fails / Se carreg falhar
   */
  async load() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(CONFIG_API_BASE);
      
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Merge with defaults to ensure all keys exist
      // Mesclar com padrões para garantir que todas as chaves existam
      this.config = this.merge(this.defaults, data.config || data);
      
      return this.config;
    } catch (error) {
      console.error('[ConfigManager] Load error:', error);
      this.error = error;
      // Keep defaults if load fails / Manter padrões se carregar falhar
      this.config = this.deepCopy(this.defaults);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Save configuration to backend / Salvar configuração no backend
   * 
   * Persists current configuration to the backend API.
   * Persiste configuração atual na API backend.
   * 
   * @returns {Promise<void>}
   * @throws {Error} If save fails / Se salvar falhar
   */
  async save(configToSave) {
    try {
      // Use provided config or internal state
      // Usar config fornecido ou estado interno
      const dataToSave = configToSave || this.config;
      
      console.log('[ConfigManager] Saving to backend:', dataToSave);
      
      const response = await fetch(CONFIG_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: dataToSave })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Save failed');
      }

      const result = await response.json();
      console.log('[ConfigManager] Save response:', result);
      return result;
    } catch (error) {
      console.error('[ConfigManager] Save error:', error);
      this.error = error;
      throw error;
    }
  }

  /**
   * Get configuration value by key / Obter valor de configuração por chave
   * 
   * Supports dot notation for nested properties (e.g., 'ai.language').
   * Suporta notação de pontos para propriedades aninhadas (ex: 'ai.language').
   * 
   * @param {string} key - Configuration key (supports dot notation) / Chave de configuração
   * @param {*} [defaultValue] - Default value if key not found / Valor padrão se chave não encontrada
   * @returns {*} Configuration value / Valor da configuração
   * 
   * @example
   * const language = cm.get('ai.language');
   * const port = cm.get('services.flask_port', 5000);
   */
  get(key, defaultValue = undefined) {
    if (!key) {
      return this.config;
    }

    const value = this.getNestedProperty(this.config, key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set configuration value / Definir valor de configuração
   * 
   * Updates a configuration value and notifies observers if notify is true.
   * Atualiza valor de configuração e notifica observadores se notify for true.
   * 
   * @param {string} key - Configuration key (supports dot notation) / Chave de configuração
   * @param {*} value - New value / Novo valor
   * @param {boolean} [notify=true] - Whether to notify observers / Se deve notificar observadores
   * 
   * @example
   * cm.set('ai.language', 'pt');
   * cm.set('system.theme', 'dark', false); // without notification
   */
  set(key, value, notify = true) {
    if (!key) {
      console.warn('[ConfigManager] Cannot set value: key is required');
      return;
    }

    const oldValue = this.get(key);
    this.setNestedProperty(this.config, key, value);

    if (notify && oldValue !== value) {
      this.notifyObservers(key, value, oldValue);
    }
  }

  /**
   * Merge partial configuration / Mesclar configuração parcial
   * 
   * Deep merges two configuration objects.
   * Mescla profundamente dois objetos de configuração.
   * 
   * @param {Object} target - Target object / Objeto alvo
   * @param {Object} source - Source object / Objeto fonte
   * @returns {Object} Merged object / Objeto mesclado
   * @private
   */
  merge(target, source) {
    const output = this.deepCopy(target);

    if (!source || typeof source !== 'object') {
      return output;
    }

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in output)) {
          output[key] = source[key];
        } else {
          output[key] = this.merge(output[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });

    return output;
  }

  /**
   * Update configuration with partial data / Atualizar configuração com dados parciais
   * 
   * Merges partial configuration and notifies observers.
   * Mescla configuração parcial e notifica observadores.
   * 
   * @param {Object} partial - Partial configuration object / Objeto de configuração parcial
   * @param {boolean} [notify=true] - Whether to notify observers / Se deve notificar observadores
   */
  update(partial, notify = true) {
    const oldConfig = this.deepCopy(this.config);
    this.config = this.merge(this.config, partial);

    if (notify) {
      // Notify for each changed top-level key
      // Notificar para cada chave de nível superior alterada
      Object.keys(partial).forEach(key => {
        if (JSON.stringify(oldConfig[key]) !== JSON.stringify(this.config[key])) {
          this.notifyObservers(key, this.config[key], oldConfig[key]);
        }
      });
    }
  }

  /**
   * Reset to default configuration / Resetar para configuração padrão
   * 
   * Restores configuration to default values.
   * Restaura configuração para valores padrão.
   * 
   * @param {boolean} [notify=true] - Whether to notify observers / Se deve notificar observadores
   */
  reset(notify = true) {
    this.config = this.deepCopy(this.defaults);
    
    if (notify) {
      this.notifyObservers('*', this.config, null);
    }
  }

  /**
   * Subscribe to configuration changes / Inscrever-se em mudanças de configuração
   * 
   * Adds a callback that will be called when configuration changes.
   * Adiciona callback que será chamado quando configuração mudar.
   * 
   * @param {Function} callback - Observer callback (key, newValue, oldValue) => void
   * 
   * @example
   * cm.subscribe((key, newValue, oldValue) => {
   *   console.log(`${key} changed from ${oldValue} to ${newValue}`);
   * });
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.warn('[ConfigManager] Subscribe requires a function callback');
      return;
    }

    if (!this.observers.includes(callback)) {
      this.observers.push(callback);
    }
  }

  /**
   * Unsubscribe from configuration changes / Cancelar inscrição de mudanças
   * 
   * Removes a previously subscribed callback.
   * Remove callback previamente inscrito.
   * 
   * @param {Function} callback - Observer callback to remove / Callback a remover
   */
  unsubscribe(callback) {
    this.observers = this.observers.filter(observer => observer !== callback);
  }

  /**
   * Notify all observers of configuration change / Notificar observadores de mudança
   * 
   * Calls all subscribed callbacks with change information.
   * Chama todos os callbacks inscritos com informação de mudança.
   * 
   * @param {string} key - Changed key / Chave alterada
   * @param {*} newValue - New value / Novo valor
   * @param {*} oldValue - Old value / Valor antigo
   * @private
   */
  notifyObservers(key, newValue, oldValue) {
    this.observers.forEach(callback => {
      try {
        callback(key, newValue, oldValue);
      } catch (error) {
        console.error('[ConfigManager] Observer error:', error);
      }
    });
  }

  /**
   * Validate configuration / Validar configuração
   * 
   * Basic validation of configuration structure and types.
   * Validação básica de estrutura e tipos de configuração.
   * 
   * @param {Object} [config=this.config] - Configuration to validate / Configuração para validar
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate(config = this.config) {
    const errors = [];

    // Validate AI settings / Validar configurações de IA
    if (config.ai) {
      if (config.ai.language && !['auto', 'en', 'pt', 'es'].includes(config.ai.language)) {
        errors.push('Invalid language. Must be: auto, en, pt, or es');
      }
      if (config.ai.max_iterations && (config.ai.max_iterations < 1 || config.ai.max_iterations > 100)) {
        errors.push('max_iterations must be between 1 and 100');
      }
    }

    // Validate services / Validar serviços
    if (config.services) {
      if (config.services.flask_port && (config.services.flask_port < 1024 || config.services.flask_port > 65535)) {
        errors.push('flask_port must be between 1024 and 65535');
      }
      if (config.services.hexstrike_port && (config.services.hexstrike_port < 1024 || config.services.hexstrike_port > 65535)) {
        errors.push('hexstrike_port must be between 1024 and 65535');
      }
    }

    // Validate system / Validar sistema
    if (config.system) {
      if (config.system.theme && !['dark', 'light'].includes(config.system.theme)) {
        errors.push('Invalid theme. Must be: dark or light');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get nested property using dot notation / Obter propriedade aninhada com notação de pontos
   * 
   * @param {Object} obj - Source object / Objeto fonte
   * @param {string} path - Dot notation path / Caminho em notação de pontos
   * @returns {*} Property value / Valor da propriedade
   * @private
   */
  getNestedProperty(obj, path) {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return undefined;
      }
      result = result[key];
    }

    return result;
  }

  /**
   * Set nested property using dot notation / Definir propriedade aninhada com notação de pontos
   * 
   * @param {Object} obj - Target object / Objeto alvo
   * @param {string} path - Dot notation path / Caminho em notação de pontos
   * @param {*} value - Value to set / Valor a definir
   * @private
   */
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Deep copy an object / Cópia profunda de objeto
   * 
   * @param {*} obj - Object to copy / Objeto para copiar
   * @returns {*} Deep copy / Cópia profunda
   * @private
   */
  deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepCopy(item));
    }

    const copy = {};
    Object.keys(obj).forEach(key => {
      copy[key] = this.deepCopy(obj[key]);
    });

    return copy;
  }

  /**
   * Get all configuration / Obter toda configuração
   * 
   * Returns a deep copy of the entire configuration object.
   * Retorna cópia profunda de todo o objeto de configuração.
   * 
   * @returns {Object} Configuration copy / Cópia da configuração
   */
  getAll() {
    return this.deepCopy(this.config);
  }

  /**
   * Check if configuration is loading / Verificar se configuração está carregando
   * 
   * @returns {boolean} Loading state / Estado de carregamento
   */
  isLoading() {
    return this.loading;
  }

  /**
   * Get last error / Obter último erro
   * 
   * @returns {Error|null} Last error / Último erro
   */
  getError() {
    return this.error;
  }

  /**
   * Clear error state / Limpar estado de erro
   */
  clearError() {
    this.error = null;
  }

  /**
   * Get default configuration / Obter configuração padrão
   * 
   * @returns {Object} Default configuration / Configuração padrão
   */
  getDefaults() {
    return this.deepCopy(this.defaults);
  }
}

// Export singleton instance / Exportar instância singleton
export default ConfigManager;
