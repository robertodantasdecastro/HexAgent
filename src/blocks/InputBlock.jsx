/**
 * InputBlock Component
 * Componente de Bloco de Entrada
 * 
 * The user's prompt area. Transforms from a textarea into a frozen static block
 * during execution. Editing it triggers an Abort signal handled by parent.
 * 
 * Área de prompt do usuário. Transforma-se de uma área de texto para um bloco estático congelado
 * durante a execução. A edição aciona um sinal de Abortar tratado pelo pai.
 * 
 * @author: Roberto Dantas de Castro
 */

import { Edit2, Send, StopCircle, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const InputBlock = ({ 
    initialContent = '', 
    status = 'editing', // editing, frozen, executing
    metadata = {},
    onSend,
    onAbort,
    onEdit 
}) => {
  // Fix for empty history: Use metadata.content if initialContent is empty
  // Correção para histórico vazio: Usar metadata.content se initialContent estiver vazio
  const resolvedContent = initialContent || metadata?.content || '';
  const [content, setContent] = useState(resolvedContent);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (content.trim()) onSend(content);
    }
  };

  const isEditable = status === 'editing';

  if (!isEditable) {
    // Frozen / Executing State View
    return (
        <div className="group relative my-4 p-4 rounded-xl bg-gray-900/30 border border-gray-800 transition-all hover:border-gray-700">
            <div className="absolute -left-3 top-4 bg-gray-950 p-1.5 rounded-full border border-gray-800 text-gray-400">
                <User size={16} />
            </div>
            
            <div className="pl-6 text-gray-200 text-base leading-relaxed whitespace-pre-wrap">
                {content}
            </div>

            {/* Actions for Frozen State */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                {status === 'executing' ? (
                     <button 
                        onClick={onAbort}
                        className="flex items-center gap-1 bg-red-900/80 hover:bg-red-800 text-red-200 text-xs px-2 py-1 rounded border border-red-700/50 transition-colors"
                     >
                        <StopCircle size={12} />
                        Abort
                     </button>
                ) : (
                    <button 
                        onClick={onEdit}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors"
                        title="Edit Prompt"
                    >
                        <Edit2 size={12} />
                    </button>
                )}
            </div>
        </div>
    );
  }

  // Editable State View
  return (
    <div className="relative my-4">
        <div className="absolute -left-3 top-4 bg-cyan-950 p-1.5 rounded-full border border-cyan-800 text-cyan-400 z-10 shadow-lg shadow-cyan-900/20">
            <User size={16} />
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gray-900/80 border border-gray-700 focus-within:border-cyan-600 focus-within:ring-1 focus-within:ring-cyan-600/50 transition-all shadow-xl">
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your security task..."
                className="w-full bg-transparent p-4 pl-8 text-base text-gray-100 placeholder-gray-500 focus:outline-none resize-none min-h-[60px]"
                rows={1}
                autoFocus
            />
            
            {/* Action Bar */}
            <div className="flex justify-between items-center px-4 py-2 bg-black/20 border-t border-gray-800/50">
                <span className="text-[10px] text-gray-600 font-mono">
                    MARKDOWN SUPPORTED • SHIFT+ENTER FOR NEWLINE
                </span>
                
                <button
                    onClick={() => content.trim() && onSend(content)}
                    disabled={!content.trim()}
                    className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-cyan-500/20"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default InputBlock;
