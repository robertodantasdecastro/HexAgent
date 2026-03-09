/**
 * useBlockManager Hook
 * Hook useBlockManager
 * 
 * Manages the state machine of Inference Blocks.
 * Gerencia a máquina de estado dos Blocos de Inferência.
 * 
 * Handles:
 * - Parsing incoming SSE stream events to create/update blocks
 * - Managing block lifecycle (Thinking -> Shell -> Narrative)
 * - Handling Abort signals
 * 
 * @author: Roberto Dantas de Castro
 */

import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BlockType } from '../constants/BlockTypes';

const useBlockManager = () => {
  const [blocks, setBlocks] = useState([]);
  const activeBlockIdRef = useRef(null);

  /**
   * Add a new block to the list
   * Adiciona um novo bloco à lista
   */
  const addBlock = useCallback((type, metadata = {}) => {
    const newBlock = {
      id: uuidv4(),
      type,
      // Fix: Accept initialContent OR content to prevent empty user blocks
      content: metadata.initialContent || metadata.content || '', 
      status: 'active', // active, done, error
      metadata: { ...metadata, timestamp: Date.now() }
    };
    
    // Cleanup helper prop
    if (newBlock.metadata.initialContent) delete newBlock.metadata.initialContent;
    
    setBlocks(prev => [...prev, newBlock]);
    activeBlockIdRef.current = newBlock.id;
    return newBlock.id;
  }, []);

  /**
   * Update the currently active block content
   * Atualiza o conteúdo do bloco ativo atual
   */
  const updateActiveBlock = useCallback((content, isAppend = true) => {
    const targetId = activeBlockIdRef.current;
    if (!targetId) return;

    setBlocks(prev => prev.map(block => {
      if (block.id === targetId) {
        return {
          ...block,
          content: isAppend ? block.content + content : content
        };
      }
      return block;
    }));
  }, []);

  /**
   * Mark active block as complete
   * Marca bloco ativo como completo
   */
  const completeActiveBlock = useCallback((finalMetadata = {}) => {
     const targetId = activeBlockIdRef.current;
     if (!targetId) return;

     setBlocks(prev => prev.map(block => {
       if (block.id === targetId) {
         return {
           ...block,
           status: 'done',
           metadata: { ...block.metadata, ...finalMetadata }
         };
       }
       return block;
     }));
     
     activeBlockIdRef.current = null;
  }, []);

  /**
   * Handle incoming SSE Event
   * Lida com evento SSE recebido
   */
  const handleEvent = useCallback((event) => {
    const { type, content, block, metadata } = event;

    switch (type) {
      case 'block_start':
        // Close previous if open (safety)
        if (activeBlockIdRef.current) completeActiveBlock();
        addBlock(block, metadata);
        break;
        
      case 'block_end':
        completeActiveBlock(metadata);
        break;
        
      case 'text':
      case 'thinking':
      case 'analysis':
      case 'suggestion':
        // Handle content updates for all text-based block types
        // Lida com atualizações de conteúdo para todos os tipos de bloco baseados em texto
        if (activeBlockIdRef.current) {
            updateActiveBlock(content);
        } else {
            // Fallback for loose content: Create generic active block or specific if known
            // Fallback para conteúdo solto: Cria bloco ativo genérico ou específico se conhecido
            const fallbackType = (type === 'text') ? BlockType.NARRATIVE : type;
            addBlock(fallbackType, metadata);
            updateActiveBlock(content);
        }
        break;
        
      case 'abort':
        if (activeBlockIdRef.current) {
             completeActiveBlock();
        }
        addBlock(BlockType.ERROR, { error: 'Aborted by user' });
        updateActiveBlock('⚠️ Process terminated by user.');
        completeActiveBlock();
        break;
        
      case 'error':
        if (activeBlockIdRef.current) {
             completeActiveBlock();
        }
        addBlock(BlockType.ERROR, { initialContent: content }); // Pass content immediately
        completeActiveBlock();
        break;

      case 'command_proposal':
      case 'tool_call':
        // Close current narrative block if open
        if (activeBlockIdRef.current) completeActiveBlock();
        
        // Define command representation
        let cmdRep = content;
        if (type === 'tool_call') {
            cmdRep = `Tool: ${content}\nArgs: ${JSON.stringify(metadata?.arguments || {}, null, 2)}`;
        }
        
        // Create a new Block in "Thinking/Proposed" state
        addBlock(type, { 
            command: cmdRep,
            status: 'proposal', // Waiting for user or auto-execution
            ...metadata
        });
        // Note: We don't complete it yet, waiting for result or user action
        break;

      case 'command_result':
        // Update the active Shell Block (assuming sequential consistency)
        if (activeBlockIdRef.current) {
            updateActiveBlock(content, false); // Replace content with result output? Or append?
            // Usually output is the "content" of a Shell Block.
            // The command itself is in metadata.
            completeActiveBlock({
                ...metadata,
                status: metadata.success ? 'done' : 'error'
            });
        }
        break;
        
      default:
        // Generic handling
        break;
    }
  }, [addBlock, updateActiveBlock, completeActiveBlock]);

  const clearBlocks = useCallback(() => {
      setBlocks([]);
      activeBlockIdRef.current = null;
  }, []);

  return {
    blocks,
    addBlock,
    updateActiveBlock,
    completeActiveBlock,
    handleEvent,
    clearBlocks
  };
};

export default useBlockManager;
