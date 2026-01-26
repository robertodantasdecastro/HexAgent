/**
 * NarrativeBlock Component
 * Componente de Bloco Narrativo
 * 
 * Renders rich text content (Markdown, Code Blocks) for the AI narrative.
 * Renderiza conteúdo de texto rico (Markdown, Blocos de Código) para a narrativa da IA.
 * 
 * Uses existing CodeBlock and AnsiRenderer.
 * Usa CodeBlock e AnsiRenderer existentes.
 * 
 * @author: Roberto Dantas de Castro
 */

import { Cpu, Terminal } from 'lucide-react';
import CodeBlock from '../components/chat/CodeBlock';
import { parseAgentContent } from '../utils/agentParser';
import { AnsiRenderer } from '../utils/ansiRenderer';

const NarrativeBlock = ({ content, type = 'assistant', timestamp, colors, onExecute, isLoading, isLast }) => {
  const sections = parseAgentContent(content);

  return (
    <div className="my-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
        <div className="flex items-center gap-2">
          {type === 'user' ? <Terminal size={14} className="text-[#00ff00]" /> : <Cpu size={14} className="text-cyan-400" />}
          <span className="text-xs text-gray-400 font-mono">{timestamp}</span>
        </div>
        {type !== 'user' && <div className="text-[10px] text-cyan-400 border border-cyan-400/20 px-1 rounded">HexAgent</div>}
      </div>

      {/* Content */}
      <div className="p-4 font-mono text-sm space-y-3">
        {type === 'user' ? (
           <div className="whitespace-pre-wrap text-green-400">{content}</div>
        ) : (
           sections.map((section, idx) => {
             if (section.type === 'ai') {
               return (
                 <div key={idx} className="leading-relaxed whitespace-pre-wrap relative text-cyan-100">
                   {section.content}
                   {isLast && isLoading && (
                     <span className="inline-block w-2 h-4 ml-1 align-middle bg-cyan-400 animate-pulse">▋</span>
                   )}
                 </div>
               );
             } else if (section.type === 'code') {
               return (
                 <CodeBlock
                   key={idx}
                   code={section.content}
                   language={section.language}
                   onExecute={onExecute}
                   colors={colors}
                 />
               );
             } else if (section.type === 'terminal') {
                return (
                 <div key={idx} className="bg-black border border-gray-800 rounded p-3 font-mono shadow-inner">
                   <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed select-text font-mono">
                     <span className="text-green-500 select-none mr-2">$</span>
                     <AnsiRenderer text={section.content} />
                   </div>
                 </div>
                );
             }
             return null;
           })
        )}
      </div>
    </div>
  );
};

export default NarrativeBlock;
