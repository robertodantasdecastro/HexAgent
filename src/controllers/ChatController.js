/**
 * ChatController - Facade for Chat, Session and Workflow management
 * ChatController - Facade para gerenciamento de Chat, Sessão e Workflow
 * 
 * Implements the Facade pattern to provide a unified interface for the UI.
 * Implementa o padrão Facade para fornecer uma interface unificada para a UI.
 * 
 * @pattern Facade
 * @author Roberto Dantas de Castro
 */

import ChatService from '../services/ChatService';
import SessionService from '../services/SessionService';
import WorkflowService from '../services/WorkflowService';
import Logger from '../utils/Logger';

class ChatController {
  static instance = null;

  constructor() {
    if (ChatController.instance) {
      return ChatController.instance;
    }
    
    this.chatService = ChatService.getInstance();
    this.sessionService = SessionService.getInstance();
    this.workflowService = WorkflowService.getInstance();
    this.logger = Logger.getInstance();
    
    ChatController.instance = this;
    this.logger.debug('ChatController initialized');
  }

  /**
   * Get singleton instance
   * Obter instância singleton
   */
  static getInstance() {
    if (!ChatController.instance) {
      ChatController.instance = new ChatController();
    }
    return ChatController.instance;
  }

  /**
   * Send a message to the AI
   * Enviar uma mensagem para a IA
   * 
   * @param {string} prompt - User input / Entrada do usuário
   * @param {Array} context - Conversation history / Histórico da conversa
   * @param {Object} options - Execution options / Opções de execução
   */
  async sendMessage(prompt, context = [], options = {}) {
    try {
      this.logger.info('ChatController: Sending message', { prompt });
      return await this.chatService.sendMessage(prompt, context, options);
    } catch (error) {
      this.logger.error('ChatController: Send message failed', error);
      throw error;
    }
  }

  /**
   * Stop current generation
   * Parar geração atual
   */
  abortGeneration() {
    this.logger.info('ChatController: Aborting generation');
    this.chatService.abortCurrentRequest();
  }

  /**
   * Check if generating
   * Verificar se está gerando
   */
  isGenerating() {
    return this.chatService.isStreaming();
  }

  /**
   * Save current session
   * Salvar sessão atual
   */
  async saveSession(name, blocks) {
    return await this.sessionService.saveSession(name, blocks);
  }

  /**
   * Subscribe to chat messages
   * Inscrever-se em mensagens do chat
   */
  onMessage(callback) {
    return this.chatService.onMessage(callback);
  }

  /**
   * Subscribe to errors
   * Inscrever-se em erros
   */
  onError(callback) {
    return this.chatService.onError(callback);
  }

  /**
   * Subscribe to completion events
   * Inscrever-se em eventos de conclusão
   */
  onComplete(callback) {
    return this.chatService.onComplete(callback);
  }
  /**
   * Execute a command
   * Executar um comando
   */
  async executeCommand(command) {
    try {
      this.logger.info('ChatController: Executing command', { command });
      // We can use APIClient directly or a CommandService if it existed
      // Podemos usar APIClient diretamente ou um CommandService se existisse
      const api = this.chatService._api; // Access API from service or instance
      return await api.post('/execute', { command });
      
    } catch (error) {
      this.logger.error('ChatController: Command execution failed', error);
      throw error;
    }
  }
}

export default ChatController;
