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
import useModalState from './hooks/useModalState';
import useSystemConfig from './hooks/useSystemConfig';
import { useTranslation } from './hooks/useTranslation';
import ChatService from './services/ChatService';
import SessionService from './services/SessionService';
import APIClient from './utils/APIClient';
import Logger from './utils/Logger';

const App = () => {
  // Service Instances / Instâncias de Serviço
  const api = APIClient.getInstance();
  const sessionService = SessionService.getInstance();
  const chatService = ChatService.getInstance();
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

  // State for Blocks (Chat History)
  const [blocks, setBlocks] = useState([]); // Start empty
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('prompt'); // 'prompt' | 'command'
  const [autoScroll, setAutoScroll] = useState(true);

  // Configuration State (OOP with ConfigManager) / Estado de Configuração (POO com ConfigManager)
  // Use SEPARATED config hooks / Usar hooks de config SEPARADOS
  const {
    systemConfig,
    loading: systemLoading,
    error: systemError,
    saveSystemConfig
  } = useSystemConfig();

  const {
    aiConfig,
    loading: aiLoading,
    error: aiError,
    updateAIConfig,
    saveAIConfig,
    updateAndSave  // Atomic update+save
  } = useAIConfig();

  // Combined loading state / Estado de carregamento combinado
  const configLoading = systemLoading || aiLoading;
  const configError = systemError || aiError;
  const scrollRef = useRef(null);

  // Translation Hook / Hook de Tradução
  const { t, language, setLanguage } = useTranslation();
  
  // SIMPLIFIED iteration state - local first, save later (debounced)
  // Estado de iteração SIMPLIFICADO - local primeiro, salvar depois (debounced)
  const [maxIterations, setMaxIterations] = useState(10);
  const [unlimitedIterations, setUnlimitedIterations] = useState(false);
  
  // Load from aiConfig once on mount
  // Carregar do aiConfig uma vez ao montar
  useEffect(() => {
    if (aiConfig?.ai) {
      setMaxIterations(aiConfig.ai.max_iterations || 10);
      setUnlimitedIterations(aiConfig.ai.unlimited_iterations || false);
    }
  }, [aiConfig?.ai?.max_iterations, aiConfig?.ai?.unlimited_iterations]);
  
  // Debounced save to backend (1 second after user stops clicking)
  // Salvamento debounced no backend (1 segundo após usuário parar de clicar)
  useEffect(() => {
    if (!aiConfig) return;
    
    const timer = setTimeout(() => {
      const updated = {
        ...aiConfig,
        ai: {
          ...aiConfig.ai,
          max_iterations: maxIterations,
          unlimited_iterations: unlimitedIterations
        }
      };
      logger.debug('[App] Saving iterations to backend (debounced)...', {maxIterations, unlimitedIterations});
      saveAIConfig(updated);
    }, 1000); // 1 second debounce
    
    return () => clearTimeout(timer);
  }, [maxIterations, unlimitedIterations]); // Only local state dependencies

  // Sync language from systemConfig to TranslationManager
  // Sincronizar idioma do systemConfig para TranslationManager
  useEffect(() => {
    if (systemConfig?.system?.language && systemConfig.system.language !== language) {
      logger.debug('Syncing language from systemConfig', { 
        from: language, 
        to: systemConfig.system.language 
      });
      setLanguage(systemConfig.system.language);
    }
  }, [systemConfig?.system?.language, language, setLanguage]);

  // History State
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [promptHistory, setPromptHistory] = useState([]); 

  // UI State - Unified modal management with useModalState hook
  // Estado de UI - Gerenciamento unificado de modais com hook useModalState
  const settingsModal = useModalState();
  const helpModal = useModalState();
  const sessionModal = useModalState();
  const servicesModal = useModalState();
  const workflowModal = useModalState();
  const shutdownModal = useModalState();
  const aiConfigModal = useModalState(); // New AI Config modal / Novo modal de config de IA
  const [currentSessionName, setCurrentSessionName] = useState('');

  // UI Enhancements State / Estados de Melhorias de UI
  const [autoExecute, setAutoExecute] = useState(false); // Default false for safety
  
  // Iteration tracking
  const [currentIteration, setCurrentIteration] = useState(0); // Current iteration count
  const [showIterationLimitReached, setShowIterationLimitReached] = useState(false);
  
  // Refs for preventing memory leaks / Refs para prevenir vazamentos de memória
  const abortControllerRef = useRef(null);
  const bottomRef = useRef(null);

  // Stop Generation Function / Função de Parar Geração
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      // Add cancellation block
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: '⚠️ Generation stopped by user. / Geração interrompida pelo usuário.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  // Auto-Save Session using SessionService / Salvar Sessão Automaticamente usando SessionService
  useEffect(() => {
    if (blocks.length === 0) return;
    sessionService.autoSave(blocks, 2000); // 2s debounce

    return () => sessionService.clearAutoSaveTimer();
  }, [blocks, sessionService]);

  // Auto-Save Session on window close / Salvar Sessão Automaticamente ao fechar a janela
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (blocks.length > 0) {
        logger.info('Saving session before close');
        try {
          await api.post('/save_session', {
            name: 'auto-save-' + Date.now(),
            blocks
          });
        } catch (error) {
          logger.error('AutoSave failed', { error });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [blocks, api]); // Depend on blocks and api

  // ========================================================================
  // ChatService SSE Event Handlers Setup
  // Configuração de Event Handlers SSE do ChatService
  // ========================================================================
  
  useEffect(() => {
    // Setup ChatService event listeners / Configurar event listeners do ChatService
    logger.info('Setting up ChatService event handlers');

    // Handle incoming message chunks / Tratar chunks de mensagem recebidos
    const unsubMessage = chatService.onMessage((chunk) => {
      const { type, content, metadata } = chunk;

      switch (type) {
        case 'text':
          // Append AI text to last block or create new block
          setBlocks(prev => {
            const lastBlock = prev[prev.length - 1];
            
            if (lastBlock && lastBlock.type === 'agent' && !lastBlock.completed) {
              return prev.map((block, idx) => 
                idx === prev.length - 1
                  ? { ...block, content: block.content + content }
                  : block
              );
            } else {
              return [...prev, {
                id: Date.now(),
                type: 'agent',
                content,
                timestamp: new Date().toLocaleTimeString(),
                completed: false
              }];
            }
          });
          break;

        case 'command_proposal':
          setBlocks(prev => {
            // Check if command is already proposed to avoid dupes
            const lastBlock = prev[prev.length - 1];
            if (lastBlock && lastBlock.type === 'proposal' && lastBlock.content === content) {
              return prev;
            }
             return [...prev, {
              id: Date.now(),
              type: 'proposal',
              content,
              timestamp: new Date().toLocaleTimeString(),
              executed: false
            }];
          });
          break;

        case 'command_result':
           setBlocks(prev => {
             // Find last proposal and mark executed
             // Could be improved with IDs logic
             return [...prev, {
              id: Date.now(),
              type: 'SHELL',
              content: content || '', // Ensure valid string
              timestamp: new Date().toLocaleTimeString(),
              result: metadata
            }];
           });
          break;
      }
    });

    // Handle errors / Tratar erros
    const unsubError = chatService.onError((error) => {
      logger.error('Chat error received', { error });
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `❌ Error: ${error.message} / Erro: ${error.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setLoading(false);
    });

    // Handle completion / Tratar conclusão
    const unsubComplete = chatService.onComplete((metadata) => {
      logger.info('Chat complete received', { metadata });
      setLoading(false);
      setBlocks(prev => {
        const lastBlock = prev[prev.length - 1];
        if (lastBlock && lastBlock.type === 'agent') {
          return prev.map((block, idx) => 
            idx === prev.length - 1
              ? { ...block, completed: true }
              : block
          );
        }
        return prev;
      });

      // Show iteration limit warn if applicable
      if (metadata && metadata.stopped_early && metadata.iterations >= metadata.max_iterations) {
         setShowIterationLimitReached(true);
         setBlocks(prev => [...prev, {
            id: Date.now(),
            type: 'limit_prompt',
            timestamp: new Date().toLocaleTimeString()
         }]);
      }
    });

    return () => {
      logger.info('Cleaning up ChatService handlers');
      unsubMessage();
      unsubError();
      unsubComplete();
    };
  }, [chatService, logger]);


  // Handler: Send Message / Handler: Enviar Mensagem
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const prompt = input;
    setInput('');
    setPromptHistory(prev => [prompt, ...prev]);
    setHistoryIndex(-1);
    setLoading(true);
    setShowIterationLimitReached(false);

    // Add User Block
    setBlocks(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString()
    }]);

    try {
      const context = blocks.map(b => ({
        role: b.type === 'user' ? 'user' : 'assistant',
        content: b.content
      }));

      await chatService.sendMessage(prompt, context, {
        autoExecute,
        maxIterations: unlimitedIterations ? 100 : maxIterations,
        stream: true
      });
      
    } catch (error) {
       // Handled by onError listener
    }
  };

  // Handler: Execute Command (Manual) / Handler: Executar Comando (Manual)
  const handleExecute = async (cmd) => {
    // Add pending SHELL block
    setBlocks(prev => {
      // Mark proposal as executed
      const updated = prev.map(b => 
        b.type === 'proposal' && b.content === cmd 
          ? { ...b, executed: true } 
          : b
      );
      
      return updated;
    });

    try {
      const res = await api.post('/execute', { command: cmd });
      // Result handled via chatService integration or direct response? 
      // Architecture calls for unified flow, but manual execution implies direct API call.
      // For consistency, we can add the block manually here if not streaming.
      
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'SHELL',
        content: res.output,
        timestamp: new Date().toLocaleTimeString(),
        result: {
            success: res.success,
            exit_code: res.exit_code
        }
      }]);

    } catch (e) {
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'SHELL',
        content: `Execution failed: ${e.message}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };


  // Handler: Continue Iteration / Handler: Continuar Iteração
  const handleContinue = (steps) => {
      // Logic to resume chat loop
      alert("Feature Pending: Resume Chat Loop logic not fully implemented in frontend-backend bridge.");
      setShowIterationLimitReached(false);
  }

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [blocks, autoScroll]);


  if (isInitializing) {
    return (
      <LoadingScreen
        progress={initProgress}
        initStatus={initStatus}
        error={initError}
        onRetry={() => window.location.reload()}
        onContinue={() => setIsInitializing(false)} // This requires exposing setIsInitializing or similar
      />
    );
  }

  // Use Theme Colors / Usar Cores do Tema
  const colors = systemConfig?.theme?.colors || {};

  return (
    <div className={`flex flex-col h-screen text-gray-200 font-sans ${systemConfig?.theme?.mode === 'dark' ? 'bg-[#050505]' : 'bg-gray-900'}`}
         style={{ '--primary-color': colors.primary || '#00ff00' }}>
      
      {/* 1. Header Bar / Barra de Cabeçalho */}
      <header className="flex-none bg-[#0a0a0a] border-b border-[#333] px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => window.location.reload()}>
             <Cpu className={`h-6 w-6 ${status === 'ONLINE' ? 'text-green-500 animate-pulse-slow' : 'text-red-500'}`} />
             <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black"></div>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
              HexAgent <span className="text-xs font-mono opacity-70 text-gray-400">v2.0</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-mono">
               <span className={status === 'ONLINE' ? 'text-green-500' : 'text-red-500'}>{status}</span>
               <span className="text-gray-600">|</span>
               <span className="text-gray-500">{currentSessionName || t('header.no_session')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons / Botões de Ação */}
        <div className="flex items-center gap-2">
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
             {/* Indicator dot if AI settings differ from default */}
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

      {/* 2. Main Content Area / Área de Conteúdo Principal */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {status === 'OFFLINE' && (
           <div className="absolute top-0 left-0 right-0 bg-red-900/20 border-b border-red-500/20 p-2 text-center text-xs text-red-400 font-mono z-20">
              ⚠️ SYSTEM OFFLINE - CHECK CONNECTION
           </div>
        )}

        {/* Chat Scroll Area / Área de Rolagem do Chat */}
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
                onExecute={handleExecute} // Pass manual execution handler
                onContinue={handleContinue}
                executed={block.executed}
                colors={colors}
                t={t}
                aiConfig={aiConfig} // Pass config for limits
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* 3. Input Area / Área de Input */}
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
                         {mode === 'prompt' ? 'AI Chat' : 'Shell Cmd'}
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
                         handleSend();
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
                         <button onClick={handleSend} disabled={!input.trim()} className="p-2 text-green-500 hover:bg-white/5 disabled:opacity-30 rounded-full transition-all">
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
        }}
      />

      <ServiceManagerModal
         isOpen={servicesModal.isOpen}
         onClose={servicesModal.close}
         status={serviceStatus}
      />

      <HelpModal isOpen={helpModal.isOpen} onClose={helpModal.close} />
      <WorkflowManagerModal isOpen={workflowModal.isOpen} onClose={workflowModal.close} />
      <ShutdownModal isOpen={shutdownModal.isOpen} onClose={shutdownModal.close} />
    </div>
  );
};

export default App;
