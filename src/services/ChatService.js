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

import BaseService from './BaseService';

class ChatService extends BaseService {
  /**
   * Singleton instance
   * @private
   * @static
   */
  static #instance = null;

  // ... (private fields for Streaming)
  #abortController = null;
  #messageHandlers = [];
  #errorHandlers = [];
  #completeHandlers = [];

  constructor() {
    super();
    if (ChatService.#instance) {
      throw new Error('ChatService is a singleton. Use ChatService.getInstance().');
    }
  }

  static getInstance() {
    if (!ChatService.#instance) {
      ChatService.#instance = new ChatService();
    }
    return ChatService.#instance;
  }

  /**
   * Send chat message with stream handling
   */
  async sendMessage(prompt, context = [], options = {}) {
    const {
      autoExecute = false,
      maxIterations = 10,
      stream = true
    } = options;

    this.abortCurrentRequest();
    
    // Create new abort controller for this request
    this.#abortController = new AbortController();

    this._logger.info('ChatService: Sending message', { 
      prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''), 
      autoExecute, 
      maxIterations 
    });

    try {
      if (stream) {
        await this.#startStreamingRequest(prompt, context, { autoExecute, maxIterations });
      } else {
        await this.#sendNonStreamingMessage(prompt, context, { autoExecute, maxIterations });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
         this._logger.info('ChatService: Request aborted by user');
         return;
      }
      this._logger.error('ChatService: Send message error', error);
      this.#notifyError(error);
      throw error;
    }
  }

  /**
   * Start streaming request using Fetch API + ReadableStream
   * Inicia requisição de streaming usando Fetch API + ReadableStream
   * @private
   */
  async #startStreamingRequest(prompt, context, options) {
    const url = `${this._api.baseURL}/chat`;
    
    // Use Fetch API for POST request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        prompt,
        context,
        stream: true,
        options
      }),
      signal: this.#abortController.signal
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Decode chunk and append to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines from buffer
            const lines = buffer.split("\n\n");
            
            // Keep the last part if it's incomplete
            buffer = lines.pop() || "";
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("data: ")) {
                    const jsonStr = trimmedLine.substring(6);
                    try {
                        const chunk = JSON.parse(jsonStr);
                        // Filter noisy log in production
                        if (chunk.type !== 'text') {
                             this._logger.debug('SSE Chunk:', chunk.type);
                        }
                        this.#handleSSEChunk(chunk);
                    } catch (e) {
                         this._logger.warn("Failed to parse SSE JSON:", e);
                    }
                }
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        this._logger.error('Stream reading error:', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
  }

  /**
   * Send non-streaming message (fallback)
   * Enviar mensagem sem streaming (fallback)
   * @private
   */
  async #sendNonStreamingMessage(prompt, context, options) {
    this._logger.info('ChatService: Sending non-streaming message');

    const response = await this._api.post('/chat', {
      prompt,
      context,
      stream: false,
      options
    });

    if (response && response.data && response.data.response) {
      // Simulate chunk format
      this.#handleSSEChunk({
        type: 'text',
        content: response.data.response,
        metadata: { iterations: response.data.iterations || 1 }
      });

      this.#handleSSEChunk({
        type: 'complete',
        content: '',
        metadata: { iterations: response.data.iterations || 1 }
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
        this._logger.info('ChatService: Streaming complete', { metadata });
        this.#notifyComplete(metadata);
        this.abortCurrentRequest(); // Clean up / Limpar
        break;

      default:
        this._logger.warn(`ChatService: Unknown chunk type: ${type}`);
    }
  }

  /**
   * Abort current request
   * Abortar requisição atual
   */
  abortCurrentRequest() {
    if (this.#abortController) {
      this._logger.debug('ChatService: Aborting request');
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  /**
   * Check if there's an active streaming connection
   * @returns {boolean}
   */
  isStreaming() {
    return this.#abortController !== null && !this.#abortController.signal.aborted;
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
    this._logger.debug('ChatService: All handlers cleared');
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
  /**
   * Notify all message handlers
   * Notificar todos os handlers de mensagem
   * @private
   */
  #notifyMessage(chunk) {
    // Iterate over a copy to prevent issues if handlers unsubscribe during iteration
    // Iterar sobre uma cópia para evitar problemas se handlers desinscreverem durante iteração
    [...this.#messageHandlers].forEach(handler => {
      try {
        handler(chunk);
      } catch (error) {
        this._logger.error('ChatService: Message handler error:', error);
      }
    });
  }

  /**
   * Notify all error handlers
   * Notificar todos os handlers de erro
   * @private
   */
  #notifyError(error) {
    [...this.#errorHandlers].forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        this._logger.error('ChatService: Error handler error:', err);
      }
    });
  }

  /**
   * Notify all complete handlers
   * Notificar todos os handlers de conclusão
   * @private
   */
  #notifyComplete(metadata) {
    [...this.#completeHandlers].forEach(handler => {
      try {
        handler(metadata);
      } catch (error) {
        this._logger.error('ChatService: Complete handler error:', error);
      }
    });
  }
}

// Export singleton instance / Exportar instância singleton
export default ChatService;
