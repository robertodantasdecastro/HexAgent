import InputBlock from '../../blocks/InputBlock';
import NarrativeBlock from '../../blocks/NarrativeBlock';
import ShellBlock from '../../blocks/ShellBlock';
import ThinkingBlock from '../../blocks/ThinkingBlock';
import { BlockType } from '../../hooks/useBlockManager';

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

  switch (type) {
    case BlockType.INPUT:
    case 'user': // Legacy support
      return (
        <InputBlock 
            initialContent={props.content} 
            status={props.status || 'frozen'} 
            onEdit={() => console.log('Edit requested (Simulated)')}
            onAbort={props.onAbort} // Pass abort handler if available
        />
      );

    case BlockType.THINKING:
      return <ThinkingBlock {...rest} />;

    case BlockType.SHELL:
    case 'SHELL': // Legacy support
      return <ShellBlock {...rest} />;

    case BlockType.NARRATIVE:
    case 'agent': // Legacy support
      return <NarrativeBlock type="assistant" {...rest} />;
    
    case BlockType.ERROR:
      return (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/50 text-red-200 font-mono text-sm">
             ❌ <strong>Error:</strong> {props.content}
          </div>
      );

    default:
      console.warn(`Unknown block type: ${type}`);
      return <NarrativeBlock type="assistant" {...rest} />;
  }
};

export default Block;
