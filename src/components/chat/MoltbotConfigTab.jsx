import { Box, Code, Globe, Terminal } from 'lucide-react';

const MoltbotConfigTab = ({ config, onChange }) => {

  const handleChange = (section, key, value) => {
      // Handle nested structures like skills.web_search.enabled
      // Tratar estruturas aninhadas
      onChange({
        ...config,
        [section]: {
          ...config[section],
          [key]: value
        }
      });
  };

  const toggleSkill = (skillName, enabled) => {
      onChange({
        ...config,
        skills: {
            ...config.skills,
            [skillName]: { ...config.skills[skillName], enabled }
        }
      });
  };

  return (
    <div className="space-y-6">
      
      {/* Resources */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2">
          <Box size={16} /> Recursos / Resources
        </h3>
        
        <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">Max Memory (MB)</label>
            <input
              type="number"
              value={config.resources?.max_memory_mb || 512}
              onChange={(e) => handleChange('resources', 'max_memory_mb', parseInt(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
            />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
          <Terminal size={16} /> Habilidades / Skills
        </h3>

        <div className="grid grid-cols-1 gap-3">
             {/* Web Search */}
             <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-[#333]">
                  <div className="flex items-center gap-3">
                      <Globe size={16} className="text-blue-400"/>
                      <div>
                          <p className="text-sm text-gray-200">Web Search</p>
                          <p className="text-[10px] text-gray-500">Permite ao agente pesquisar na internet</p>
                      </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.skills?.web_search?.enabled ?? true}
                    onChange={(e) => toggleSkill('web_search', e.target.checked)}
                    className="w-4 h-4"
                  />
             </div>

             {/* Code Interpreter */}
             <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-[#333]">
                  <div className="flex items-center gap-3">
                      <Code size={16} className="text-yellow-400"/>
                      <div>
                          <p className="text-sm text-gray-200">Code Interpreter</p>
                          <p className="text-[10px] text-gray-500">Execução segura de código Python/JS</p>
                      </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.skills?.code_interpreter?.enabled ?? true}
                    onChange={(e) => toggleSkill('code_interpreter', e.target.checked)}
                    className="w-4 h-4"
                  />
             </div>
        </div>
      </div>

    </div>
  );
};

export default MoltbotConfigTab;
