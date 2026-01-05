/**
 * useChatState - Chat state management hook
 * Manages messages, loading state, and chat history
 * 
 * useChatState - Hook de gerenciamento de estado do chat
 * Gerencia mensagens, estado de carregamento e histórico
 */

import { useCallback, useState } from 'react';
import { MessageService } from '../services';

/**
 * useChatState Hook
 * Manages all chat-related state
 * 
 * Hook useChatState
 * Gerencia todo estado relacionado ao chat
 * 
 * @returns {object} Chat state and methods / Estado e métodos do chat
 */
export function useChatState() {
  // State / Estado
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);

  /**
   * Add message to chat
   * Adicionar mensagem ao chat
   * 
   * @param {object} message - Message object / Objeto de mensagem
   */
  const addMessage = useCallback((message) => {
    const formatted = MessageService.formatForDisplay(message);
    setMessages(prev => [...prev, formatted]);
  }, []);

  /**
   * Add user message
   * Adicionar mensagem de usuário
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   */
  const addUserMessage = useCallback((content) => {
    const message = MessageService.createUserMessage(content);
    addMessage(message);
  }, [addMessage]);

  /**
   * Add agent message
   * Adicionar mensagem de agente
   * 
   * @param {string} content - Message content / Conteúdo da mensagem
   * @param {object} metadata - Additional metadata / Metadados adicionais
   */
  const addAgentMessage = useCallback((content, metadata = {}) => {
    const message = MessageService.createAgentMessage(content, metadata);
    addMessage(message);
  }, [addMessage]);

  /**
   * Add error message
   * Adicionar mensagem de erro
   * 
   * @param {string} error - Error message / Mensagem de erro
   */
  const addErrorMessage = useCallback((error) => {
    const message = MessageService.createErrorMessage(error);
    addMessage(message);
  }, [addMessage]);

  /**
   * Clear all messages
   * Limpar todas as mensagens
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentIteration(0);
  }, []);

  /**
   * Update last message
   * Atualizar última mensagem
   * 
   * @param {function|object} updater - Update function or new message / Função de atualização ou nova mensagem
   */
  const updateLastMessage = useCallback((updater) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      
      if (typeof updater === 'function') {
        newMessages[lastIndex] = updater(newMessages[lastIndex]);
      } else {
        newMessages[lastIndex] = { ...newMessages[lastIndex], ...updater };
      }
      
      return newMessages;
    });
  }, []);

  /**
   * Remove message
   * Remover mensagem
   * 
   * @param {number} index - Message index / Índice da mensagem
   */
  const removeMessage = useCallback((index) => {
    setMessages(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Get message count
   * Obter contagem de mensagens
   * 
   * @returns {number} Message count / Contagem de mensagens
   */
  const getMessageCount = useCallback(() => {
    return messages.length;
  }, [messages.length]);

  /**
   * Get last message
   * Obter última mensagem
   * 
   * @returns {object|null} Last message or null / Última mensagem ou null
   */
  const getLastMessage = useCallback(() => {
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }, [messages]);

  return {
    // State / Estado
    messages,
    isLoading,
    currentIteration,
    
    // Setters / Setters
    setIsLoading,
    setCurrentIteration,
    
    // Methods / Métodos
    addMessage,
    addUserMessage,
    addAgentMessage,
    addErrorMessage,
    clearMessages,
    updateLastMessage,
    removeMessage,
    getMessageCount,
    getLastMessage
  };
}
