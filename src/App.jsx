/**
 * App.jsx - Main Application Entry Point (Refactored)
 * Ponto de Entrada Principal (Refatorado)
 * 
 * Architecture:
 * - App.jsx: Global State, Services, Managers, Header
 * - InferencePanel.jsx: Chat, Terminal, Input Area
 * - AppModals.jsx: All Modal components
 */
import { Activity, ArrowDown, Bug, Cpu, Crosshair, Flag, Ghost, HelpCircle, History, List, Server, Settings, Terminal as TerminalIcon, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// New Architecture Components
import AppModals from './components/AppModals';
import InferencePanel from './components/chat/InferencePanel';
import LoadingScreen from './components/LoadingScreen';

// Hooks
import useAIConfig from './hooks/useAIConfig';
import useBackendInit from './hooks/useBackendInit';
import useChatManager from './hooks/useChatManager';
import useCommandMode from './hooks/useCommandMode';
import useModalState from './hooks/useModalState';
import useSystemConfig from './hooks/useSystemConfig';
import { useTranslation } from './hooks/useTranslation';

// Services & Utils
import SessionService from './services/SessionService';
import APIClient from './utils/APIClient';
import Logger from './utils/Logger';

const App = () => {
  // 1. Service Instances
  const api = APIClient.getInstance();
  const sessionService = SessionService.getInstance();
  const logger = Logger.getInstance();

  // 2. Initialization & Config
  const {
    isInitializing,
    setIsInitializing,
    initProgress,
    initError,
    initStatus,
    status,
    serviceStatus
  } = useBackendInit();

  const {
    systemConfig,
    loading: systemLoading,
    saveSystemConfig,
    reloadSystemConfig
  } = useSystemConfig();

  const {
    aiConfig,
    loading: aiLoading,
    saveAIConfig,
    reloadAIConfig,
    updateAndSave // NEW: Atomic update function
  } = useAIConfig();

  // 3. Global State
  const [appMode, setAppMode] = useState('chat'); // 'chat' | 'command'
  const { t, language, setLanguage } = useTranslation();
  const [currentSessionName, setCurrentSessionName] = useState('');
  
  // Terminal Visibility (Global for Header toggle)
  const [showTerminal, setShowTerminal] = useState(false);

  // Shadow Mode
  const [shadowMode, setShadowMode] = useState(false);
  const toggleShadowMode = async () => {
      try {
          const newState = !shadowMode;
          setShadowMode(newState);
          await api.post('/monitoring/toggle', { enabled: newState });
      } catch (e) {
          setShadowMode(!shadowMode);
      }
  };

  // 4. Managers
  const chatManager = useChatManager(api, aiConfig);
  const commandManager = useCommandMode(aiConfig);

  // Active Manager Proxy
  const activeManager = appMode === 'chat' ? chatManager : {
      blocks: commandManager.history,
      isLoading: commandManager.isLoading,
      sendMessage: commandManager.executeCommand,
      stopGeneration: commandManager.stopExecution,
      inputMode: 'command',
      setInputMode: () => {},
      autoScroll: true,
      cmdHistory: commandManager.cmdHistory
  };

  // 5. Modal States
  const settingsModal = useModalState();
  const helpModal = useModalState();
  const sessionModal = useModalState();
  const servicesModal = useModalState();
  const shutdownModal = useModalState();
  const aiConfigModal = useModalState();
  const profileModal = useModalState();
  const monitoringDashboard = useModalState();
  const hexstrikeToolsModal = useModalState();
  const activeProcessesModal = useModalState();
  const hexstrikeMonitorModal = useModalState();
  const bugBountyModal = useModalState();
  const ctfModal = useModalState();

  // 6. Effects
  useEffect(() => {
    if (systemConfig?.system?.language && systemConfig.system.language !== language) {
      setLanguage(systemConfig.system.language);
    }
  }, [systemConfig?.system?.language, language, setLanguage]);

  useEffect(() => {
    if (status === 'ONLINE' || status === 'CONFIG-REQUIRED') {
      reloadSystemConfig();
      reloadAIConfig();
    }
  }, [status, reloadSystemConfig, reloadAIConfig]);

  // Auto-Save Session
  useEffect(() => {
    if (chatManager.blocks.length === 0) return;
    sessionService.autoSave(chatManager.blocks, 2000);
    return () => sessionService.clearAutoSaveTimer();
  }, [chatManager.blocks, sessionService]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (chatManager.blocks.length > 0) {
        await sessionService.saveBeforeClose(chatManager.blocks);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [chatManager.blocks, sessionService]);

  const hasAutoOpenedMonitor = useRef(false);
  useEffect(() => {
    if (systemConfig?.system?.debug_mode && status === 'ONLINE' && !hasAutoOpenedMonitor.current) {
        hexstrikeMonitorModal.open();
        hasAutoOpenedMonitor.current = true;
    }
  }, [systemConfig?.system?.debug_mode, status, hexstrikeMonitorModal]);

  // Shutdown Logic
  const handleShutdownComplete = () => {
    try {
        const { ipcRenderer } = window.require('electron');
        ipcRenderer.send('app-ready-to-quit');
    } catch (e) {
        window.close();
    }
  };

  useEffect(() => {
    let removeListener = () => {};
    try {
        const { ipcRenderer } = window.require('electron');
        const handleCloseReq = () => shutdownModal.open();
        ipcRenderer.on('app-close-requested', handleCloseReq);
        removeListener = () => ipcRenderer.removeListener('app-close-requested', handleCloseReq);
    } catch (e) {}
    return removeListener;
  }, [shutdownModal.open]);

  // Fork Handler (Passed to Panel)
  const handleFork = (blockId) => {
      // Note: This logic requires setInput which is now in InferencePanel.
      // We can't implement it here easily without lifting state up.
      // For now, we will pass a signal or specialized function if needed, 
      // but 'InferencePanel' can reimplement typical fork logic or accept a callback.
      // Actually, InferencePanel handles input, so it can handle fork locally if it has access to managers.
      // We will pass the manager's fork method if available.
  };

  // Continue Handler
  const handleContinue = () => {
      alert("Feature Pending: Resume Chat Loop");
  };

  // 7. Render
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
  const maxIterations = aiConfig?.ai?.max_iterations || 10;

  return (
    <div className={`flex flex-col h-screen text-gray-200 font-sans ${systemConfig?.theme?.mode === 'dark' ? 'bg-[#050505]' : 'bg-gray-900'}`}
         style={{ '--primary-color': colors.primary || '#00ff00' }}>
      
      {/* HEADER BAR */}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
          {activeManager.isLoading && (
            <button
              onClick={activeManager.stopGeneration}
              className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-500/50 rounded flex items-center gap-2 animate-pulse"
            >
               <span className="text-xs font-bold tracking-wider">STOP</span>
            </button>
          )}

          {systemConfig?.system?.debug_mode && (
            <button
              onClick={() => logger.downloadDump(systemConfig, aiConfig, chatManager.blocks)}
              className="p-2 text-red-400 hover:bg-[#2a1a1a] rounded transition relative group border border-red-500/30"
              title="Debug Dump"
            >
              <ArrowDown size={18} />
            </button>
          )}

            <button
                onClick={toggleShadowMode}
                onContextMenu={(e) => { e.preventDefault(); monitoringDashboard.open(); }}
                className={`p-2 rounded transition relative group ${shadowMode ? 'text-purple-400 bg-purple-900/20' : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'}`}
            >
                <Ghost size={18} />
                {shadowMode && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>}
            </button>

            {shadowMode && (
                <button onClick={monitoringDashboard.open} className="p-2 text-purple-400 hover:bg-[#1a1a1a] rounded transition">
                    <Activity size={18} />
                </button>
            )}

            <button onClick={profileModal.open} className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded transition">
                <User size={18} />
            </button>

            <button onClick={bugBountyModal.open} className="p-2 text-purple-400 hover:bg-[#1a1a1a] rounded transition" title="Bug Bounty Operations">
                <Bug size={18} />
            </button>
            <button onClick={hexstrikeToolsModal.open} className="p-2 text-blue-400 hover:bg-[#1a1a1a] rounded transition" title="HexStrike Arsenal">
                <Crosshair size={18} />
            </button>
            <button onClick={ctfModal.open} className="p-2 text-green-500 hover:bg-[#1a1a1a] rounded transition" title="CTF Workflows">
                <Flag size={18} />
            </button>
            <button onClick={activeProcessesModal.open} className="p-2 text-purple-400 hover:bg-[#1a1a1a] rounded transition" title="Mission Control (Processes)">
                <List size={18} />
            </button>
            <button onClick={hexstrikeMonitorModal.open} className="p-2 text-green-400 hover:bg-[#1a1a1a] rounded transition" title="HexStrike Daemon Monitor">
                <TerminalIcon size={18} />
            </button>

            <button onClick={servicesModal.open} className={`p-2 rounded hover:bg-[#1a1a1a] transition ${serviceStatus.brain ? 'text-green-400' : 'text-gray-500'}`}>
                <Server size={18} />
            </button>
          
          <button onClick={aiConfigModal.open} className="p-2 text-cyan-400 hover:bg-[#1a1a1a] rounded transition relative">
             <Cpu size={18} />
             {maxIterations !== 10 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>}
          </button>

          <button onClick={sessionModal.open} className="p-2 text-yellow-400 hover:bg-[#1a1a1a] rounded transition">
            <History size={18} />
          </button>

          <button onClick={settingsModal.open} className="p-2 text-gray-400 hover:bg-[#1a1a1a] rounded transition">
            <Settings size={18} />
          </button>
          
          <button onClick={helpModal.open} className="p-2 text-blue-400 hover:bg-[#1a1a1a] rounded transition">
            <HelpCircle size={18} />
          </button>
          
          <button 
             onClick={() => setShowTerminal(!showTerminal)} 
             className={`p-2 rounded transition ${showTerminal ? 'bg-green-900/30 text-green-400' : 'text-gray-400 hover:bg-[#1a1a1a]'}`}
          >
             <TerminalIcon size={18} />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <InferencePanel 
          appMode={appMode}
          setAppMode={setAppMode}
          activeManager={activeManager}
          chatManager={chatManager}
          commandManager={commandManager}
          aiConfig={aiConfig}
          systemConfig={systemConfig}
          status={status}
          showTerminal={showTerminal}
          setShowTerminal={setShowTerminal}

          t={t}
          onUpdateConfig={updateAndSave} // Pass atomic update function
          onHandleContinue={handleContinue}
          onHandleFork={(blockId) => {
             // Basic Fork Implementation for InferencePanel
             const blockIndex = activeManager.blocks.findIndex(b => b.id === blockId);
             if (blockIndex !== -1 && activeManager.forkBranch) {
                  // We need to signal Panel to update input. 
                  // Since we didn't lift state, we can't do it easily here.
                  // For now, simpler implementation:
                  if (confirm("Fork Branch?")) {
                      activeManager.forkBranch(blockIndex > 0 ? blockIndex - 1 : -1);
                  }
             }
          }}
      />

      {/* MODALS */}
      <AppModals 
          settingsModal={settingsModal}
          aiConfigModal={aiConfigModal}
          profileModal={profileModal}
          servicesModal={servicesModal}
          sessionModal={sessionModal}
          helpModal={helpModal}
          shutdownModal={shutdownModal}
          monitoringDashboard={monitoringDashboard}
          hexstrikeToolsModal={hexstrikeToolsModal}
          activeProcessesModal={activeProcessesModal}
          hexstrikeMonitorModal={hexstrikeMonitorModal}
          bugBountyModal={bugBountyModal}
        ctfModal={ctfModal}

          systemConfig={systemConfig}
          saveSystemConfig={saveSystemConfig}
          aiConfig={aiConfig}
          saveAIConfig={saveAIConfig}
          serviceStatus={serviceStatus}
          currentSessionName={currentSessionName}
          setCurrentSessionName={setCurrentSessionName}
          chatManager={chatManager}
          sessionService={sessionService}
          handleShutdownComplete={handleShutdownComplete}
          t={t}
      />

    </div>
  );
};

export default App;
