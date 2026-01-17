/**
 * useChatManager - Custom Hook for Chat State Management
 * Hook Customizado para Gerenciamento de Estado do Chat
 * 
 * Encapsulates:
 * - Block/Message state / Estado de Blocos/Mensagens
 * - ChatService subscriptions / Assinaturas do ChatService
 * - Message sending & Commands / Envio de mensagens e Comandos
 * - Loading & Error states / Estados de Carregamento e Erro
 * 
 * @author Roberto Dantas de Castro
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import ChatService from '../services/ChatService';
import Logger from '../utils/Logger';

const useChatManager = (api, aiConfig) => {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('prompt'); // 'prompt' | 'command'
  const [autoScroll, setAutoScroll] = useState(true);
  const [showIterationLimitReached, setShowIterationLimitReached] = useState(false);
  
  // Services
  const chatService = ChatService.getInstance();
  const logger = Logger.getInstance();

  /**
   * Send a new message
   * Enviar uma nova mensagem
   */
  const sendMessage = useCallback(async (text, autoExecute = false, unlimitedIterations = false, maxIterations = 10) => {
    if (!text.trim() || isLoading) return;

    setLoading(true);
    setShowIterationLimitReached(false);

    // Add User Block
    setBlocks(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString()
    }]);

    try {
      const context = blocks.map(b => ({
        role: b.type === 'user' ? 'user' : 'assistant',
        content: b.content
      }));

      await chatService.sendMessage(text, context, {
        autoExecute,
        maxIterations: unlimitedIterations ? 100 : maxIterations,
        stream: true
      });
      
    } catch (error) {
       // Handled by onError listener
       logger.error('Failed to send message', error);
    }
  }, [blocks, isLoading, chatService, logger]);

  /**
   * Execute a command manually
   * Executar um comando manualmente
   */
  const manualExecute = useCallback(async (cmd) => {
    // Mark proposal as executed if it exists
    setBlocks(prev => prev.map(b => 
      b.type === 'proposal' && b.content === cmd 
        ? { ...b, executed: true } 
        : b
    ));

    try {
      const res = await api.post('/execute', { command: cmd });
      
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'SHELL',
        content: res.output,
        timestamp: new Date().toLocaleTimeString(),
        result: {
            success: res.success,
            exit_code: res.exit_code
        }
      }]);

    } catch (e) {
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'SHELL',
        content: `Execution failed: ${e.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  }, [api]);

  /**
   * Stop generation
   * Parar geração
   */
  const stopGeneration = useCallback(() => {
    chatService.abortCurrentRequest();
    setLoading(false);
    
    setBlocks(prev => [...prev, {
      id: Date.now(),
      type: 'agent',
      content: '⚠️ Generation stopped by user. / Geração interrompida pelo usuário.',
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, [chatService]);

  // Track mount status / Rastrear status de montagem
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ========================================================================
  // ChatService Subscriptions
  // ========================================================================
  
  useEffect(() => {
    logger.info('Setting up ChatService event handlers in useChatManager');

    const unsubMessage = chatService.onMessage((chunk) => {
      if (!isMounted.current) return;
      
      const { type, content, metadata } = chunk;

      switch (type) {
        case 'text':
          setBlocks(prev => {
            const lastBlock = prev[prev.length - 1];
            
            if (lastBlock && lastBlock.type === 'agent' && !lastBlock.completed) {
              return prev.map((block, idx) => 
                idx === prev.length - 1
                  ? { ...block, content: block.content + content }
                  : block
              );
            } else {
              return [...prev, {
                id: Date.now(),
                type: 'agent',
                content,
                timestamp: new Date().toLocaleTimeString(),
                completed: false
              }];
            }
          });
          break;

        case 'command_proposal':
          setBlocks(prev => {
            const lastBlock = prev[prev.length - 1];
            if (lastBlock && lastBlock.type === 'proposal' && lastBlock.content === content) {
              return prev;
            }
             return [...prev, {
              id: Date.now(),
              type: 'proposal',
              content,
              timestamp: new Date().toLocaleTimeString(),
              executed: false
            }];
          });
          break;

        case 'command_result':
           setBlocks(prev => [...prev, {
              id: Date.now(),
              type: 'SHELL',
              content: content || '',
              timestamp: new Date().toLocaleTimeString(),
              result: metadata
            }]);
          break;
      }
    });

    const unsubError = chatService.onError((error) => {
      if (!isMounted.current) return;
      logger.error('Chat error received', { error });
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `❌ Error: ${error.message} / Erro: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setLoading(false);
    });

    const unsubComplete = chatService.onComplete((metadata) => {
      if (!isMounted.current) return;
      logger.info('Chat complete received', { metadata });
      setLoading(false);
      setBlocks(prev => {
        const lastBlock = prev[prev.length - 1];
        if (lastBlock && lastBlock.type === 'agent') {
          return prev.map((block, idx) => 
            idx === prev.length - 1
              ? { ...block, completed: true }
              : block
          );
        }
        return prev;
      });

      if (metadata && metadata.stopped_early && metadata.iterations >= metadata.max_iterations) {
         setShowIterationLimitReached(true);
         setBlocks(prev => [...prev, {
            id: Date.now(),
            type: 'limit_prompt',
            timestamp: new Date().toLocaleTimeString()
         }]);
      }
    });

    return () => {
      unsubMessage();
      unsubError();
      unsubComplete();
    };
  }, [chatService, logger]);

  return {
    blocks,
    setBlocks,
    isLoading,
    inputMode,
    setInputMode,
    autoScroll,
    setAutoScroll,
    showIterationLimitReached,
    sendMessage,
    manualExecute,
    stopGeneration
  };
};

export default useChatManager;
