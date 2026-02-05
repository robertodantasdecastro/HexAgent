import InputBlock from '../../blocks/InputBlock';
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
  const { type, ...rest } = props;

  // Special handling for INPUT (User messages)
  if (type === BlockType.INPUT || type === 'user') {
       return (
        <SlideTransition show={true} direction="left" duration={300}>
            <InputBlock 
                initialContent={props.content} 
                status={props.status || 'frozen'} 
                onEdit={() => props.onFork && props.onFork(props.id)} // Trigger fork
                onAbort={props.onAbort} 
                blockId={props.id}
            />
        </SlideTransition>
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
      metadata: props.metadata || rest
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <BlockRenderer block={blockData} />
    </div>
  );
};

export default Block;
