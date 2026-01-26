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

export const BlockType = {
  INPUT: 'input',
  THINKING: 'thinking',
  SHELL: 'shell',
  NARRATIVE: 'narrative',
  ERROR: 'error'
};

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
      content: '',
      status: 'active', // active, done, error
      metadata: { ...metadata, timestamp: Date.now() }
    };
    
    setBlocks(prev => [...prev, newBlock]);
    activeBlockIdRef.current = newBlock.id;
    return newBlock.id;
  }, []);

  /**
   * Update the currently active block content
   * Atualiza o conteúdo do bloco ativo atual
   */
  const updateActiveBlock = useCallback((content, isAppend = true) => {
    if (!activeBlockIdRef.current) return;

    setBlocks(prev => prev.map(block => {
      if (block.id === activeBlockIdRef.current) {
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
     if (!activeBlockIdRef.current) return;

     setBlocks(prev => prev.map(block => {
       if (block.id === activeBlockIdRef.current) {
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
        // Standard text chunk 
        // Logic: specific blocks (thinking, etc) handle their own content updates?
        // OR: 'text' events populate the currently active block
        // Assuming strictly sequential:
        if (activeBlockIdRef.current) {
            updateActiveBlock(content);
        } else {
            // Fallback for loose text: Create Narrative block implicitly
            addBlock(BlockType.NARRATIVE);
            updateActiveBlock(content);
        }
        break; // Fixed: was missing break
        
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
        addBlock(BlockType.ERROR);
        updateActiveBlock(content);
        completeActiveBlock();
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
