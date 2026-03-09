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
  static _instance = null;

  // ... (private fields for Streaming)
  _abortController = null;
  _messageHandlers = [];
  _errorHandlers = [];
  _completeHandlers = [];

  constructor() {
    super();
    if (ChatService._instance) {
      throw new Error('ChatService is a singleton. Use ChatService.getInstance().');
    }
  }

  static getInstance() {
    if (!ChatService._instance) {
      ChatService._instance = new ChatService();
    }
    return ChatService._instance;
  }

  /**
   * Envia o comando para o Backend Linter e retorna sugestões
   * @param {string} command 
   * @param {string} cwd 
   * @returns {Promise<Object>}
   */
  async lintCommand(command, cwd) {
    try {
      const response = await this.post('/chat/lint', { command, cwd });
      if (response && response.success) {
         return response.data; // { valid: boolean, suggestion: string, reason: string }
      }
      return null;
    } catch (e) {
      this._logger.error('Linter failed', e);
      return null;
    }
  }

  /**
   * Execute command and feed result back to agent for analysis (streaming)
   * Executar comando e retornar resultado ao agente para análise (streaming)
   * 
   * BUG A FIX: This is the correct flow for manual command approval.
   * Uses POST /execute_and_analyze which: (1) runs the command, (2) injects
   * the result into agent history, (3) streams the agent's next step back to UI.
   *
   * CORREÇÃO BUG A: Fluxo correto para aprovação manual de comandos.
   */
  async executeAndAnalyze(command, context = [], options = {}) {
    const {
      autoExecute = false,
      maxIterations = 10,
    } = options;

    this.abortCurrentRequest();
    this._abortController = new AbortController();

    this._logger.info('ChatService: ExecuteAndAnalyze', { command });

    try {
      const url = `${this._api.baseURL}/execute_and_analyze`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          command,
          context,
          options: { auto_execute: autoExecute, max_iterations: maxIterations }
        }),
        signal: this._abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Reuse same stream reading + SSE parsing logic
      // Reutiliza mesma lógica de leitura de stream + parsing SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              const jsonStr = trimmedLine.substring(6);
              if (jsonStr.trim() === '[DONE]') continue;
              try {
                const chunk = JSON.parse(jsonStr);
                this._handleSSEChunk(chunk);
              } catch (e) {
                this._logger.warn('executeAndAnalyze: Failed to parse SSE JSON:', e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        this._logger.info('ChatService: ExecuteAndAnalyze aborted');
        return;
      }
      this._logger.error('ChatService: ExecuteAndAnalyze error', error);
      this._notifyError(error);
      throw error;
    }
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
    this._abortController = new AbortController();

    this._logger.info('ChatService: Sending message', { 
      prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''), 
      autoExecute, 
      maxIterations 
    });

    try {
      if (stream) {
        await this._startStreamingRequest(prompt, context, { autoExecute, maxIterations });
      } else {
        await this._sendNonStreamingMessage(prompt, context, { autoExecute, maxIterations });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
         this._logger.info('ChatService: Request aborted by user');
         return;
      }
      this._logger.error('ChatService: Send message error', error);
      this._notifyError(error);
      throw error;
    }
  }

  /**
   * Start streaming request using Fetch API + ReadableStream
   * Inicia requisição de streaming usando Fetch API + ReadableStream
   * @private
   */
  async _startStreamingRequest(prompt, context, options) {
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
        options: {
          auto_execute: options.autoExecute,
          max_iterations: options.maxIterations
        }
      }),
      signal: this._abortController.signal
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
                        // Validate JSON string before parsing to avoid syntax error
                        if (jsonStr.trim() === "[DONE]") {
                            continue; // Standard SSE close message
                        }
                        
                        const chunk = JSON.parse(jsonStr);
                        // Filter noisy log in production
                        if (chunk.type !== 'text') {
                             this._logger.debug('SSE Chunk:', chunk.type);
                        }
                        this._handleSSEChunk(chunk);
                    } catch (e) {
                         this._logger.warn("Failed to parse SSE JSON:", e);
                         // Don't throw, just log and continue to next line
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
  async _sendNonStreamingMessage(prompt, context, options) {
    this._logger.info('ChatService: Sending non-streaming message');

    const response = await this._api.post('/chat', {
      prompt,
      context,
      stream: false,
      options: {
        auto_execute: options.autoExecute,
        max_iterations: options.maxIterations
      }
    });

    if (response && response.data && response.data.response) {
      // Simulate chunk format
      this._handleSSEChunk({
        type: 'text',
        content: response.data.response,
        metadata: { iterations: response.data.iterations || 1 }
      });

      this._handleSSEChunk({
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
  _handleSSEChunk(chunk) {
    const { type, content, metadata } = chunk;

    switch (type) {
      case 'text':
        this._notifyMessage({
          type: 'text',
          content,
          metadata
        });
        break;

      case 'thinking':
        // Thinking Chain / Cadeia de Pensamento
        this._notifyMessage({
          type: 'thinking',
          content,
          metadata
        });
        break;

      case 'block_start':
        // Lifecycle Event: Start Block / Evento Ciclo de Vida: Iniciar Bloco
        this._notifyMessage({
          type: 'block_start',
          content: content || metadata?.block_name || 'unknown',
          metadata
        });
        break;

      case 'block_end':
        // Lifecycle Event: End Block / Evento Ciclo de Vida: Terminar Bloco
        this._notifyMessage({
          type: 'block_end',
          content: content || metadata?.block_name || 'unknown',
          metadata
        });
        break;

      case 'command_proposal':
        this._notifyMessage({
          type: 'command_proposal',
          content,
          metadata
        });
        break;

      case 'command_result':
        this._notifyMessage({
          type: 'command_result',
          content,
          metadata
        });
        break;

      case 'error':
        this._notifyError(new Error(content));
        break;

      case 'complete':
        this._logger.info('ChatService: Streaming complete', { metadata });
        this._notifyComplete(metadata);
        this.abortCurrentRequest();
        break;

      default:
        // Generic handler for custom blocks if needed / Handler genérico
        if (type.startsWith('custom_')) {
             this._notifyMessage({ type, content, metadata });
        } else {
             this._logger.warn(`ChatService: Unknown chunk type: ${type}`);
        }
        break;
    }
  }

  /**
   * Abort current request
   * Abortar requisição atual
   */
  abortCurrentRequest() {
    if (this._abortController) {
      this._logger.debug('ChatService: Aborting request');
      this._abortController.abort();
      this._abortController = null;
    }
  }

  /**
   * Check if there's an active streaming connection
   * @returns {boolean}
   */
  isStreaming() {
    return this._abortController !== null && !this._abortController.signal.aborted;
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

    this._messageHandlers.push(handler);

    // Return unsubscribe function / Retornar função de unsubscribe
    return () => {
      const index = this._messageHandlers.indexOf(handler);
      if (index > -1) {
        this._messageHandlers.splice(index, 1);
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

    this._errorHandlers.push(handler);

    return () => {
      const index = this._errorHandlers.indexOf(handler);
      if (index > -1) {
        this._errorHandlers.splice(index, 1);
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

    this._completeHandlers.push(handler);

    return () => {
      const index = this._completeHandlers.indexOf(handler);
      if (index > -1) {
        this._completeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all event handlers
   * Limpar todos os handlers de eventos
   */
  clearAllHandlers() {
    this._messageHandlers = [];
    this._errorHandlers = [];
    this._completeHandlers = [];
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
  _notifyMessage(chunk) {
    // Iterate over a copy to prevent issues if handlers unsubscribe during iteration
    // Iterar sobre uma cópia para evitar problemas se handlers desinscreverem durante iteração
    [...this._messageHandlers].forEach(handler => {
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
  _notifyError(error) {
    [...this._errorHandlers].forEach(handler => {
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
  _notifyComplete(metadata) {
    [...this._completeHandlers].forEach(handler => {
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
