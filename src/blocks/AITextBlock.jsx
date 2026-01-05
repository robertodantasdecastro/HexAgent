/**
 * AITextBlock - AI response text renderer
 * Displays regular AI text responses
 * 
 * AITextBlock - Renderizador de texto de resposta da IA
 * Exibe respostas de texto regulares da IA
 */

/**
 * AITextBlock Component
 * Simple text renderer for AI responses
 * 
 * Componente AITextBlock
 * Renderizador simples de texto para respostas da IA
 * 
 * Props:
 * - content: string - Text content / Conteúdo de texto
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered text block
 */
export default function AITextBlock({ content }) {
  return (
    <div className="ai-text-block text-gray-200 leading-relaxed break-words whitespace-pre-wrap">
      {content}
    </div>
  );
}
