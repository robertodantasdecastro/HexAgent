import React, { useState } from 'react';
import { HelpCircle, X, Terminal, MessageSquare, ChevronRight, Hash } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#333] rounded-xl w-[600px] h-[500px] shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#111]">
          <h2 className="text-lg font-bold text-[#00ff00] flex items-center gap-2 font-mono">
            <HelpCircle size={20} /> TERMINAL COMMANDS & HELP
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition hover:rotate-90">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <section>
                <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wider border-b border-[#333] pb-1 flex items-center gap-2">
                    <Terminal size={16} /> Prompt Mode (Terminal)
                </h3>
                <div className="space-y-4">
                    <div className="bg-[#111] p-3 rounded border border-gray-800">
                        <div className="text-xs text-gray-500 font-mono mb-1">STANDARD EXECUTION</div>
                        <code className="text-[#00ff00] text-sm block mb-2 font-bold">ls -la</code>
                        <p className="text-gray-400 text-xs">Directly executes bash commands on the system.</p>
                        <p className="text-gray-500 text-[10px] mt-1 italic">Executa comandos bash diretamente no sistema.</p>
                    </div>

                    <div className="bg-[#111] p-3 rounded border border-gray-800">
                        <div className="text-xs text-gray-500 font-mono mb-1">AI INFERENCE / INFERÊNCIA IA</div>
                        <div className="space-y-2">
                            <div>
                                <code className="text-cyan-300 text-sm block font-bold">@ &lt;query&gt;</code>
                                <code className="text-cyan-300 text-sm block font-bold"># &lt;query&gt;</code>
                                <code className="text-cyan-300 text-sm block font-bold">/ai &lt;query&gt;</code>
                            </div>
                        </div>
                        <p className="text-gray-400 text-xs mt-2">Sends the query to the LLM agent instead of executing as bash.</p>
                        <p className="text-gray-500 text-[10px] mt-1 italic">Envia a consulta para o agente LLM em vez de executar como bash.</p>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-bold text-yellow-500 mb-3 uppercase tracking-wider border-b border-[#333] pb-1 flex items-center gap-2">
                    <MessageSquare size={16} /> Chat Mode
                </h3>
                <div className="space-y-2 text-xs text-gray-400">
                    <p>Standard natural language interaction. The AI decides when to execute commands.</p>
                    <p className="text-gray-500 italic">Interação padrão em linguagem natural. A IA decide quando executar comandos.</p>
                </div>
            </section>

            <section>
                <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider border-b border-[#333] pb-1 flex items-center gap-2">
                    <Hash size={16} /> Special Commands
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#111] p-2 rounded border border-gray-800">
                        <code className="text-white text-xs font-bold block">/help</code>
                        <span className="text-[10px] text-gray-500">Show this list</span>
                    </div>
                    <div className="bg-[#111] p-2 rounded border border-gray-800">
                        <code className="text-white text-xs font-bold block">/clear</code>
                        <span className="text-[10px] text-gray-500">Clear screen</span>
                    </div>
                </div>

                <h4 className="text-xs font-bold text-gray-500 mt-4 mb-2">SYSTEM & SESSION</h4>
                <div className="space-y-2">
                     <div className="bg-[#111] p-2 rounded border border-gray-800 flex justify-between items-center">
                        <code className="text-white text-xs font-bold">/exit</code>
                        <span className="text-[10px] text-gray-500">Safely shutdown application</span>
                     </div>
                     <div className="bg-[#111] p-2 rounded border border-gray-800 flex justify-between items-center">
                        <code className="text-cyan-300 text-xs font-bold">/save session [name]</code>
                        <span className="text-[10px] text-gray-500">Save history</span>
                     </div>
                     <div className="bg-[#111] p-2 rounded border border-gray-800 flex justify-between items-center">
                        <code className="text-cyan-300 text-xs font-bold">/open session [name]</code>
                        <span className="text-[10px] text-gray-500">Load history</span>
                     </div>
                     <div className="bg-[#111] p-2 rounded border border-gray-800 flex justify-between items-center">
                        <code className="text-yellow-500 text-xs font-bold">/stop service [name]</code>
                        <span className="text-[10px] text-gray-500">Control services</span>
                     </div>
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};

export default HelpModal;
