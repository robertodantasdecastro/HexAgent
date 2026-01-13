/**
 * ChatService - AI Chat and SSE Streaming Service
 * Serviço de Chat IA e Streaming SSE
 * 
 * Handles all chat/AI interactions including Server-Sent Events (SSE) streaming
 * for real-time AI responses, command proposals, and execution results.
 * 
 * Gerencia todas interações de chat/IA incluindo streaming Server-Sent Events (SSE)
 * para respostas IA em tempo real, propostas de comando e resultados de execução.
 * 
 * @pattern Singleton + Observer
 * @dependencies APIClient
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 */

import APIClient from '../utils/APIClient';

class ChatService {
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
   * Current EventSource for SSE / EventSource atual para SSE
   * @private
   */
  #currentEventSource = null;

  /**
   * Message event handlers (Observer pattern)
   * Handlers de eventos de mensagem (padrão Observer)
   * @private
   */
  #messageHandlers = [];

  /**
   * Error event handlers
   * Handlers de eventos de erro
   * @private
   */
  #errorHandlers = [];

  /**
   * Complete event handlers
   * Handlers de eventos de conclusão
   * @private
   */
  #completeHandlers = [];

  /**
   * Private constructor (Singleton pattern)
   * Construtor privado (padrão Singleton)
   * @private
   */
  constructor() {
    if (ChatService.#instance) {
      throw new Error(
        'ChatService is a singleton. Use ChatService.getInstance() instead. / ' +
        'ChatService é um singleton. Use ChatService.getInstance() ao invés disso.'
      );
    }
    this.#api = APIClient.getInstance();
  }

  /**
   * Get singleton instance / Obter instância singleton
   * @static
   * @returns {ChatService} ChatService instance / Instância do ChatService
   */
  static getInstance() {
    if (!ChatService.#instance) {
      ChatService.#instance = new ChatService();
    }
    return ChatService.#instance;
  }

  /**
   * Send chat message with SSE streaming
   * Enviar mensagem de chat com streaming SSE
   * 
   * @param {string} prompt - User message / Mensagem do usuário
   * @param {Array} context - Conversation context / Contexto da conversa
   * @param {Object} options - Additional options / Opções adicionais
   * @param {boolean} options.autoExecute - Auto-execute commands / Auto-executar comandos
   * @param {number} options.maxIterations - Max AI→Command iterations / Máx iterações IA→Comando
   * @param {boolean} options.stream - Enable streaming (default: true) / Habilitar streaming
   * @returns {Promise<void>}
   */
  async sendMessage(prompt, context = [], options = {}) {
    const {
      autoExecute = false,
      maxIterations = 10,
      stream = true
    } = options;

    // Close any existing connection / Fechar qualquer conexão existente
    this.abortCurrentRequest();

    console.log('[ChatService] Sending message:', { prompt: prompt.substring(0, 50), autoExecute, maxIterations });

    try {
      if (stream) {
        // SSE Streaming mode / Modo streaming SSE
        await this.#initSSEConnection(prompt, context, { autoExecute, maxIterations });
      } else {
        // Fallback: Non-streaming mode / Fallback: modo sem streaming
        await this.#sendNonStreamingMessage(prompt, context, { autoExecute, maxIterations });
      }
    } catch (error) {
      console.error('[ChatService] Send message error:', error);
      this.#notifyError(error);
      throw error;
    }
  }

  /**
   * Initialize SSE connection for streaming responses
   * Inicializar conexão SSE para respostas com streaming
   * @private
   */
  async #initSSEConnection(prompt, context, options) {
    const { autoExecute, maxIterations } = options;

    // Build query parameters for SSE GET request
    // Construir parâmetros de query para requisição GET SSE
    const params = new URLSearchParams({
      prompt: prompt,
      auto_execute: autoExecute.toString(),
      max_iterations: maxIterations.toString()
    });

    // Add context as JSON in query (alternative: POST body, but GET is simpler for EventSource)
    // Adicionar contexto como JSON na query
    if (context && context.length > 0) {
      params.append('context', JSON.stringify(context));
    }

    const url = `${this.#api.baseURL}/chat?${params.toString()}`;

    console.log('[ChatService] Initializing SSE connection:', url.substring(0, 100));

    // Create EventSource for SSE / Criar EventSource para SSE
    this.#currentEventSource = new EventSource(url);

    // Setup event listeners / Configurar event listeners
    this.#currentEventSource.onmessage = (event) => {
      try {
        const chunk = JSON.parse(event.data);
        console.log('[ChatService] SSE chunk received:', chunk.type);
        this.#handleSSEChunk(chunk);
      } catch (error) {
        console.error('[ChatService] SSE message parse error:', error);
      }
    };

    this.#currentEventSource.onerror = (error) => {
      console.error('[ChatService] SSE error:', error);
      this.#notifyError(new Error('SSE connection error / Erro de conexão SSE'));
      this.abortCurrentRequest();
    };

    // EventSource doesn't have onclose, but we track completion via 'complete' chunk
    // EventSource não tem onclose, mas rastreamos conclusão via chunk 'complete'
  }

  /**
   * Send non-streaming message (fallback)
   * Enviar mensagem sem streaming (fallback)
   * @private
   */
  async #sendNonStreamingMessage(prompt, context, options) {
    console.log('[ChatService] Sending non-streaming message');

    const response = await this.#api.post('/chat', {
      prompt,
      context,
      stream: false,
      options
    });

    // Simulate chunk format for consistency
    // Simular formato de chunk para consistência
    if (response && response.response) {
      this.#handleSSEChunk({
        type: 'text',
        content: response.response,
        metadata: { iterations: response.iterations || 1 }
      });

      this.#handleSSEChunk({
        type: 'complete',
        content: '',
        metadata: { iterations: response.iterations || 1 }
      });
    }
  }

  /**
   * Handle SSE chunk based on type
   * Tratar chunk SSE baseado no tipo
   * @private
   */
  #handleSSEChunk(chunk) {
    const { type, content, metadata } = chunk;

    switch (type) {
      case 'text':
        // AI response text chunk / Chunk de texto da resposta IA
        this.#notifyMessage({
          type: 'text',
          content,
          metadata
        });
        break;

      case 'command_proposal':
        // Command proposed by AI / Comando proposto pela IA
        this.#notifyMessage({
          type: 'command_proposal',
          content,
          metadata
        });
        break;

      case 'command_result':
        // Result from command execution / Resultado da execução de comando
        this.#notifyMessage({
          type: 'command_result',
          content,
          metadata
        });
        break;

      case 'error':
        // Error message / Mensagem de erro
        this.#notifyError(new Error(content));
        break;

      case 'complete':
        // Streaming complete / Streaming completo
        console.log('[ChatService] Streaming complete:', metadata);
        this.#notifyComplete(metadata);
        this.abortCurrentRequest(); // Clean up / Limpar
        break;

      default:
        console.warn('[ChatService] Unknown chunk type:', type);
    }
  }

  /**
   * Abort current request and close SSE connection
   * Abortar requisição atual e fechar conexão SSE
   */
  abortCurrentRequest() {
    if (this.#currentEventSource) {
      console.log('[ChatService] Closing SSE connection');
      this.#currentEventSource.close();
      this.#currentEventSource = null;
    }
  }

  /**
   * Check if there's an active streaming connection
   * Verificar se há uma conexão de streaming ativa
   * @returns {boolean}
   */
  isStreaming() {
    return this.#currentEventSource !== null;
  }

  // ========================================================================
  // Observer Pattern: Event Handler Registration
  // Padrão Observer: Registro de Handlers de Eventos
  // ========================================================================

  /**
   * Register message handler (Observer pattern)
   * Registrar handler de mensagens (padrão Observer)
   * 
   * @param {Function} handler - Callback function (chunk) => void
   * @returns {Function} Unsubscribe function / Função de unsubscribe
   */
  onMessage(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function / Handler deve ser uma função');
    }

    this.#messageHandlers.push(handler);

    // Return unsubscribe function / Retornar função de unsubscribe
    return () => {
      const index = this.#messageHandlers.indexOf(handler);
      if (index > -1) {
        this.#messageHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register error handler
   * Registrar handler de erro
   * 
   * @param {Function} handler - Callback function (error) => void
   * @returns {Function} Unsubscribe function
   */
  onError(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function / Handler deve ser uma função');
    }

    this.#errorHandlers.push(handler);

    return () => {
      const index = this.#errorHandlers.indexOf(handler);
      if (index > -1) {
        this.#errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register complete handler
   * Registrar handler de conclusão
   * 
   * @param {Function} handler - Callback function (metadata) => void
   * @returns {Function} Unsubscribe function
   */
  onComplete(handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function / Handler deve ser uma função');
    }

    this.#completeHandlers.push(handler);

    return () => {
      const index = this.#completeHandlers.indexOf(handler);
      if (index > -1) {
        this.#completeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all event handlers
   * Limpar todos os handlers de eventos
   */
  clearAllHandlers() {
    this.#messageHandlers = [];
    this.#errorHandlers = [];
    this.#completeHandlers = [];
    console.log('[ChatService] All handlers cleared');
  }

  // ========================================================================
  // Private: Notify observers
  // Privado: Notificar observers
  // ========================================================================

  /**
   * Notify all message handlers
   * Notificar todos os handlers de mensagem
   * @private
   */
  #notifyMessage(chunk) {
    this.#messageHandlers.forEach(handler => {
      try {
        handler(chunk);
      } catch (error) {
        console.error('[ChatService] Message handler error:', error);
      }
    });
  }

  /**
   * Notify all error handlers
   * Notificar todos os handlers de erro
   * @private
   */
  #notifyError(error) {
    this.#errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        console.error('[ChatService] Error handler error:', err);
      }
    });
  }

  /**
   * Notify all complete handlers
   * Notificar todos os handlers de conclusão
   * @private
   */
  #notifyComplete(metadata) {
    this.#completeHandlers.forEach(handler => {
      try {
        handler(metadata);
      } catch (error) {
        console.error('[ChatService] Complete handler error:', error);
      }
    });
  }
}

// Export singleton instance / Exportar instância singleton
export default ChatService;
