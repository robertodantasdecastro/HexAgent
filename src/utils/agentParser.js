/**
 * Agent Content Parser
 * Analisador de Conteúdo do Agente
 *
 * Intelligently splits AI responses into structured sections.
 * Divide inteligentemente respostas da IA em seções estruturadas.
 *
 * @module agentParser
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 */

/**
 * Parse agent content into formatted sections
 * Analisa conteúdo do agente em seções formatadas
 *
 * This function intelligently splits AI responses into structured sections:
 * - Code blocks (```language...```)
 * - Output blocks ([Output]: or Command Executed markers)
 * - Regular AI text
 *
 * Esta função divide inteligentemente respostas da IA em seções estruturadas:
 * - Blocos de código (```linguagem...```)
 * - Blocos de saída (marcadores [Output]: ou Command Executed)
 * - Texto normal da IA
 *
 * @param {string} content - Raw AI response content / Conteúdo bruto da resposta da IA
 * @returns {Array<{type: string, content: string, language?: string}>} Parsed sections / Seções parseadas
 */
export const parseAgentContent = (content) => {
  const sections = [];

  // First, extract code blocks with regex
  // Primeiro, extrai blocos de código com regex
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    // Adiciona texto antes do bloco de código
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index).trim();
      if (textBefore) {
        // Check if this text contains [Output]: marker
        // Verifica se este texto contém marcador [Output]:
        if (textBefore.includes('[Output]:') || textBefore.match(/Command Executed/i)) {
          sections.push({ type: 'output', content: textBefore });
        } else {
          sections.push({ type: 'ai', content: textBefore });
        }
      }
    }

    // Add code block
    // Adiciona bloco de código
    const language = match[1] || 'plaintext';
    const code = match[2];
    sections.push({ type: 'code', content: code, language });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last code block
  // Adiciona texto restante após último bloco de código
  if (lastIndex < content.length) {
    const remaining = content.substring(lastIndex).trim();
    if (remaining) {
      // Check if remaining contains output markers
      // Verifica se o restante contém marcadores de saída
      if (remaining.includes('[Output]:') || remaining.match(/Command Executed/i)) {
        sections.push({ type: 'output', content: remaining });
      } else {
        sections.push({ type: 'ai', content: remaining });
      }
    }
  }

  // If no code blocks were found, check if whole content is an output or normal text
  // Se nenhum bloco de código foi encontrado, verifica se todo conteúdo é saída ou texto normal
  if (sections.length === 0) {
    if (content.includes('[Output]:') || content.match(/Command Executed/i)) {
      sections.push({ type: 'output', content });
    } else {
      sections.push({ type: 'ai', content });
    }
  }

  return sections;
};
