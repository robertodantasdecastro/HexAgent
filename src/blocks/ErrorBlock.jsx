/**
 * ErrorBlock - Error message renderer
 * Displays error messages with appropriate styling
 * 
 * ErrorBlock - Renderizador de mensagens de erro
 * Exibe mensagens de erro com estilização apropriada
 */

import { AlertTriangle } from 'lucide-react';

/**
 * ErrorBlock Component
 * Renders error messages with red theme and icon
 * 
 * Componente ErrorBlock
 * Renderiza mensagens de erro com tema vermelho e ícone
 * 
 * Props:
 * - content: string - Error message / Mensagem de erro
 * - title: string - Error title / Título do erro
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered error block
 */
export default function ErrorBlock({ 
  content,
  title = 'Error'
}) {
  return (
    <div className="error-block mt-2 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
      {/* Error header with icon */}
      {/* Cabeçalho de erro com ícone */}
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={14} className="text-red-400" />
        <span className="text-xs text-red-400 font-mono font-bold">{title}:</span>
      </div>

      {/* Error content */}
      {/* Conteúdo do erro */}
      <div className="font-mono text-sm text-red-300 leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
