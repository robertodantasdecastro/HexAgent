import { Hash, HelpCircle, MessageSquare, Terminal, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const HelpModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#0a0a0a] border border-[#00ff00]/30 rounded-lg w-[600px] h-[600px] shadow-2xl flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
             <HelpCircle className="text-cyan-400" size={20} />
             <h2 className="text-lg font-bold text-white tracking-wide">
               {t('help.title', 'AJUDA & COMANDOS')}
             </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#0a0a0a]">
            
            <section>
                <h3 className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-wider border-b border-[#333] pb-2 flex items-center gap-2">
                    <Terminal size={16} /> Prompt Mode (Terminal)
                </h3>
                <div className="space-y-4">
                    <div className="bg-[#111] p-4 rounded border border-[#222] hover:border-[#333] transition">
                        <div className="text-[10px] text-gray-500 font-mono tracking-widest mb-2 uppercase">Standard Execution</div>
                        <code className="text-[#00ff00] text-sm block mb-2 font-bold font-mono px-2 py-1 bg-black rounded w-fit">ls -la</code>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            {t('help.prompt_desc', 'Directly executes bash commands on the system.')}
                        </p>
                    </div>

                    <div className="bg-[#111] p-4 rounded border border-[#222] hover:border-[#333] transition">
                        <div className="text-[10px] text-gray-500 font-mono tracking-widest mb-2 uppercase">AI Inference</div>
                        <div className="space-y-2 mb-3">
                             <div className="flex items-center gap-2">
                                <code className="text-cyan-300 text-sm font-bold font-mono bg-black px-2 py-1 rounded">@ &lt;query&gt;</code>
                             </div>
                             <div className="flex items-center gap-2">
                                <code className="text-cyan-300 text-sm font-bold font-mono bg-black px-2 py-1 rounded"># &lt;query&gt;</code>
                             </div>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            {t('help.ai_desc', 'Sends the query to the LLM agent instead of executing as bash.')}
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-bold text-[#00ff00] mb-4 uppercase tracking-wider border-b border-[#333] pb-2 flex items-center gap-2">
                    <MessageSquare size={16} /> Chat Mode
                </h3>
                <div className="bg-[#111] p-4 rounded border border-[#222]">
                    <p className="text-xs text-gray-300 leading-relaxed">
                        {t('help.chat_desc', 'Standard natural language interaction. The AI decides when to execute commands.')}
                    </p>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider border-b border-[#333] pb-2 flex items-center gap-2">
                    <Hash size={16} /> Special Commands
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#111] p-3 rounded border border-[#222] flex flex-col gap-1">
                        <code className="text-white text-xs font-bold font-mono">/help</code>
                        <span className="text-[10px] text-gray-500">Show this list</span>
                    </div>
                     <div className="bg-[#111] p-3 rounded border border-[#222] flex flex-col gap-1">
                        <code className="text-white text-xs font-bold font-mono">/clear</code>
                        <span className="text-[10px] text-gray-500">Clear screen</span>
                    </div>
                </div>

                <h4 className="text-[10px] font-bold text-gray-600 mt-6 mb-3 uppercase tracking-widest">System & Session</h4>
                <div className="space-y-2">
                     <div className="bg-[#111] p-2 rounded border border-[#222] flex justify-between items-center group hover:bg-[#151515] transition">
                        <code className="text-red-400 text-xs font-bold font-mono">/exit</code>
                        <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Shutdown application</span>
                     </div>
                     <div className="bg-[#111] p-2 rounded border border-[#222] flex justify-between items-center group hover:bg-[#151515] transition">
                        <code className="text-cyan-300 text-xs font-bold font-mono">/save session [name]</code>
                        <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Save history</span>
                     </div>
                     <div className="bg-[#111] p-2 rounded border border-[#222] flex justify-between items-center group hover:bg-[#151515] transition">
                        <code className="text-cyan-300 text-xs font-bold font-mono">/open session [name]</code>
                        <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Load history</span>
                     </div>
                </div>
            </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-[#111] hover:bg-[#222] border border-[#333] rounded text-gray-300 text-xs font-mono transition"
            >
                {t('common.close', 'FECHAR')}
            </button>
        </div>

      </div>
    </div>
  );
};

export default HelpModal;
