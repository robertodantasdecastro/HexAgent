import AnalysisBlock from '../../blocks/AnalysisBlock';
import CommandOutputBlock from '../../blocks/CommandOutputBlock';
import SuggestionBlock from '../../blocks/SuggestionBlock';
import { BlockType } from '../../constants/BlockTypes';
import { CommandProposal } from '../CommandProposal';
import TerminalBlock from './blocks/TerminalBlock';
import TextBlock from './blocks/TextBlock';

const BlockRenderer = ({ block }) => {
  if (!block) return null;

  const { type, content, metadata, onExecute } = block;

  switch (type) {
    case BlockType.THINKING:
    case 'thinking':
      // return <ThinkingBlock content={content} />;
      return null;
    
    case 'text':
    case 'agent':
    case BlockType.NARRATIVE:
    case 'narrative':
      return <TextBlock content={content} />;
      
    case BlockType.SHELL:
    case 'shell':
    case 'block_start': // Legacy support
      if (content === 'shell' || type === BlockType.SHELL) {
        const cmd = metadata?.command || content || '...';
        const isExecuting = metadata?.status === 'proposal' ? false : true;
        return <TerminalBlock command={cmd} isExecuting={isExecuting} onExecute={onExecute} />;
      }
      return null;

    case BlockType.COMMAND_OUTPUT:
    case 'command_output':
      return <CommandOutputBlock content={content} />;

    case BlockType.ANALYSIS:
    case 'analysis':
      return <AnalysisBlock content={content} />;

    case BlockType.SUGGESTION:
    case 'suggestion':
       return (
         <SuggestionBlock 
            content={content} 
            onExecute={(action) => console.log('Suggestion clicked:', action)} 
         />
       );

    case 'block_end':
       return null;

    // Legacy block types from old sessions / Tipos legados de sessões antigas
    case 'system':
      return <TextBlock content={content} />;
    case 'ai_response':
      return <TextBlock content={content} />;

    case 'tool_call':
    case 'command_proposal':
       if (block.status === 'proposal') {
           // Provide an explicit mapping to execute by sending the command to manualExecute
           const handleApprove = () => {
               if (type === 'tool_call') {
                   const payload = {
                       name: metadata?.tool_name || content,
                       arguments: metadata?.arguments || {}
                   };
                   onExecute(`MCP_TOOL_CALL|${JSON.stringify(payload)}`);
               } else {
                   onExecute(metadata?.command || content);
               }
           };

           return (
             <CommandProposal 
                command={metadata?.command || content} 
                metadata={metadata} 
                onApprove={handleApprove} 
                onReject={() => console.log('Rejected by user')}
             />
           );
       } else {
           // Render as a completed terminal block with output
           return (
             <TerminalBlock 
                command={metadata?.command || 'unknown'} 
                output={content} 
                exitCode={metadata?.exit_code} 
                isExecuting={block.status === 'active'} 
             />
           );
       }

    case 'command_result':
       // For results, we render a complete terminal block
       // Note: ideally we would merge this with the proposal, but for now standalone is fine
       return (
         <TerminalBlock 
            command={metadata?.command || 'unknown'} 
            output={content} 
            exitCode={metadata?.exit_code} 
            isExecuting={false} 
         />
       );

    default:
      console.warn(`BlockRenderer: Unknown block type '${type}'`, block);
      return null;
  }
};

export default BlockRenderer;
