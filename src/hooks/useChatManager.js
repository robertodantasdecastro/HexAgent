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
import { BlockType } from '../constants/BlockTypes';
import ChatController from '../controllers/ChatController';
import useBlockManager from './useBlockManager';

const useChatManager = (api, aiConfig) => {
  const [isLoading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('prompt'); // 'prompt' | 'command'
  const [showIterationLimitReached, setShowIterationLimitReached] = useState(false);
  
  // Controller Facade
  const controller = ChatController.getInstance();
  
  // New Block Manager State Machine
  const { 
    blocks, 
    addBlock, 
    updateActiveBlock, 
    completeActiveBlock, 
    clearBlocks, 
    setBlocks: rawSetBlocks 
  } = useBlockManager();

  // Branching Logic
  const [branches, setBranches] = useState({ 
      'main': { id: 'main', blocks: [], parentId: null } 
  });
  const [currentBranchId, setCurrentBranchId] = useState('main');

  // Sync: Active blocks -> Current Branch Storage
  // Sincronização: Blocos ativos -> Armazenamento do Branch atual
  useEffect(() => {
     setBranches(prev => {
         // Avoid infinite loops by checking equality if possible, 
         // but simpler to just update the current branch reference.
         // Simplified check: if reference is same or length is same (naive)
         if (prev[currentBranchId]?.blocks === blocks) return prev;
         
         return {
             ...prev,
             [currentBranchId]: { 
                 ...prev[currentBranchId], 
                 blocks: blocks 
             }
         };
     });
  }, [blocks, currentBranchId]);

  /**
   * Switch to a different branch
   * Alternar para um branch diferente
   */
  const switchBranch = useCallback((branchId) => {
      if (branches[branchId]) {
          // 1. Snapshot current state is handled by useEffect, but forceful save for safety
          // (Actually useEffect handles it)

          // 2. Switch ID
          setCurrentBranchId(branchId);
          
          // 3. Hydrate View from Branch
          // Using internal clear/add loop to ensure proper state machine reset
          clearBlocks(); 
          
          // Small timeout to allow clear to settle if needed, or just sync
          // Ideally setBlocks should be supported, passing raw array
          if (branches[branchId].blocks.length > 0) {
             branches[branchId].blocks.forEach(b => addBlock(b.type, b));
          }
      }
  }, [branches, clearBlocks, addBlock]);

  /**
   * Fork the conversation from a specific block
   * Ramificar a conversa a partir de um bloco específico
   */
  const forkBranch = useCallback((blockIndex) => {
      if (blockIndex < 0 || blockIndex >= blocks.length) return;

      const newBranchId = `branch_${Date.now()}`;
      
      // Slice blocks up to the fork point
      const forkedBlocks = blocks.slice(0, blockIndex + 1);
      
      const newBranch = {
          id: newBranchId,
          blocks: forkedBlocks,
          parentId: currentBranchId,
          forkIndex: blockIndex
      };

      // Create Branch
      setBranches(prev => ({ ...prev, [newBranchId]: newBranch }));
      
      // Switch Context
      setCurrentBranchId(newBranchId);
      
      // Update UI
      clearBlocks();
      forkedBlocks.forEach(b => addBlock(b.type, b));
      
      return newBranchId;
  }, [blocks, currentBranchId, clearBlocks, addBlock]);


  /**
   * Send a new message
   * Enviar uma nova mensagem
   */
  const sendMessage = useCallback(async (text, autoExecute = false, unlimitedIterations = false, maxIterations = 10) => {
    if (!text.trim() || isLoading) return;

    setLoading(true);
    setShowIterationLimitReached(false);

    // 1. Add Input Block to UI
    const newBlock = { 
        id: `block_${Date.now()}`,
        type: BlockType.INPUT,
        content: text, 
        status: 'frozen', 
        timestamp: Date.now() 
    };
    addBlock(BlockType.INPUT, newBlock); 

    try {
      // 2. Build Context from UI Blocks (Source of Truth)
      // Filter only relevant blocks for context
      // Note: We need to use a functional update or access current 'blocks' ref for latest state
      // But 'blocks' in dependency array ensures this closure is fresh.
      
      // We manually append the new block to the context because 'blocks' 
      // might not have updated in this render cycle yet (React batching).
      
      const previousContext = blocks
        .filter(b => b.type === BlockType.INPUT || b.type === BlockType.NARRATIVE)
        .map(b => ({
            role: b.type === BlockType.INPUT ? 'user' : 'assistant',
            content: b.content
      }));
      
      const context = [...previousContext, { role: 'user', content: text }];

      await controller.sendMessage(text, context, {
        autoExecute,
        maxIterations: unlimitedIterations ? 100 : maxIterations,
        stream: true
      });
      
    } catch (error) {
       console.error('Failed to send message', error);
       addBlock(BlockType.ERROR, { initialContent: error.message, error: error.message });
       setLoading(false);
    }
  }, [blocks, isLoading, controller, addBlock]);

  /**
   * Execute a command manually
   */
  const manualExecute = useCallback(async (cmd) => {
    addBlock(BlockType.SHELL, { command: cmd });
    
    try {
      const res = await controller.executeCommand(cmd);
      
      updateActiveBlock(res.output || "");
      completeActiveBlock({ 
          exit_code: res.exit_code, 
          success: res.success 
      });

    } catch (e) {
      updateActiveBlock(`Execution failed: ${e.message}`);
      completeActiveBlock({ exit_code: 1, success: false });
    }
  }, [controller, addBlock, updateActiveBlock, completeActiveBlock]);

  /**
   * Stop generation
   */
  const stopGeneration = useCallback(async () => {
    try {
        await api.post('/chat/abort', {});
    } catch (e) {
        console.error("Failed to send abort signal", e);
    }

    controller.abortGeneration();
    setLoading(false);
    
    // Pass abort event to block manager to finalize UI
    handleEvent({ type: 'abort' });
    
  }, [controller, api]); // handleEvent is used below via hoisting or ref? No, defined below. 
  // Wait, handleEvent needs to be defined BEFORE stopGeneration if used there.
  // Or use a ref. Or move handleEvent up.
  
  // Track mount status
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ========================================================================
  // ChatService Subscriptions & Event Handler
  // ========================================================================
  
  // Internal Event Handler that routes to BlockManager
  // MOVED UP to be accessible by stopGeneration (if we use 'var' or function hoisting, but const needs order)
  // Actually, circular dependency: stopGeneration uses handleEvent, handleEvent uses addBlock.
  // We can define handleEvent first.
  
  const handleEvent = useCallback((chunk) => {
      
      // Map Backend Loop Types to Frontend Block Types
      const blockTypeMap = {
          'thinking': BlockType.THINKING,
          'narrative': BlockType.NARRATIVE, // Maps 'text' block from backend
          'shell': BlockType.SHELL,
          'command': BlockType.SHELL, // Alias
          'code': BlockType.CODE,     // Fixed: Added Code Block support
          'input': BlockType.INPUT    // Safety
      };

      if (chunk.type === 'block_start') {
          const typeName = chunk.content; // 'thinking', 'narrative', 'shell'
          const blockType = blockTypeMap[typeName] || BlockType.NARRATIVE;
          
          // Start new block
          addBlock(blockType, chunk.metadata);

      } else if (chunk.type === 'text') {
           // Standard text, append to active
           updateActiveBlock(chunk.content);
           
      } else if (chunk.type === 'thinking') {
           // Thinking content
           updateActiveBlock(chunk.content);

      } else if (chunk.type === 'block_end') {
           completeActiveBlock(chunk.metadata);

      } else if (chunk.type === 'shell_start') { // Legacy fallback
          addBlock(BlockType.SHELL, { command: chunk.metadata?.command });

      } else if (chunk.type === 'shell_end') { // Legacy fallback
          completeActiveBlock(chunk.metadata);

      } else if (chunk.type === 'command_proposal') { // Legacy fallback or specific event
           addBlock(BlockType.SHELL, { command: chunk.content, status: 'proposal', ...chunk.metadata });

      } else if (chunk.type === 'command_result') { // Legacy fallback
           updateActiveBlock(chunk.content);
           completeActiveBlock({ ...chunk.metadata, status: chunk.metadata.success ? 'done' : 'error' });

      } else if (chunk.type === 'error' || chunk.type === 'abort') {
          completeActiveBlock(); // Close current
          if (chunk.type === 'error') {
               addBlock(BlockType.ERROR, { initialContent: chunk.content });
          }
      }
  }, [addBlock, updateActiveBlock, completeActiveBlock]);

  // Redefine stopGeneration to implicitly use handleEvent if needed
  // Or just call it directly.
  
  useEffect(() => {
    // logger.info('Setting up ChatService event handlers in useChatManager (Block Arch)');

    const unsubMessage = controller.onMessage((chunk) => {
      if (!isMounted.current) return;
      handleEvent(chunk);
    });

    const unsubError = controller.onError((error) => {
      if (!isMounted.current) return;
      handleEvent({ type: 'error', content: error.message });
      setLoading(false);
    });

    const unsubComplete = controller.onComplete((metadata) => {
      if (!isMounted.current) return;
      setLoading(false);
      completeActiveBlock(metadata);

      if (metadata && metadata.stopped_early && metadata.iterations >= metadata.max_iterations) {
         setShowIterationLimitReached(true);
      }
    });

    return () => {
      unsubMessage();
      unsubError();
      unsubComplete();
    };
  }, [controller, handleEvent, completeActiveBlock]);

  // Handle direct setBlocks (e.g. from Session Load)
  const setBlocks = useCallback((newBlocks) => {
      clearBlocks();
      newBlocks.forEach(b => addBlock(b.type, b));
  }, [clearBlocks, addBlock]);

  return {
    blocks, // Single usage
    setBlocks, 
    isLoading,
    inputMode,
    setInputMode,
    showIterationLimitReached,
    sendMessage,
    manualExecute,
    stopGeneration,
    
    // Branching API
    branches,
    currentBranchId,
    switchBranch,
    forkBranch
  };
};

export default useChatManager;
