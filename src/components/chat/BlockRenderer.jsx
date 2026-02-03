import TerminalBlock from './blocks/TerminalBlock';
import TextBlock from './blocks/TextBlock';
import ThinkingBlock from './blocks/ThinkingBlock';

const BlockRenderer = ({ block }) => {
  if (!block) return null;

  const { type, content, metadata } = block;

  switch (type) {
    case 'thinking':
      return <ThinkingBlock content={content} />;
    
    case 'text':
      return <TextBlock content={content} />;
      
    case 'block_start':
      if (content === 'shell') {
        const cmd = metadata.command || '...';
        return <TerminalBlock command={cmd} isExecuting={true} />;
      }
      return null;

    case 'block_end':
       return null;

    case 'command_proposal':
       // Render as a pending terminal block (no output yet)
       return <TerminalBlock command={content} isExecuting={false} autoExecute={metadata.auto_execute} />;

    case 'command_result':
       // For results, we render a complete terminal block
       // Note: ideally we would merge this with the proposal, but for now standalone is fine
       return (
         <TerminalBlock 
            command={metadata.command || 'unknown'} 
            output={content} 
            exitCode={metadata.exit_code} 
            isExecuting={false} 
         />
       );

    default:
      console.warn(`BlockRenderer: Unknown block type '${type}'`, block);
      return null;
  }
};

export default BlockRenderer;
