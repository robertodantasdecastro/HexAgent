import { Lightbulb, Play } from 'lucide-react';

/**
 * Suggestion Block Component
 * Exibe próximos passos sugeridos com ações clicáveis
 */
const SuggestionBlock = ({ content, onExecute }) => {
  // Parse suggestions if content is a JSON string or array, otherwise treat as text lines
  let suggestions = [];
  
  if (Array.isArray(content)) {
    suggestions = content;
  } else if (typeof content === 'string') {
    // Try to parse JSON first
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) suggestions = parsed;
    } catch (e) {
      // Fallback: split by newlines and clean up
      suggestions = content.split('\n')
        .map(line => line.replace(/^[\d-.]+\s*/, '').trim())
        .filter(line => line.length > 0);
    }
  }

  return (
    <div className="my-3 ml-4 animate-in fade-in slide-in-from-left-2 duration-500 delay-100">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={14} className="text-yellow-500/80" />
        <span className="text-xs font-semibold text-yellow-500/80 uppercase tracking-wider">Suggested Actions</span>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onExecute && onExecute(suggestion)}
            className="group w-full max-w-xl flex items-center justify-between p-3 rounded-md bg-gray-800/50 hover:bg-gray-700/80 border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600 group-hover:border-yellow-500/50 group-hover:bg-yellow-900/20 transition-colors">
                <span className="text-xs font-mono text-gray-400 group-hover:text-yellow-400">{index + 1}</span>
              </div>
              <span className="text-sm text-gray-300 group-hover:text-gray-100 transition-colors">
                {typeof suggestion === 'string' ? suggestion : suggestion.label || JSON.stringify(suggestion)}
              </span>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
               <Play size={14} className="text-yellow-400 fill-yellow-400/20" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionBlock;
