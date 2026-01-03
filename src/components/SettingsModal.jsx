import { Activity, Cpu, Database, Globe, Key, Save, Server, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const SettingsModal = ({ isOpen, onClose, config, onSave, t }) => {
  const [localConfig, setLocalConfig] = useState(config || {
    ai: { 
        language: 'auto', 
        max_iterations: 10, 
        temperature: 0.7,
        model: 'openai/gpt-4-turbo',
        api_key: '',
        api_url: '',
        web_search_enabled: false,
        unlimited_iterations: false
    },
    services: {
        flask_port: 5000,
        hexstrike_port: 8888,
        backend_host: '127.0.0.1'
    },
    system: {
        theme: 'dark'
    },
    ui: {
        custom_colors: {}
    }
  });

  const [activeTab, setActiveTab] = useState('brain'); // brain, services, appearance, system

  useEffect(() => {
    if (config) {
        // Deep merge or specific field merge to ensure new fields exist
        setLocalConfig(prev => ({
            ...prev,
            ...config,
            ai: { ...prev.ai, ...config.ai },
            services: { ...prev.services, ...config.services },
            system: { ...prev.system, ...config.system },
            ui: { ...prev.ui, ...config.ui }
        }));
    }
  }, [config]);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const updateAI = (field, value) => {
    setLocalConfig(prev => ({
        ...prev,
        ai: { ...prev.ai, [field]: value }
    }));
  };

  const updateService = (field, value) => {
    setLocalConfig(prev => ({
        ...prev,
        services: { ...prev.services, [field]: value }
    }));
  };

  const updateUI = (field, value) => {
    setLocalConfig(prev => ({
        ...prev,
        ui: { 
            ...prev.ui, 
            custom_colors: { ...prev.ui?.custom_colors, [field]: value } 
        }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-[#333] rounded-xl w-[600px] h-[500px] shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#111]">
          <h2 className="text-lg font-bold text-[#00ff00] flex items-center gap-2 font-mono">
            <Settings size={20} /> {t ? t('settings.title') : 'CONFIGURATION'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition hover:rotate-90">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#333] bg-[#0f0f0f]">
            <button 
                onClick={() => setActiveTab('brain')}
                className={`flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'brain' ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Cpu size={14} /> {t ? t('settings.tab_brain') : 'BRAIN'}
            </button>
            <button 
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'services' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Server size={14} /> SERVICES
            </button>
            <button 
                onClick={() => setActiveTab('appearance')}
                className={`flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'appearance' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Globe size={14} /> {t ? t('settings.tab_appearance') : 'APPEARANCE'}
            </button>
            <button 
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-3 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'system' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Database size={14} /> {t ? t('settings.tab_general') : 'SYSTEM'}
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* BRAIN TAB */}
            {activeTab === 'brain' && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                             <label className="block text-xs text-gray-400 mb-1.5 font-mono">{t ? t('brain.provider') : 'AI Provider'}</label>
                             <select
                                value={localConfig.ai?.provider || 'openai'}
                                onChange={(e) => updateAI('provider', e.target.value)}
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-[#00ff00] focus:outline-none mb-3"
                             >
                                <option value="openai">OpenAI</option>
                                <option value="openrouter">OpenRouter</option>
                                <option value="anthropic">Anthropic</option>
                                <option value="deepseek">DeepSeek</option>
                                <option value="local">Local (Ollama/LM Studio)</option>
                                <option value="custom">Custom (Generic)</option>
                             </select>
                        </div>

                        <div className="col-span-2">
                             <label className="block text-xs text-gray-400 mb-1.5 font-mono">{t ? t('brain.model') : 'AI Model'}</label>
                             <input 
                                type="text" 
                                value={localConfig.ai?.model || ''}
                                onChange={(e) => updateAI('model', e.target.value)}
                                placeholder="e.g., openai/gpt-4-turbo, llama3"
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-[#00ff00] focus:outline-none font-mono"
                             />
                        </div>

                        <div className="col-span-2">
                             <label className="block text-xs text-gray-400 mb-1.5 font-mono flex items-center gap-2">
                                <Key size={12} /> {t ? t('brain.api_key') : 'API Key'}
                             </label>
                             <input 
                                type="password" 
                                value={localConfig.ai?.api_key || ''}
                                onChange={(e) => updateAI('api_key', e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-[#00ff00] focus:outline-none font-mono"
                             />
                        </div>
                        
                        {(localConfig.ai?.provider === 'local' || localConfig.ai?.provider === 'custom') && (
                            <div className="col-span-2 animate-in fade-in slide-in-from-top-2">
                                 <label className="block text-xs text-gray-400 mb-1.5 font-mono">{t ? t('brain.base_url') : 'Base URL'}</label>
                                 <input 
                                    type="text" 
                                    value={localConfig.ai?.base_url || ''}
                                    onChange={(e) => updateAI('base_url', e.target.value)}
                                    placeholder="http://localhost:11434/v1"
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-[#00ff00] focus:outline-none font-mono"
                                 />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">{t ? t('settings.language') : 'Language'}</label>
                            <select
                                value={localConfig.ai?.language || 'auto'}
                                onChange={(e) => updateAI('language', e.target.value)}
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-[#00ff00] focus:outline-none"
                            >
                                <option value="auto">{t ? t('settings.language_auto') : 'Auto-detect'}</option>
                                <option value="pt">Português</option>
                                <option value="es">Español</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs text-gray-400 mb-1.5 font-mono">Temperature: {localConfig.ai?.temperature}</label>
                             <input
                                type="range"
                                min="0" max="1" step="0.1"
                                value={localConfig.ai?.temperature || 0.7}
                                onChange={(e) => updateAI('temperature', parseFloat(e.target.value))}
                                className="w-full accent-[#00ff00]"
                             />
                        </div>
                    </div>

                    <div className="border-t border-[#333] pt-4 space-y-3">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-mono text-gray-300 flex items-center gap-2">
                                <Activity size={14} className="text-[#00ff00]" />
                                {t ? t('brain.max_iterations') : 'Max Iterations'}
                                <span className="text-xs text-gray-500">({localConfig.ai?.unlimited_iterations ? '∞' : localConfig.ai?.max_iterations})</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500">UNLIMITED</span>
                                <button 
                                    onClick={() => updateAI('unlimited_iterations', !localConfig.ai?.unlimited_iterations)}
                                    className={`w-8 h-4 rounded-full relative transition-colors ${localConfig.ai?.unlimited_iterations ? 'bg-[#00ff00]' : 'bg-gray-700'}`}
                                >
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${localConfig.ai?.unlimited_iterations ? 'left-4.5' : 'left-0.5'}`} />
                                </button>
                            </div>
                         </div>
                         {!localConfig.ai?.unlimited_iterations && (
                            <input
                                type="range" min="1" max="50"
                                value={localConfig.ai?.max_iterations || 10}
                                onChange={(e) => updateAI('max_iterations', parseInt(e.target.value))}
                                className="w-full accent-[#00ff00]"
                            />
                         )}
                    </div>

                    <div className="border border-[#333] rounded p-3 bg-[#111] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe size={18} className="text-blue-400" />
                            <div>
                                <div className="text-sm font-bold text-gray-200">{t ? t('brain.browser_search') : 'Web Search Access'}</div>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                updateAI('web_search_enabled', !localConfig.ai?.web_search_enabled);
                            }}
                            className={`w-10 h-5 rounded-full relative transition-colors ${localConfig.ai?.web_search_enabled ? 'bg-blue-500' : 'bg-gray-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${localConfig.ai?.web_search_enabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs text-gray-400 mb-2 font-mono">{t ? t('appearance.ai_text_color') : 'AI Text Color'}</label>
                             <div className="flex items-center gap-3">
                                 <input 
                                    type="color" 
                                    value={localConfig.ui?.custom_colors?.ai_text || '#06b6d4'}
                                    onChange={(e) => updateUI('ai_text', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                 />
                                 <span className="text-xs font-mono text-gray-500">{localConfig.ui?.custom_colors?.ai_text || '#06b6d4'}</span>
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs text-gray-400 mb-2 font-mono">{t ? t('appearance.user_text_color') : 'User Text Color'}</label>
                             <div className="flex items-center gap-3">
                                 <input 
                                    type="color" 
                                    value={localConfig.ui?.custom_colors?.user_text || '#00ff00'}
                                    onChange={(e) => updateUI('user_text', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                                 />
                                 <span className="text-xs font-mono text-gray-500">{localConfig.ui?.custom_colors?.user_text || '#00ff00'}</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="p-4 rounded border border-[#333] bg-[#000000] space-y-2">
                        <div className="text-xs text-gray-500 mb-2">PREVIEW / PRÉVIA</div>
                        <div className="font-mono text-sm" style={{ color: localConfig.ui?.custom_colors?.user_text || '#00ff00' }}>
                            Hello System.
                        </div>
                        <div className="font-mono text-sm" style={{ color: localConfig.ui?.custom_colors?.ai_text || '#06b6d4' }}>
                            Hello! How can I help you today?
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === 'services' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider border-b border-[#333] pb-1">Backend Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">Flask Port</label>
                                <input 
                                    type="number" 
                                    value={localConfig.services?.flask_port || 5000}
                                    onChange={(e) => updateService('flask_port', parseInt(e.target.value))}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">Host</label>
                                <input 
                                    type="text" 
                                    value={localConfig.services?.backend_host || '127.0.0.1'}
                                    onChange={(e) => updateService('backend_host', e.target.value)}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider border-b border-[#333] pb-1">HexStrike Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">HexStrike Port</label>
                                <input 
                                    type="number" 
                                    value={localConfig.services?.hexstrike_port || 8888}
                                    onChange={(e) => updateService('hexstrike_port', parseInt(e.target.value))}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                     <div className="text-center py-4">
                        <img src="logo.png" className="w-16 h-16 mx-auto object-contain mb-4" alt="logo" />
                        <h3 className="text-xl font-bold text-white">HexAgent GUI</h3>
                        <p className="text-gray-500 font-mono text-sm mt-1">v1.0.0 Alpha</p>
                        
                        <div className="mt-4 mb-6">
                            <p className="text-sm text-gray-300">Developer: <span className="text-[#00ff00]">Roberto Dantas de Castro</span></p>
                            <p className="text-xs text-gray-500">Email: robertodantasdecastro@gmail.com</p>
                            <a href="https://github.com/robertodantasdecastro/HexAgent/wiki" target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 underline block mt-1">
                                 GitHub Wiki
                            </a>
                        </div>

                        <div className="bg-[#111] p-4 rounded border border-[#333] flex flex-col items-center max-w-sm mx-auto mb-6">
                            <h4 className="text-xs font-bold text-yellow-500 mb-3 uppercase tracking-wider">Support the Project / Apoie o Projeto</h4>
                            <img src="qrcode.png" className="w-32 h-32 object-contain bg-white p-1 rounded mb-3" alt="Bitcoin QR" />
                            <div className="text-[10px] text-gray-400 font-mono break-all text-center">
                                BTC: bc1qekh060wjfgspgt32vclmu3fcfx9fr7jh0akuwu
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono break-all text-center mt-2">
                                PIX: robertodantasdecastro@gmail.com
                            </div>
                        </div>

                        <div className="p-4 bg-[#111] rounded border border-[#333] text-left text-xs font-mono text-gray-400 space-y-2">
                            <div className="flex justify-between"><span>Electron:</span> <span>v33.2.1</span></div>
                            <div className="flex justify-between"><span>Chrome:</span> <span>v130.0.6723.137</span></div>
                            <div className="flex justify-between"><span>Node:</span> <span>v20.18.1</span></div>
                            <div className="flex justify-between"><span>V8:</span> <span>v13.0.245.17-electron.0</span></div>
                            <div className="flex justify-between"><span>Platform:</span> <span>Linux arm64</span></div>
                        </div>
                     </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#333] bg-[#0a0a0a] flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
            >
                {t ? t('settings.cancel') : 'CANCEL'}
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-[#00ff00] text-black text-xs font-bold rounded hover:bg-[#00cc00] transition-colors flex items-center gap-2"
            >
                <Save size={14} /> {t ? t('settings.save') : 'SAVE SETTINGS'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
