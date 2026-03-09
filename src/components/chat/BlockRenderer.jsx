import AnalysisBlock from '../../blocks/AnalysisBlock';
import CommandOutputBlock from '../../blocks/CommandOutputBlock';
import ShellBlock from '../../blocks/ShellBlock';
import SuggestionBlock from '../../blocks/SuggestionBlock';
import { BlockType } from '../../constants/BlockTypes';
import { CommandProposal } from '../CommandProposal';
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
      if (content === 'shell' || type === BlockType.SHELL || type === 'shell') {
        const outputText = (content && content !== 'shell') ? content : '';
        
        let blockStatus = block.status;
        if (blockStatus === 'frozen') {
             blockStatus = metadata?.status || 'done'; 
        }
        
        // Correct behavior: If it has output text, but still claims 'proposal' or 'active', and actually has an exit code, it's done.
        if (blockStatus === 'active' && metadata?.exit_code !== undefined) {
             blockStatus = 'done';
        }
        
        if ((blockStatus === 'active' || metadata?.status === 'proposal') && !outputText) {
            blockStatus = 'active';
        }
        
        return (
          <ShellBlock 
            content={outputText}
            metadata={metadata}
            status={blockStatus}
          />
        );
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
           // Se auto_execute é true, o backend emitirá um LifecycleBlock("shell") em seguida, 
           // tornando este bloco de proposal um 'fantasma' duplicado após ser fechado.
           if (metadata?.auto_execute) {
               return null;
           }

           // Render as a completed shell block with output
           return (
             <ShellBlock 
                content={content || ''}
                metadata={metadata}
                status={block.status}
             />
           );
       }

    case 'command_result':
       // For results, we render a complete shell block
       return (
         <ShellBlock 
            content={content || ''}
            metadata={metadata}
            status="done"
         />
       );

    default:
      console.warn(`BlockRenderer: Unknown block type '${type}'`, block);
      return null;
  }
};

export default BlockRenderer;
