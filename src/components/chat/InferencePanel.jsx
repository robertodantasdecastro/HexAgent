/**
 * InferencePanel Component
 * Painel de Inferência (Chat & Command & Terminal)
 * 
 * Centralizes the active workspace area to simplify App.jsx
 * Centraliza a área de trabalho ativa para simplificar o App.jsx
 */
import {
    ArrowDown, Cpu, Hash, Infinity,
    Send,
    Terminal as TerminalIcon, Zap
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { HeightTransition } from '../SimpleTransition';
import XTermConsole from '../terminal/XTermConsole';
import ToolMenu from '../tools/ToolMenu';
import Block from './Block';

const InferencePanel = ({
    // Mode State
    appMode,
    setAppMode,
    
    // Managers & Data
    activeManager,
    chatManager,
    commandManager,
    aiConfig,
    systemConfig,
    status,
    
    // UI State
    showTerminal,
    setShowTerminal,
    t, // translation
    
    // Handlers
    onHandleFork,
    onHandleContinue,
    onUpdateConfig, // New Prop

    // Sudo State
    sudoModal,
    sudoActive
}) => {
    // Local UI State
    const [autoScroll, setAutoScroll] = useState(true);
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Refs
    const scrollRef = useRef(null);
    const bottomRef = useRef(null);
    const xtermRef = useRef(null);
    const lastProcessedBlockRef = useRef(-1);

    // Derived values
    const maxIterations = aiConfig?.ai?.max_iterations || 10;
    const unlimitedIterations = aiConfig?.ai?.unlimited_iterations || false;
    // Default on for autonomous operation
    const autoExecute = aiConfig?.ai?.auto_execute ?? true;
    const colors = systemConfig?.theme?.colors || {};

    // Auto-scroll Effect
    useEffect(() => {
        if (autoScroll && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeManager.blocks, autoScroll]);

    // Terminal Stream Effect
    useEffect(() => {
        if (!activeManager.blocks) return;
        
        const blocks = activeManager.blocks;
        const startIdx = lastProcessedBlockRef.current + 1;
        
        for (let i = startIdx; i < blocks.length; i++) {
            const block = blocks[i];
            
            if (block.type === 'command') {
                xtermRef.current?.writeln(`\x1b[33m$ ${block.content}\x1b[0m`);
            } else if (block.type === 'result') {
                const formatted = block.content.replace(/\n/g, '\r\n');
                if (block.success) {
                    xtermRef.current?.writeln(formatted);
                } else {
                    xtermRef.current?.writeln(`\x1b[31m${formatted}\x1b[0m`);
                }
            }
        }
        
        lastProcessedBlockRef.current = blocks.length - 1;
    }, [activeManager.blocks]);

    // Input Key Handler
    const handleKeyDown = (e) => {
        // Tab for Linter Suggestion
        if (e.key === 'Tab' && activeManager.lintSuggestion && activeManager.lintSuggestion.suggestion && activeManager.lintSuggestion.suggestion !== input) {
            e.preventDefault();
            setInput(activeManager.lintSuggestion.suggestion);
            if (activeManager.setCurrentInputForLinter) {
                activeManager.setCurrentInputForLinter(activeManager.lintSuggestion.suggestion);
            }
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            activeManager.sendMessage(input, autoExecute, unlimitedIterations, maxIterations);
            setInput('');
            setHistoryIndex(-1);
            if (activeManager.setCurrentInputForLinter) {
                activeManager.setCurrentInputForLinter('');
            }
        }
        
        // Command Mode History
        if (appMode === 'command' && activeManager.cmdHistory && activeManager.cmdHistory.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const newIndex = historyIndex === -1 ? activeManager.cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(newIndex);
                setInput(activeManager.cmdHistory[newIndex] || '');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex === -1) return;
                
                const newIndex = historyIndex + 1;
                if (newIndex >= activeManager.cmdHistory.length) {
                    setHistoryIndex(-1);
                    setInput('');
                } else {
                    setHistoryIndex(newIndex);
                    setInput(activeManager.cmdHistory[newIndex]);
                }
            }
        }
    };

    return (
        <div className="flex-1 overflow-hidden relative flex flex-col h-full">
            {/* Offline/Config Banners */}
            {status === 'OFFLINE' && (
               <div className="absolute top-0 left-0 right-0 bg-red-900/20 border-b border-red-500/20 p-2 text-center text-xs text-red-400 font-mono z-20">
                  ⚠️ SYSTEM OFFLINE - CHECK CONNECTION
               </div>
            )}
            {status === 'CONFIG-REQUIRED' && (
               <div className="absolute top-0 left-0 right-0 bg-yellow-900/20 border-b border-yellow-500/20 p-2 text-center text-xs text-yellow-400 font-mono z-20">
                  ⚠️ AI BRAIN NOT INITIALIZED
               </div>
            )}

            {/* Mode Switcher Tab */}
            <div className="flex justify-center bg-[#0a0a0a] border-b border-[#333] py-2 flex-none">
                 <div className="flex bg-[#1a1a1a] rounded-lg p-1">
                     <button 
                        onClick={() => setAppMode('chat')}
                        className={`px-4 py-1 rounded text-xs font-mono transition-all ${appMode === 'chat' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        Chat Mode
                     </button>
                     <button 
                        onClick={() => setAppMode('command')}
                        className={`px-4 py-1 rounded text-xs font-mono transition-all ${appMode === 'command' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        Command Mode
                     </button>
                 </div>
            </div>

            {/* Chat/Command List Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent" ref={scrollRef}>
              {activeManager.blocks.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                    <p className="text-sm font-mono text-center">
                       {appMode === 'chat' ? t('welcome.ready') : 'Terminal Ready'}<br/>
                       <span className="text-xs opacity-70">Model: {aiConfig?.ai?.model || 'Unknown'}</span>
                    </p>
                 </div>
              ) : (
                activeManager.blocks.map((block, index) => (
                  <Block
                    key={block.id || index}
                    {...block}
                    isLast={index === activeManager.blocks.length - 1}
                    isLoading={activeManager.isLoading}
                    onExecute={chatManager.manualExecute} 
                    onContinue={onHandleContinue}
                    executed={block.executed}
                    colors={colors}
                    t={t}
                    aiConfig={aiConfig}
                    mode={appMode} 
                    onAbort={activeManager.stopGeneration}
                    onFork={onHandleFork}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Terminal Panel (Collapsible) */}
            <HeightTransition 
                show={showTerminal}
                height="33%"
                className="border-t border-[#333] bg-[#0d1117] p-2 flex flex-col flex-none"
                duration={300}
            >
                <div className="flex justify-between items-center mb-1 px-2 flex-none">
                    <span className="text-xs font-mono text-gray-400">Hybrid Terminal</span>
                    <button onClick={() => xtermRef.current?.clear()} className="text-[10px] text-gray-500 hover:text-white uppercase">Clear</button>
                </div>
                <div className="flex-1 overflow-hidden flex min-h-0"> 
                    <div className="flex-1 h-full min-h-0"> 
                        <XTermConsole 
                            ref={xtermRef} 
                            onCommand={(cmd) => activeManager.sendMessage(cmd, true)}
                        />
                    </div>
                    {/* Tool Menu Sidebar */}
                    <ToolMenu 
                        className="hidden md:flex ml-2" 
                        onExecute={(cmd) => activeManager.sendMessage(cmd, true)} 
                    />
                </div>
            </HeightTransition>

            {/* Input Area */}
            <div className="flex-none p-4 bg-[#0a0a0a] border-t border-[#333] z-30 relative"> 
                <div className="max-w-4xl mx-auto relative group">
                    {/* Linter Co-Pilot Tooltip */}
                    {appMode === 'command' && activeManager.lintSuggestion && activeManager.lintSuggestion.suggestion && activeManager.lintSuggestion.suggestion !== input && (
                        <div className="absolute -top-12 left-0 right-0 mx-auto w-fit max-w-2xl bg-emerald-900/90 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 rounded-lg px-4 py-2 text-xs font-mono text-emerald-200 flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200 z-50 pointer-events-none">
                           <Zap size={14} className="text-emerald-400 animate-pulse flex-none" />
                           <div className="flex-1 truncate">
                              <span className="opacity-70 mr-2">Suggestion:</span>
                              <span className="font-bold text-white">{activeManager.lintSuggestion.suggestion}</span>
                              {activeManager.lintSuggestion.reason && (
                                 <span className="ml-2 text-[10px] text-emerald-400/80 italic">— {activeManager.lintSuggestion.reason}</span>
                              )}
                           </div>
                           <div className="flex-none bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                               [TAB]
                           </div>
                        </div>
                    )}
                    
                    <div className={`relative flex items-center bg-[#1a1a1a] rounded-lg border ${activeManager.isLoading ? 'border-green-500/30' : activeManager.isLinting ? 'border-emerald-500/50' : 'border-[#333] group-hover:border-gray-600'} transition-all`}>
                       <div className="pl-3 text-gray-500">
                          {appMode === 'chat' ? <Cpu size={20} /> : <TerminalIcon size={20} className="text-green-500" />}
                       </div>

                       <textarea
                         value={input}
                         onChange={(e) => {
                             setInput(e.target.value);
                             if (appMode === 'command' && activeManager.setCurrentInputForLinter) {
                                 activeManager.setCurrentInputForLinter(e.target.value);
                             }
                         }}
                         onKeyDown={handleKeyDown}
                         placeholder={
                           status === 'OFFLINE' ? "⚠️ System Offline (Backend Disconnected)" :
                           activeManager.isLoading ? "Processing..." :
                           appMode === 'chat' ? t('input.placeholder_ai') : "Enter command or '?' for AI..."
                         }
                         className="flex-1 bg-transparent border-none text-gray-200 p-3 max-h-32 focus:ring-0 resize-none font-mono text-sm placeholder-gray-600 outline-none"
                         rows={1}
                         disabled={activeManager.isLoading || status === 'OFFLINE'}
                       />

                       <div className="pr-2 flex items-center gap-1">
                           {activeManager.isLoading ? (
                             <button onClick={activeManager.stopGeneration} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 text-red-500 hover:bg-red-900/60 border border-red-500/30 rounded-lg transition-colors font-bold text-xs font-mono" title={t('common.stop')}>
                                <span className="animate-pulse">🛑</span> ABORT
                             </button>
                          ) : (
                             <button 
                                onClick={() => {
                                    activeManager.sendMessage(input, autoExecute, unlimitedIterations, maxIterations);
                                    setInput('');
                                    if (activeManager.setCurrentInputForLinter) activeManager.setCurrentInputForLinter('');
                                 }} 
                                disabled={!input.trim()} 
                                className="p-2 text-green-500 hover:bg-white/5 disabled:opacity-30 rounded-full transition-all"
                             >
                                <Send size={18} />
                             </button>
                          )}
                       </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex justify-between mt-2 px-1">
                        <div className="flex gap-4 text-[10px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1 hover:text-gray-300 cursor-pointer" onClick={() => setAutoScroll(!autoScroll)}>
                               <ArrowDown size={10} className={autoScroll ? 'text-green-500' : 'text-gray-600'} /> Auto-scroll
                            </span>
                            
                            {/* Auto-Execute Toggle */}
                            <button 
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all border ${autoExecute ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'}`}
                                onClick={() => onUpdateConfig && onUpdateConfig('ai.auto_execute', !autoExecute)}
                                title="Toggle Auto-Execute Commands (No confirmation required)"
                            >
                               <Zap size={10} className={autoExecute ? 'fill-green-500/20' : ''} /> 
                               <span className="font-bold">Auto-Exec: {autoExecute ? 'ON' : 'OFF'}</span>
                            </button>

                            {/* Elevated Privileges Toggle */}
                            <button 
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all border ${sudoActive ? 'bg-red-900/20 border-red-500/30 text-red-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'}`}
                                onClick={sudoModal.open}
                                title="Sudo Mode (Elevate Privileges)"
                            >
                               {sudoActive ? <span className="animate-pulse">🛡️ Root Access: ON</span> : <span>🛡️ Aux: Root Access: OFF</span>}
                            </button>

                            {appMode === 'chat' && (
                                <span className="flex items-center gap-1">
                                   <Hash size={10} /> Max Iterations: {unlimitedIterations ? <Infinity size={10} /> : maxIterations}
                                </span>
                            )}
                            {appMode === 'command' && (
                                <span className="flex items-center gap-1 text-green-600">
                                   <TerminalIcon size={10} /> CWD: {commandManager.cwd}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InferencePanel;
