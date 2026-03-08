import { Activity, Target } from 'lucide-react';
import { useState } from 'react';
import APIClient from '../../utils/APIClient';

const HexStrikeConfigTab = ({ config, onChange }) => {
  const [loading, setLoading] = useState(false);
  const api = APIClient.getInstance();

  const handleChange = (section, key, value) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    });
  };

  const toggleService = async () => {
      setLoading(true);
      try {
          // This would ideally interact with the lifecycle controller
          // For now, we simulate a toggle or just logs
          console.log("Lifecycle toggle not fully hooked in UI yet");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="space-y-6">
      
      {/* Agent Objectives */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <Target size={16} /> Objetivos do Agente / Agent Objectives
        </h3>
        
        <div className="p-3 bg-red-900/10 border border-red-500/20 rounded mb-2">
             <p className="text-xs text-red-300 font-mono">
                Define a "missão" primária do agente autônomo.
             </p>
        </div>

        <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Modo de Operação / Operation Mode</label>
             <select
              value={config.agent?.objective || 'general_assistant'}
              onChange={(e) => handleChange('agent', 'objective', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="general_assistant">Assistente Geral / General Assistant</option>
              <option value="pentest">Red Team (Pentest)</option>
              <option value="blue_team">Blue Team (Defesa)</option>
              <option value="osint">Investigador (OSINT)</option>
            </select>
        </div>

        <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Nível de Segurança / Safety Level</label>
             <select
              value={config.agent?.safety_level || 'high'}
              onChange={(e) => handleChange('agent', 'safety_level', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="high">Alto (Apenas Leitura/Safe) / High</option>
              <option value="medium">Médio (Execução Controlada) / Medium</option>
              <option value="low">Baixo (Execução Irrestrita) / Low</option>
            </select>
        </div>
      </div>

       {/* Execution Parameters */}
       <div className="space-y-4">
        <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
          <Activity size={16} /> Parâmetros de Execução / Execution Params
        </h3>

        <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Timeout (sec)</label>
                <input
                  type="number"
                  value={config.execution?.timeout || 300}
                  onChange={(e) => handleChange('execution', 'timeout', parseInt(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
             </div>
             <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Max Concurrency</label>
                <input
                  type="number"
                  value={config.execution?.max_concurrency || 1}
                  onChange={(e) => handleChange('execution', 'max_concurrency', parseInt(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
             </div>
        </div>
       </div>

    </div>
  );
};

export default HexStrikeConfigTab;
