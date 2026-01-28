/**
 * SmartBlock Component
 * Componente de Bloco Inteligente
 * 
 * Dispatcher for specialized Inference Blocks (v2.1 Architecture)
 * Despachante para Blocos de Inferência especializados (Arquitetura v2.1)
 * 
 * Delegates rendering to:
 * - InputBlock (User Prompt)
 * - ThinkingBlock (Chain of Thought)
 * - ShellBlock (Command Execution)
 * - NarrativeBlock (AI Response)
 * 
 * @author: Roberto Dantas de Castro
 */

import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputBlock from '../blocks/InputBlock';
import NarrativeBlock from '../blocks/NarrativeBlock';
import ShellBlock from '../blocks/ShellBlock';
import ThinkingBlock from '../blocks/ThinkingBlock';
import { BlockType, detectBlockType } from '../utils/blockTypeDetector';

const SmartBlock = ({ 
  block, 
  onAction 
}) => {
  const [blockInfo, setBlockInfo] = useState(null);
  
  const { content, type, metadata = {}, id, timestamp } = block;

  useEffect(() => {
    // If type is already explicit in block object (from BlockManager), use it.
    // Otherwise detect from content (legacy support).
    if (type) {
        setBlockInfo({ type, language: metadata.language });
    } else {
        const detected = detectBlockType(content, metadata);
        setBlockInfo(detected);
    }
  }, [content, type, metadata]);
  
  if (!blockInfo) {
    return (
      <div className="animate-pulse bg-gray-800/20 rounded-lg p-4 my-3">
        <div className="h-4 bg-gray-700/30 rounded w-3/4"></div>
      </div>
    );
  }

  // Dispatch based on Block Type
  switch (blockInfo.type) {
    case BlockType.INPUT:
        return (
            <InputBlock 
                initialContent={content}
                status={block.status || 'frozen'}
                onSend={(newText) => onAction('retry', newText, block)}
                onEdit={() => onAction('edit', null, block)}
                onAbort={() => onAction('abort', null, block)}
            />
        );

    case BlockType.THINKING:
        return (
            <ThinkingBlock 
                content={content} 
                metadata={metadata}
                status={block.status || 'active'}
            />
        );

    case BlockType.SHELL:
        return (
            <ShellBlock 
                content={content}
                metadata={metadata}
                status={block.status || 'active'}
            />
        );

    case BlockType.NARRATIVE:
    case BlockType.CODE: // Fallback for code blocks to narrative
    case BlockType.TEXT: // Fallback
        return (
            <NarrativeBlock 
                content={content}
                type={metadata.role || 'assistant'}
                timestamp={new Date(timestamp || Date.now()).toLocaleTimeString()}
                onExecute={(cmd) => onAction('execute', cmd, block)}
                isLoading={block.status === 'streaming'}
                isLast={block.isLast} // passed from parent map if needed
            />
        );

    case BlockType.ERROR:
        return (
            <div className="my-4 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div className="text-red-200 text-sm font-mono whitespace-pre-wrap">
                    {content}
                </div>
            </div>
        );

    default:
        // Fallback for unknown types
        return (
            <NarrativeBlock 
                content={content}
                type="system"
                timestamp={new Date(timestamp || Date.now()).toLocaleTimeString()}
            />
        );
  }
};

export default SmartBlock;
