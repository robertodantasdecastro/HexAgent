import InputBlock from '../../blocks/InputBlock';
import { BlockType } from '../../hooks/useBlockManager';
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
        <InputBlock 
            initialContent={props.content} 
            status={props.status || 'frozen'} 
            onEdit={() => props.onFork && props.onFork(props.id)} // Trigger fork
            onAbort={props.onAbort} 
            blockId={props.id}
        />
      );
  }
  
  // For error, we can still use simple render or map to BlockRenderer if we implement ErrorBlock there
  if (type === BlockType.ERROR) {
      return (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/50 text-red-200 font-mono text-sm shadow-lg my-2">
             <div className="flex items-center gap-2 mb-1">
                <span className="text-red-500">❌</span>
                <strong className="uppercase tracking-wider text-xs">System Error</strong>
             </div>
             {props.content || props.error}
          </div>
      );
  }

  // Delegate everything else to BlockRenderer
  // We construct the 'block' object expected by BlockRenderer
  const blockData = {
      type: type === 'narrative' ? 'text' : type, // Map native types if needed
      content: props.content,
      metadata: props.metadata || rest
  };

  return <BlockRenderer block={blockData} />;
};

export default Block;
