/**
 * ChatContainer - Chat History Display Component
 * Componente de Exibição de Histórico de Chat
 * 
 * Displays chat blocks with auto-scroll functionality.
 * Exibe blocos de chat com funcionalidade de auto-scroll.
 * 
 * @component
 */

import { useEffect, useRef } from 'react';
import SmartBlock from './SmartBlock';

const ChatContainer = ({ 
  blocks, 
  isLoading, 
  autoScroll,
  onBlockAction 
}) => {
  const bottomRef = useRef(null);

  // Auto-scroll effect / Efeito de auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [blocks, autoScroll]);

  return (
    <div className="conversation-area">
      {blocks.map(block => (
        <SmartBlock 
          key={block.id} 
          block={block}
          onAction={onBlockAction}
        />
      ))}
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Processing...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatContainer;
