import { ArrowDown, Cpu, GitBranch, Hash, HelpCircle, History, Infinity, Pause, Send, Server, Settings, Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AIConfigModal from './components/AIConfigModal';
import HelpModal from './components/HelpModal';
import LoadingScreen from './components/LoadingScreen';
import ServiceManagerModal from './components/ServiceManagerModal';
import SessionModal from './components/SessionModal';
import SettingsModal from './components/SettingsModal';
import ShutdownModal from './components/ShutdownModal';
import WorkflowManagerModal from './components/WorkflowManagerModal';
import Block from './components/chat/Block';
import useAIConfig from './hooks/useAIConfig';
import useBackendInit from './hooks/useBackendInit';
import useChatManager from './hooks/useChatManager';
import useModalState from './hooks/useModalState';
import useSystemConfig from './hooks/useSystemConfig';
import { useTranslation } from './hooks/useTranslation';
import SessionService from './services/SessionService';
import APIClient from './utils/APIClient';
import Logger from './utils/Logger';

const App = () => {
  // Service Instances / Instâncias de Serviço
  const api = APIClient.getInstance();
  const sessionService = SessionService.getInstance();
  const logger = Logger.getInstance();

  // Unified Backend Initialization Hook / Hook Unificado de Inicialização Backend
  const {
    isInitializing,
    setIsInitializing,
    initProgress,
    initError,
    initStatus,
    status,
    serviceStatus
  } = useBackendInit();

  // Configuration State / Estado de Configuração
  const {
    systemConfig,
    loading: systemLoading,
    saveSystemConfig
  } = useSystemConfig();

  const {
    aiConfig,
    loading: aiLoading,
    saveAIConfig,
  } = useAIConfig();

  // Chat Manager Hook (The Core Refactor!)
  // Hook de Gerenciamento de Chat (A Refatoração Principal!)
  const {
    blocks,
    setBlocks,
    isLoading,
    inputMode,
    setInputMode,
    autoScroll,
    setAutoScroll,
    showIterationLimitReached,
    sendMessage,
    manualExecute,
    stopGeneration
  } = useChatManager(api, aiConfig);

  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  // Translation Hook / Hook de Tradução
  const { t, language, setLanguage } = useTranslation();
  
  // Derived AI Settings
  const maxIterations = aiConfig?.ai?.max_iterations || 10;
  const unlimitedIterations = aiConfig?.ai?.unlimited_iterations || false;
  const [autoExecute, setAutoExecute] = useState(false);

  // Sync language
  useEffect(() => {
    if (systemConfig?.system?.language && systemConfig.system.language !== language) {
      setLanguage(systemConfig.system.language);
    }
  }, [systemConfig?.system?.language, language, setLanguage]);

  // UI State - Modals
  const settingsModal = useModalState();
  const helpModal = useModalState();
  const sessionModal = useModalState();
  const servicesModal = useModalState();
  const workflowModal = useModalState();
  const shutdownModal = useModalState();
  const aiConfigModal = useModalState();
  const [currentSessionName, setCurrentSessionName] = useState('');

  // Auto-Save Session
  useEffect(() => {
    if (blocks.length === 0) return;
    sessionService.autoSave(blocks, 2000);
    return () => sessionService.clearAutoSaveTimer();
  }, [blocks, sessionService]);

  // Auto-Save on Close
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (blocks.length > 0) {
        await sessionService.saveBeforeClose(blocks);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [blocks, sessionService]);

  // Handler: Send Message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const prompt = input;
    setInput('');
    await sendMessage(prompt, autoExecute, unlimitedIterations, maxIterations);
  };

  // Handler: Continue
  const handleContinue = () => {
      alert("Feature Pending: Resume Chat Loop logic not fully implemented in frontend-backend bridge.");
  }

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [blocks, autoScroll]);

  // Shutdown Handler (Corrected)
  // Memoized to prevent re-renders in children
  const handleShutdownComplete = () => {
    try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('app-ready-to-quit');
    } catch (e) {
        console.error("IPC Shutdown failed", e);
        window.close(); // Fallback
    }
  };

  // Listen for shutdown request from Main
  useEffect(() => {
    let removeListener = () => {};
    try {
        const { ipcRenderer } = window.require('electron');
        const handleCloseReq = () => {
             shutdownModal.open();
        };
        ipcRenderer.on('app-close-requested', handleCloseReq);
        removeListener = () => {
             ipcRenderer.removeListener('app-close-requested', handleCloseReq);
        };
    } catch (e) {
        // Not in electron or context isolation issue
    }
    return removeListener;
  }, [shutdownModal.open]); // Only depend on the stable 'open' function

  if (isInitializing) {
    return (
      <LoadingScreen
        progress={initProgress}
        initStatus={initStatus}
        error={initError}
        onRetry={() => window.location.reload()}
        onContinue={() => setIsInitializing(false)}
      />
    );
  }

  const colors = systemConfig?.theme?.colors || {};

  return (
    <div className={`flex flex-col h-screen text-gray-200 font-sans ${systemConfig?.theme?.mode === 'dark' ? 'bg-[#050505]' : 'bg-gray-900'}`}
         style={{ '--primary-color': colors.primary || '#00ff00' }}>
      
      {/* 1. Header Bar - Draggable Region */}
      <header className="flex-none bg-[#0a0a0a] border-b border-[#333] px-4 py-3 flex items-center justify-between shadow-md z-10" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => window.location.reload()} style={{ WebkitAppRegion: 'no-drag' }}>
             <Cpu className={`h-6 w-6 ${status === 'ONLINE' ? 'text-green-500 animate-pulse-slow' : 'text-red-500'}`} />
             <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
              HexAgent <span className="text-xs font-mono opacity-70 text-gray-400">v2.1</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-mono">
               <span className={status === 'ONLINE' ? 'text-green-500' : 'text-red-500'}>{status}</span>
               <span className="text-gray-600">|</span>
               <span className="text-gray-500">{currentSessionName || t('header.no_session')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - No Drag */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
            <button
            onClick={servicesModal.open}
            className={`p-2 rounded hover:bg-[#1a1a1a] transition ${serviceStatus.brain ? 'text-green-400' : 'text-gray-500'}`}
            title={t('header.services')}
          >
            <Server size={18} />
          </button>
          
          <button
            onClick={aiConfigModal.open} 
            className="p-2 text-cyan-400 hover:bg-[#1a1a1a] rounded transition relative group"
            title={t('header.ai_config')}
          >
            <Cpu size={18} />
             {maxIterations !== 10 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>}
          </button>

          <button onClick={workflowModal.open} className="p-2 text-purple-400 hover:bg-[#1a1a1a] rounded transition" title={t('header.workflows')}>
            <GitBranch size={18} />
          </button>

          <button onClick={sessionModal.open} className="p-2 text-yellow-400 hover:bg-[#1a1a1a] rounded transition" title={t('header.sessions')}>
            <History size={18} />
          </button>

          <button onClick={settingsModal.open} className="p-2 text-gray-400 hover:bg-[#1a1a1a] rounded transition" title={t('header.settings')}>
            <Settings size={18} />
          </button>
          
          <button onClick={helpModal.open} className="p-2 text-blue-400 hover:bg-[#1a1a1a] rounded transition" title={t('header.help')}>
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {status === 'OFFLINE' && (
           <div className="absolute top-0 left-0 right-0 bg-red-900/20 border-b border-red-500/20 p-2 text-center text-xs text-red-400 font-mono z-20">
              ⚠️ SYSTEM OFFLINE - CHECK CONNECTION
           </div>
        )}

        {/* Chat Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent" ref={scrollRef}>
          {blocks.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                <Cpu size={64} className="mb-4 text-gray-700" />
                <p className="text-sm font-mono text-center">
                   {t('welcome.ready')}<br/>
                   <span className="text-xs opacity-70">Model: {aiConfig?.ai?.model || 'Unknown'}</span>
                </p>
             </div>
          ) : (
            blocks.map((block, index) => (
              <Block
                key={block.id || index}
                {...block}
                isLast={index === blocks.length - 1}
                isLoading={isLoading}
                onExecute={manualExecute}
                onContinue={handleContinue}
                executed={block.executed}
                colors={colors}
                t={t}
                aiConfig={aiConfig}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* 3. Input Area */}
        <div className="flex-none p-4 bg-[#0a0a0a] border-t border-[#333]"> 
            <div className="max-w-4xl mx-auto relative group">
                {/* Input Mode Toggle */}
                <div className="absolute -top-8 left-0 flex gap-1">
                   {['prompt', 'command'].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setInputMode(mode)}
                        className={`text-xs px-3 py-1 rounded-t border-t border-x ${inputMode === mode ? 'bg-[#1a1a1a] border-[#333] text-green-400' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300'}`}
                      >
                         {mode === 'prompt' ? t('input.mode.chat') : t('input.mode.prompt')}
                      </button>
                   ))}
                </div>

                {/* Input Box */}
                <div className={`relative flex items-center bg-[#1a1a1a] rounded-lg border ${isLoading ? 'border-green-500/30 shadow-[0_0_15px_rgba(0,255,0,0.1)]' : 'border-[#333] group-hover:border-gray-600'} transition-all`}>
                   
                   <div className="pl-3 text-gray-500">
                      {inputMode === 'prompt' ? <Cpu size={20} /> : <Terminal size={20} />}
                   </div>

                   <textarea
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         inputMode === 'command' ? manualExecute(input) && setInput('') : handleSend();
                       }
                     }}
                     placeholder={inputMode === 'prompt' ? t('input.placeholder_ai') : t('input.placeholder_cmd')}
                     className="flex-1 bg-transparent border-none text-gray-200 p-3 max-h-32 focus:ring-0 resize-none font-mono text-sm placeholder-gray-600"
                     rows={1}
                     disabled={isLoading || status === 'OFFLINE'}
                   />

                   <div className="pr-2 flex items-center gap-1">
                      {isLoading ? (
                         <button onClick={stopGeneration} className="p-2 text-red-500 hover:bg-white/5 rounded-full" title={t('common.stop')}>
                            <Pause size={18} />
                         </button>
                      ) : (
                         <button onClick={() => inputMode === 'command' ? manualExecute(input) && setInput('') : handleSend()} disabled={!input.trim()} className="p-2 text-green-500 hover:bg-white/5 disabled:opacity-30 rounded-full transition-all">
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
                        <span className="flex items-center gap-1">
                           <Hash size={10} /> Max Iterations: {unlimitedIterations ? <Infinity size={10} /> : maxIterations}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
        settings={systemConfig}
        onSave={async (newSettings) => {
           await saveSystemConfig(newSettings);
           settingsModal.close();
        }}
        t={t}
      />

       <AIConfigModal
        isOpen={aiConfigModal.isOpen}
        onClose={aiConfigModal.close}
        config={aiConfig}
        onSave={async (newConfig) => {
           await saveAIConfig(newConfig);
           aiConfigModal.close();
        }}
      />
      
      <SessionModal
        isOpen={sessionModal.isOpen}
        onClose={sessionModal.close}
        currentSession={currentSessionName}
        onLoad={(session) => {
           setBlocks(session.blocks);
           setCurrentSessionName(session.name);
           sessionModal.close();
        }}
        onSave={async (name) => {
           await sessionService.saveSession(name, blocks);
           setCurrentSessionName(name);
           sessionModal.close();
        }}
      />

      <ServiceManagerModal
         isOpen={servicesModal.isOpen}
         onClose={servicesModal.close}
         status={serviceStatus}
      />

      <HelpModal isOpen={helpModal.isOpen} onClose={helpModal.close} />
      <WorkflowManagerModal isOpen={workflowModal.isOpen} onClose={workflowModal.close} />
      <ShutdownModal 
        isOpen={shutdownModal.isOpen} 
        onShutdownComplete={handleShutdownComplete}
      />
    </div>
  );
};

export default App;
