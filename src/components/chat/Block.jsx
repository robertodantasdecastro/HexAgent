import ThinkingBlock from '../../blocks/ThinkingBlock';
import UserBlock from '../../blocks/UserBlock';
import { BlockType } from '../../constants/BlockTypes';
import { SlideTransition } from '../SimpleTransition';
import BlockRenderer from './BlockRenderer'; // Use the renderer

/**
 * Block Dispatcher Component
 * Componente Despachante de Blocos
 * 
 * Routes block data to the specific visualization component.
 * Roteia dados do bloco para o componente de visualização específico.
 * 
 * @author Roberto Dantas de Castro
 */
const Block = (props) => {
  const { type, ...rest} = props;

  // Render USER block (visual user message)
  // Renderiza bloco USER (mensagem visual do usuário)
  if (type === BlockType.USER || type === 'user') {
    return (
      <SlideTransition show={true} direction="left" duration={300}>
        <UserBlock
          content={props.content}
          timestamp={props.timestamp}
          onEdit={(newContent) => console.log('Edit:', newContent)}
          onReexecute={(content) => console.log('Re-execute:', content)}
        />
      </SlideTransition>
    );
  }

  // INPUT block should NOT be rendered (context only  - hidden prop set in useChatManager)
  // Bloco INPUT NÃO deve ser renderizado (contexto apenas - prop hidden definida em useChatManager)
  if (type === BlockType.INPUT || type === 'input') {
    return null; // Skip rendering
  }

  // Handling for THINKING (AI Thought Process)
  if (type === BlockType.THINKING || type === 'thinking') {
      return (
          <ThinkingBlock 
              content={props.content} 
              iteration={props.iteration}
              isExpanded={true}
          />
      );
  }
  
  // For error, we can still use simple render or map to BlockRenderer if we implement ErrorBlock there
  // For error
  if (type === BlockType.ERROR) {
      return (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/50 text-red-200 font-mono text-sm shadow-lg my-2 glass-panel animate-in fade-in zoom-in-95 duration-300">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-red-500">❌</span>
                <strong className="uppercase tracking-wider text-xs">System Error</strong>
             </div>
             {props.content || props.error}
          </div>
      );
  }

  // Delegate everything else to BlockRenderer
  const blockData = {
      type: type === 'narrative' ? 'text' : type,
      content: props.content,
      metadata: props.metadata || rest,
      onExecute: props.onExecute
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <BlockRenderer block={blockData} />
    </div>
  );
};

export default Block;
