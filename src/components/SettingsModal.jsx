import { Database, Globe, RefreshCw, Save, Server, Settings, Terminal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import useProfile from '../hooks/useProfile'; // Keep profile hook as it manages separate profile.json

/**
 * SettingsModal - System Configuration Editor
 * Editor de Configuração do Sistema
 * 
 * Architecture:
 * - Local State Draft (Rascunho de Estado Local)
 * - Explicit Save (Salvar Explícito)
 * - Strict Mapping to system-config.json
 */
const SettingsModal = ({ isOpen, onClose, config, onSave, t }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [localConfig, setLocalConfig] = useState(null);
  
  // Keep Profile integration but ensure it doesn't block system config
  const { profile, saveProfile } = useProfile();
  const [localProfile, setLocalProfile] = useState(null);

  // Hydrate from Props - Single Source of Truth for Initialization
  useEffect(() => {
    if (isOpen && config) {
      console.log('[SettingsModal] Hydrating from props:', config);
      
      // Deep copy to prevent reference issues
      // Cópia profunda para evitar problemas de referência
      setLocalConfig(JSON.parse(JSON.stringify(config)));
    }
  }, [isOpen, config]);

  // Hydrate Profile
  useEffect(() => {
    if (isOpen && profile) {
        setLocalProfile(JSON.parse(JSON.stringify(profile)));
    }
  }, [isOpen, profile]);

  const handleSave = async () => {
    if (!localConfig) return;

    try {
        console.log('[SettingsModal] Saving config:', localConfig);
        await onSave(localConfig);
        
        if (localProfile) {
            await saveProfile(localProfile);
        }
        
        onClose();
    } catch (error) {
        console.error('[SettingsModal] Save error:', error);
    }
  };

  // Helper to update System Config sections safely
  const updateConfig = (section, field, value) => {
    setLocalConfig(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        };
    });
  };

  // Helper for deeply nested updates (e.g., ui.custom_colors)
  const updateNestedConfig = (section, subsection, field, value) => {
      setLocalConfig(prev => {
          if (!prev) return null;
          return {
              ...prev,
              [section]: {
                  ...prev[section],
                  [subsection]: {
                      ...prev[section]?.[subsection],
                      [field]: value
                  }
              }
          };
      });
  };

  if (!isOpen) return null;

  // Loading State with Automatic Timeout Fallback
  // Estado de Carregamento com Fallback de Timeout Automático
  if (!localConfig) {
      // If config is missing for too long, we should probably just initialize with defaults or allow escape
      // Se a config estiver faltando por muito tempo, devemos provavelmente inicializar com padrões ou permitir saída
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
             <div className="flex flex-col items-center gap-4">
                 <RefreshCw size={32} className="animate-spin text-cyan-400" />
                 <p className="text-white font-mono text-sm">Loading System Config...</p>
                 <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            // Emergency init if stuck
                            setLocalConfig({ 
                                system: { language: 'auto', theme: 'dark' },
                                services: { backend_host: '127.0.0.1', flask_port: 5000 },
                                ui: { custom_colors: {} },
                                terminal: { shell_type: 'auto' }
                            });
                        }}
                        className="mt-4 px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/20 text-xs font-mono"
                     >
                        Use Defaults
                     </button>
                     <button 
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 text-xs font-mono"
                     >
                        Force Close
                     </button>
                 </div>
             </div>
        </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'GERAL / GENERAL', icon: Settings },
    { id: 'services', label: 'SERVIÇOS / SERVICES', icon: Server },
    { id: 'ui', label: 'INTERFACE / UI', icon: Globe },
    { id: 'terminal', label: 'TERMINAL', icon: Terminal },
    { id: 'system', label: 'SISTEMA / SYSTEM', icon: Database }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#0a0a0a] border border-[#00ff00]/30 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                <div className="flex items-center gap-3">
                    <Settings className="text-cyan-400" size={20} />
                    <h2 className="text-lg font-bold text-white tracking-wide">
                        Configurações do Sistema / System Settings
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

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0a0a0a]">
                
                {/* --- GENERAL TAB --- */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                            <p className="text-xs text-blue-400 font-mono">
                                ℹ️ Configurações e preferências principais da aplicação
                            </p>
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wider">
                                Idioma / Language
                            </label>
                            <select
                                value={localConfig.system?.language || 'auto'}
                                onChange={(e) => updateConfig('system', 'language', e.target.value)}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                            >
                                <option value="auto">🌍 Auto Detect</option>
                                <option value="en">🇬🇧 English</option>
                                <option value="pt">🇧🇷 Português</option>
                                <option value="es">🇪🇸 Español</option>
                            </select>
                        </div>

                        {/* Theme */}
                        <div>
                            <label className="block text-xs font-mono text-cyan-400 mb-2 uppercase tracking-wider">
                                Tema / Theme
                            </label>
                            <select
                                value={localConfig.system?.theme || 'dark'}
                                onChange={(e) => updateConfig('system', 'theme', e.target.value)}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                            >
                                <option value="dark">🌙 Dark Mode</option>
                                <option value="light">☀️ Light Mode</option>
                                <option value="hacker">💻 Hacker (High Contrast)</option>
                            </select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-4 pt-2">
                             {/* Auto Save */}
                            <div className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded hover:border-[#333] transition">
                                <div>
                                    <label className="block text-sm font-bold text-gray-200 mb-1">Salvar Sessões Automaticamente</label>
                                    <div className="text-xs text-gray-500">Salvar sessões de chat automaticamente</div>
                                </div>
                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                    <input 
                                        type="checkbox" 
                                        id="auto_save_toggle"
                                        className="peer sr-only"
                                        checked={!!localConfig.system?.auto_save_session}
                                        onChange={(e) => updateConfig('system', 'auto_save_session', e.target.checked)}
                                    />
                                    <label 
                                        htmlFor="auto_save_toggle"
                                        className="block bg-gray-700 w-12 h-6 rounded-full peer-checked:bg-cyan-500 cursor-pointer transition-colors relative"
                                    >
                                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                                    </label>
                                </div>
                            </div>

                             {/* Debug Mode */}
                             <div className="flex items-center justify-between p-3 bg-[#111] border border-[#222] rounded hover:border-[#333] transition">
                                <div>
                                    <label className="block text-sm font-bold text-gray-200 mb-1">Modo Debug</label>
                                    <div className="text-xs text-gray-500">Ativar registro de debug detalhado e logs visíveis</div>
                                </div>
                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                    <input 
                                        type="checkbox" 
                                        id="debug_mode_toggle"
                                        className="peer sr-only"
                                        checked={!!localConfig.system?.debug_mode}
                                        onChange={(e) => updateConfig('system', 'debug_mode', e.target.checked)}
                                    />
                                    <label 
                                        htmlFor="debug_mode_toggle"
                                        className="block bg-gray-700 w-12 h-6 rounded-full peer-checked:bg-cyan-500 cursor-pointer transition-colors relative"
                                    >
                                        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SERVICES TAB --- */}
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                            <h3 className="text-xs font-bold text-cyan-400 mb-4 uppercase tracking-wider border-b border-[#333] pb-2 flex items-center gap-2">
                                <Server size={14} /> Backend & Ports
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-mono">Backend Host</label>
                                    <input 
                                        type="text" 
                                        value={localConfig.services?.backend_host || '127.0.0.1'}
                                        onChange={(e) => updateConfig('services', 'backend_host', e.target.value)}
                                        className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-mono">Flask Port</label>
                                    <input 
                                        type="number" 
                                        value={localConfig.services?.flask_port || 5000}
                                        onChange={(e) => updateConfig('services', 'flask_port', parseInt(e.target.value))}
                                        className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                            <h3 className="text-xs font-bold text-green-500 mb-4 uppercase tracking-wider border-b border-[#333] pb-2 flex items-center gap-2">
                                <Server size={14} /> HexStrike Integration
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-mono">HexStrike Host</label>
                                    <input 
                                        type="text" 
                                        value={localConfig.services?.hexstrike_host || '127.0.0.1'}
                                        disabled
                                        className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-gray-500 text-sm font-mono cursor-not-allowed"
                                        title="Locked for security"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-mono">HexStrike Port</label>
                                    <input 
                                        type="number" 
                                        value={localConfig.services?.hexstrike_port || 8888}
                                        onChange={(e) => updateConfig('services', 'hexstrike_port', parseInt(e.target.value))}
                                        className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none font-mono"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">HexStrike Venv Path</label>
                                <input 
                                    type="text" 
                                    value={localConfig.services?.hexstrike_venv_path || ''}
                                    onChange={(e) => updateConfig('services', 'hexstrike_venv_path', e.target.value)}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- UI TAB --- */}
                {activeTab === 'ui' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                             {/* AI Text Color */}
                            <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                                <label className="block text-xs text-cyan-400 mb-3 font-mono uppercase tracking-wider">AI Text Color</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={localConfig.ui?.custom_colors?.ai_text || '#06b6d4'}
                                        onChange={(e) => updateNestedConfig('ui', 'custom_colors', 'ai_text', e.target.value)}
                                        className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#333]"
                                    />
                                    <span className="text-xs font-mono text-gray-400 bg-black px-2 py-1 rounded">{localConfig.ui?.custom_colors?.ai_text || '#06b6d4'}</span>
                                </div>
                            </div>

                            {/* User Text Color */}
                            <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                                <label className="block text-xs text-green-500 mb-3 font-mono uppercase tracking-wider">User Text Color</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={localConfig.ui?.custom_colors?.user_text || '#00ff00'}
                                        onChange={(e) => updateNestedConfig('ui', 'custom_colors', 'user_text', e.target.value)}
                                        className="w-10 h-10 rounded cursor-pointer bg-transparent border border-[#333]"
                                    />
                                    <span className="text-xs font-mono text-gray-400 bg-black px-2 py-1 rounded">{localConfig.ui?.custom_colors?.user_text || '#00ff00'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="p-6 rounded-lg border border-[#333] bg-[#050505] space-y-4">
                            <div className="text-xs text-gray-600 font-mono tracking-widest uppercase mb-2">Live Preview</div>
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

                 {/* --- TERMINAL TAB --- */}
                 {activeTab === 'terminal' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                            <h3 className="text-xs font-bold text-indigo-400 mb-4 uppercase tracking-wider border-b border-[#333] pb-2">Shell Configuration</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-mono">Shell Type</label>
                                    <select
                                        value={localConfig.terminal?.shell_type || 'auto'}
                                        onChange={(e) => updateConfig('terminal', 'shell_type', e.target.value)}
                                        className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                    >
                                        <option value="auto">Auto Detect</option>
                                        <option value="zsh">ZSH (/bin/zsh)</option>
                                        <option value="bash">Bash (/bin/bash)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1.5 font-mono">History File Path</label>
                                    <input
                                        type="text"
                                        value={localConfig.terminal?.history_path || ''}
                                        onChange={(e) => updateConfig('terminal', 'history_path', e.target.value)}
                                        placeholder="~/.zsh_history or ~/.bash_history"
                                        className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none font-mono"
                                    />
                                    <p className="text-[10px] text-gray-600 mt-1">Leave empty for auto-detect based on shell type.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                 {/* --- SYSTEM INFO TAB --- */}
                 {activeTab === 'system' && (
                     <div className="flex flex-col items-center justify-center py-8">
                         <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center border border-[#333] mb-4 shadow-lg shadow-cyan-500/10">
                            <img src="logo.png" className="w-16 h-16 object-contain" alt="HexAgent" />
                        </div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">HexAgent GUI</h3>
                         <div className="flex items-center gap-2 mt-2 mb-8">
                             <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono rounded border border-cyan-500/20">v2.1.0</span>
                             <span className="px-2 py-0.5 bg-[#222] text-gray-400 text-[10px] font-mono rounded border border-[#333]">REL_CANDIDATE</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
                            <div className="p-4 bg-[#111] rounded border border-[#222] text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Developer</p>
                                <p className="text-sm text-white font-medium">Roberto Dantas</p>
                            </div>
                             <div className="p-4 bg-[#111] rounded border border-[#222] text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Support</p>
                                <p className="text-xs text-cyan-400 break-all">robertodantasdecastro@gmail.com</p>
                            </div>
                        </div>
                        <div className="w-full max-w-lg p-4 bg-[#1a1a1a] rounded border border-[#333]">
                           <h4 className="text-xs font-bold text-yellow-500 mb-3 uppercase tracking-wider text-center">Software Information</h4>
                           <div className="text-[10px] font-mono text-gray-400 space-y-1">
                               <div className="flex justify-between"><span>GUI Path:</span> <span>{localConfig.environment?.cwd || 'Unknown'}</span></div>
                               <div className="flex justify-between"><span>Venv Path:</span> <span>{localConfig.environment?.venv_path || 'Unknown'}</span></div>
                               <div className="flex justify-between"><span>Node:</span> <span>v20.18.1</span></div>
                               <div className="flex justify-between"><span>Electron:</span> <span>v33.2.1</span></div>
                           </div>
                        </div>
                     </div>
                 )}

            </div>

             {/* Footer */}
            <div className="p-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-mono text-gray-400 hover:text-white transition-colors"
                >
                    Cancelar / Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-sm font-mono font-bold rounded hover:bg-cyan-500/20 transition-all flex items-center gap-2"
                >
                    <Save size={16} /> Salvar Alterações / Save Changes
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;

