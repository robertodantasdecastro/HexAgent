/**
 * Block Types Constants
 * Constantes de Tipos de Bloco
 * 
 * Extracted to avoid circular dependencies
 * Extraído para evitar dependências circulares
 */
export const BlockType = {
  INPUT: 'input',      // Internal context only (não renderizado)
  USER: 'user',        // User message visual block (NEW)
  THINKING: 'thinking',
  SHELL: 'shell',
  NARRATIVE: 'narrative',
  CODE: 'code',
  ERROR: 'error',
  // Phase 3: New Block Types
  COMMAND_OUTPUT: 'command_output',
  ANALYSIS: 'analysis',
  SUGGESTION: 'suggestion'
};
