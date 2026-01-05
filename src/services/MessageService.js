/**
 * MessageService - Message processing and formatting
 * Handles message creation, parsing, and validation
 * 
 * MessageService - Processamento e formatação de mensagens
 * Gerencia criação, análise e validação de mensagens
 */

import { parseContentIntoBlocks } from '../utils/blockRenderer';

/**
 * MessageService Class
 * Static utility methods for message handling
 * 
 * Classe MessageService
 * Métodos utilitários estáticos para gerenciamento de mensagens
 */
class MessageService {
  /**
   * Create user message object
   * Criar objeto de mensagem de usuário
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   * @returns {object} User message object / Objeto de mensagem de usuário
   */
  static createUserMessage(content) {
    return {
      type: 'user',
      content,
      timestamp: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  }

  /**
   * Create agent message object
   * Criar objeto de mensagem de agente
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   * @param {object} metadata - Additional metadata / Metadados adicionais
   * @returns {object} Agent message object / Objeto de mensagem de agente
   */
  static createAgentMessage(content, metadata = {}) {
    return {
      type: 'agent',
      content,
      timestamp: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      ...metadata
    };
  }

  /**
   * Create error message object
   * Criar objeto de mensagem de erro
   * 
   * @param {string} error - Error message / Mensagem de erro
   * @returns {object} Error message object / Objeto de mensagem de erro
   */
  static createErrorMessage(error) {
    return {
      type: 'agent',
      content: `Error: ${error}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      isError: true
    };
  }

  /**
   * Parse message content into blocks
   * Analisar conteúdo da mensagem em blocos
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   * @param {string} type - Message type / Tipo de mensagem
   * @returns {array} Array of blocks / Array de blocos
   */
  static parseIntoBlocks(content, type = 'agent') {
    return parseContentIntoBlocks(content, type);
  }

  /**
   * Validate message
   * Validar mensagem
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   * @returns {boolean} Is valid / É válido
   */
  static validateMessage(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const trimmed = content.trim();
    return trimmed.length > 0 && trimmed.length <= 10000; // Max 10k chars
  }

  /**
   * Sanitize message content
   * Sanitizar conteúdo da mensagem
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   * @returns {string} Sanitized content / Conteúdo sanitizado
   */
  static sanitize(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Trim whitespace / Remover espaços
    let sanitized = content.trim();

    // Remove null bytes / Remover bytes nulos
    sanitized = sanitized.replace(/\0/g, '');

    // Limit length / Limitar comprimento
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + '... (truncated)';
    }

    return sanitized;
  }

  /**
   * Format message for display
   * Formatar mensagem para exibição
   * 
   * @param {object} message - Message object / Objeto de mensagem
   * @returns {object} Formatted message / Mensagem formatada
   */
  static formatForDisplay(message) {
    return {
      ...message,
      content: this.sanitize(message.content),
      blocks: this.parseIntoBlocks(message.content, message.type)
    };
  }

  /**
   * Extract commands from message
   * Extrair comandos da mensagem
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   * @returns {array} Array of commands / Array de comandos
   */
  static extractCommands(content) {
    const commands = [];
    const commandPattern = /```(?:bash|sh)?\n([\s\S]*?)\n```/g;
    let match;

    while ((match = commandPattern.exec(content)) !== null) {
      const command = match[1].trim();
      if (command) {
        commands.push(command);
      }
    }

    return commands;
  }
}

export default MessageService;
