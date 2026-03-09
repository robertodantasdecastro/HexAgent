import { MessageSquare, RefreshCw, User, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import APIClient from '../../utils/APIClient';

const ProfileConfigTab = ({ config, onChange }) => {
  const [personas, setPersonas] = useState([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      setLoadingPersonas(true);
      try {
        const api = APIClient.getInstance();
        const response = await api.get('/config/profile/personas');
        if (response.success && response.data?.personas) {
          setPersonas(response.data.personas);
        }
      } catch (error) {
        console.error('Failed to load personas:', error);
      } finally {
        setLoadingPersonas(false);
      }
    };
    fetchPersonas();
  }, []);

  const handleChange = (section, key, value) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* User Identity */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          <User size={16} /> Identidade de Usuário / User Identity
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Nome / Name</label>
            <input
              type="text"
              value={config.user?.name || ''}
              onChange={(e) => handleChange('user', 'name', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Papel / Role</label>
            <select
              value={config.user?.role || 'Admin'}
              onChange={(e) => handleChange('user', 'role', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="Admin">Admin</option>
              <option value="Operator">Operator</option>
              <option value="Analyst">Analyst</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Persona Settings */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
          <MessageSquare size={16} /> Persona da IA / AI Persona
        </h3>
        
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-mono text-gray-400">Modelo de Persona / Persona Template</label>
                {loadingPersonas && <RefreshCw size={12} className="animate-spin text-cyan-400" />}
            </div>
            <select
              value={config.persona?.id || 'hexagent'}
              onChange={(e) => {
                 const selected = personas.find(p => p.id === e.target.value);
                 handleChange('persona', 'id', e.target.value);
                 if (selected) {
                     handleChange('persona', 'name', selected.name);
                 }
              }}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 mb-3"
            >
              {personas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.description ? `- ${p.description}` : ''}
                </option>
              ))}
              {personas.length === 0 && <option value="hexagent">Padrão / Default</option>}
            </select>

            <label className="block text-xs font-mono text-gray-400 mb-1">Nome Sobrescrito / Override Name (Optional)</label>
            <input
              type="text"
              value={config.persona?.name || 'HexAgent'}
              onChange={(e) => handleChange('persona', 'name', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Tom / Tone</label>
             <select
              value={config.persona?.tone || 'professional'}
              onChange={(e) => handleChange('persona', 'tone', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="professional">Profissional / Professional</option>
              <option value="cyberpunk">Cyberpunk / Hacker</option>
              <option value="friendly">Amigável / Friendly</option>
              <option value="concise">Conciso / Concise</option>
            </select>
           </div>
           
           <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Verbosidade / Verbosity</label>
             <select
              value={config.persona?.verbosity || 'balanced'}
              onChange={(e) => handleChange('persona', 'verbosity', e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            >
              <option value="verbose">Detalhado / Verbose</option>
              <option value="balanced">Balanceado / Balanced</option>
              <option value="concise">Direto / Concise</option>
            </select>
           </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
          <Volume2 size={16} /> Preferências / Preferences
        </h3>
        
        <div className="flex items-center gap-3">
             <input
              type="checkbox"
              id="sounds"
              checked={config.preferences?.sound_effects ?? true}
              onChange={(e) => handleChange('preferences', 'sound_effects', e.target.checked)}
              className="w-4 h-4"
             />
             <label htmlFor="sounds" className="text-sm text-gray-300 font-mono">Efeitos Sonoros / Sound Effects</label>
        </div>
      </div>
    </div>
  );
};

export default ProfileConfigTab;
