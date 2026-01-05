/**
 * BlockRenderer - Main block rendering orchestrator
 * Routes blocks to appropriate components based on type
 * 
 * BlockRenderer - Orquestrador principal de renderização de blocos
 * Roteia blocos para componentes apropriados baseado no tipo
 */

import { BlockTypes } from '../utils/blockRenderer';
import AITextBlock from './AITextBlock';
import CodeBlockWrapper from './CodeBlockWrapper';
import ErrorBlock from './ErrorBlock';
import OutputBlock from './OutputBlock';
import ThinkingBlock from './ThinkingBlock';

/**
 * BlockRenderer Component
 * Main orchestrator that renders blocks based on their type
 * 
 * Componente BlockRenderer
 * Orquestrador principal que renderiza blocos baseado em seu tipo
 * 
 * Props:
 * - block: object - Block data with type and content / Dados do bloco com tipo e conteúdo
 * - index: number - Block index for React key / Índice do bloco para chave React
 * - helpers: object - Helper functions (onExecute, onSave, colors, etc.)
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered block component
 */
export default function BlockRenderer({ block, index, helpers = {} }) {
  const {
    onExecute,
    onSave,
    colors,
    tempFileManager
  } = helpers;

  /**
   * Route block to appropriate component
   * Rotear bloco para componente apropriado
   */
  switch (block.type) {
    // AI Text - Regular AI response
    // Texto IA - Resposta regular da IA
    case BlockTypes.AI_TEXT:
      return <AITextBlock key={index} content={block.content} />;

    // Code - Syntax highlighted code
    // Código - Código com destaque de sintaxe
    case BlockTypes.CODE:
      return (
        <CodeBlockWrapper
          key={index}
          content={block.content}
          language={block.language || 'plaintext'}
          onExecute={onExecute}
          onSave={(content, lang) => {
            if (tempFileManager) {
              tempFileManager.trackFile(`script_${Date.now()}.${lang}`, content);
            }
            if (onSave) {
              onSave(content, lang);
            }
          }}
        />
      );

    // Output - Command output with ANSI colors
    // Saída - Saída de comando com cores ANSI
    case BlockTypes.OUTPUT:
      return (
        <OutputBlock
          key={index}
          content={block.content}
          customColors={colors?.custom_ansi}
          title="Output"
        />
      );

    // Error - Error messages
    // Erro - Mensagens de erro
    case BlockTypes.ERROR:
      return (
        <ErrorBlock
          key={index}
          content={block.content}
          title="Error"
        />
      );

    // Thinking - AI reasoning process
    // Pensamento - Processo de raciocínio da IA
    case BlockTypes.THINKING:
      return (
        <ThinkingBlock
          key={index}
          content={block.content}
          collapsed={false}
        />
      );

    // Default fallback - render as text
    // Padrão - renderizar como texto
    default:
      console.warn(`[BlockRenderer] Unknown block type: ${block.type}`);
      return <AITextBlock key={index} content={block.content} />;
  }
}

/**
 * Render multiple blocks
 * Renderizar múltiplos blocos
 * 
 * @param {Array} blocks - Array of block objects / Array de objetos de bloco
 * @param {Object} helpers - Helper functions and data
 * @returns {Array} Array of rendered components
 */
export function renderBlocks(blocks, helpers) {
  if (!blocks || !Array.isArray(blocks)) {
    return [];
  }

  return blocks.map((block, index) => (
    <BlockRenderer
      key={index}
      block={block}
      index={index}
      helpers={helpers}
    />
  ));
}
