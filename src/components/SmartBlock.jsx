/**
 * SmartBlock Component
 * Intelligent block rendering with context-aware buttons and styling
 * 
 * Componente de Bloco Inteligente
 * Renderização inteligente com botões sensive ao contexto
 */

import { ChevronDown, ChevronUp, Copy, Download, Edit, FileText, Play, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AnsiRenderer } from '../utils/ansiRenderer';
import { BlockType, detectBlockType, getBlockTypeName } from '../utils/blockTypeDetector';

const SmartBlock = ({ 
  content, 
  metadata = {}, 
  onAction,
  autoExecuteEnabled = false 
}) => {
  const [blockInfo, setBlockInfo] = useState(null);
  const [rules, setRules] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const detected = detectBlockType(content, metadata);
    setBlockInfo(detected);
    
    // Load block rules from config (fallback to defaults)
    loadBlockRules(detected.type).then(setRules);
  }, [content]);
  
  useEffect(() => {
    if (blockInfo?.type === BlockType.THINKING && rules?.collapsed_by_default) {
      setCollapsed(true);
    }
  }, [blockInfo, rules]);
  
  const loadBlockRules = async (blockType) => {
    try {
      const response = await fetch('http://localhost:5000/config/user/ui/block_rules');
      if (response.ok) {
        const config = await response.json();
        return config.block_types?.[blockType] || getDefaultRules(blockType);
      }
    } catch (error) {
      console.warn('[SmartBlock] Failed to load rules, using defaults:', error);
    }
    return getDefaultRules(blockType);
  };
  
  const getDefaultRules = (blockType) => {
    const defaults = {
      text: { actions: ['copy', 'save'], syntax_highlight: false },
      code: { actions: ['copy', 'save', 'edit'], syntax_highlight: true },
      shell: { actions: ['copy', 'execute', 'save'], syntax_highlight: true, auto_execute_hides_button: true },
      thinking: { actions: [], syntax_highlight: false, collapsed_by_default: true, opacity: 0.6, font_size: '0.7rem' },
      log: { actions: ['copy', 'save'], syntax_highlight: false },
      readme: { actions: ['copy', 'save'], syntax_highlight: true },
      error: { actions: ['copy', 'save'], syntax_highlight: false }
    };
    return defaults[blockType] || defaults.text;
  };
  
  if (!blockInfo || !rules) {
    return (
      <div className="animate-pulse bg-gray-800/20 rounded-lg p-4 my-3">
        <div className="h-4 bg-gray-700/30 rounded w-3/4"></div>
      </div>
    );
  }
  
  const getBlockClassName = () => {
    const base = 'rounded-lg p-4 my-3 border transition-all duration-200';
    
    const typeStyles = {
      thinking: 'bg-gray-900/10 border-gray-700/20 opacity-60',
      shell: 'bg-black/40 border-cyan-500/20',
      log: 'bg-gray-900/30 border-gray-600/10',
      code: 'bg-black/50 border-purple-500/20',
      error: 'bg-red-900/10 border-red-500/30',
      readme: 'bg-blue-900/10 border-blue-500/20',
      text: 'bg-gray-900/5 border-gray-700/10'
    };
    
    return `${base} ${typeStyles[blockInfo.type] || typeStyles.text}`;
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[SmartBlock] Copy failed:', error);
    }
  };
  
  const getActionButtons = () => {
    if (!rules.actions || rules.actions.length === 0) return null;
    
    let actions = [...rules.actions];
    
    // Hide execute button if auto_execute is enabled
    if (autoExecuteEnabled && rules.auto_execute_hides_button) {
      actions = actions.filter(a => a !== 'execute');
    }
    
    if (actions.length === 0) return null;
    
    const iconMap = {
      copy: Copy,
      save: Save,
      edit: Edit,
      execute: Play,
      download: Download
    };
    
    const labelMap = {
      copy: 'Copiar',
      save: 'Salvar',
      edit: 'Editar',
      execute: 'Executar',
      download: 'Download'
    };
    
    return (
      <div className="flex gap-1 items-center">
        {actions.map(action => {
          const Icon = iconMap[action];
          const label = labelMap[action];
          
          if (action === 'copy') {
            return (
              <button
                key={action}
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
                title={copied ? 'Copiado!' : label}
              >
                {copied ? <span className="text-green-500 text-xs">✓</span> : <Icon size={14} />}
              </button>
            );
          }
          
          return (
            <button
              key={action}
              onClick={() => onAction?.(action, content, blockInfo)}
              className="p-1.5 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
              title={label}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    );
  };
  
  // Thinking block: collapsible and discrete
  if (blockInfo.type === BlockType.THINKING) {
    return (
      <details 
        className={getBlockClassName()}
        open={!collapsed}
        style={{ fontSize: rules.font_size || '0.7rem' }}
      >
        <summary className="cursor-pointer flex items-center gap-2 text-gray-500 hover:text-gray-400 select-none">
          {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <span className="text-xs font-mono">⚙️ AI está processando...</span>
        </summary>
        <div className="mt-2 pl-4 text-gray-600 text-xs border-l-2 border-gray-700">
          {content}
        </div>
      </details>
    );
  }
  
  // Regular blocks
  return (
    <div className={getBlockClassName()}>
      {/* Header with type and actions */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-gray-500" />
          <span className="text-xs text-gray-500 font-mono">
            {getBlockTypeName(blockInfo.type)}
            {blockInfo.language && ` (${blockInfo.language})`}
          </span>
          {blockInfo.confidence && (
            <span className="text-[10px] text-gray-600">
              {Math.round(blockInfo.confidence * 100)}%
            </span>
          )}
        </div>
        {getActionButtons()}
      </div>
      
      {/* Content */}
      <div className="overflow-x-auto">
        {rules.syntax_highlight && blockInfo.language && blockInfo.type === BlockType.CODE ? (
          <SyntaxHighlighter
            language={blockInfo.language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              background: 'rgba(0, 0, 0, 0.3)'
            }}
            showLineNumbers={true}
          >
            {content}
          </SyntaxHighlighter>
        ) : (blockInfo.type === BlockType.LOG || 
            blockInfo.type === BlockType.SHELL ||
            metadata.type === 'output' ||
            hasAnsiCodes(content)) ? (
          <div className="p-3 bg-black/30 rounded font-mono text-sm text-gray-200 leading-relaxed overflow-x-auto">
            <AnsiRenderer text={content} />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-200 leading-relaxed">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
};

export default SmartBlock;
