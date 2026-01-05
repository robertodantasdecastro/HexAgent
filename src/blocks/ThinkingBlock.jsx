/**
 * ThinkingBlock - AI thinking process renderer
 * Displays AI's internal reasoning/thinking
 * 
 * ThinkingBlock - Renderizador de processo de pensamento da IA
 * Exibe raciocínio/pensamento interno da IA
 */

import { Brain } from 'lucide-react';

/**
 * ThinkingBlock Component
 * Renders AI thinking process with purple theme
 * 
 * Componente ThinkingBlock
 * Renderiza processo de pensamento da IA com tema roxo
 * 
 * Props:
 * - content: string - Thinking content / Conteúdo do pensamento
 * - collapsed: boolean - Initial collapse state / Estado inicial de colapso
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered thinking block
 */
export default function ThinkingBlock({ 
  content,
  collapsed = false
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  return (
    <div className="thinking-block mt-2 p-3 bg-purple-900/10 rounded-lg border border-purple-500/20">
      {/* Thinking header with toggle */}
      {/* Cabeçalho de pensamento com alternância */}
      <div 
        className="flex items-center gap-2 mb-2 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Brain size={14} className="text-purple-400" />
        <span className="text-xs text-purple-400 font-mono">Thinking:</span>
        <span className="text-xs text-gray-500 ml-auto">
          {isCollapsed ? '▶' : '▼'}
        </span>
      </div>

      {/* Thinking content (collapsible) */}
      {/* Conteúdo do pensamento (colapsável) */}
      {!isCollapsed && (
        <div className="text-sm text-purple-300 leading-relaxed whitespace-pre-wrap italic">
          {content}
        </div>
      )}
    </div>
  );
}
