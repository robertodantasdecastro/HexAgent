import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Cpu, Shield, AlertTriangle, Power, Code, Settings, X, Square, ArrowDown, Ban, Play, Pause, ChevronRight, CheckCircle, HelpCircle, Copy, RefreshCw } from 'lucide-react';
import LoadingScreen from './components/LoadingScreen';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import ShutdownModal from './components/ShutdownModal';

// Parse agent content into formatted sections / Analisa conteúdo do agente em seções formatadas
const parseAgentContent = (content) => {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = { type: 'ai', content: '' };
  
  for (const line of lines) {
    if (line.startsWith('🔧 Executando:')) {
      // Save current section if it has content
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      // Start command section
      currentSection = { type: 'command', content: line };
    } else if (line.startsWith('Command Executed') || line.startsWith('Comando Executado')) {
      // Save current section
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      // Start terminal output section
      currentSection = { type: 'terminal', content: line };
    } else {
      // Append to current section
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }
  
  // Add final section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
};


// Block Component with enhanced formatting / Componente de Bloco com formatação aprimorada
const Block = ({ type, content, result, timestamp, onExecute, executed, onContinue }) => {
  // Parse content for agent responses
  const sections = type === 'agent' ? parseAgentContent(content) : [];
  const [editedCmd, setEditedCmd] = useState(content);

  if (type === 'limit_prompt') {
      return (
        <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg border-yellow-500/30">
             <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-[#333] border-yellow-500/20">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-mono font-bold">ITERATION LIMIT REACHED / LIMITE DE ITERAÇÕES</span>
                    <span className="text-xs text-gray-500 font-mono ml-auto">{timestamp}</span>
             </div>
             <div className="p-4 space-y-4">
                 <p className="text-sm text-gray-300">
                     The agent reached the maximum iteration limit. Do you want to continue?
                 </p>
                 <div className="flex gap-2">
                     <button
                        onClick={() => onContinue(0)}
                        className="px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-500 rounded hover:bg-red-900/40 text-xs font-mono"
                     >
                         STOP
                     </button>
                     <button
                        onClick={() => onContinue(5)}
                        className="px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-500 rounded hover:bg-green-900/40 text-xs font-mono flex items-center gap-2"
                     >
                         <Play size={12} />
                         CONTINUE (+5)
                     </button>
                     <button
                        onClick={() => onContinue(10)}
                        className="px-4 py-2 bg-blue-900/20 border border-blue-500/30 text-blue-500 rounded hover:bg-blue-900/40 text-xs font-mono flex items-center gap-2"
                     >
                         <RefreshCw size={12} />
                         CONTINUE (+10)
                     </button>
                 </div>
             </div>
        </div>
      );
  }

  if (type === 'proposal') {
      return (
        <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-b border-[#333]">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-mono font-bold">COMMAND PROPOSAL / PROPOSTA DE COMANDO</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">{timestamp}</span>
            </div>
            <div className="p-4 space-y-3">
                 <p className="text-xs text-gray-400">The agent wants to execute the following command. You can edit it before running.</p>
                 <textarea 
                    value={editedCmd}
                    onChange={(e) => setEditedCmd(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-3 text-sm font-mono text-yellow-300 focus:outline-none focus:border-yellow-500 transition-colors"
                    rows={editedCmd.split('\n').length + 1}
                 />
                 <div className="flex justify-end gap-2">
                     {!executed ? (
                         <button 
                            onClick={() => onExecute(editedCmd)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded hover:bg-yellow-500/20 transition-all font-mono text-xs"
                         >
                            <Play size={12} /> EXECUTE / EXECUTAR
                         </button>
                     ) : (
                         <span className="text-xs text-green-500 flex items-center gap-1">
                             <CheckCircle size={12} /> Executed / Executado
                         </span>
                     )}
                 </div>
            </div>
        </div>
      );
  }
  
  return (
    <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg transition-all hover:border-[#00ff00]/30 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
        <div className="flex items-center gap-2">
          {type === 'user' ? <Terminal size={14} className="text-[#00ff00]" /> : <Cpu size={14} className="text-cyan-400" />}
          <span className="text-xs text-gray-400 font-mono">{timestamp}</span>
        </div>
        {type === 'agent' && <div className="text-[10px] text-cyan-400 border border-cyan-400/20 px-1 rounded">HEXAGENT</div>}
      </div>
      
      <div className="p-4 font-mono text-sm space-y-3">
        {type === 'user' ? (
          <div className="text-[#00ff00] whitespace-pre-wrap">{content}</div>
        ) : (
          sections.map((section, idx) => {
            if (section.type === 'ai') {
              // AI explanation/response - cyan/blue
              return (
                <div key={idx} className="text-cyan-300 leading-relaxed whitespace-pre-wrap group relative pl-2 border-l-2 border-cyan-800/20">
                  {section.content}
                   <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-[#0a0a0a]/80 backdrop-blur rounded p-1">
                       <button 
                         onClick={() => navigator.clipboard.writeText(section.content)}
                         className="p-1 hover:bg-[#222] text-gray-400 rounded transition-colors"
                         title="Copy Text"
                       >
                           <Copy size={12} />
                       </button>
                   </div>
                </div>
              );
            } else if (section.type === 'command') {
              // Command execution - yellow/orange with icon
              return (
                <div key={idx} className="group relative flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  <Code size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-300 font-semibold">{section.content}</span>
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-[#0a0a0a]/80 backdrop-blur rounded p-1">
                       <button 
                         onClick={() => navigator.clipboard.writeText(section.content)}
                         className="p-1 hover:bg-[#222] text-gray-400 rounded transition-colors"
                         title="Copy Command"
                       >
                           <Copy size={12} />
                       </button>
                       <button 
                         onClick={() => onExecute(section.content)}
                         className="p-1 hover:bg-[#222] text-green-400 rounded transition-colors"
                         title="Execute Command"
                       >
                           <Play size={12} />
                       </button>
                  </div>
                </div>
              );
            } else if (section.type === 'terminal') {
              // Terminal output - STANDARD SHELL COLORS (Requested)
              // Black background, Green prompt/text, Monospace
              return (
                <div key={idx} className="bg-black border border-gray-800 rounded p-3 font-mono shadow-inner">
                  <div className="text-[#00ff00] text-xs whitespace-pre-wrap leading-relaxed select-text">
                    <span className="opacity-50 select-none mr-2">$</span>
                    {section.content}
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
        
        {result && (
           <div className="mt-2 p-2 bg-black rounded border border-[#333] text-gray-300 whitespace-pre-wrap font-mono text-xs">
             {result}
           </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [input, setInput] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState('OFFLINE');
  const [serviceStatus, setServiceStatus] = useState({ flask: false, hexstrike: false, brain: false });
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [config, setConfig] = useState(null);
  
  // Terminal History / Histórico do Terminal
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showShutdown, setShowShutdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  
  // UI Enhancements State / Estados de Melhorias de UI
  // UI Enhancements State / Estados de Melhorias de UI
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoExecute, setAutoExecute] = useState(false); // Default false for safety
  const [inputMode, setInputMode] = useState('chat'); // 'chat' or 'prompt'
  const abortControllerRef = useRef(null);
  const bottomRef = useRef(null);
  
  // Loading screen states / Estados da tela de carregamento
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [initError, setInitError] = useState(null);
  const [initStatus, setInitStatus] = useState({
    backend: { status: 'pending', message: 'Starting...' },
    brain: { status: 'pending', message: 'Starting...' },
    hexstrike: { status: 'pending', message: 'Starting...' },
    config: { status: 'pending', message: 'Starting...' }
  });

  const toggleService = async () => {
      setToggleLoading(true);
      const endpoint = status === 'ONLINE' ? '/stop_service' : '/start_service';
      try {
          await fetch(`http://localhost:5000${endpoint}`, { method: 'POST' });
          // Status update will happen next poll
      } catch (e) {
          console.error("Toggle failed", e);
      } finally {
          setToggleLoading(false);
      }
  };
  
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

  useEffect(() => {
    let intervalId = null;

    // Load configuration on mount / Carregar configuração na montagem
    const loadConfig = async () => {
      try {
        const res = await fetch('http://localhost:5000/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          console.log('[Config] Loaded:', data);
        }
      } catch (e) {
        console.error('[Config] Failed to load:', e);
      }
    };

    // Check Status and update service status details / Verificar status e detalhes dos serviços
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/status');
        const data = await res.json();
        if (data.status === 'ok' || data.alive) {
            setStatus('ONLINE');
            setServiceStatus({
              flask: true,
              hexstrike: data.hexstrike_alive || false,
              brain: data.alive || data.brain_initialized || false
            });
        } else {
            setStatus('OFFLINE');
            setServiceStatus({ flask: false, hexstrike: false, brain: false });
        }
      } catch (e) {
        setStatus('DISCONNECTED');
        setServiceStatus({ flask: false, hexstrike: false, brain: false });
      }
    };

    // Wait for backend to be ready with retries (20 seconds total)
    const waitForBackend = async (maxRetries = 20, delayMs = 1000) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                console.log(`[HexAgentGUI] Checking backend (attempt ${i + 1}/${maxRetries})...`);
                const response = await fetch('http://localhost:5000/health');
                if (response.ok) {
                    console.log("[HexAgentGUI] Backend is ready!");
                    return true;
                }
            } catch (e) {
                // Backend not ready yet, wait and retry
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        console.error("[HexAgent GUI] Backend failed to start after retries");
        return false;
    };

    // Init Backend - MUST complete before user can chat
    const initBackend = async (retries = 3, delay = 15000) => {
         console.log("[HexAgentGUI] Initializing backend...");
         for (let i = 0; i < retries; i++) {
             try {
                 if (i > 0) {
                     // Update UI to show retry
                     console.log(`[HexAgentGUI] Retrying Brain init (${i+1}/${retries})...`);
                     setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: `Loading (${i+1}/${retries})...` }}));
                     await new Promise(r => setTimeout(r, delay));
                 }

                 const response = await fetch('http://localhost:5000/init', { method: 'POST' });
                 if (!response.ok) {
                     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                 }
                 const data = await response.json();
                 console.log("[HexAgentGUI] Init response:", data);
                 
                 if (data.success) {
                     console.log("[HexAgentGUI] Brain initialized successfully!");
                     return true;
                 }
                 console.error("[HexAgentGUI] Init failed:", data.error || data.message);
                 // If specific error, maybe don't retry? But safe to retry generally.
             } catch(e) { 
                 console.error(`[HexAgentGUI] Init exception (attempt ${i+1}):`, e); 
             }
         }
         return false;
    };

    const initialize = async () => {
        try {
            // Step 1: Backend
            setInitStatus(prev => ({ ...prev, backend: { status: 'loading', message: 'Starting Flask...' }}));
            setInitProgress(10);
            
            const backendReady = await waitForBackend();
            if (!backendReady) {
                throw new Error('Backend failed to start');
            }
            setInitStatus(prev => ({ ...prev, backend: { status: 'success', message: 'Running' }}));
            setInitProgress(25);
            
            // Step 2: Brain
            setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: 'Loading Brain...' }}));
            setInitProgress(40);
            
            const initResult = await initBackend();
            if (!initResult) {
                setInitStatus(prev => ({ ...prev, brain: { status: 'error', message: 'Failed' }}));
                throw new Error('Brain init failed');
            }
            setInitStatus(prev => ({ ...prev, brain: { status: 'success', message: 'Loaded' }}));
            setInitProgress(60);
            
            // Step 3: Config
            setInitStatus(prev => ({ ...prev, config: { status: 'loading', message: 'Loading...' }}));
            setInitProgress(75);
            
            await loadConfig();
            setInitStatus(prev => ({ ...prev, config: { status: 'success', message: 'Loaded' }}));
            setInitProgress(85);
            
            // Step 4: HexStrike
            setInitStatus(prev => ({ ...prev, hexstrike: { status: 'loading', message: 'Checking...' }}));
            setInitProgress(90);
            
            await checkStatus();
            setInitStatus(prev => ({ ...prev, hexstrike: { status: 'pending', message: 'Offline' }}));
            setInitProgress(100);
            
            // Success - hide loading screen
            setTimeout(() => setIsInitializing(false), 500);
            intervalId = setInterval(checkStatus, 5000);
            
        } catch (error) {
            console.error('[Init] Error:', error);
            setInitError({ message: error.message });
        }
    };

    // Use IIFE to properly await async operations
    (async () => {
        await initialize();
    })();

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // UseEffect for AutoScroll logic / Lógica de AutoScroll
  useEffect(() => {
    if (autoScroll) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [blocks, autoScroll]);

  // IPC Listener for Shutdown
  useEffect(() => {
      if (window.require) {
          try {
              const { ipcRenderer } = window.require('electron');
              const handler = () => setShowShutdown(true);
              ipcRenderer.on('app-close-requested', handler);
              return () => ipcRenderer.removeListener('app-close-requested', handler);
          } catch(e) { console.log('Non-electron env'); }
      }
  }, []);

  // Save configuration handler / Handler para salvar configuração
  const saveConfig = async (newConfig) => {
    try {
      const res = await fetch('http://localhost:5000/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        console.log('[Config] Saved successfully:', data.config);
      } else {
        console.error('[Config] Failed to save');
      }
    } catch (e) {
      console.error('[Config] Save error:', e);
    }
  };

  const handleContinue = async (count) => {
      if (count <= 0) return; 

      const msg = `Please continue the task for ${count} more iterations.`;
      
      const userBlock = {
          id: Date.now(),
          type: 'user',
          content: msg,
          timestamp: new Date().toLocaleTimeString()
      };
      setBlocks(prev => [...prev, userBlock]);
      setLoading(true);
      
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
           const response = await fetch('http://localhost:5000/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  message: msg,
                  language: 'auto', 
                  auto_execute: autoExecute,
                  max_iterations: count
              }),
              signal: abortControllerRef.current.signal
           });
           
           const reader = response.body.getReader();
           const decoder = new TextDecoder();
           let agentText = '';
           
           setBlocks(prev => [...prev, {
               id: Date.now() + 1,
               type: 'agent',
               content: '',
               timestamp: new Date().toLocaleTimeString()
           }]);

           while (true) {
               const { value, done } = await reader.read();
               if (done) break;
               
               const chunk = decoder.decode(value, { stream: true });
               const lines = chunk.split('\n');
               
               for (const line of lines) {
                   if (!line.trim()) continue;
                   try {
                       const json = JSON.parse(line);
                       if (json.chunk) {
                            agentText += json.chunk;
                            setBlocks(prev => {
                                const newBlocks = [...prev];
                                const lastBlock = newBlocks[newBlocks.length - 1];
                                if (lastBlock.type === 'agent') {
                                    lastBlock.content = agentText;
                                }
                                return newBlocks;
                            });
                       } else if (json.proposal) {
                           setBlocks(prev => [...prev, {
                               id: Date.now(),
                               type: 'proposal',
                               content: json.proposal,
                               timestamp: new Date().toLocaleTimeString(),
                               executed: false
                           }]);
                       } else if (json.limit_reached) {
                            setBlocks(prev => [...prev, {
                                type: 'limit_prompt',
                                content: json.iterations,
                                timestamp: new Date().toLocaleTimeString()
                            }]);
                       }
                   } catch (e) {}
               }
           }
      } catch (e) {
          if (e.name !== 'AbortError') {
              console.error(e);
          }
      } finally {
          setLoading(false);
          abortControllerRef.current = null;
      }
  };

  const handleServiceCommand = async (commandLine) => {
      const parts = commandLine.split(' ');
      const action = parts[0].toLowerCase(); // stop/start
      // "stop service <name>"
      // parts[1] should be "service" or "services"
      let serviceName = parts[2]?.replace(/["']/g, '');
      
      if (parts[1] === 'all' && parts[2] === 'services') {
          // stop all services
          // For now, handling generic 'all' or specific
          serviceName = 'all'; 
      }
      
      // Map 'app' or 'application' to something? Backend handles 'brain', 'hexstrike'.
      try {
          const res = await fetch('http://localhost:5000/service', {
              method: 'POST', 
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ action, service: serviceName })
          });
          const data = await res.json();
          
          setBlocks(prev => [...prev, {
              id: Date.now(), type: 'terminal', 
              content: `Service Control: ${data.message}`,
              timestamp: new Date().toLocaleTimeString()
          }]);
      } catch(e) {
          setBlocks(prev => [...prev, {
              id: Date.now(), type: 'terminal', 
              content: `Error: ${e.message}`,
              timestamp: new Date().toLocaleTimeString()
          }]);
      }
  };

  const handleSessionCommand = async (commandLine) => {
      // save session "name", open session "name"
      const parts = commandLine.split(' ');
      const actionMap = { 'save': 'save', 'open': 'load', 'delete': 'delete', 'list': 'list' };
      const cmdAction = parts[0].toLowerCase();
      const action = actionMap[cmdAction] || cmdAction;
      
      let name = parts[2]?.replace(/["']/g, '');
      
      // If list, no name needed
      if (action === 'list') name = 'default';
      if (!name) name = 'default';
      
      // For save, pass blocks
      const payload = { action, name };
      if (action === 'save') {
           payload.data = blocks;
      }
      
      try {
          const res = await fetch('http://localhost:5000/sessions', {
              method: 'POST', 
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(payload)
          });
          const data = await res.json();
          
          if (action === 'load' && data.success) {
               setBlocks(data.data);
               setBlocks(prev => [...prev, {
                  id: Date.now(), type: 'terminal', 
                  content: `Session '${name}' loaded.`,
                  timestamp: new Date().toLocaleTimeString()
               }]);
          } else {
               setBlocks(prev => [...prev, {
                  id: Date.now(), type: 'terminal', 
                  content: data.message || (data.sessions ? "Sessions: " + data.sessions.join(", ") : "Done"),
                  timestamp: new Date().toLocaleTimeString()
               }]);
          }
      } catch(e) {
             setBlocks(prev => [...prev, {
              id: Date.now(), type: 'terminal', 
              content: `Error: ${e.message}`,
              timestamp: new Date().toLocaleTimeString()
          }]);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Reset abort controller / Reiniciar controlador de cancelamento
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userBlock = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setBlocks(prev => [...prev, userBlock]);
    let cmd = input;
    
    // Add to History
    setHistory(prev => {
        const newHist = [...prev, input];
        // Limit history to 100 items
        if (newHist.length > 100) return newHist.slice(newHist.length - 100);
        return newHist;
    });
    setHistoryIndex(-1);
    
    setInput('');
    setLoading(true);

    // COMMAND INTERCEPTOR (Omni-commands for any mode if prefixed)
    // Check for @exit, /exit, @stop service..., /save session...
    const cleanCmd = cmd.replace(/^[@#\/]/, '').trim(); 
    const lowerCmd = cleanCmd.toLowerCase();

    if (lowerCmd === 'exit') {
        setShowShutdown(true);
        setLoading(false);
        return;
    }

    if (lowerCmd.startsWith('stop service') || lowerCmd.startsWith('start service') || lowerCmd.startsWith('stop all') || lowerCmd.startsWith('start all')) {
         await handleServiceCommand(cleanCmd);
         setLoading(false);
         return;
    }
    
    if (lowerCmd.startsWith('save session') || lowerCmd.startsWith('open session') || lowerCmd.startsWith('delete session') || lowerCmd.startsWith('list sessions')) {
         await handleSessionCommand(cleanCmd);
         setLoading(false);
         return;
    }

    // PROMPT MODE LOGIC
    if (inputMode === 'prompt') {
        // Build-in Terminal Commands
        if (cmd.trim() === '/help') {
             setShowHelp(true);
             setLoading(false);
             return;
        }
        if (cmd.trim() === '/clear') {
             setBlocks([]);
             setLoading(false);
             return;
        }

        // AI Inference Check (@, #, /ai)
        let isAgentRequest = false;
        if (cmd.startsWith('/ai ')) {
            isAgentRequest = true;
            cmd = cmd.substring(4); // Remove prefix
        } else if (cmd.startsWith('@') || cmd.startsWith('#')) {
            isAgentRequest = true;
            cmd = cmd.substring(1); // Remove prefix
        }
        
        if (!isAgentRequest) {
            // Direct execution
            try {
                const response = await fetch('http://localhost:5000/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: cmd })
                });
                const data = await response.json();
                
                // Show result simulation terminal block
                setBlocks(prev => {
                    const last = prev[prev.length - 1]; // user block
                    // We want to append a terminal result
                     return [...prev, {
                        id: Date.now() + 1,
                        type: 'agent', // Reuse agent block structure but mostly terminal
                        content: `Command Executed:\n${cmd}\n${data.result || ''}`,
                        timestamp: new Date().toLocaleTimeString()
                     }];
                });
            } catch(e) {
                console.error("Exec failed", e);
            } finally {
                setLoading(false);
                abortControllerRef.current = null;
            }
            return;
        }
        // If starts with special char, fall through to Chat logic
    }

    // CHAT MODE LOGIC
    try {
        // Chat with language support and optional web search / Chat com suporte a idioma e busca web
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: cmd, 
                language: 'pt',
                web_search: webSearchEnabled,
                auto_execute: autoExecute 
            }),
            signal: abortControllerRef.current.signal
        });

        if (!response.body) throw new Error('No body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let agentText = '';
        
        // Create agent block placeholder / Criar placeholder para resposta do agente
        setBlocks(prev => [...prev, {
            id: Date.now() + 1,
            type: 'agent',
            content: '',
            timestamp: new Date().toLocaleTimeString()
        }]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.chunk) {
                        agentText += json.chunk;
                        // Update last block / Atualizar último bloco
                        setBlocks(prev => {
                            const newBlocks = [...prev];
                            newBlocks[newBlocks.length - 1].content = agentText;
                            return newBlocks;
                        });
                    } else if (json.proposal) {
                        // Handle Command Proposal
                         setBlocks(prev => [...prev, {
                            id: Date.now() + 2,
                            type: 'proposal',
                            content: json.proposal.trim(),
                            timestamp: new Date().toLocaleTimeString(),
                            executed: false
                        }]);
                    } else if (json.limit_reached) {
                         setBlocks(prev => [...prev, {
                            id: Date.now() + 3,
                            type: 'limit_prompt',
                            content: json.iterations,
                            timestamp: new Date().toLocaleTimeString()
                        }]);
                    }
                } catch (e) {}
            }
        }
    } catch (e) {
        if (e.name === 'AbortError') {
             console.log('Fetch aborted');
        } else {
            setBlocks(prev => [...prev, {
                id: Date.now(),
                type: 'agent',
                content: `Error: ${e.message}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        }
    } finally {
        setLoading(false);
        abortControllerRef.current = null;
    }
  };

  const handleExecuteProposal = async (cmd, blockId) => {
      // Mark as executed locally
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, executed: true } : b));
      setLoading(true);
      
      try {
          // Execute
          const response = await fetch('http://localhost:5000/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
          });
          const data = await response.json();
          
          // Show result
          const resultText = data.result || "(No output)";
          setBlocks(prev => [...prev, {
                id: Date.now(),
                type: 'agent',
                content: `Command Executed / Comando Executado:\n\`\`\`bash\n${cmd}\n\`\`\`\n\n[Output]:\n${resultText}`,
                timestamp: new Date().toLocaleTimeString()
          }]);
      } catch (e) {
          console.error("Manual execution failed", e);
      } finally {
          setLoading(false);
      }
  };

  // Show LoadingScreen during initialization / Mostrar tela de carregamento durante inicialização
  if (isInitializing) {
    return (
      <LoadingScreen
        initStatus={initStatus}
        progress={initProgress}
        error={initError}
        onRetry={() => window.location.reload()}
        onContinue={() => setIsInitializing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
          <img src="logo.png" className="w-[60vh] h-[60vh] object-contain filter grayscale" alt="watermark" />
      </div>

      {/* Header */}
      <header className="h-10 bg-[#0a0a0a] border-b border-[#333] flex items-center justify-between px-4 pr-24 select-none drag-region">
          <div className="flex items-center gap-2">
              <img src="logo.png" className="w-4 h-4 object-contain" alt="logo" />
              <span className="font-bold text-sm tracking-wider">HEXAGENT GUI</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
              <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded transition-all border border-gray-500/30 bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 hover:text-white"
                  title="Settings / Configurações"
              >
                  <Settings size={12} />
              </button>
              <button 
                  onClick={toggleService}
                  disabled={toggleLoading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all border ${
                      status === 'ONLINE' 
                      ? 'border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00] hover:bg-[#00ff00]/20' 
                      : 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  }`}
              >
                  <Power size={12} />
                  <span>{toggleLoading ? '...' : (status === 'ONLINE' ? 'ON' : 'OFF')}</span>
              </button>
              <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-[#00ff00] animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={status === 'ONLINE' ? 'text-[#00ff00]' : 'text-red-500'}>{status}</span>
              </div>
          </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                  <Shield size={64} className="mb-4" />
                  <p>System Ready. Waiting for input.</p>
              </div>
          )}
          {blocks.map(block => (
              <Block 
                key={block.id} 
                {...block} 
                onExecute={(cmd) => handleExecuteProposal(cmd, block.id)} 
                onContinue={handleContinue}
              />
          ))}
          <div ref={bottomRef} />
      </main>

      {/* Input Area (Sticky Bottom) */}
      <div className="p-4 bg-[#0a0a0a] border-t border-[#333]">
          
          {/* Controls Bar */}
          <div className="flex justify-between items-center mb-2 px-1">
             <div className="flex items-center gap-2">
                <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all ${autoScroll ? 'text-[#00ff00] bg-[#00ff00]/10 border-[#00ff00]/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}
                    title="Toggle Auto-scroll"
                >
                    <ArrowDown size={10} />
                    <span>AutoScroll: {autoScroll ? 'ON' : 'OFF'}</span>
                </button>

                <button
                    onClick={() => setShowHelp(true)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 transition-all"
                    title="Terminal Help & Commands"
                >
                    <HelpCircle size={10} />
                    <span>HELP</span>
                </button>
                
                <button
                    onClick={() => setAutoExecute(!autoExecute)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all ${autoExecute ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}
                    title="Toggle Auto-Execute Commands"
                >
                    {autoExecute ? <Play size={10} /> : <Pause size={10} />}
                    <span>Auto-Exec: {autoExecute ? 'ON' : 'OFF'}</span>
                </button>

                <button
                    onClick={() => setInputMode(inputMode === 'chat' ? 'prompt' : 'chat')}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all ${inputMode === 'prompt' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}
                    title="Toggle Input Mode (Chat vs specific Prompt)"
                >
                    <ChevronRight size={10} />
                    <span>Mode: {inputMode === 'chat' ? 'CHAT' : 'PROMPT'}</span>
                </button>
             </div>
             <div>
                {loading && (
                    <button
                        onClick={stopGeneration}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 transition-all animate-pulse"
                    >
                        <Square size={10} fill="currentColor" />
                        <span>STOP GENERATING</span>
                    </button>
                )}
             </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
              <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        if (!input.trim()) return;
                        
                        // Call Autocomplete
                        fetch('http://localhost:5000/complete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ prefix: input })
                        })
                        .then(r => r.json())
                        .then(data => {
                            const suggs = data.suggestions;
                            if (!suggs || suggs.length === 0) return;
                            
                            if (suggs.length === 1) {
                                // Replace last token logic / Lógica de substituir último token
                                const parts = input.split(' ');
                                parts.pop();
                                parts.push(suggs[0]);
                                setInput(parts.join(' ') + (suggs[0].endsWith('/') ? '' : ' ')); 
                            } else {
                                // Show ambiguous options / Mostrar opções ambíguas
                                setBlocks(prev => [...prev, {
                                    id: Date.now(),
                                    type: 'terminal',
                                    content: suggs.join('  '),
                                    timestamp: new Date().toLocaleTimeString()
                                }]);
                            }
                        })
                        .catch(err => console.error("Autocomplete error", err));
                    }
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHistoryIndex(prev => {
                            const newIndex = Math.min(prev + 1, history.length - 1);
                            if (history.length > 0) {
                                const val = history[history.length - 1 - newIndex];
                                if (val) setInput(val);
                            }
                            return newIndex;
                        });
                    }
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHistoryIndex(prev => {
                            const newIndex = Math.max(prev - 1, -1);
                            if (newIndex === -1) {
                                setInput('');
                            } else {
                                const val = history[history.length - 1 - newIndex];
                                if (val) setInput(val);
                            }
                            return newIndex;
                        });
                    }
                  }}
                  placeholder={inputMode === 'chat' ? "Ask HexAgent... (Enter to send)" : "root@hexagent:~# (Execute bash command)"}
                  className={`w-full bg-[#111] border rounded-md py-3 px-4 pl-10 pr-20 focus:outline-none transition-colors font-mono text-sm resize-none ${inputMode === 'prompt' ? 'border-cyan-500/30 text-cyan-300 focus:border-cyan-500' : 'border-[#333] focus:border-[#00ff00]'}`}
                  rows={2}
                  autoFocus
              />
              <Terminal size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <div className="absolute right-2 top-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`p-1.5 rounded transition-colors ${
                      webSearchEnabled 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 hover:bg-gray-500/20'
                    }`}
                    title={webSearchEnabled ? 'Web search enabled' : 'Web search disabled'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="p-1.5 bg-[#00ff00]/10 text-[#00ff00] rounded hover:bg-[#00ff00]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      <Send size={16} />
                  </button>
              </div>
          </form>
          <div className="mt-2 flex justify-between text-[10px]">
              <div className="flex items-center gap-3 text-gray-600">
                  <span>HexSecGPT Connected {webSearchEnabled && '• Web Search ON'}</span>
                  <span className="text-gray-700">|</span>
                  <span className={serviceStatus.flask ? 'text-[#00ff00]' : 'text-red-500'}>
                      Flask:{config?.services?.flask_port || 5000} {serviceStatus.flask ? '✓' : '✗'}
                  </span>
                  <span className={serviceStatus.hexstrike ? 'text-[#00ff00]' : 'text-gray-600'}>
                      HexStrike:{config?.services?.hexstrike_port || 8888} {serviceStatus.hexstrike ? '✓' : '○'}
                  </span>
                  <span className={serviceStatus.brain ? 'text-[#00ff00]' : 'text-gray-600'}>
                      Brain {serviceStatus.brain ? '✓' : '○'}
                  </span>
              </div>
              <span className="text-gray-600">v1.0.0 Alpha</span>
          </div>
      </div>
      
      {/* Settings Modal / Modal de Configurações */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onSave={saveConfig}
      />
      
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      
      <ShutdownModal 
          isOpen={showShutdown} 
          onShutdownComplete={() => {
              if (window.require) {
                  const { ipcRenderer } = window.require('electron');
                  ipcRenderer.send('app-ready-to-quit');
              }
          }}
      />
    </div>
  );
};

export default App;
