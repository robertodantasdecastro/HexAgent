import { Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * Analysis Block Component
 * Exibe a análise heurística/técnica da IA sobre o resultado
 */
const AnalysisBlock = ({ content }) => {
  return (
    <div className="my-3 rounded-lg border border-indigo-500/30 bg-indigo-950/20 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/30 rounded-t-lg">
        <Brain size={16} className="text-indigo-400" />
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">HexStrike Intelligence</span>
      </div>

      {/* Content */}
      <div className="p-4 text-sm text-gray-200 leading-relaxed">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-gray-300" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-gray-300" {...props} />,
            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            strong: ({ node, ...props }) => <strong className="text-indigo-200 font-semibold" {...props} />,
            code: ({ node, inline, ...props }) => (
              <code className="bg-indigo-950/50 px-1.5 py-0.5 rounded text-indigo-200 text-xs font-mono border border-indigo-500/20" {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default AnalysisBlock;
