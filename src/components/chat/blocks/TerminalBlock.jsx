import { Check, Copy, Terminal } from 'lucide-react';
import { useState } from 'react';

const TerminalBlock = ({ command, output, exitCode, autoExecute = false, isExecuting = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = isExecuting ? 'text-blue-400' :
                      exitCode === 0 ? 'text-green-400' :
                      exitCode !== undefined ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-gray-700 bg-[#0d1117] shadow-xl font-mono text-sm max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-gray-700">
        <div className="flex items-center gap-2">
            <Terminal size={14} className={statusColor} />
            <span className="text-gray-300 font-semibold text-xs">Shell Command</span>
            {exitCode !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${exitCode === 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    exit: {exitCode}
                </span>
            )}
        </div>
        <div className="flex gap-2">
             <button 
                onClick={handleCopy}
                className="p-1 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                title="Copy Command"
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
        </div>
      </div>

      {/* Command */}
      <div className="bg-[#0d1117] py-2 px-3 border-b border-gray-700/50">
         <div className="flex gap-2">
            <span className="text-pink-500 select-none">$</span>
            <span className="text-gray-100 flex-1 break-all whitespace-pre-wrap font-bold">{command}</span>
         </div>
      </div>

      {/* Output Area */}
      {output && (
        <div className={`p-3 overflow-x-auto max-h-[300px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent ${exitCode === 0 ? 'text-gray-300' : 'text-red-300'}`}>
          <pre className="whitespace-pre-wrap break-words text-xs">{output}</pre>
        </div>
      )}
      
      {/* Execution Status */}
      {isExecuting && (
         <div className="px-3 py-1 bg-blue-900/20 text-blue-300 text-xs border-t border-blue-900/30 flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Executing...
         </div>
      )}
    </div>
  );
};

export default TerminalBlock;
