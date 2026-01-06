import { AlertTriangle, ArrowDown, CheckCircle, Code, Copy, Cpu, Download, Edit, FileText, Folder, Hash, HelpCircle, History, Infinity, Pause, Play, Power, Send, Settings, Square, Terminal } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect, useRef, useState } from 'react';
import HelpModal from './components/HelpModal';
import LoadingScreen from './components/LoadingScreen';
import SessionModal from './components/SessionModal';
import SettingsModal from './components/SettingsModal';
import ShutdownModal from './components/ShutdownModal';
import SmartBlock from './components/SmartBlock';
import WorkspacePanel from './components/WorkspacePanel';
import { useTranslation } from './hooks/useTranslation';
import { tempFileManager } from './utils/tempFileManager';

import { AnsiRenderer } from './utils/ansiRenderer';

/**
 * Parse agent content into formatted sections
 * Analisa conteúdo do agente em seções formatadas
 * 
 * This function intelligently splits AI responses into structured sections:
 * - Code blocks (```language...```)
 * - Output blocks ([Output]: or Command Executed markers)
 * - Regular AI text
 * 
 * Esta função divide inteligentemente respostas da IA em seções estruturadas:
 * - Blocos de código (```linguagem...```)
 * - Blocos de saída (marcadores [Output]: ou Command Executed)
 * - Texto normal da IA
 * 
 * @param {string} content - Raw AI response content / Conteúdo bruto da resposta da IA
 * @returns {Array<{type: string, content: string, language?: string}>} Parsed sections / Seções parseadas
 */
const parseAgentContent = (content) => {
  const sections = [];
  
  // First, extract code blocks with regex
  // Primeiro, extrai blocos de código com regex
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    // Adiciona texto antes do bloco de código
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index).trim();
      if (textBefore) {
        // Check if this text contains [Output]: marker
        // Verifica se este texto contém marcador [Output]:
        if (textBefore.includes('[Output]:') || textBefore.match(/Command Executed/i)) {
          sections.push({ type: 'output', content: textBefore });
        } else {
          sections.push({ type: 'ai', content: textBefore });
        }
      }
    }
    
    // Add code block
    // Adiciona bloco de código
    const language = match[1] || 'plaintext';
    const code = match[2];
    sections.push({ type: 'code', content: code, language });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last code block
  // Adiciona texto restante após último bloco de código
  if (lastIndex < content.length) {
    const remaining = content.substring(lastIndex).trim();
    if (remaining) {
      // Check if remaining contains output markers
      // Verifica se o restante contém marcadores de saída
      if (remaining.includes('[Output]:') || remaining.match(/Command Executed/i)) {
        sections.push({ type: 'output', content: remaining });
      } else {
        sections.push({ type: 'ai', content: remaining });
      }
    }
  }
  
  // If no code blocks were found, check if whole content is an output or normal text
  // Se nenhum bloco de código foi encontrado, verifica se todo conteúdo é saída ou texto normal
  if (sections.length === 0) {
    if (content.includes('[Output]:') || content.match(/Command Executed/i)) {
      sections.push({ type: 'output', content });
    } else {
      sections.push({ type: 'ai', content });
    }
  }
  
  return sections;
};

// Advanced ANSI to React Parser

// Block Component with enhanced formatting / Componente de Bloco com formatação aprimorada
const Block = ({ type, content, result, timestamp, onExecute, executed, onContinue, isLast, isLoading, t, colors }) => {
  const sections = type === 'agent' ? parseAgentContent(content) : [];
  const [editedCmd, setEditedCmd] = useState(content);

  // Limit Prompt
  if (type === 'limit_prompt') {
      return (
        <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg border-yellow-500/30">
             <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-[#333] border-yellow-500/20">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-mono font-bold">{t('block.limit_title')}</span>
                    <span className="text-xs text-gray-500 font-mono ml-auto">{timestamp}</span>
             </div>
             <div className="p-4 space-y-4">
                 <p className="text-sm text-gray-300">{t('block.limit_desc')}</p>
                 <div className="flex gap-2">
                     <button onClick={() => onContinue(0)} className="px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-500 rounded hover:bg-red-900/40 text-xs font-mono">{t('block.stop')}</button>
                     <button onClick={() => onContinue(config?.ai?.max_iterations || 15)} className="px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-500 rounded hover:bg-green-900/40 text-xs font-mono flex items-center gap-2"><Play size={12} /> {t('block.continue_n').replace('{n}', config?.ai?.max_iterations || 15)}</button>
                     <button onClick={() => onContinue('MAKE_SCRIPT')} className="px-4 py-2 bg-purple-900/20 border border-purple-500/30 text-purple-400 rounded hover:bg-purple-900/40 text-xs font-mono flex items-center gap-2 transition-all hover:scale-105"><FileText size={12} /> Make Script</button>
                 </div>
             </div>
        </div>
      );
  }

  // Command Proposal
  if (type === 'proposal') {
      return (
        <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-b border-[#333]">
                <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-yellow-500" />
                    <span className="text-xs text-yellow-500 font-mono font-bold">{t('block.proposal_title')}</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">{timestamp}</span>
            </div>
            <div className="p-4 space-y-3">
                 <p className="text-xs text-gray-400">{t('block.proposal_desc')}</p>
                 <textarea 
                    value={editedCmd}
                    onChange={(e) => setEditedCmd(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded p-3 text-sm font-mono text-yellow-300 focus:outline-none focus:border-yellow-500 transition-colors"
                    rows={editedCmd.split('\n').length + 1}
                 />
                 <div className="flex justify-end gap-2">
                     {!executed ? (
                         <button onClick={() => onExecute(editedCmd)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded hover:bg-yellow-500/20 transition-all font-mono text-xs"><Play size={12} /> {t('common.execute')}</button>
                     ) : (
                         <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> {t('common.executed')}</span>
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
        {type === 'agent' && <div className="text-[10px] text-cyan-400 border border-cyan-400/20 px-1 rounded">{t('block.hexagent')}</div>}
      </div>
      
      <div className="p-4 font-mono text-sm space-y-3">
        {type === 'user' ? (
          <div className="whitespace-pre-wrap" style={{ color: colors?.user_text || '#00ff00' }}>{content}</div>
        ) : (
          sections.map((section, idx) => {
            if (section.type === 'ai') {
              return (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap group relative pl-2 border-l-2 border-cyan-800/20" style={{ color: colors?.ai_text || '#22d3ee' }}>
                  {section.content}
                   {isLast && isLoading && (
                       <span className="inline-block w-2 H-4 ml-1 align-middle bg-cyan-400 animate-pulse">▋</span>
                   )}
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-[#0a0a0a]/80 backdrop-blur rounded p-1 border border-gray-800">
                       <button onClick={() => navigator.clipboard.writeText(section.content)} className="flex items-center gap-1 p-1 hover:bg-[#222] text-gray-400 rounded transition-colors text-[10px]" title={t('common.copy_text')}><Copy size={12} /> {t('common.copy')}</button>
                   </div>
                </div>
              );
            } else if (section.type === 'command') {
              return (
                <div key={idx} className="group relative flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  <Code size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-300 font-semibold">{section.content}</span>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-[#0a0a0a]/80 backdrop-blur rounded p-1 border border-gray-800">
                       <button onClick={() => navigator.clipboard.writeText(section.content)} className="flex items-center gap-1 p-1 hover:bg-[#222] text-gray-400 rounded transition-colors text-[10px]" title={t('common.copy_command')}><Copy size={12} /> {t('common.copy')}</button>
                       <button onClick={() => onExecute(section.content)} className="flex items-center gap-1 p-1 hover:bg-[#222] text-green-400 rounded transition-colors text-[10px]" title={t('common.execute')}>
                         {executed ? <div className="animate-spin h-3 w-3 border-2 border-green-500 rounded-full border-t-transparent"></div> : <Play size={12} />} {t('common.execute')}
                       </button>
                  </div>
                </div>
              );
            } else if (section.type === 'terminal') {
              return (
                <div key={idx} className="bg-black border border-gray-800 rounded p-3 font-mono shadow-inner">
                  <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed select-text font-mono">
                    <span className="text-green-500 select-none mr-2">$</span>
                    <AnsiRenderer text={section.content} customColors={colors?.custom_ansi} />
                  </div>
                </div>
              );
            } else if (section.type === 'code') {
              return (
                <SmartBlock 
                  key={idx}
                  content={section.content}
                  metadata={{ language: section.language, type: 'code' }}
                  autoExecuteEnabled={false}
                  onAction={(action, content, blockInfo) => {
                    if (action === 'execute') {
                      onExecute(content, blockInfo.language);
                    } else if (action === 'save') {
                      tempFileManager.trackFile(`script_${Date.now()}.${blockInfo.language}`, content);
                    }
                  }}
                />
              );
            } else if (section.type === 'output') {
              return (
                <div key={idx} className="mt-2 p-3 bg-black/30 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">Output:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigator.clipboard.writeText(section.content)}
                        className="px-2 py-0.5 text-[10px] rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition"
                        title="Copy output"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    <AnsiRenderer text={section.content} customColors={colors?.custom_ansi} />
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
        
        {result && (
          <div className="mt-2 p-3 bg-black/30 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-mono">Output:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result);
                  }}
                  className="px-2 py-0.5 text-[10px] rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition"
                  title="Copy output"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    tempFileManager.trackFile(`output_${Date.now()}.log`, result);
                  }}
                  className="px-2 py-0.5 text-[10px] rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition"
                  title="Save output"
                >
                  Save
                </button>
              </div>
            </div>
            <div className="font-mono text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
              <AnsiRenderer text={result} customColors={colors?.custom_ansi} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// CodeBlock component with action buttons / Componente de bloco de código com botões de ação
const CodeBlock = ({ code, language, onExecute, colors }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current && !editing) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language, editing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editing ? editedCode : code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const extensions = { python: 'py', javascript: 'js', bash: 'sh', json: 'json', markdown: 'md' };
    const ext = extensions[language] || 'txt';
    const filename = prompt('Nome do arquivo:', `script.${ext}`);
    if (filename) {
      const blob = new Blob([editing ? editedCode : code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleExecute = () => {
    if (onExecute) onExecute(editing ? editedCode : code, language);
  };

  const handleEdit = () => {
    setEditing(!editing);
    if (editing) {
      // Save changes
      // For now just toggle, could add save logic here
    }
  };

  const isExecutable = ['bash', 'python', 'javascript', 'sh'].includes(language);

  return (
    <div className="my-2 rounded-lg bg-[#1e1e1e] border border-[#333] overflow-hidden">
      {/* Action Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#444]">
        <span className="text-xs text-gray-400 font-mono">{language || 'plaintext'}</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition">
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <button onClick={handleSave} className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition">
            {saved ? <CheckCircle size={12} /> : <Download size={12} />}
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
          <button onClick={handleEdit} className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] transition ${editing ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
            <Edit size={12} />
            {editing ? 'Fechar' : 'Editar'}
          </button>
          {isExecutable && onExecute && (
            <button onClick={handleExecute} className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] text-green-400 hover:text-green-300 transition">
              <Play size={12} />
              Executar
            </button>
          )}
        </div>
      </div>
      {/* Code Content */}
      {editing ? (
        <textarea
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
          className="w-full bg-[#1e1e1e] text-gray-200 p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          rows={editedCode.split('\n').length + 1}
        />
      ) : language === 'bash' && (code.includes('\u001b[') || code.includes('\x1b[') || code.match(/\[\d+(?:;\d+)*m/)) ? (
        // Bash with ANSI codes - use AnsiRenderer
        <div className="p-3 overflow-x-auto bg-black font-mono text-sm text-gray-200">
          <AnsiRenderer text={code} customColors={colors?.custom_ansi} />
        </div>
      ) : (
        <pre className="p-3 overflow-x-auto"><code ref={codeRef} className={`language-${language || 'plaintext'}`}>{code}</code></pre>
      )}
    </div>
  );
};

const App = () => {
  // State for Blocks (Chat History)
  const [blocks, setBlocks] = useState([]); // Start empty
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [status, setStatus] = useState('OFFLINE'); // Global Connection Status
  const [serviceStatus, setServiceStatus] = useState({ flask: false, hexstrike: false, brain: false });
  const [inputMode, setInputMode] = useState('prompt'); // 'prompt' | 'command'
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Configuration State (Must be initialized before useTranslation)
  const [config, setConfig] = useState(null);
  const scrollRef = useRef(null);
  

  // Translation Hook
  const { t } = useTranslation(config);
  
  // History State
  const [promptHistory, setPromptHistory] = useState([]); // Local Prompt History
  const [systemHistory, setSystemHistory] = useState([]); // Remote Shell History
  
  
  // History State

  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sysHistoryIndex, setSysHistoryIndex] = useState(-1);

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShutdown, setShowShutdown] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [currentSessionName, setCurrentSessionName] = useState('');
  
  // UI Enhancements State / Estados de Melhorias de UI
  const [autoExecute, setAutoExecute] = useState(false); // Default false for safety
  const [maxIterations, setMaxIterations] = useState(10); // Max AI iterations
  const [unlimitedIterations, setUnlimitedIterations] = useState(false); // Unlimited mode toggle
  const [currentIteration, setCurrentIteration] = useState(0); // Current iteration count
  const [showIterationLimitReached, setShowIterationLimitReached] = useState(false);
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

  // Auto-Save Session / Salvar Sessão Automaticamente
  useEffect(() => {
    if (blocks.length === 0) return;
    const timeoutId = setTimeout(() => {
        fetch('http://localhost:5000/save_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'autosave', blocks })
        }).catch(e => console.error("Auto-save failed", e));
    }, 2000); // Debounce 2s
    return () => clearTimeout(timeoutId);
  }, [blocks]);

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
        
        /* Auto-load removed for clean session start */
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

    // Wait for backend to be ready with retries (60 seconds total)
    const waitForBackend = async (maxRetries = 60, delayMs = 1000) => {
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

  // Fetch System Shell History on Mount / Carregar histórico do shell no início
  useEffect(() => {
      fetch('http://localhost:5000/history/shell')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.commands) {
                setSystemHistory(data.commands);
                console.log(`[Shell History] Loaded ${data.commands.length} commands from ${data.shell}`);
            }
        })
        .catch(err => console.error("Failed to fetch shell history", err));
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

  // Save settings handler
  const handleSettingsSave = async (newConfig) => {
    console.log('[DEBUG] Saving settings:', newConfig);
    try {
      const response = await fetch('http://localhost:5000/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        setConfig(newConfig);
        console.log('[DEBUG] Settings saved successfully');
      }
    } catch (error) {
      console.error('[DEBUG] Failed to save settings:', error);
    }
  };

  // Export chat handler (debug mode only)
  const handleExportChat = async () => {
    try {
      // Prepare export data
      const exportData = {
        session_id: Date.now().toString(),
        blocks: blocks, // Changed from 'messages' to 'blocks' to match context
        metadata: {
          date: new Date().toISOString(),
          config: config
        }
      };

      // Request backend to format
      const response = await fetch('http://localhost:5000/export/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      const data = await response.json();

      if (data.success && window.require) {
        // Use Electron IPC to save file
        const { ipcRenderer } = window.require('electron');
        const result = await ipcRenderer.invoke('save-file', {
          content: data.markdown,
          defaultName: `hexagent_chat_${new Date().toISOString().split('T')[0]}.md`,
          filters: [
            { name: 'Markdown Files', extensions: ['md'] },
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (result.success) {
          console.log('✅ Chat exported to:', result.path);
        }
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
  };

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

  const toggleUnlimited = () => {
       const newUnlimited = !config?.ai?.unlimited_iterations;
       updateConfig('ai.unlimited_iterations', newUnlimited);
       // Also update local state for immediate feedback
       setConfig(prev => ({
           ...prev,
           ai: {
               ...prev.ai,
               unlimited_iterations: newUnlimited
           }
       }));
  };

  const handleContinue = async (countOrAction) => {
      if (!countOrAction) return;
      
      let msg = '';
      let maxIters = 5;

      if (countOrAction === 'MAKE_SCRIPT') {
          msg = "Consolidate the work done so far into a script. Create the script file in the standard location.";
          maxIters = 20; // Give plenty of iterations for script writing
      } else {
          const count = Number(countOrAction);
          if (count <= 0) return;
          msg = `Please continue the task for ${count} more iterations.`;
          maxIters = count;
      }
      
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
                  max_iterations: maxIters
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

  // Session Management Handlers
  const handleLoadSession = async (name) => {
      // 1. Load session data
      try {
          const res = await fetch('http://localhost:5000/load_session?name=' + name);
          const data = await res.json();
          if (data.success) {
              setBlocks(data.blocks);
              setBlocks(prev => [...prev, {
                  id: Date.now(), type: 'terminal', 
                  content: `Session '${name}' loaded.`,
                  timestamp: new Date().toLocaleTimeString()
              }]);
              setShowSessionModal(false);
          }
      } catch (e) { console.error(e); }
  };

  const handleSaveSession = async (name) => {
      try {
          await fetch('http://localhost:5000/sessions', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ action: 'save', name, data: blocks })
          });
          setShowSessionModal(false);
      } catch (e) { console.error(e); }
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
    
    // History Logic
    if (inputMode === 'prompt') {
        setPromptHistory(prev => [input, ...prev].slice(0, 100));
        setHistoryIndex(-1);
    } else {
        // In command mode, update system history locally for immediate feedback
        setSystemHistory(prev => [input, ...prev].slice(0, 100));
        setSysHistoryIndex(-1);
    }
    
    setInput('');
    setLoading(true);

    // COMMAND INTERCEPTOR (Omni-commands for any mode if prefixed)
    const cleanCmd = cmd.replace(/^[@#\/]/, '').trim(); 
    const lowerCmd = cleanCmd.toLowerCase();

    // Slash Command Fixes
    if (lowerCmd === 'clear' || lowerCmd === 'clean') {
        setBlocks([]);
        setLoading(false);
        return;
    }
    
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
    
    // PROMPT MODE LOGIC
    if (inputMode === 'prompt') {
        if (cmd.trim() === '/help') {
             setShowHelp(true);
             setLoading(false);
             return;
        }

        // AI Inference Check (@, #, /ai)
        let isAgentRequest = true; // Default to AI in prompt mode unless /cmd
        
        // ... (rest of logic handles AI)
    }

    
    // COMMAND MODE - Direct Execution / MODO COMANDO - Execução Direta
    if (inputMode === 'command') {
        // Check if it's an @llm request / Verificar se é solicitação @llm
        if (cmd.trim().startsWith('@')) {
            // Strip @ and send to AI / Remover @ e enviar para IA
            const llmPrompt = cmd.trim().substring(1);
            
            try {
                const response = await fetch('http://localhost:5000/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: llmPrompt, 
                        language: 'auto',
                        auto_execute: autoExecute 
                    }),
                    signal: abortControllerRef.current.signal
                });
                
                if (!response.body) throw new Error('No body');
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
                                setBlocks(prev => {
                                    const newBlocks = [...prev];
                                    newBlocks[newBlocks.length - 1].content = agentText;
                                    return newBlocks;
                                });
                            } else if (json.proposal) {
                                setBlocks(prev => [...prev, {
                                    id: Date.now() + 2,
                                    type: 'proposal',
                                    content: json.proposal.trim(),
                                    timestamp: new Date().toLocaleTimeString(),
                                    executed: false
                                }]);
                            }
                        } catch (e) {}
                    }
                }
            } catch(e) {
                if(e.name !== 'AbortError') console.error(e);
            } finally {
                setLoading(false);
            }
            return;
        }
        
        // Direct command execution / Execução direta de comando
        try {
            const response = await fetch('http://localhost:5000/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            });
            const data = await response.json();
            
            // Show terminal-style output wrapped in bash code block
            const output = data.result || data.error || "(No output)";
            setBlocks(prev => [...prev, {
                id: Date.now(),
                type: 'agent',
                content: `\`\`\`bash\n${output}\n\`\`\``,
                timestamp: new Date().toLocaleTimeString()
            }]);
        } catch (e) {
            console.error("Command execution failed", e);
            setBlocks(prev => [...prev, {
                id: Date.now(),
                type: 'agent',
                content: `❌ Error: ${e.message}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        } finally {
            setLoading(false);
        }
        return;
    }

    // PROMPT MODE LOGIC (Fallback for chat/AI)
    try {
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: cmd,
              context: {
                messages: blocks.slice(-5),
                auto_execute: autoExecute,
                max_iterations: unlimitedIterations ? 0 : maxIterations  // 0 = unlimited
              }
            }),
            signal: abortControllerRef.current.signal
        });
        
        if (!response.body) throw new Error('No body');
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
                        setBlocks(prev => {
                            const newBlocks = [...prev];
                            newBlocks[newBlocks.length - 1].content = agentText;
                            return newBlocks;
                        });
                    } else if (json.proposal) {
                         setBlocks(prev => [...prev, {
                            id: Date.now() + 2,
                            type: 'proposal',
                            content: json.proposal.trim(),
                            timestamp: new Date().toLocaleTimeString(),
                            executed: false
                        }]);
                    }
                } catch (e) {}
            }
        }

    } catch(e) {
        if(e.name !== 'AbortError') console.error(e);
        setLoading(false);
    } finally {
        setLoading(false);
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
                content: `Command Executed / Comando Executado:\n\`\`\`bash\n${cmd}\n\`\`\`\n\n[Output]:\n\`\`\`bash\n${resultText}\n\`\`\``,
                timestamp: new Date().toLocaleTimeString()
          }]);
      } catch (e) {
          console.error("Manual execution failed", e);
      } finally {
          setLoading(false);
      }
  };

  const handleKeyDown = (e) => {
    // 1. Enter Key
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
        return;
    }

    // 2. Tab (Autocomplete - Global)
    if (e.key === 'Tab') {
        e.preventDefault();
        if (!input.trim()) return;
        fetch('http://localhost:5000/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix: input })
        })
        .then(r => r.json())
        .then(data => {
            const suggs = data.suggestions;
            if (suggs && suggs.length > 0) {
                 const parts = input.split(' ');
                 parts.pop();
                 parts.push(suggs[0]);
                 setInput(parts.join(' ') + (suggs[0].endsWith('/') ? '' : ' ')); 
            }
        });
        return;
    }

    // 3. Navigation Logic
    // Command Mode (Blue) -> Use System History
    if (inputMode === 'command') {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSysHistoryIndex(prev => {
                const newIndex = Math.min(prev + 1, systemHistory.length - 1);
                if (systemHistory[newIndex]) setInput(systemHistory[newIndex]);
                return newIndex;
            });
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSysHistoryIndex(prev => {
                const newIndex = Math.max(prev - 1, -1);
                if (newIndex === -1) setInput('');
                else if (systemHistory[newIndex]) setInput(systemHistory[newIndex]);
                return newIndex;
            });
        }
    } 
    // Prompt Mode (Green) -> Text Editor behavior
    else {
        // Shift+Ctrl+Arrows -> Local Prompt History
        if (e.shiftKey && e.ctrlKey) {
             if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHistoryIndex(prev => {
                    const newIndex = Math.min(prev + 1, promptHistory.length - 1);
                    if (promptHistory[newIndex]) setInput(promptHistory[newIndex]);
                    return newIndex;
                });
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHistoryIndex(prev => {
                    const newIndex = Math.max(prev - 1, -1);
                    if (newIndex === -1) setInput('');
                    else if (promptHistory[newIndex]) setInput(promptHistory[newIndex]);
                    return newIndex;
                });
            }
        }
        // Normal Arrows -> Default textarea behavior (cursor move) - Do nothing
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
      <header className="drag-region h-10 bg-[#0a0a0a] border-b border-[#333] flex items-center justify-between px-4 pr-24 select-none">
          <div className="flex items-center gap-2">
              <img src="logo.png" className="w-4 h-4 object-contain" alt="logo" />
              <span className="font-bold text-sm tracking-wider">HEXAGENT GUI</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
              <button onClick={() => setShowSessionModal(true)} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                  <History size={14} />
                  <span>History</span>
              </button>
              
              {/* Existing Header Items */}
              {/* Header Status Removed as per user request */}
              {/* Detailed Compact Status Bar */}
              <div className="flex items-center gap-3 text-[10px] font-mono border-l border-[#333] pl-3 h-5">
                   {/* Flask Status */}
                   <div className="flex items-center gap-1.5" title="Backend API">
                        <div className={`w-1.5 h-1.5 rounded-full ${initStatus.backend.status === 'success' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        <span className={initStatus.backend.status === 'success' ? 'text-green-500' : 'text-red-500'}>Flask:{initStatus.backend.port || 5000}</span>
                   </div>

                   {/* HexStrike Status */}
                   <div className="flex items-center gap-1.5 border-l border-[#333] pl-3" title="Command Engine">
                        <div className={`w-1.5 h-1.5 rounded-full ${initStatus.hexstrike.ready ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        <span className={initStatus.hexstrike.ready ? 'text-green-500' : 'text-red-500'}>HexStrike:{initStatus.hexstrike.port || 8888}</span>
                   </div>

                   {/* Brain Status */}
                   <div className="flex items-center gap-1.5 border-l border-[#333] pl-3" title="AI Core">
                        <div className={`w-1.5 h-1.5 rounded-full ${initStatus.brain.status === 'success' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
                        <span className={initStatus.brain.status === 'success' ? 'text-green-500' : 'text-red-500'}>Brain</span>
                   </div>
              </div>

              <div className="flex items-center gap-2 border-l border-[#333] pl-3 ml-2">
                   {/* Export Chat Button (debug mode only) */}
                   {config?.system?.debug_mode && (
                     <button
                       onClick={handleExportChat}
                       className="p-0 bg-transparent border-0 cursor-pointer flex items-center"
                       title="Export Chat (Debug Mode)"
                     >
                       <Download 
                         size={14} 
                         className="text-purple-400 hover:text-purple-300 transition-colors" 
                       />
                     </button>
                   )}
                   
                   {/* Workspace Button */}
                   <button
                     onClick={() => setShowWorkspace(!showWorkspace)}
                     className="p-0 bg-transparent border-0 cursor-pointer flex items-center"
                     title="Workspace / Espaço de Trabalho"
                   >
                     <Folder 
                       size={14} 
                       className={`transition-colors ${
                         showWorkspace ? 'text-yellow-500' : 'text-gray-400 hover:text-white'
                       }`}
                     />
                   </button>
                   
                   <button
                     onClick={() => {
                       console.log('[DEBUG] Settings button clicked!');
                       console.log('[DEBUG] Current showSettings:', showSettings);
                       console.log('[DEBUG] Current config:', config);
                       setShowSettings(prev => {
                         console.log('[DEBUG] Setting showSettings from', prev, 'to true');
                         return true;
                       });
                     }}
                     className="p-0 bg-transparent border-0 cursor-pointer flex items-center"
                     title="Settings / Configurações"
                   >
                     <Settings 
                       size={14} 
                       className="text-gray-400 hover:text-white transition-colors" 
                     />
                   </button>
                   <Power size={14} className="text-red-500 hover:text-red-400 cursor-pointer" onClick={() => setShowShutdown(true)} title="Shutdown and Kill All Services" />
              </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar z-10" ref={scrollRef}>
           {/* Blocks Rendering */}
           {blocks.map((block, index) => (
              <Block 
                  key={block.id} 
                  {...block} 
                  onExecute={(cmd) => handleExecuteProposal(cmd, block.id)}
                  onContinue={handleContinue}
                  isLast={index === blocks.length - 1}
                  isLoading={isLoading && index === blocks.length - 1}
                  t={t}
                  colors={config?.ui?.custom_ansi}
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
                >
                    <ArrowDown size={10} />
                    <span>AutoScroll</span>
                </button>

                <button
                    onClick={() => setShowHelp(true)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 transition-all"
                >
                    <HelpCircle size={10} />
                    <span>HELP</span>
                </button>
                
                <button
                    onClick={() => setAutoExecute(!autoExecute)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all ${autoExecute ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}
                >
                    {autoExecute ? <Play size={10} /> : <Pause size={10} />}
                    <span>Auto-Exec: {autoExecute ? 'ON' : 'OFF'}</span>
                </button>
                
                {/* Iteration Control */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border border-gray-600/30 bg-gray-800/20">
                  <button
                    onClick={() => setUnlimitedIterations(!unlimitedIterations)}
                    className={`transition-all ${unlimitedIterations ? 'text-yellow-400' : 'text-gray-500'}`}
                    title={unlimitedIterations ? "Iterações ilimitadas ATIVAS" : "Ativar iterações ilimitadas"}
                  >
                    <Infinity size={10} />
                  </button>
                  <button 
                    onClick={() => setMaxIterations(Math.max(1, maxIterations - 1))}
                    className="text-gray-400 hover:text-white px-1 transition-colors"
                    disabled={unlimitedIterations}
                  >
                    -
                  </button>
                  <span className="px-1 font-bold text-cyan-400">{unlimitedIterations ? '∞' : `${currentIteration}/${maxIterations}`}</span>
                  <button 
                    onClick={() => setMaxIterations(Math.min(50, maxIterations + 1))}
                    className="text-gray-400 hover:text-white px-1 transition-colors"
                    disabled={unlimitedIterations}
                  >
                    +
                  </button>
                </div>

                <button
                    onClick={() => setInputMode(inputMode === 'prompt' ? 'command' : 'prompt')}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all ${inputMode === 'prompt' ? 'text-[#00ff00] bg-[#00ff00]/10 border-[#00ff00]/30' : 'text-blue-400 bg-blue-500/10 border-blue-500/30'}`}
                    title="Toggle Input Mode"
                >
                    <Terminal size={10} />
                    <span>{inputMode === 'prompt' ? 'MODE: PROMPT (CHAT)' : 'MODE: COMMAND'}</span>
                </button>

                <button
                    onClick={toggleUnlimited}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all ${config?.ai?.unlimited_iterations ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}
                >
                    {config?.ai?.unlimited_iterations ? <Infinity size={10} /> : <Hash size={10} />}
                    <span>{config?.ai?.unlimited_iterations ? 'Unlimited' : `Limit: ${config?.ai?.max_iterations || 15}`}</span>
                </button>
             </div>
             <div>
                {isLoading && (
                    <button
                        onClick={stopGeneration}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20 transition-all animate-pulse"
                    >
                        <Square size={10} fill="currentColor" />
                        <span>STOP</span>
                    </button>
                )}
             </div>
          </div>

          <form onSubmit={handleSubmit} className="relative">
              <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputMode === 'prompt' ? "Type message... (Shift+Enter for new line)" : "Type command... (Up/Down for history)"}
                  className={`w-full bg-[#111] border rounded-md py-3 px-4 pl-10 pr-20 focus:outline-none transition-colors font-mono text-sm resize-none ${inputMode === 'prompt' ? 'border-green-500/30 text-green-300 focus:border-green-500 placeholder-green-700/50' : 'border-blue-500/30 text-blue-300 focus:border-blue-500 placeholder-blue-700/50'}`}
                  rows={2}
                  autoFocus
              />
              <div className={`absolute left-3 top-3.5 ${inputMode === 'prompt' ? 'text-green-500' : 'text-blue-500'}`}>
                  {inputMode === 'prompt' ? <FileText size={16} /> : <Terminal size={16} />}
              </div>
              <div className="absolute right-2 top-2 flex items-center gap-2">
                  <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className={`p-1.5 rounded-md transition-colors border ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'} ${inputMode === 'prompt' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-blue-500/50 text-blue-500 bg-blue-500/10'}`}
                  >
                      <Send size={16} />
                  </button>
              </div>
          </form>
          <div className="mt-2 flex justify-between text-[10px] text-gray-600">
              <span className="flex items-center gap-2">
                 {inputMode === 'prompt' ? 'SHIFT+CTRL+ARROWS for History' : 'ARROWS for System History'}
              </span>
              <span>HexSecGPT v2.0</span>
          </div>
      </div>
      
      {/* Modals */}
      {console.log('[DEBUG] About to render SettingsModal, showSettings=', showSettings, 'config=', config)}
      
      {/* Workspace Panel / Painel de Workspace */}
      <WorkspacePanel
        isOpen={showWorkspace}
        onClose={() => setShowWorkspace(false)}
        onFileSelect={(file) => {
          console.log('[App] File selected from workspace:', file);
          // Future: open file in editor panel
        }}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => {
          console.log('[DEBUG] SettingsModal onClose called');
          setShowSettings(false);
        }}
        config={config}
        onSave={saveConfig}
        t={t}
      />
      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onLoadSession={handleLoadSession}
        onSaveSession={handleSaveSession}
        currentSessionName={currentSessionName}
      />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <ShutdownModal 
        isOpen={showShutdown} 
        onClose={() => setShowShutdown(false)} 
        onShutdownComplete={() => {
          // Send IPC to Electron to actually close the window
          if (window.require) {
            try {
              const { ipcRenderer } = window.require('electron');
              ipcRenderer.send('app-ready-to-quit');
            } catch (e) {
              console.error('Failed to send quit signal:', e);
              window.close();
            }
          } else {
            window.close();
          }
        }}
      />
    </div>
  );
};

export default App;
