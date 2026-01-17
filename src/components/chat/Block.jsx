import { AlertTriangle, CheckCircle, Code, Copy, Cpu, FileText, Play, Terminal } from 'lucide-react';
import { useState } from 'react';
import { parseAgentContent } from '../../utils/agentParser';
import { AnsiRenderer } from '../../utils/ansiRenderer';
import { tempFileManager } from '../../utils/tempFileManager';
import CodeBlock from './CodeBlock';

/**
 * Block Component
 * Componente de Bloco
 * 
 * Renders different types of chat blocks (User, Agent, System, Command).
 * Renderiza diferentes tipos de blocos de chat (Usuário, Agente, Sistema, Comando).
 * 
 * @component
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 */
const Block = ({ type, content, result, timestamp, onExecute, executed, onContinue, isLast, isLoading, t, colors, aiConfig }) => {
  const sections = type === 'agent' ? parseAgentContent(content) : [];
  const [editedCmd, setEditedCmd] = useState(content);

  // Limit Prompt Block / Bloco de Limite de Iteração
  if (type === 'limit_prompt') {
    return (
      <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg border-yellow-500/30">
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-[#333] border-yellow-500/20">
          <AlertTriangle size={14} className="text-yellow-500" />
          <span className="text-xs text-yellow-500 font-mono font-bold">{t('block.limit_title') || 'Iteration Limit Reached'}</span>
          <span className="text-xs text-gray-500 font-mono ml-auto">{timestamp}</span>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-300">{t('block.limit_desc') || 'Maximum iterations reached. Continue?'}</p>
          <div className="flex gap-2">
            <button onClick={() => onContinue(0)} className="px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-500 rounded hover:bg-red-900/40 text-xs font-mono">{t('block.stop') || 'Stop'}</button>
            <button onClick={() => onContinue(aiConfig?.ai?.max_iterations || 15)} className="px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-500 rounded hover:bg-green-900/40 text-xs font-mono flex items-center gap-2"><Play size={12} /> {t('block.continue_n', { n: aiConfig?.ai?.max_iterations || 15 }) || `Continue (${aiConfig?.ai?.max_iterations || 15})`}</button>
            <button onClick={() => onContinue('MAKE_SCRIPT')} className="px-4 py-2 bg-purple-900/20 border border-purple-500/30 text-purple-400 rounded hover:bg-purple-900/40 text-xs font-mono flex items-center gap-2 transition-all hover:scale-105"><FileText size={12} /> Make Script</button>
          </div>
        </div>
      </div>
    );
  }

  // Command Proposal Block / Bloco de Proposta de Comando
  if (type === 'proposal') {
    return (
      <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center justify-between px-4 py-2 bg-yellow-500/10 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-500" />
            <span className="text-xs text-yellow-500 font-mono font-bold">{t('block.proposal_title') || 'Command Proposal'}</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">{timestamp}</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-400">{t('block.proposal_desc') || 'The agent proposes the following command:'}</p>
          <textarea
            value={editedCmd}
            onChange={(e) => setEditedCmd(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded p-3 text-sm font-mono text-yellow-300 focus:outline-none focus:border-yellow-500 transition-colors"
            rows={editedCmd.split('\n').length + 1}
          />
          <div className="flex justify-end gap-2">
            {!executed ? (
              <button onClick={() => onExecute(editedCmd)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded hover:bg-yellow-500/20 transition-all font-mono text-xs"><Play size={12} /> {t('common.execute') || 'Execute'}</button>
            ) : (
              <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> {t('common.executed') || 'Executed'}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // SHELL Output Block / Bloco de Saída SHELL
  if (type === 'SHELL') {
    return (
      <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-green-500/20 overflow-hidden shadow-lg">
        {/* Header with command / Cabeçalho com comando */}
        <div className="flex items-center justify-between px-4 py-2 bg-green-500/5 border-b border-green-500/10">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-green-500" />
            <span className="text-xs text-green-400 font-mono">Shell Output</span>
          </div>
          <span className="text-xs text-gray-500 font-mono">{timestamp}</span>
        </div>

        {/* Terminal output content / Conteúdo da saída do terminal */}
        <div className="p-4 bg-black/30 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
          <AnsiRenderer text={content} colors={colors} />
        </div>

        {/* Discrete footer with iteration badge / Rodapé discreto com badge de iteração */}
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

  // Regular Chat Block (User/Agent) / Bloco de Chat Regular (Usuário/Agente)
  return (
    <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg transition-all hover:border-[#00ff00]/30 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
        <div className="flex items-center gap-2">
          {type === 'user' ? <Terminal size={14} className="text-[#00ff00]" /> : <Cpu size={14} className="text-cyan-400" />}
          <span className="text-xs text-gray-400 font-mono">{timestamp}</span>
        </div>
        {type === 'agent' && <div className="text-[10px] text-cyan-400 border border-cyan-400/20 px-1 rounded">{t('block.hexagent') || 'HexAgent'}</div>}
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
                    <button onClick={() => navigator.clipboard.writeText(section.content)} className="flex items-center gap-1 p-1 hover:bg-[#222] text-gray-400 rounded transition-colors text-[10px]" title={t('common.copy_text') || 'Copy Text'}><Copy size={12} /> {t('common.copy') || 'Copy'}</button>
                  </div>
                </div>
              );
            } else if (section.type === 'command') {
              return (
                <div key={idx} className="group relative flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  <Code size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-300 font-semibold">{section.content}</span>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-[#0a0a0a]/80 backdrop-blur rounded p-1 border border-gray-800">
                    <button onClick={() => navigator.clipboard.writeText(section.content)} className="flex items-center gap-1 p-1 hover:bg-[#222] text-gray-400 rounded transition-colors text-[10px]" title={t('common.copy_command') || 'Copy Command'}><Copy size={12} /> {t('common.copy') || 'Copy'}</button>
                    <button onClick={() => onExecute(section.content)} className="flex items-center gap-1 p-1 hover:bg-[#222] text-green-400 rounded transition-colors text-[10px]" title={t('common.execute') || 'Execute'}>
                      {executed ? <div className="animate-spin h-3 w-3 border-2 border-green-500 rounded-full border-t-transparent"></div> : <Play size={12} />} {t('common.execute') || 'Execute'}
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
                <CodeBlock
                  key={idx}
                  code={section.content}
                  language={section.language}
                  onExecute={onExecute}
                  colors={colors}
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

export default Block;
