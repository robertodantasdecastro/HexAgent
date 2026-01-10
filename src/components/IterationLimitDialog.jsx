/**
 * IterationLimitDialog Component
 * Shows when iteration limit is reached
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const IterationLimitDialog = ({ 
  currentIteration, 
  maxIterations, 
  onContinue, 
  onCancel 
}) => {
  const { t } = useTranslation();
  const [additionalIterations, setAdditionalIterations] = useState(5);
  const [unlimited, setUnlimited] = useState(false);

  const handleContinue = () => {
    if (unlimited) {
      onContinue(-1); // -1 means unlimited
    } else {
      onContinue(additionalIterations);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-yellow-500 rounded-xl p-6 max-w-md shadow-2xl" style={{ boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <AlertCircle className="text-yellow-500" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-yellow-500 font-mono">{t('iteration.limit_reached', 'Iteration Limit Reached')}</h3>
            <p className="text-xs text-gray-500">{t('iteration.task_requires_more', 'Task requires more steps')}</p>
          </div>
        </div>
        
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{t('iteration.current_progress', 'Current Progress')}:</span>
            <span className="text-sm font-mono font-bold text-[#00ff00]">
              {currentIteration} / {maxIterations}
            </span>
          </div>
          <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#00ff00] h-2 transition-all"
              style={{ width: `${(currentIteration / maxIterations) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-3">{t('iteration.continue_with', 'Continue with')}:</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[5, 10, 20].map(num => (
                <button 
                  key={num}
                  onClick={() => { setAdditionalIterations(num); setUnlimited(false); }}
                  className={`py-2 px-3 rounded font-mono text-sm transition-all ${
                    additionalIterations === num && !unlimited
                      ? 'bg-cyan-500 text-black font-bold' 
                      : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>
            
            <input 
              type="number" 
              min="1"
              max="100"
              value={unlimited ? '' : additionalIterations}
              onChange={(e) => {
                setAdditionalIterations(parseInt(e.target.value) || 5);
                setUnlimited(false);
              }}
              placeholder={t('iteration.custom_amount', 'Custom amount')}
              className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm mb-3 focus:border-cyan-500 focus:outline-none"
            />
            
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#1a1a1a] p-2 rounded transition">
              <input 
                type="checkbox" 
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">{t('iteration.unlimited', 'Enable unlimited iterations')} (∞)</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={handleContinue}
            className="flex-1 py-2.5 bg-[#00ff00] text-black font-bold rounded-lg hover:bg-[#00cc00] transition font-mono text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            {t('iteration.continue', 'Continue')}
          </button>
          <button 
            onClick={onCancel}
            className="flex-1 py-2.5 bg-[#333] text-white font-bold rounded-lg hover:bg-[#444] transition font-mono text-sm"
          >
            {t('iteration.stop', 'Stop')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IterationLimitDialog;
