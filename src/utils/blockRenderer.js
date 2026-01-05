/**
 * Block Renderer Utility
 * Comprehensive block detection and parsing system
 * 
 * Utilidade de Renderização de Blocos
 * Sistema abrangente de detecção e análise de blocos
 */

// Block types with their characteristics
// Tipos de blocos com suas características
export const BlockTypes = {
  AI_TEXT: 'ai_text',           // Regular AI response / Resposta regular da IA
  COMMAND: 'command',           // Shell command / Comando de shell
  CODE: 'code',                 // Code snippet / Trecho de código
  OUTPUT: 'output',             // Command output / Saída de comando
  ERROR: 'error',               // Error message / Mensagem de erro
  THINKING: 'thinking'          // AI thinking process / Processo de pensamento da IA
};

/**
 * Parse content into structured blocks
 * Analisa conteúdo em blocos estruturados
 * 
 * @param {string} content - Raw content to parse / Conteúdo bruto para analisar
 * @param {string} type - Message type ('agent' or 'user') / Tipo de mensagem
 * @returns {Array} Array of block objects / Array de objetos de bloco
 */
export function parseContentIntoBlocks(content, type = 'agent') {
  if (!content || typeof content !== 'string') {
    return [];
  }

  // User messages are always simple text
  // Mensagens de usuário são sempre texto simples
  if (type === 'user') {
    return [{ type: BlockTypes.AI_TEXT, content }];
  }

  const blocks = [];
  
  // Step 1: Extract code blocks (highest priority)
  // Passo 1: Extrair blocos de código (maior prioridade)
  const codeBlockPattern = /```(\w+)?\n([\s\S]*?)\n```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockPattern.exec(content)) !== null) {
    // Text before code block / Texto antes do bloco de código
    if (match.index > lastIndex) {
      parts.push({
        text: content.substring(lastIndex, match.index),
        isCode: false
      });
    }

    // Code block / Bloco de código
    parts.push({
      text: match[2],
      isCode: true,
      language: match[1] || 'plaintext'
    });

    lastIndex = match.index + match[0].length;
  }

  // Remaining text / Texto restante
  if (lastIndex < content.length) {
    parts.push({
      text: content.substring(lastIndex),
      isCode: false
    });
  }

  // Step 2: Process each part and detect block types
  // Passo 2: Processar cada parte e detectar tipos de bloco
  for (const part of parts) {
    if (part.isCode) {
      // Code blocks are straightforward
      // Blocos de código são diretos
      blocks.push({
        type: BlockTypes.CODE,
        content: part.text,
        language: part.language
      });
    } else {
      // Analyze text parts for special patterns
      // Analisar partes de texto para padrões especiais
      const textBlocks = analyzeTextPart(part.text);
      blocks.push(...textBlocks);
    }
  }

  return blocks.length > 0 ? blocks : [{ type: BlockTypes.AI_TEXT, content }];
}

/**
 * Analyze text part and detect special block types
 * Analisa parte de texto e detecta tipos especiais de bloco
 */
function analyzeTextPart(text) {
  if (!text || !text.trim()) {
    return [];
  }

  const blocks = [];
  const lines = text.split('\n');
  let currentBlock = null;
  let blockContent = [];

  for (const line of lines) {
    const trimmed = line.trim();

    //Check for output markers / Verificar marcadores de output
    if (trimmed.match(/^\[output\]:?/i) || 
        trimmed.match(/^command executed/i) ||
        trimmed.match(/^executado:/i)) {
      
      // Flush current block / Descarregar bloco atual
      if (currentBlock) {
        blocks.push({
          type: currentBlock,
          content: blockContent.join('\n').trim()
        });
      }

      currentBlock = BlockTypes.OUTPUT;
      blockContent = [];
      continue;
    }

    // Check for thinking markers / Verificar marcadores de pensamento
    if (trimmed.match(/^\[thinking\]:?/i) ||
        trimmed.match(/^pensando:/i)) {
      
      if (currentBlock) {
        blocks.push({
          type: currentBlock,
          content: blockContent.join('\n').trim()
        });
      }

      currentBlock = BlockTypes.THINKING;
      blockContent = [];
      continue;
    }

    // Check for error markers / Verificar marcadores de erro
    if (trimmed.match(/^error:/i) ||
        trimmed.match(/^erro:/i) ||
        trimmed.match(/^exception:/i)) {
      
      if (currentBlock) {
        blocks.push({
          type: currentBlock,
          content: blockContent.join('\n').trim()
        });
      }

      currentBlock = BlockTypes.ERROR;
      blockContent = [line];
      continue;
    }

    // Check for ANSI codes (indicates output) / Verificar códigos ANSI (indica output)
    if (line.match(/\[0m|\[01;\d+m|\[0;\d+m/)) {
      if (currentBlock !== BlockTypes.OUTPUT) {
        if (currentBlock) {
          blocks.push({
            type: currentBlock,
            content: blockContent.join('\n').trim()
          });
        }
        currentBlock = BlockTypes.OUTPUT;
        blockContent = [];
      }
    }

    // Add line to current block / Adicionar linha ao bloco atual
    blockContent.push(line);
  }

  // Flush final block / Descarregar bloco final
  if (currentBlock && blockContent.length > 0) {
    blocks.push({
      type: currentBlock,
      content: blockContent.join('\n').trim()
    });
  } else if (blockContent.length > 0) {
    // Default to AI text / Padrão para texto da IA
    blocks.push({
      type: BlockTypes.AI_TEXT,
      content: blockContent.join('\n').trim()
    });
  }

  return blocks;
}

/**
 * Detect if content has ANSI escape codes
 * Detecta se o conteúdo tem códigos de escape ANSI
 */
export function hasAnsiCodes(text) {
  if (!text || typeof text !== 'string') return false;
  return /\[0m|\[01;\d+m|\[0;\d+m|\[0;\d+;\d+m|\x1b\[|\033\[/.test(text);
}
