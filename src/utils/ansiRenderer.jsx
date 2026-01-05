/**
 * ANSI Renderer Utility
 * Utilidade de Renderização ANSI
 * 
 * Converts ANSI escape codes to React styled components
 * Converte códigos de escape ANSI para componentes React estilizados
 * 
 * Supported escape codes / Códigos de escape suportados:
 * - \x1b[Xm - Standard format
 * - \u001b[Xm - Unicode format
 * - [Xm - Simplified format
 * 
 * Color codes / Códigos de cor:
 * - 30-37: Standard colors (Black to White)
 * - 90-97: Bright colors (Bright Black to Bright White)
 * - 0: Reset all attributes
 * - 1: Bold
 * - 4: Underline
 * 
 * @example
 * // Input: "\x1b[31mError\x1b[0m"
 * // Output: <span style={{color: '#ef4444'}}>Error</span>
 */

/**
 * AnsiRenderer Component
 * Componente AnsiRenderer
 * 
 * Parses ANSI escape sequences and renders colored text
 * Parseia sequências de escape ANSI e renderiza texto colorido
 * 
 * @param {Object} props - Component props / Propriedades do componente
 * @param {string} props.text - Text with ANSI codes / Texto com códigos ANSI
 * @param {Object} [props.customColors={}] - Custom color overrides / Cores personalizadas
 * @returns {JSX.Element} Rendered colored text / Texto colorido renderizado
 */
export const AnsiRenderer = ({ text, customColors = {} }) => {
  if (!text) return null;
  
  // Regex matches ESC[...m (various formats)
  // Regex identifica ESC[...m (vários formatos)
  const parts = text.split(/(\x1b\[(?:\d{1,3}(?:;\d{1,3})*)?m|\\u001b\[(?:\d{1,3}(?:;\d{1,3})*)?m|\[[\d;]+m)/g);
  
  const spans = [];
  let style = { color: 'inherit', fontWeight: 'normal', textDecoration: 'none' };
  let key = 0;

  // Custom Kali-like Palette
  // Paleta estilo Kali personalizada
  const defaultColors = {
    30: '#000000', 31: '#ef4444', 32: '#22c55e', 33: '#eab308', 
    34: '#3b82f6', 35: '#d946ef', 36: '#06b6d4', 37: '#e5e7eb',
    90: '#6b7280', 91: '#f87171', 92: '#4ade80', 93: '#facc15', 
    94: '#60a5fa', 95: '#e879f9', 96: '#22d3ee', 97: '#ffffff'
  };
  
  const colors = { ...defaultColors, ...customColors };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Check if this is an ANSI code
    // Verifica se é um código ANSI
    if (part && (part.startsWith('\x1b[') || part.startsWith('\\u001b[') || part.match(/^\[[\d;]+m$/))) {
      const codes = part.match(/\d+/g);
      if (codes) {
        for (const codeStr of codes) {
          const code = parseInt(codeStr, 10);
          if (code === 0) {
            // Reset / Resetar
            style = { color: 'inherit', fontWeight: 'normal', textDecoration: 'none' };
          } else if (code === 1) {
            style = { ...style, fontWeight: 'bold' };
          } else if (code === 4) {
            style = { ...style, textDecoration: 'underline' };
          } else if (code >= 30 && code <= 37) {
            style = { ...style, color: colors[code] };
          } else if (code >= 90 && code <= 97) {
            style = { ...style, color: colors[code] };
          } else if (code === 39) {
            style = { ...style, color: 'inherit' };
          }
        }
      }
    } else if (part) {
      // Regular text - render with current style
      // Texto regular - renderiza com estilo atual
      spans.push(<span key={key++} style={{...style}}>{part}</span>);
    }
  }
  
  return <>{spans}</>;
};

/**
 * Helper to detect if text contains ANSI codes
 * Auxiliar para detectar se texto contém códigos ANSI
 * 
 * @param {string} text - Text to check / Texto para verificar
 * @returns {boolean} True if ANSI codes found / Verdadeiro se códigos ANSI encontrados
 */
export const hasAnsiCodes = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /\x1b\[|\033\[|\\u001b\[|\[[\d;]+m/.test(text);
};
