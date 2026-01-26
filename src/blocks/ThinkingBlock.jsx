/**
 * ThinkingBlock Component
 * Componente de Bloco de Pensamento
 * 
 * Visualizes the AI's Chain of Thought (CoT).
 * Visualiza a Cadeia de Pensamento (CoT) da IA.
 * 
 * features:
 * - Collapsible "Kernel Debug" style
 * - Streaming updates
 * - Low-profile visual to not distract from main narrative
 * 
 * @author: Roberto Dantas de Castro
 */

import { ChevronDown, Cpu } from 'lucide-react';
import { useEffect, useState } from 'react';

const ThinkingBlock = ({ content, metadata = {}, status = 'active' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Auto-expand on error or if specific metadata flags it
  useEffect(() => {
      if (status === 'error') setIsOpen(true);
  }, [status]);

  return (
    <div className={`my-2 border rounded-lg overflow-hidden transition-all duration-300 ${
      status === 'active' ? 'border-cyan-500/30' : 'border-gray-800'
    }`}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900/40 p-2 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
            <Cpu size={14} className={`transition-colors ${
                status === 'active' ? 'text-cyan-400 animate-pulse' : 'text-gray-600'
            }`} />
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                {status === 'active' ? 'Neural Processing...' : 'CoT Analysis'}
            </span>
        </div>
        
        <div className="flex items-center gap-2">
            {metadata.iteration && (
                <span className="text-[10px] text-gray-600 bg-gray-900 px-1 rounded">
                    ITER {metadata.iteration}
                </span>
            )}
            <ChevronDown 
                size={14} 
                className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
            />
        </div>
      </div>

      {/* Content */}
      {(isOpen || status === 'active') && (
        <div className="bg-black/20 p-3 border-t border-gray-800/50">
            <pre className="font-mono text-xs text-gray-500 leading-relaxed whitespace-pre-wrap font-light">
                {content || "Initializing..."}
                {status === 'active' && <span className="animate-pulse">_</span>}
            </pre>
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
