import { Infinity, Plus, StopCircle } from 'lucide-react';
import { useState } from 'react';

/**
 * IterationLimitReachedDialog Component
 * Componente de Diálogo de Limite de Iterações Atingido
 * 
 * Shows when AI reaches max iterations, allowing user to:
 * - Continue with more iterations (+5, +10, custom)
 * - Enable unlimited mode (∞)
 * - Stop execution
 * 
 * Mostra quando IA atinge max de iterações, permitindo usuário:
 * - Continuar com mais iterações (+5, +10, customizado)
 * - Habilitar modo ilimitado (∞)
 * - Parar execução
 */
const IterationLimitReachedDialog = ({ 
  currentLimit, 
  currentIteration,
  onContinue, 
  onStop,
  onClose
}) => {
  const [customValue, setCustomValue] = useState(currentLimit + 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border-2 border-yellow-500/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <StopCircle className="text-yellow-500" size={24} />
          <h2 className="text-xl font-bold text-yellow-500">
            ⚠️ Iteration Limit Reached
          </h2>
        </div>
        
        {/* Info */}
        <p className="text-gray-300 mb-2">
          The AI has completed <span className="text-cyan-400 font-bold">{currentIteration}</span> iterations 
          (limit: <span className="text-yellow-400 font-bold">{currentLimit}</span>).
        </p>
        <p className="text-gray-400 text-sm mb-6 italic">
          A IA completou {currentIteration} iterações (limite: {currentLimit}).
        </p>
        
        {/* Options */}
        <div className="space-y-3">
          {/* Unlimited */}
          <button
            onClick={() => onContinue(0)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-400 font-semibold transition-all"
          >
            <Infinity size={18} />
            <span>Enable Unlimited Iterations</span>
          </button>
          
          {/* Quick options */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onContinue(currentLimit + 5)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-semibold transition-all"
            >
              <Plus size={16} />
              <span>+5 More</span>
            </button>
            
            <button
              onClick={() => onContinue(currentLimit + 10)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-semibold transition-all"
            >
              <Plus size={16} />
              <span>+10 More</span>
            </button>
          </div>
          
          {/* Custom */}
          <div className="flex gap-2">
            <input
              type="number"
              min={currentLimit + 1}
              max={100}
              value={customValue}
              onChange={(e) => setCustomValue(parseInt(e.target.value) || currentLimit + 10)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Custom limit"
            />
            <button
              onClick={() => onContinue(customValue)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white font-semibold transition-all"
            >
              Set Custom
            </button>
          </div>
          
          {/* Stop */}
          <button
            onClick={onStop}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 font-semibold transition-all mt-4"
          >
            <StopCircle size={16} />
            <span>Stop Execution Here</span>
          </button>
        </div>
        
        {/* Footer hint */}
        <p className="text-gray-500 text-xs text-center mt-4 italic">
          💡 Tip: Use ∞ button in controls to preset unlimited mode
        </p>
      </div>
    </div>
  );
};

export default IterationLimitReachedDialog;
