/**
 * ANSI Renderer Utility
 * Converts ANSI escape codes to React styled components
 * 
 * Utilidade de Renderização ANSI
 * Converte códigos de escape ANSI para componentes React estilizados
 */

export const AnsiRenderer = ({ text, customColors = {} }) => {
  if (!text) return null;
  
  // Regex matches ESC[...m (various formats)
  const parts = text.split(/(\x1b\[(?:\d{1,3}(?:;\d{1,3})*)?m|\\u001b\[(?:\d{1,3}(?:;\d{1,3})*)?m|\[[\d;]+m)/g);
  
  const spans = [];
  let style = { color: 'inherit', fontWeight: 'normal', textDecoration: 'none' };
  let key = 0;

  // Custom Kali-like Palette
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
    if (part && (part.startsWith('\x1b[') || part.startsWith('\\u001b[') || part.match(/^\[[\d;]+m$/))) {
      const codes = part.match(/\d+/g);
      if (codes) {
        for (const codeStr of codes) {
          const code = parseInt(codeStr, 10);
          if (code === 0) {
            // Reset
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
      spans.push(<span key={key++} style={{...style}}>{part}</span>);
    }
  }
  
  return <>{spans}</>;
};

// Helper to detect if text contains ANSI codes
export const hasAnsiCodes = (text) => {
  if (!text || typeof text !== 'string') return false;
  return /\x1b\[|\033\[|\\u001b\[|\[[\d;]+m/.test(text);
};
