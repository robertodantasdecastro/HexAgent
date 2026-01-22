import { Database, Globe, Save, Server, Settings, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import useProfile from '../hooks/useProfile';

const SettingsModal = ({ isOpen, onClose, config, onSave, t }) => {
  const [localConfig, setLocalConfig] = useState(config || {});
  const [activeTab, setActiveTab] = useState('general');
  
  // Profile Hook Integration
  const { profile, saveProfile, updateProfile } = useProfile();
  const [localProfile, setLocalProfile] = useState(null);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  // Sync profile when loaded
  useEffect(() => {
     if (profile) {
         setLocalProfile(profile);
     }
  }, [profile]);

  const handleSave = async () => {
    // Save System Config
    onSave(localConfig);
    
    // Save Profile if changed
    if (localProfile) {
        await saveProfile(localProfile);
    }
    
    onClose();
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

  const updateSystem = (field, value) => {
    setLocalConfig(prev => ({
        ...prev,
        system: { ...prev.system, [field]: value }
    }));
  }

  // Profile Update Helper
  const updateProfileField = (section, field, value) => {
      setLocalProfile(prev => ({
          ...prev,
          [section]: {
              ...prev[section],
              [field]: value
          }
      }));
  };
  
  const updateProfileRoot = (field, value) => {
      setLocalProfile(prev => ({
          ...prev,
          [field]: value
      }));
  };

  if (!isOpen) return null;

  // Tabs Definition
  const tabs = [
    { id: 'general', label: t ? t('settings.tabs.general', 'GENERAL') : 'GENERAL', icon: Settings },
    { id: 'personal', label: t ? t('settings.tabs.personal', 'PERSONAL') : 'PERSONAL', icon: User },
    { id: 'services', label: t ? t('settings.tabs.services', 'SERVICES') : 'SERVICES', icon: Server },
    { id: 'appearance', label: t ? t('settings.tabs.appearance', 'APPEARANCE') : 'APPEARANCE', icon: Globe },
    { id: 'system', label: t ? t('settings.tabs.system', 'SYSTEM') : 'SYSTEM', icon: Database }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
          className="bg-[#0a0a0a] border border-[#00ff00]/30 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
             <Settings className="text-cyan-400" size={20} />
             <h2 className="text-lg font-bold text-white tracking-wide">
                {t ? t('settings.title') : 'Configurações / Settings'}
             </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-[#333] bg-[#0f0f0f]/50">
           {tabs.map(tab => {
             const Icon = tab.icon;
             return (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-t text-xs font-mono font-bold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
                 }`}
               >
                   <Icon size={14} /> {tab.label}
               </button>
             );
           })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0a0a0a]">
            
            {/* SECURITY WARNING FOR PERSONALIZATION */}
            {activeTab === 'personal' && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded flex items-start gap-3">
                    <User className="text-indigo-400 mt-1" size={16} />
                    <div>
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Context Injection</h4>
                        <p className="text-[11px] text-gray-400">
                           Information added here will be injected into the AI's System Prompt. 
                           This helps the AI know who you are and your environment context.
                           <br/><span className="text-red-400/80">Warning: This data is sent to the AI Provider.</span>
                        </p>
                    </div>
                </div>
            )}

            {/* PERSONAL TAB */}
            {activeTab === 'personal' && localProfile && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Identity */}
                    <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                        <h3 className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-wider border-b border-[#333] pb-2">
                             Identity
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">My Name</label>
                                <input 
                                    type="text" 
                                    value={localProfile.user?.name || ''}
                                    onChange={(e) => updateProfileField('user', 'name', e.target.value)}
                                    placeholder="e.g., Neo"
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">My Role</label>
                                <input 
                                    type="text" 
                                    value={localProfile.user?.role || ''}
                                    onChange={(e) => updateProfileField('user', 'role', e.target.value)}
                                    placeholder="e.g., Pentester"
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Environment */}
                    <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                        <h3 className="text-xs font-bold text-green-500 mb-4 uppercase tracking-wider border-b border-[#333] pb-2">
                             Environment Concept
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">Environment Notes</label>
                                <textarea 
                                    value={localProfile.environment?.notes || ''}
                                    onChange={(e) => updateProfileField('environment', 'notes', e.target.value)}
                                    placeholder="e.g., Target subnet is 192.168.1.0/24. Gateway is .1."
                                    rows={3}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none font-mono resize-none"
                                />
                                <p className="text-[10px] text-gray-600 mt-1">Facts about your current working environment.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">Forbidden Scopes (Comma separated)</label>
                                <input 
                                    type="text" 
                                    value={localProfile.environment?.forbidden_scopes?.join(', ') || ''}
                                    onChange={(e) => updateProfileField('environment', 'forbidden_scopes', e.target.value.split(',').map(s=>s.trim()))}
                                    placeholder="production, hr-server"
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Custom Instructions */}
                    <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                        <h3 className="text-xs font-bold text-yellow-500 mb-4 uppercase tracking-wider border-b border-[#333] pb-2">
                             Custom Behavior
                        </h3>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Global Custom Instructions</label>
                            <textarea 
                                value={localProfile.custom_instructions || ''}
                                onChange={(e) => updateProfileRoot('custom_instructions', e.target.value)}
                                placeholder="e.g., Always explain commands before executing. Use JSON format for reports."
                                rows={4}
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none font-mono resize-none"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">These instructions are appended to every system prompt.</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                         <p className="text-xs text-blue-400 font-mono">
                           ℹ️ {t ? t('settings.general.description') : 'Core application settings and preferences'}
                         </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded hover:border-[#333] transition">
                            <div>
                                <label className="block text-sm font-bold text-gray-200 mb-1">{t ? t('settings.general.auto_save') : 'Auto Save Sessions'}</label>
                                <div className="text-xs text-gray-500">{t ? t('settings.general.auto_save_desc') : 'Automatically save chat sessions'}</div>
                            </div>
                            <div className="relative inline-block w-10 h-5">
                                <input 
                                    type="checkbox" 
                                    checked={localConfig.system?.auto_save_session ?? true}
                                    onChange={(e) => updateSystem('auto_save_session', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded hover:border-[#333] transition">
                            <div>
                                <label className="block text-sm font-bold text-gray-200 mb-1">{t ? t('settings.general.debug_mode') : 'Debug Mode'}</label>
                                <div className="text-xs text-gray-500">{t ? t('settings.general.debug_desc') : 'Enable detailed debug logging'}</div>
                            </div>
                            <div className="relative inline-block w-10 h-5">
                                <input 
                                    type="checkbox" 
                                    checked={localConfig.system?.debug_mode ?? false}
                                    onChange={(e) => updateSystem('debug_mode', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                            </div>
                        </div>
                        
                        {/* Language Selector */}
                        <div>
                            <label className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wider">
                                {t ? t('settings.language') : 'Language / Idioma'}
                            </label>
                            <select
                                value={localConfig.system?.language || 'auto'}
                                onChange={async (e) => {
                                    const newLang = e.target.value;
                                    updateSystem('language', newLang);
                                    
                                    const { default: TranslationManager } = await import('../utils/TranslationManager');
                                    const tm = TranslationManager.getInstance();
                                    tm.setLanguage(newLang);
                                }}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                            >
                                <option value="auto">🌍 Auto Detect / Auto Detectar</option>
                                <option value="en">🇬🇧 English</option>
                                <option value="pt">🇧🇷 Português</option>
                                <option value="es">🇪🇸 Español</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}
            
            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                             <label className="block text-xs text-cyan-400 mb-3 font-mono uppercase tracking-wider">{t ? t('appearance.ai_text_color') : 'AI Text Color'}</label>
                             <div className="flex items-center gap-3">
                                 <input 
                                    type="color" 
                                    value={localConfig.ui?.custom_colors?.ai_text || '#06b6d4'}
                                    onChange={(e) => updateUI('ai_text', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#333]"
                                 />
                                 <span className="text-xs font-mono text-gray-400 bg-black px-2 py-1 rounded">{localConfig.ui?.custom_colors?.ai_text || '#06b6d4'}</span>
                             </div>
                        </div>
                        <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                             <label className="block text-xs text-[#00ff00] mb-3 font-mono uppercase tracking-wider">{t ? t('appearance.user_text_color') : 'User Text Color'}</label>
                             <div className="flex items-center gap-3">
                                 <input 
                                    type="color" 
                                    value={localConfig.ui?.custom_colors?.user_text || '#00ff00'}
                                    onChange={(e) => updateUI('user_text', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#333]"
                                 />
                                 <span className="text-xs font-mono text-gray-400 bg-black px-2 py-1 rounded">{localConfig.ui?.custom_colors?.user_text || '#00ff00'}</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="p-6 rounded-lg border border-[#333] bg-[#050505] space-y-4">
                        <div className="text-xs text-gray-600 font-mono tracking-widest uppercase mb-2">Live Preview</div>
                        
                        {/* Mock Chat */}
                        <div className="flex flex-col gap-4">
                            <div className="self-end max-w-[80%]">
                                <span className="text-[10px] text-gray-600 block text-right mb-1">USER</span>
                                <div 
                                    className="text-sm font-mono p-3 rounded-lg bg-[#111] border border-[#222]"
                                    style={{ color: localConfig.ui?.custom_colors?.user_text || '#00ff00' }}
                                >
                                    Hello System. Status report?
                                </div>
                            </div>
                            
                            <div className="self-start max-w-[80%]">
                                <span className="text-[10px] text-gray-600 block mb-1">HEXAGENT</span>
                                <div 
                                    className="text-sm font-mono p-3 rounded-lg bg-[#111] border border-[#222]"
                                    style={{ color: localConfig.ui?.custom_colors?.ai_text || '#06b6d4' }}
                                >
                                    System online. All modules functioning within normal parameters.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === 'services' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                        <h3 className="text-xs font-bold text-cyan-400 mb-4 uppercase tracking-wider border-b border-[#333] pb-2 flex items-center gap-2">
                            <Server size={14} /> Backend Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
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
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">HexAgent Venv Path</label>
                            <input 
                                type="text" 
                                value={localConfig.environment?.venv_path || ''}
                                onChange={(e) => setLocalConfig(prev => ({ ...prev, environment: { ...prev.environment, venv_path: e.target.value } }))}
                                placeholder="/path/to/hexagent/venv"
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">HexStrike Venv Path</label>
                            <input 
                                type="text" 
                                value={localConfig.services?.hexstrike_venv_path || ''}
                                onChange={(e) => updateService('hexstrike_venv_path', e.target.value)}
                                placeholder="/path/to/hexstrike/venv"
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">
                                Path to the dedicated HexStrike virtual environment
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                        <h3 className="text-xs font-bold text-[#00ff00] mb-4 uppercase tracking-wider border-b border-[#333] pb-2 flex items-center gap-2">
                             HexStrike Configuration
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">HexStrike Port</label>
                                <input 
                                    type="number" 
                                    value={localConfig.services?.hexstrike_port || 8888}
                                    onChange={(e) => updateService('hexstrike_port', parseInt(e.target.value))}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-[#00ff00] focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                        <h3 className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-wider border-b border-[#333] pb-2">Shell History</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">Shell Type</label>
                                <select
                                    value={localConfig.system?.shell_type || 'auto'}
                                    onChange={(e) => updateSystem('shell_type', e.target.value)}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                >
                                    <option value="auto">Auto Detect</option>
                                    <option value="zsh">ZSH</option>
                                    <option value="bash">Bash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">History File Path</label>
                                <input
                                    type="text"
                                    value={localConfig.system?.shell_history_path || ''}
                                    onChange={(e) => updateSystem('shell_history_path', e.target.value)}
                                    placeholder="~/.zsh_history or ~/.bash_history"
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                />
                                <p className="text-[10px] text-gray-600 mt-1">Leave empty for auto-detect</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                     <div className="text-center py-6 flex flex-col items-center">
                        <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center border border-[#333] mb-4 shadow-lg shadow-cyan-500/10">
                            <img src="logo.png" className="w-12 h-12 object-contain" alt="logo" />
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">HexAgent GUI</h3>
                        <div className="flex items-center gap-2 mt-2">
                             <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono rounded border border-cyan-500/20">v2.1.0</span>
                             <span className="px-2 py-0.5 bg-[#222] text-gray-400 text-[10px] font-mono rounded border border-[#333]">ALPHA</span>
                        </div>
                        
                        <div className="w-full max-w-sm h-px bg-gradient-to-r from-transparent via-[#333] to-transparent my-6"></div>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                             <div className="p-4 bg-[#111] rounded border border-[#222] text-center">
                                 <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Developer</p>
                                 <p className="text-sm text-white font-medium">Roberto Dantas</p>
                             </div>
                             <div className="p-4 bg-[#111] rounded border border-[#222] text-center">
                                 <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Contact</p>
                                 <p className="text-xs text-cyan-400">robertodantasdecastro@gmail.com</p>
                             </div>
                        </div>
                        
                        <div className="mt-8 p-4 bg-[#080808] border border-[#222] rounded flex flex-col items-center max-w-sm w-full">
                            <h4 className="text-xs font-bold text-yellow-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Database size={12} /> Support Project
                            </h4>
                            <div className="p-1 bg-white rounded mb-2">
                                <img src="qrcode.png" className="w-24 h-24 object-contain" alt="Bitcoin QR" />
                            </div>
                            <code className="text-[10px] text-gray-500 font-mono bg-black px-2 py-1 rounded w-full text-center break-all border border-[#222]">
                                bc1qekh060wjfgspgt32vclmu3fcfx9fr7jh0akuwu
                            </code>
                        </div>

                        <div className="mt-8 text-[10px] text-gray-600 font-mono">
                            <p>Electron: v33.2.1 | Chrome: v130 | Node: v20.18.1</p>
                            <p>Platform: Linux arm64</p>
                        </div>
                     </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end gap-3 rounded-b-lg">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-mono text-gray-400 hover:text-white transition-colors"
            >
                {t ? t('settings.cancel') : 'CANCEL'}
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm font-mono font-bold rounded hover:bg-cyan-500/20 transition-all flex items-center gap-2"
            >
                <Save size={16} /> {t ? t('settings.save') : 'SAVE CONFIGURATION'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
