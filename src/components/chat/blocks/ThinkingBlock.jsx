import { Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ThinkingBlock = ({ content }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="my-2 border border-gray-700 rounded-lg bg-[#0d1117] overflow-hidden">
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-[#161b22] cursor-pointer hover:bg-[#1c2128] transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        <Brain size={16} className="text-purple-400" />
        <span className="text-xs font-mono text-gray-400 select-none">
          Thinking Process / Processo de Pensamento
        </span>
      </div>
      
      {!isCollapsed && (
        <div className="p-3 text-sm text-gray-300 bg-[#0d1117] border-t border-gray-700 animate-in fade-in slide-in-from-top-1 duration-200">
           <div className="prose prose-invert max-w-none prose-sm">
            <SyntaxHighlighter
              language="markdown"
              style={vscDarkPlus}
              customStyle={{ background: 'transparent', padding: 0, margin: 0, fontSize: '0.85rem' }}
              wrapLongLines={true}
            >
              {content}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThinkingBlock;
