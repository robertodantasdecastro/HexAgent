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
import useCommandMode from './hooks/useCommandMode';
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
    reloadAIConfig
  } = useAIConfig();

  // Global State for Mode Switching
  const [appMode, setAppMode] = useState('chat'); // 'chat' | 'command'

  // Chat Manager Hook
  const chatManager = useChatManager(api, aiConfig);
  
  // Command Mode Hook
  const commandManager = useCommandMode(aiConfig);

  // Active Manager Proxy (Delegates to currrent mode)
  const activeManager = appMode === 'chat' ? chatManager : {
      blocks: commandManager.history, // Map history to blocks for UI compatibility
      isLoading: commandManager.isLoading,
      sendMessage: commandManager.executeCommand, // Command mode uses executeCommand
      stopGeneration: commandManager.stopExecution,
      inputMode: 'command', // Fixed
      setInputMode: () => {}, // No-op in command mode
      autoScroll: true
  };

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

  // Reload AI Config when Backend comes online (Fixes race condition/fallback)
  useEffect(() => {
    if (status === 'ONLINE' || status === 'CONFIG-REQUIRED') {
      console.log('[App] Backend online, reloading AI config...');
      reloadAIConfig();
    }
  }, [status, reloadAIConfig]);

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
      <header className="flex-none bg-[#0a0a0a] border-b border-[#333] pl-4 pr-[140px] h-[50px] flex items-center justify-between shadow-md z-10" style={{ WebkitAppRegion: 'drag' }}>
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => window.location.reload()} style={{ WebkitAppRegion: 'no-drag' }}>
             <Cpu className={`h-6 w-6 ${
               status === 'ONLINE' ? 'text-green-500 animate-pulse-slow' : 
               status === 'CONFIG-REQUIRED' ? 'text-yellow-500' : 'text-red-500'
             }`} />
             <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-black ${
               status === 'ONLINE' ? 'bg-green-500' : 
               status === 'CONFIG-REQUIRED' ? 'bg-yellow-500' : 'bg-red-500'
             }`}></div>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
              HexAgent <span className="text-xs font-mono opacity-70 text-gray-400">v2.1</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-mono">
               <span className={
                 status === 'ONLINE' ? 'text-green-500' : 
                 status === 'CONFIG-REQUIRED' ? 'text-yellow-500 cursor-pointer hover:underline' : 'text-red-500'
               } onClick={() => status === 'CONFIG-REQUIRED' && aiConfigModal.open()}>
                 {status === 'CONFIG-REQUIRED' ? '⚠️ CONFIG REQUIRED' : status}
               </span>
               <span className="text-gray-600">|</span>
               <span className="text-gray-500">{currentSessionName || t('header.no_session')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons - No Drag */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          {systemConfig?.system?.debug_mode && (
            <button
              onClick={() => {
                const dump = {
                  timestamp: new Date().toISOString(),
                  app_info: {
                    version: "2.1",
                    status: status,
                    service_status: serviceStatus
                  },
                  configs: {
                    system: systemConfig,
                    ai: aiConfig
                  },
                  session: {
                    name: currentSessionName,
                    blocks: blocks
                  },
                  logs: logger.getLogs ? logger.getLogs() : "Logger does not support getLogs"
                };
                
                const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `debug_dump_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="p-2 text-red-400 hover:bg-[#2a1a1a] rounded transition relative group border border-red-500/30"
              title="Debug: Save Context Dump"
            >
              <ArrowDown size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            </button>
          )}

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
        {status === 'CONFIG-REQUIRED' && (
           <div className="absolute top-0 left-0 right-0 bg-yellow-900/20 border-b border-yellow-500/20 p-2 text-center text-xs text-yellow-400 font-mono z-20 cursor-pointer hover:bg-yellow-900/30 transition-colors"
                onClick={aiConfigModal.open}>
              ⚠️ AI BRAIN NOT INITIALIZED - CLICK TO CONFIGURE
           </div>
        )}

        {/* Mode Switcher Tab */}
        <div className="flex justify-center bg-[#0a0a0a] border-b border-[#333] py-2">
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

        {/* Chat/Command Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent" ref={scrollRef}>
          {activeManager.blocks.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 opacity-50">
                {appMode === 'chat' ? <Cpu size={64} className="mb-4 text-gray-700" /> : <Terminal size={64} className="mb-4 text-green-900" />}
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
                onContinue={handleContinue}
                executed={block.executed}
                colors={colors}
                t={t}
                aiConfig={aiConfig}
                mode={appMode} // Pass mode to Block to render differently if needed
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* 3. Input Area */}
        <div className="flex-none p-4 bg-[#0a0a0a] border-t border-[#333] z-30 relative"> 
            <div className="max-w-4xl mx-auto relative group">
                
                {/* Input Box */}
                <div className={`relative flex items-center bg-[#1a1a1a] rounded-lg border ${activeManager.isLoading ? 'border-green-500/30 shadow-[0_0_15px_rgba(0,255,0,0.1)]' : 'border-[#333] group-hover:border-gray-600'} transition-all`}>
                   
                   <div className="pl-3 text-gray-500">
                      {appMode === 'chat' ? <Cpu size={20} /> : <Terminal size={20} className="text-green-500" />}
                   </div>

                   <textarea
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         // Send to active manager!
                         activeManager.sendMessage(input, autoExecute, unlimitedIterations, maxIterations);
                         setInput('');
                       }
                     }}
                     placeholder={
                       status === 'OFFLINE' ? "⚠️ System Offline (Backend Disconnected)" :
                       activeManager.isLoading ? "Processing..." :
                       appMode === 'chat' ? t('input.placeholder_ai') : "Enter command or '?' for AI..."
                     }
                     className="flex-1 bg-transparent border-none text-gray-200 p-3 max-h-32 focus:ring-0 resize-none font-mono text-sm placeholder-gray-600"
                     rows={1}
                     disabled={activeManager.isLoading || status === 'OFFLINE'}
                   />

                   <div className="pr-2 flex items-center gap-1">
                      {activeManager.isLoading ? (
                         <button onClick={activeManager.stopGeneration} className="p-2 text-red-500 hover:bg-white/5 rounded-full" title={t('common.stop')}>
                            <Pause size={18} />
                         </button>
                      ) : (
                         <button 
                            onClick={() => {
                                activeManager.sendMessage(input, autoExecute, unlimitedIterations, maxIterations);
                                setInput('');
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
                        {appMode === 'chat' && (
                            <span className="flex items-center gap-1">
                               <Hash size={10} /> Max Iterations: {unlimitedIterations ? <Infinity size={10} /> : maxIterations}
                            </span>
                        )}
                        {appMode === 'command' && (
                            <span className="flex items-center gap-1 text-green-600">
                               <Terminal size={10} /> CWD: {commandManager.cwd}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
        config={systemConfig}
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
