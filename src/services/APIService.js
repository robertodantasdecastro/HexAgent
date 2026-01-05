/**
 * APIService - Backend API communication layer
 * Handles all HTTP requests to backend server
 * 
 * APIService - Camada de comunicação com API backend
 * Gerencia todas requisições HTTP para servidor backend
 */

/**
 * APIService Class
 * Singleton service for backend communication
 * 
 * Classe APIService
 * Serviço singleton para comunicação com backend
 */
class APIService {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
  }

  /**
   * Send chat message to AI
   * Enviar mensagem de chat para IA
   * 
   * @param {string} message - User message / Mensagem do usuário
   * @param {object} config - Configuration / Configuração
   * @returns {Promise<object>} AI response / Resposta da IA
   */
  async sendMessage(message, config = {}) {
    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, ...config })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[APIService] sendMessage failed:', error);
      throw error;
    }
  }

  /**
   * Execute shell command
   * Executar comando de shell
   * 
   * @param {string} command - Command to execute / Comando para executar
   * @param {string} workingDir - Working directory / Diretório de trabalho
   * @returns {Promise<object>} Command result / Resultado do comando
   */
  async executeCommand(command, workingDir = null) {
    try {
      const response = await fetch(`${this.baseURL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, working_dir: workingDir })
      });

      if (!response.ok) {
        throw new Error(`Execute failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[APIService] executeCommand failed:', error);
      throw error;
    }
  }

  /**
   * Load configuration from backend
   * Carregar configuração do backend
   * 
   * @returns {Promise<object>} Configuration / Configuração
   */
  async loadConfig() {
    try {
      const response = await fetch(`${this.baseURL}/config`);
      
      if (!response.ok) {
        throw new Error(`Config load failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[APIService] loadConfig failed:', error);
      throw error;
    }
  }

  /**
   * Save configuration to backend
   * Salvar configuração no backend
   * 
   * @param {object} config - Configuration to save / Configuração para salvar
   * @returns {Promise<object>} Save result / Resultado do salvamento
   */
  async saveConfig(config) {
    try {
      const response = await fetch(`${this.baseURL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error(`Config save failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[APIService] saveConfig failed:', error);
      throw error;
    }
  }

  /**
   * Save chat session
   * Salvar sessão de chat
   * 
   * @param {array} messages - Messages to save / Mensagens para salvar
   * @param {string} name - Session name / Nome da sessão
   * @returns {Promise<object>} Save result / Resultado do salvamento
   */
  async saveSession(messages, name = 'autosave') {
    try {
      const response = await fetch(`${this.baseURL}/save_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, name })
      });

      if (!response.ok) {
        throw new Error(`Session save failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[APIService] saveSession failed:', error);
      throw error;
    }
  }

  /**
   * Load chat session
   * Carregar sessão de chat
   * 
   * @param {string} name - Session name / Nome da sessão
   * @returns {Promise<object>} Loaded session / Sessão carregada
   */
  async loadSession(name = 'autosave') {
    try {
      const response = await fetch(`${this.baseURL}/load_session?name=${name}`);
      
      if (!response.ok) {
        throw new Error(`Session load failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[APIService] loadSession failed:', error);
      throw error;
    }
  }

  /**
   * Get server status
   * Obter status do servidor
   * 
   * @returns {Promise<object>} Server status / Status do servidor
   */
  async getStatus() {
    try {
      const response = await fetch(`${this.baseURL}/status`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[APIService] getStatus failed:', error);
      throw error;
    }
  }
}

// Export singleton instance / Exportar instância singleton
export default new APIService();
