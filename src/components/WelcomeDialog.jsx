/**
 * WelcomeDialog Component
 * First-run configuration dialog
 */

import { Activity, Settings, Zap } from 'lucide-react';
import { useState } from 'react';
import { saveConfig } from '../utils/configManager';

const WelcomeDialog = ({ onComplete }) => {
  const [iterations, setIterations] = useState(6);
  const [unlimited, setUnlimited] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(true);

  const handleComplete = async () => {
    const config = {
      max_iterations: unlimited ? 50 : iterations,
      unlimited_iterations: unlimited,
      first_run_complete: true
    };
    
    if (saveAsDefault) {
      try {
        await saveConfig('ai/brain', config);
      } catch (error) {
        console.error('[WelcomeDialog] Failed to save config:', error);
      }
    }
    
    onComplete(config);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#00ff00] rounded-xl p-8 max-w-lg shadow-2xl" style={{ boxShadow: '0 0 30px rgba(0, 255, 0, 0.3)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#00ff00]/10 rounded-lg flex items-center justify-center">
            <Settings className="text-[#00ff00]" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#00ff00] font-mono">Welcome to HexAgentGUI</h2>
            <p className="text-xs text-gray-500">Configure your AI assistant</p>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="border border-[#333] rounded-lg p-4 bg-[#111]">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-cyan-400" />
              <label className="text-sm font-bold text-white">Max Iterations per Task</label>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              How many reasoning steps should the AI take before asking for your approval?
            </p>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[3, 6, 10, 20].map(num => (
                <button 
                  key={num}
                  onClick={() => { setIterations(num); setUnlimited(false); }}
                  className={`py-2 px-3 rounded font-mono text-sm transition-all ${
                    iterations === num && !unlimited 
                      ? 'bg-[#00ff00] text-black font-bold' 
                      : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#1a1a1a] p-2 rounded transition">
              <input 
                type="checkbox" 
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Unlimited iterations (∞)</span>
              <span className="text-xs text-yellow-600 ml-auto">⚠️ May use more resources</span>
            </label>
          </div>
          
          <div className="border border-[#333] rounded-lg p-4 bg-[#111]">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-purple-400" />
              <label className="text-sm font-bold text-white">Auto-Execute Commands</label>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Currently <span className="text-red-400 font-bold">DISABLED</span> by default for safety. You can enable it later in Settings.
            </p>
          </div>
          
          <div className="border-t border-[#333] pt-4">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#1a1a1a] p-2 rounded transition">
              <input 
                type="checkbox" 
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">
                Save as default <span className="text-xs text-gray-500">(can change in Settings)</span>
              </span>
            </label>
          </div>
        </div>
        
        <button 
          onClick={handleComplete}
          className="w-full mt-6 py-3 bg-[#00ff00] text-black font-bold rounded-lg hover:bg-[#00cc00] transition font-mono text-sm"
        >
          START USING HEXAGENTGUI →
        </button>
      </div>
    </div>
  );
};

export default WelcomeDialog;
