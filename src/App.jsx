import { AlertTriangle, ArrowDown, CheckCircle, Code, Copy, Cpu, Download, Edit, FileText, GitBranch, Hash, HelpCircle, History, Infinity, Pause, Play, Power, Send, Server, Settings, Square, Terminal } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect, useRef, useState } from 'react';
import HelpModal from './components/HelpModal';
import LoadingScreen from './components/LoadingScreen';
import ServiceManagerModal from './components/ServiceManagerModal';
import SessionModal from './components/SessionModal';
import SettingsModal from './components/SettingsModal';
import ShutdownModal from './components/ShutdownModal';
import SmartBlock from './components/SmartBlock';
import useAIConfig from './hooks/useAIConfig';
import useModalState from './hooks/useModalState';
import useSystemConfig from './hooks/useSystemConfig';
import { useTranslation } from './hooks/useTranslation';
import SessionService from './services/SessionService';
import APIClient from './utils/APIClient';
import { tempFileManager } from './utils/tempFileManager';

import AIConfigModal from './components/AIConfigModal';
import WorkflowManagerModal from './components/WorkflowManagerModal';
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
                     <button onClick={() => onContinue(aiConfig?.ai?.max_iterations || 15)} className="px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-500 rounded hover:bg-green-900/40 text-xs font-mono flex items-center gap-2"><Play size={12} /> {t('block.continue_n').replace('{n}', aiConfig?.ai?.max_iterations || 15)}</button>
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
  
  // SHELL Output Block - Terminal command result / Bloco de Saída SHELL - Resultado de comando terminal
  if (type === 'SHELL') {
    return (
      <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-green-500/20 overflow-hidden shadow-lg">
        {/* Header with command */}
        <div className="flex items-center justify-between px-4 py-2 bg-green-500/5 border-b border-green-500/10">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-green-500" />
            <span className="text-xs text-green-400 font-mono">Shell Output</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">{timestamp}</span>
        </div>
        
        {/* Terminal output content */}
        <div className="p-4 bg-black/30 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
          <AnsiRenderer text={content} colors={colors} />
        </div>
        
        {/* Discrete footer with iteration badge */}
        {(result?.iteration || result?.maxIterations) && (
          <div className="flex justify-between items-center px-4 py-2 bg-[#0a0a0a] border-t border-green-500/10">
            <span className="text-[10px] text-gray-600 font-mono">
              Iteration {result.iteration}/{result.maxIterations}
            </span>
            {result.iteration >= result.maxIterations && isLast && (
              <button 
                onClick={() => onContinue(result.maxIterations)}
                className="text-[11px] px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded hover:bg-green-500/20 transition">
                Continue
              </button>
            )}
          </div>
        )}
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
  // Service Instances / Instâncias de Serviço
  const api = APIClient.getInstance();
  const sessionService = SessionService.getInstance();
  
  // State for Blocks (Chat History)
  const [blocks, setBlocks] = useState([]); // Start empty
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [status, setStatus] = useState('OFFLINE'); // Global Connection Status
  const [serviceStatus, setServiceStatus] = useState({ flask: false, hexstrike: false, brain: false });
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
    saveAIConfig 
  } = useAIConfig();
  
  // Combined loading state / Estado de carregamento combinado
  const configLoading = systemLoading || aiLoading;
  const configError = systemError || aiError;
  const scrollRef = useRef(null);
  

  // Translation Hook / Hook de Tradução
  const { t, language, setLanguage } = useTranslation();
  
  // Sync language from systemConfig to TranslationManager
  // Sincronizar idioma do systemConfig para TranslationManager
  useEffect(() => {
    if (systemConfig?.system?.language && systemConfig.system.language !== language) {
      console.log(`[App] Syncing language from systemConfig: ${systemConfig.system.language}`);
      setLanguage(systemConfig.system.language);
    }
  }, [systemConfig?.system?.language, language, setLanguage]);
  
  // History State
  const [promptHistory, setPromptHistory] = useState([]); // Local Prompt History
  const [systemHistory, setSystemHistory] = useState([]); // Remote Shell History
  
  
  // History State

  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sysHistoryIndex, setSysHistoryIndex] = useState(-1);

  // UI State - Unified modal management with useModalState hook
  // Estado de UI - Gerenciamento unificado de modais com hook useModalState
  const settingsModal = useModalState();
  const helpModal = useModalState();
  const sessionModal = useModalState();
  const servicesModal = useModalState();
  const workflowModal = useModalState();
  const shutdownModal = useModalState();
  const aiConfigModal = useModalState(); // New AI Config modal / Novo modal de config de IA
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
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
        console.log('[AutoSave] Saving session before close...');
        try {
          await api.post('/save_session', {
            name: 'auto-save-' + Date.now(),
            blocks
          });
        } catch (error) {
          console.error('[AutoSave] Failed:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [blocks, api]); // Depend on blocks and api

  useEffect(() => {
    let intervalId = null;

    // Config is now loaded automatically by useConfig hook
    // Configuração agora é carregada automaticamente pelo hook useConfig
    // (loadConfig function removed - duplicidade eliminada)

    // Check Status and update service status details / Verificar status e detalhes dos serviços
    const checkStatus = async () => {
      try {
        const data = await api.get('/status');
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
                const isHealthy = await api.healthCheck();
                if (isHealthy) {
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

                console.log(`[HexAgentGUI] Attempting init (${i + 1}/${retries})...`);
                if (i > 0) {
                    console.warn(`[HexAgentGUI] Retry ${i}/${retries - 1} for init`);
                }

                const data = await api.post('/init');
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
            
            // Step 2: Brain (optional in standalone mode)
            setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: 'Loading Brain...' }}));
            setInitProgress(40);
            
            const initResult = await initBackend();
            if (!initResult) {
                // Brain init failed - continue anyway in standalone mode
                // Inicialização do brain falhou - continuar em modo standalone
                console.warn('[Init] Brain initialization failed - continuing in standalone mode');
                setInitStatus(prev => ({ ...prev, brain: { status: 'warning', message: 'Standalone Mode' }}));
            } else {
                setInitStatus(prev => ({ ...prev, brain: { status: 'success', message: 'Loaded' }}));
            }
            setInitProgress(60);
            
            // Step 3: Config
            setInitStatus(prev => ({ ...prev, config: { status: 'loading', message: 'Loading...' }}));
            setInitProgress(75);
            // Config now loaded automatically by useConfig hook
            // Configuração agora é carregada automaticamente pelo hook useConfig
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

  // Load shell history / Carregar histórico do shell
    useEffect(() => {
      api.get('/history/shell')
        .then(data => {
          if (data && data.history) {
            setSystemHistory(data.history);
          }
        })
        .catch(e => console.error('[History] Failed to load shell history:', e));
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
              const handler = () => shutdownModal.open();
              ipcRenderer.on('app-close-requested', handler);
              return () => ipcRenderer.removeListener('app-close-requested', handler);
          } catch(e) { console.log('Non-electron env'); }
      }
  }, []);

  // Save settings handler (unified with ConfigManager)
  // Handler de salvamento de configurações (unificado com ConfigManager)
  const handleSettingsSave = async (newConfig) => {
    console.log('[DEBUG] Saving settings:', newConfig);
    try {
      // Use APIClient for unified config handling
      // Usar APIClient para tratamento unificado de config
      await api.post('/config', newConfig);
      
      // Update ConfigManager to sync state
      // Atualizar ConfigManager para sincronizar estado
      Object.keys(newConfig).forEach(key => {
        updateConfig(key, newConfig[key]);
      });
      console.log('[DEBUG] Settings saved successfully');
    } catch (error) {
      console.error('[DEBUG] Failed to save settings:', error);
    }
  };

  // Export chat handler (debug mode only)
  const handleExportChat = async () => {
    console.log('[Export Chat] Button clicked');
    try {
      // Check if Electron is available
      if (!window.require) {
        console.error('[Export Chat] window.require not available');
        alert('Export feature only works in Electron app');
        return;
      }
      
      console.log('[Export Chat] Preparing export data...');
      // Use APIClient for backend export
      const data = await api.post('/export/chat', {
        blocks,
        format: 'markdown',
        session_id: Date.now().toString(),
        metadata: {
          date: new Date().toISOString(),
          config: systemConfig
        }
      });
      
      if (data.success && data.filepath) {
        console.log('[Export Chat] Exported to:', data.filepath);
        alert(`Chat exported to: ${data.filepath}`);
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (error) {
      console.error('[Export Chat] Error:', error);
      alert('Error exporting chat: ' + error.message);
    }
  };

  // Save configuration handler
  const handleConfigUpdate = async (newConfig) => {
    console.log('[Config Update] Saving config:', newConfig);
    try {
      await api.post('/config', newConfig);
      
      // Update ConfigManager to sync state
      Object.keys(newConfig).forEach(key => {
        updateConfig(key, newConfig[key]);
      });
      console.log('[Config Update] Config saved successfully');
    } catch (error) {
      console.error('[Config Update] Failed to save config:', error);
    }
  };

  const toggleUnlimited = () => {
       const newUnlimited = !aiConfig?.ai?.unlimited_iterations;
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
          const data = await api.post('/service', {
              action,
              service: serviceName
          });

          console.log('[Service] Response:', data);
          
          // Update service status if provided
          // This `setServiceStatus` is not defined in the provided context.
          // If it's meant to be used, it needs to be defined or removed.
          // For now, I'll keep it as per the instruction, assuming it's defined elsewhere.
          // if (data.status) {
          //     setServiceStatus(data.status);
          // }

          setBlocks(prev => [...prev, {
              id: Date.now(), type: 'terminal',
              content: `Service Control: ${data.message || 'Command executed'}`,
              timestamp: new Date().toLocaleTimeString()
          }]);
      } catch (error) {
          console.error('[Service] Error:', error);
          setBlocks(prev => [...prev, {
              id: Date.now(), type: 'terminal',
              content: `Error: ${error.message}`,
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
          const data = await api.post('/sessions', payload);
          
          if (action === 'load' && data.success) {
               setBlocks(data.data);
               setBlocks(prev => [...prev, {
                  id: Date.now(), type: 'terminal', 
                  content: `Session '${name}' loaded.`,
                  timestamp: new Date().toLocaleTimeString()
               }]);
          } else if (action === 'list' && data.sessions) {
              // List sessions
              const sessionList = data.sessions.join('\n');
              setBlocks(prev => [...prev, {
                  id: Date.now(), type: 'terminal',
                  content: `Available sessions:\n${sessionList}`,
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

  // Session Management using SessionService / Gerenciamento de Sessões usando SessionService
  const handleLoadSession = async (name) => {
    if (!name) return;
    try {
      const result = await sessionService.loadSession(name);
      
      if (result.success) {
        setBlocks(result.blocks);
        setCurrentSessionName(result.name);
        sessionModal.close();
        console.log(`[App] Session "${name}" loaded successfully`);
      }
    } catch (error) {
      console.error('[App] Load session error:', error);
      alert(`Failed to load session: ${error.message}`);
    }
  };

  const handleSaveSession = async (name) => {
    if (!name) return;
    try {
      const result = await sessionService.saveSession(name, blocks);
      
      if (result.success) {
        setCurrentSessionName(result.name);
        sessionModal.close();
        console.log(`[App] Session "${name}" saved successfully (${result.blockCount} blocks)`);
      }
    } catch (error) {
      console.error('[App] Save session error:', error);
      alert(`Failed to save session: ${error.message}`);
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
    
    if (lowerCmd === 'exit' || lowerCmd === 'quit') {
        shutdownModal.open();
        setLoading(false);
        return;
    }

    if (lowerCmd === 'save' || cmd.trim() === '/save') {
        handleSaveSession();
        setLoading(false);
        return;
    }

    if (lowerCmd.startsWith('open session') || cmd.trim().startsWith('/open session')) {
        sessionModal.open();
        setLoading(false);
        return;
    }

    if (lowerCmd.startsWith('open history') || cmd.trim().startsWith('/open history')) {
        helpModal.open();
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
             helpModal.open();
             setLoading(false);
             return;
        }

        // AI Inference Check (@, #, /ai)
        let isAgentRequest = true; // Default to AI in prompt mode unless /cmd
        
        // ... (rest of logic handles AI)
    }

    
    // COMMAND MODE - Handled by Chat Logic for consistency & AI Feedback
    // MODO COMANDO - Gerenciado pela lógica de Chat para consistência e feedback da IA
    // Falls through to PROMPT MODE LOGIC below...


    // PROMPT MODE LOGIC (Fallback for chat/AI)
    // Call backend /chat endpoint with correct payload format
    // Chamar endpoint /chat do backend com formato correto de payload
    try {
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: cmd,  // Backend expects 'prompt' not 'message'
              context: blocks.slice(-5).map(b => ({
                role: b.type === 'user' ? 'user' : 'assistant',
                content: b.content
              })),
              stream: false
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
                    
                    // Handle SHELL output block (NEW - from backend type:'shell_output')
                    if (json.type === 'shell_output') {
                        setBlocks(prev => [...prev, {
                            id: Date.now() + Math.random(), 
                            type: 'SHELL',
                            content: json.stdout,
                            command: json.command,
                            exitCode: json.exit_code,
                            result: {
                                iteration: json.iteration,
                                maxIterations: json.max_iterations
                            },
                            timestamp: new Date().toLocaleTimeString()
                        }]);
                        // CRITICAL FIX: Reset agent text accumulator so we start fresh for next AI block
                        // CRÍTICO: Reiniciar acumulador de texto para começar novo bloco de IA limpo
                        agentText = '';
                        continue; 
                    }
                    
                    // Handle AI text chunks
                    if (json.chunk) {
                        agentText += json.chunk;
                        const currentTextSnapshot = agentText; // Snapshot for closure safety
                        
                        setBlocks(prev => {
                            const lastBlock = prev[prev.length - 1];
                            
                            // If lastBlock is Agent (and not shell), update it
                            if (lastBlock && lastBlock.type === 'agent') {
                                const newBlocks = [...prev];
                                newBlocks[newBlocks.length - 1].content = currentTextSnapshot;
                                return newBlocks;
                            } 
                            
                            // If last block is NOT Agent, create NEW Agent block
                            return [...prev, {
                                id: Date.now() + 1,
                                type: 'agent',
                                content: currentTextSnapshot,
                                timestamp: new Date().toLocaleTimeString()
                            }];
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
    try {
      setBlocks(prevBlocks =>
        prevBlocks.map(b => 
          b.id === blockId ? { ...b, executing: true } : b
        )
      );

      const data = await api.post('/execute', { command: cmd });

      setBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === blockId ? {
            ...b,
            executing: false,
            executed: true,
            executionResult: data
          } : b
        )
      );

      if (data && data.output) {
        const resultBlock = {
          id: Date.now(),
          type: 'command-result',
          content: data.output,
          exitCode: data.exit_code,
          timestamp: new Date().toLocaleTimeString()
        };
        setBlocks(prev => [...prev, resultBlock]);
      }
    } catch (error) {
      console.error('[Execute] Error:', error);
      setBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === blockId ? {
            ...b,
            executing: false,
            executionError: error.message
          } : b
        )
      );
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
        const currentInput = input;
        
        api.post('/complete', {
            partial_command: currentInput,
            context: 'shell'
        })
        .then(data => {
            if (data && data.completions && data.completions.length > 0) {
                setInput(data.completions[0]);
            }
        })
        .catch(err => console.error('[Autocomplete] Error:', err));
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505]">
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 text-white relative overflow-hidden">
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

                   {/* Brain Status with AI Config */}
                   <div className="flex items-center gap-2 border-l border-[#333] pl-3" title="AI Core">
                        <div className="flex items-center gap-1.5">
                             <div className={`w-1.5 h-1.5 rounded-full ${initStatus.brain.status === 'success' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : initStatus.brain.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                             <span className={initStatus.brain.status === 'success' ? 'text-green-500' : initStatus.brain.status === 'warning' ? 'text-yellow-500' : 'text-red-500'}>
                                  Brain{initStatus.brain.status === 'warning' ? '(Standalone)' : ''}
                             </span>
                        </div>
                        {/* AI Config Button */}
                        <button
                             onClick={() => aiConfigModal.open()}
                             className="ml-1 p-0.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                             title="Configure AI Engine / Configurar Engine de IA"
                        >
                             <Cpu size={12} />
                        </button>
                   </div>
              </div>
{/* sdsad */}
              <button onClick={() => sessionModal.open()} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                  <History size={14} />
                  <span>{t('nav.history', 'History')}</span>
              </button>
              <div className="flex items-center gap-2 border-l border-[#333] pl-3 ml-2">
                   {/* Export Chat Button (debug mode only) */}
                   {systemConfig?.system?.debug_mode && (
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
                   
              {/* Services Button / Botão Serviços */}
              <button
                onClick={() => servicesModal.open()}
                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
                title={t('nav.services', 'Services')}
              >
                <Server size={14} />
                <span className="hidden sm:inline">{t('nav.services', 'Services')}</span>
              </button>
              
              {/* Workflows Button / Botão Workflows */}
              <button
                onClick={() => workflowModal.open()}
                className="flex items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors"
                title={t('nav.workflows', 'Workflows')}
              >
                 <GitBranch size={14} />
                 <span className="hidden sm:inline">{t('nav.workflows', 'Workflows')}</span>
              </button>
              
                   <button
                     onClick={() => {
                       console.log('[DEBUG] Settings button clicked');
                       console.log('[DEBUG] Current settingsModal.isOpen:', settingsModal.isOpen);
                       settingsModal.open();
                       console.log('[DEBUG] Called settingsModal.open()');
                     }}className="p-0 bg-transparent border-0 cursor-pointer flex items-center"
                     title={t('nav.settings', 'Settings')}
                   >
                     <Settings 
                       size={14} 
                       className="text-gray-400 hover:text-white transition-colors" 
                     />
                   </button>
                    <Power size={14} className="text-red-500 hover:text-red-400 cursor-pointer" onClick={shutdownModal.open} title={t('common.shutdown', 'Shutdown')} />
              </div>
          </div>
      </header>

      {/* Content Area - Split between Editor and Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Editor Panel (conditionally shown when files are open) */}
        {openFiles.length > 0 && (
          <div className="flex-1 min-w-0 border-r border-[#333]">
            <FileEditorPanel
              openFiles={openFiles}
              activeFileIndex={activeFileIndex}
              onTabChange={setActiveFileIndex}
              onClose={(index) => {
                setOpenFiles(prev => prev.filter((_, i) => i !== index));
                if (activeFileIndex >= openFiles.length - 1) {
                  setActiveFileIndex(Math.max(0, openFiles.length - 2));
                }
              }}
              onSave={async (path, content) => {
                try {
                  console.log('[FileEditor] Saving file:', path);
                  await api.post('/file/write', {
                    path: path,
                    content: content,
                    overwrite: true,
                    make_executable: false,
                    is_temp: false
                  });
                  
                  // Update saved state and content
                  setOpenFiles(prev =>
                    prev.map(f =>
                      f.path === path ? { ...f, content, saved: true, modified: false } : f
                    )
                  );
                  console.log('[FileEditor] File saved successfully');
                } catch (error) {
                  console.error('[FileEditor] Save error:', error);
                  alert('Failed to save file: ' + error.message);
                }
              }}
            />
          </div>
        )}
        
        {/* Conversation Area */}
        <div className={`flex flex-col ${openFiles.length > 0 ? 'flex-1' : 'flex-1'} min-w-0`}>
      {/* Conversation Area */}
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
                  colors={systemConfig?.ui?.custom_ansi}
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
                    onClick={() => helpModal.open()}
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border text-blue-400 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 transition-all"
                >
                    <HelpCircle size={10} />
                    <span>{t('nav.help', 'HELP')}</span>
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
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border transition-all ${aiConfig?.ai?.unlimited_iterations ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-gray-500 bg-gray-500/10 border-gray-500/20'}`}
                >
                    {aiConfig?.ai?.unlimited_iterations ? <Infinity size={10} /> : <Hash size={10} />}
                    <span>{aiConfig?.ai?.unlimited_iterations ? 'Unlimited' : `Limit: ${aiConfig?.ai?.max_iterations || 15}`}</span>
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
      </div> {/* End conversationArea flex-col */}
    </div> {/* End Content Area flex split */}      
      {/* Modals */}
      {console.log('[DEBUG] About to render SettingsModal, isOpen=', settingsModal.isOpen, 'systemConfig=', systemConfig)}
      {/*console.log('[DEBUG] SettingsModal, AI config=', aiConfig)*/}
      <SettingsModal
        isOpen={settingsModal.isOpen}
        onClose={() => {
          console.log('[DEBUG] SettingsModal onClose called');
          settingsModal.close();
        }}
        config={systemConfig}
        onSave={saveSystemConfig}
        t={t}
      />
      <SessionModal
        isOpen={sessionModal.isOpen}
        onClose={sessionModal.close}
        onLoadSession={handleLoadSession}
        onSaveSession={handleSaveSession}
        currentSessionName={currentSessionName}
      />
      <ServiceManagerModal 
        isOpen={servicesModal.isOpen}
        onClose={servicesModal.close}
      />
      <WorkflowManagerModal
        isOpen={workflowModal.isOpen}
        onClose={workflowModal.close}
      />
      <HelpModal isOpen={helpModal.isOpen} onClose={helpModal.close} />
      <AIConfigModal 
        isOpen={aiConfigModal.isOpen}
        onClose={aiConfigModal.close}
        config={aiConfig}
        onSave={handleSettingsSave}
      />
      <ShutdownModal 
        isOpen={shutdownModal.isOpen} 
        onClose={shutdownModal.close} 
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
    </div>
  );
};

export default App;
