/**
 * OutputBlock - Command output renderer with ANSI support
 * Displays terminal output with proper color rendering
 * 
 * OutputBlock - Renderizador de saída de comando com suporte ANSI
 * Exibe saída de terminal com renderização correta de cores
 */

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { AnsiRenderer } from '../utils/ansiRenderer';

/**
 * OutputBlock Component
 * 
 * Props:
 * - content: string - Output text with ANSI codes / Texto de saída com códigos ANSI
 * - customColors: object - Custom color palette / Paleta de cores personalizada
 * - showCopy: boolean - Show copy button / Mostrar botão copiar
 * - title: string - Block title / Título do bloco
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered output block
 */
export default function OutputBlock({ 
  content, 
  customColors = {},
  showCopy = true,
  title = 'Output'
}) {
  const [copied, setCopied] = useState(false);

  /**
   * Handle copy to clipboard
   * Gerenciar cópia para área de transferência
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="output-block mt-2 p-3 bg-black/30 rounded-lg border border-gray-700">
      {/* Header with title and copy button */}
      {/* Cabeçalho com título e botão copiar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-mono">{title}:</span>
        
        {showCopy && (
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 text-[10px] rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 transition flex items-center gap-1"
            title="Copy output / Copiar saída"
          >
            <Copy size={10} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* Content with ANSI rendering */}
      {/* Conteúdo com renderização ANSI */}
      <div className="font-mono text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
        <AnsiRenderer text={content} customColors={customColors} />
      </div>
    </div>
  );
}
