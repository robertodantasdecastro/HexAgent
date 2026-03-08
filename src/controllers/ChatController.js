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
   * Execute a command and stream AI analysis of its result
   * Executar um comando e retornar resultado ao agente para análise
   * 
   * This is the correct flow for manual command approval:
   * (1) Execute command via backend, (2) inject result into agent context,
   * (3) stream AI analysis back to UI.
   * 
   * Correto fluxo para aprovação manual de commandos:
   * (1) Executa via backend, (2) resultado injetado no contexto do agente,
   * (3) análise da IA stream de volta à UI.
   */
  async executeAndAnalyze(command, context = [], options = {}) {
    try {
      this.logger.info('ChatController: ExecuteAndAnalyze', { command });
      return await this.chatService.executeAndAnalyze(command, context, options);
    } catch (error) {
      this.logger.error('ChatController: ExecuteAndAnalyze failed', error);
      throw error;
    }
  }

  /**
   * Execute a command (no AI feedback, display only)
   * Executar um comando (sem feedback da IA, apenas exibir)
   */
  async executeCommand(command) {
    try {
      this.logger.info('ChatController: Executing command', { command });
      const api = this.chatService._api;
      return await api.post('/execute', { command });
      
    } catch (error) {
      this.logger.error('ChatController: Command execution failed', error);
      throw error;
    }
  }
}

export default ChatController;
