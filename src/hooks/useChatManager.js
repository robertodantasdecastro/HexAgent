/**
 * useChatManager - Custom Hook for Chat State Management
 * Hook Customizado para Gerenciamento de Estado do Chat
 * 
 * Updated for Inference Blocks Architecture (v2.1)
 * Atualizado para Arquitetura de Blocos de Inferência (v2.1)
 * 
 * Encapsulates:
 * - Block Manager State Machine
 * - ChatService subscriptions
 * - Message sending & Commands
 * - Abort Logic
 * 
 * @author Roberto Dantas de Castro
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import ChatService from '../services/ChatService';
import Logger from '../utils/Logger';
import useBlockManager, { BlockType } from './useBlockManager';

const useChatManager = (api, aiConfig) => {
  const [isLoading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('prompt'); // 'prompt' | 'command'
  const [showIterationLimitReached, setShowIterationLimitReached] = useState(false);
  
  // Services
  const chatService = ChatService.getInstance();
  const logger = Logger.getInstance();
  
  // New Block Manager State Machine
  const blockManager = useBlockManager();
  const { blocks, addBlock, updateActiveBlock, completeActiveBlock, handleEvent, clearBlocks } = blockManager;

  /**
   * Send a new message
   * Enviar uma nova mensagem
   */
  const sendMessage = useCallback(async (text, autoExecute = false, unlimitedIterations = false, maxIterations = 10) => {
    if (!text.trim() || isLoading) return;

    setLoading(true);
    setShowIterationLimitReached(false);

    // 1. Create Input Block (Frozen State)
    addBlock(BlockType.INPUT, { 
        content: text, 
        status: 'frozen', // Display as frozen input
        timestamp: Date.now() 
    });
    
    // Manually set content since addBlock initializes empty
    updateActiveBlock(text, false); 
    completeActiveBlock(); // Mark input as done so next events start new blocks

    try {
      const context = blocks
        .filter(b => b.type === BlockType.INPUT || b.type === BlockType.NARRATIVE)
        .map(b => ({
            role: b.type === BlockType.INPUT ? 'user' : 'assistant',
            content: b.content
      }));

      await chatService.sendMessage(text, context, {
        autoExecute,
        maxIterations: unlimitedIterations ? 100 : maxIterations,
        stream: true
      });
      
    } catch (error) {
       logger.error('Failed to send message', error);
       addBlock(BlockType.ERROR, { error: error.message });
       updateActiveBlock(error.message);
       completeActiveBlock();
       setLoading(false);
    }
  }, [blocks, isLoading, chatService, logger, addBlock, updateActiveBlock, completeActiveBlock]);

  /**
   * Execute a command manually
   * Executar um comando manualmente
   */
  const manualExecute = useCallback(async (cmd) => {
    // Note: In new architecture, manual execute usually triggers a ShellBlock
    addBlock(BlockType.SHELL, { command: cmd });
    
    try {
      const res = await api.post('/execute', { command: cmd });
      
      updateActiveBlock(res.output || "");
      completeActiveBlock({ 
          exit_code: res.exit_code, 
          success: res.success 
      });

    } catch (e) {
      updateActiveBlock(`Execution failed: ${e.message}`);
      completeActiveBlock({ exit_code: 1, success: false });
    }
  }, [api, addBlock, updateActiveBlock, completeActiveBlock]);

  /**
   * Stop generation
   * Parar geração
   */
  const stopGeneration = useCallback(async () => {
    // 1. Send Abort to Backend
    try {
        await api.post('/chat/abort', {});
    } catch (e) {
        logger.error("Failed to send abort signal", e);
    }

    // 2. Abort Frontend Service
    chatService.abortCurrentRequest();
    setLoading(false);
    
    // 3. Update UI
    handleEvent({ type: 'abort' });
    
  }, [chatService, api, handleEvent, logger]);

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
    logger.info('Setting up ChatService event handlers in useChatManager (Block Arch)');

    // Map ChatService events to BlockManager events
    const unsubMessage = chatService.onMessage((chunk) => {
      if (!isMounted.current) return;
      
      // Pass directly to BlockManager State Machine
      handleEvent(chunk);
    });

    const unsubError = chatService.onError((error) => {
      if (!isMounted.current) return;
      handleEvent({ type: 'error', content: error.message });
      setLoading(false);
    });

    const unsubComplete = chatService.onComplete((metadata) => {
      if (!isMounted.current) return;
      setLoading(false);
      // Ensure last block is closed
      completeActiveBlock(metadata);

      if (metadata && metadata.stopped_early && metadata.iterations >= metadata.max_iterations) {
         setShowIterationLimitReached(true);
         // Optional: Add a limit warning block if needed
      }
    });

    return () => {
      unsubMessage();
      unsubError();
      unsubComplete();
    };
  }, [chatService, logger, handleEvent, completeActiveBlock]);

  return {
    blocks,
    setBlocks: () => logger.warn("setBlocks is deprecated in Block Architecture"), // Read-only mostly
    isLoading,
    inputMode,
    setInputMode,
    showIterationLimitReached,
    sendMessage,
    manualExecute,
    stopGeneration
  };
};

export default useChatManager;
