import { Check, Copy, Terminal } from 'lucide-react';
import { useState } from 'react';

/**
 * Command Output Block Component
 * Exibe a saída de comandos executados estilo terminal
 */
const CommandOutputBlock = ({ content }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-md overflow-hidden border border-gray-700 bg-[#0d1117] shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-500" />
          <span className="text-xs font-mono text-gray-400 font-medium">STDOUT / STDERR</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
          title="Copy Output"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-60 overflow-y-auto overflow-x-auto p-3 custom-scrollbar">
        <pre className="font-mono text-xs md:text-sm text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
          {content || <span className="text-gray-600 italic">No output</span>}
        </pre>
      </div>
    </div>
  );
};

export default CommandOutputBlock;
