/**
 * ThinkingBlock Component
 * Componente de Bloco de Pensamento
 * 
 * Visualizes the AI's internal thought process (Chain of Thought).
 * Visualiza o processo de pensamento interno da IA (Cadeia de Pensamento).
 * 
 * Features:
 * - Collapsible detail view / Visualização de detalhes expansível
 * - Animated pulse effect / Efeito de pulso animado
 * - Cyberpunk aesthetic / Estética Cyberpunk
 * 
 * @author: Roberto Dantas de Castro
 */

import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ThinkingBlock = ({ content, iteration, isExpanded = false }) => {
  const [expanded, setExpanded] = useState(isExpanded);

  return (
    <div className="my-2 rounded border border-cyan-900/30 bg-cyan-950/10 overflow-hidden transition-all duration-300">
      
      {/* Header Toggle */}
      <button 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center w-full px-3 py-2 gap-2 text-xs font-mono text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-900/20 transition-colors"
      >
        <Brain size={12} className={expanded ? "animate-pulse" : ""} />
        <span className="uppercase font-bold tracking-wider">
          Thinking Process {iteration ? `#${iteration}` : ''}
        </span>
        <div className="flex-1 h-px bg-cyan-900/30 mx-2" />
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-3 text-sm text-cyan-200/80 font-mono bg-black/40 border-t border-cyan-900/30 animate-in slide-in-from-top-2 duration-200">
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-pre:bg-black/50">
             <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
