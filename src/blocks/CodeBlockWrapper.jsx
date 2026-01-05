/**
 * CodeBlockWrapper - Code snippet renderer with SmartBlock
 * Wraps SmartBlock for code display with syntax highlighting
 * 
 * CodeBlockWrapper - Renderizador de trechos de código com SmartBlock
 * Envolve SmartBlock para exibição de código com destaque de sintaxe
 */

import SmartBlock from '../components/SmartBlock';

/**
 * CodeBlockWrapper Component
 * Renders code with SmartBlock for syntax highlighting and actions
 * 
 * Componente CodeBlockWrapper
 * Renderiza código com SmartBlock para destaque de sintaxe e ações
 * 
 * Props:
 * - content: string - Code content / Conteúdo do código
 * - language: string - Programming language / Linguagem de programação
 * - onExecute: function - Execute callback / Callback de execução
 * - onSave: function - Save callback / Callback de salvamento
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered code block
 */
export default function CodeBlockWrapper({ 
  content, 
  language = 'plaintext',
  onExecute,
  onSave
}) {
  /**
   * Handle block actions (execute, save, etc.)
   * Gerenciar ações do bloco (executar, salvar, etc.)
   */
  const handleAction = (action, blockContent, blockInfo) => {
    switch (action) {
      case 'execute':
        if (onExecute) {
          onExecute(blockContent, blockInfo.language);
        }
        break;
      
      case 'save':
        if (onSave) {
          onSave(blockContent, blockInfo.language);
        }
        break;
      
      default:
        console.log(`[CodeBlockWrapper] Unhandled action: ${action}`);
    }
  };

  return (
    <div className="code-block-wrapper">
      <SmartBlock
        content={content}
        metadata={{ 
          language, 
          type: 'code' 
        }}
        autoExecuteEnabled={false}
        onAction={handleAction}
      />
    </div>
  );
}
