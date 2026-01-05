/**
 * Block Rendering Helper
 * Maps block types to React components
 * 
 * Auxiliar de Renderização de Blocos
 * Mapeia tipos de bloco para componentes React
 */

import { Copy } from 'lucide-react';
import { AnsiRenderer } from './ansiRenderer';
import { BlockTypes } from './blockRenderer';

/**
 * Render a single block based on its type
 * Renderiza um único bloco baseado em seu tipo
 * 
 * @param {Object} block - Block object with type and content
 * @param {number} idx - Block index
 * @param {Object} helpers - Helper functions and data (onExecute, colors, t, temp FileManager, SmartBlock)
 */
export function renderBlock(block, idx, helpers) {
  const { onExecute, colors, t, tempFileManager, SmartBlock } = helpers;

  switch (block.type) {
    // AI Text - Regular response / Texto da IA - Resposta regular
    case BlockTypes.AI_TEXT:
      return (
        <div key={idx} className="text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
          {block.content}
        </div>
      );

    // Code Block - Syntax highlighted code / Bloco de Código - Código com destaque de sintaxe
    case BlockTypes.CODE:
      return (
        <SmartBlock
          key={idx}
          content={block.content}
          metadata={{ language: block.language, type: 'code' }}
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

    // Output Block - Command output with ANSI support / Bloco de Saída - Saída de comando com suporte ANSI
    case BlockTypes.OUTPUT:
      return (
        <div key={idx} className="mt-2 p-3 bg-black/30 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-mono">Output:</span>
            <button
              onClick={() => navigator.clipboard.writeText(block.content)}
              className="px-2 py-0.5 text-[10px] rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition flex items-center gap-1"
              title="Copy output"
            >
              <Copy size={10} />
              Copy
            </button>
          </div>
          <div className="font-mono text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            <AnsiRenderer text={block.content} customColors={colors?.custom_ansi} />
          </div>
        </div>
      );

    // Error Block - Error messages / Bloco de Erro - Mensagens de erro
    case BlockTypes.ERROR:
      return (
        <div key={idx} className="mt-2 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
          <div className="text-xs text-red-400 font-mono mb-1">Error:</div>
          <div className="font-mono text-sm text-red-300 leading-relaxed whitespace-pre-wrap">
            {block.content}
          </div>
        </div>
      );

    // Thinking Block - AI thought process / Bloco de Pensamento - Processo de pensamento da IA
    case BlockTypes.THINKING:
      return (
        <div key={idx} className="mt-2 p-3 bg-purple-900/10 rounded-lg border border-purple-500/20">
          <div className="text-xs text-purple-400 font-mono mb-1">Thinking:</div>
          <div className="text-sm text-purple-300 leading-relaxed whitespace-pre-wrap italic">
            {block.content}
          </div>
        </div>
      );

    // Default fallback / Padrão de retorno
    default:
      return (
        <div key={idx} className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {block.content}
        </div>
      );
  }
}
