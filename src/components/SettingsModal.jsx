import { AlertCircle, Code, Database, Globe, RefreshCw, Save, Server, Settings, Shield, Terminal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useProfile from '../hooks/useProfile';
import { SimpleTransition, SlideTransition } from './SimpleTransition';

/** Default config used as fallback if backend is slow or unavailable
 *  Config padrão usado como fallback se o backend estiver lento ou indisponível */
const DEFAULT_CONFIG = {
  system: { theme: 'dark', language: 'auto', auto_save_session: true, debug_mode: false },
  services: { backend_host: '127.0.0.1', flask_port: 5001, hexstrike_host: '127.0.0.1', hexstrike_port: 8888 },
  ui: { custom_colors: {}, animations_enabled: true, compact_mode: false },
  terminal: { shell_type: 'auto' }
};

/** SettingsModal - System Configuration Editor / Editor de Configuração do Sistema */
const SettingsModal = ({ isOpen, onClose, config, onSave, t }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [localConfig, setLocalConfig] = useState(null);
  const [configError, setConfigError] = useState(false);
  const loadTimeoutRef = useRef(null);
  
  const { profile, saveProfile } = useProfile();
  const [localProfile, setLocalProfile] = useState(null);

  // Load config when modal opens / Carregar config quando modal abre
  useEffect(() => {
    if (isOpen && config) {
      setLocalConfig(JSON.parse(JSON.stringify(config)));
      setConfigError(false);
      // Clear any pending timeout / Limpar timeout pendente
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    }
  }, [isOpen, config]);

  // Timeout fallback: if config never arrives in 10s, use defaults
  // Fallback de timeout: se config nunca chegar em 10s, usar defaults
  useEffect(() => {
    if (isOpen && !localConfig) {
      loadTimeoutRef.current = setTimeout(() => {
        if (!localConfig) {
          console.warn('[SettingsModal] Config timeout — using default config');
          setConfigError(true);
        }
      }, 10000);
    }
    return () => { if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current); };
  }, [isOpen, localConfig]);

  useEffect(() => {
    if (isOpen && profile) {
        setLocalProfile(JSON.parse(JSON.stringify(profile)));
    }
  }, [isOpen, profile]);


  const handleSave = async () => {
    if (!localConfig) return;
    try {
        await onSave(localConfig);
        if (localProfile) {
            await saveProfile(localProfile);
        }
        onClose();
    } catch (error) {
        console.error('[SettingsModal] Save error:', error);
    }
  };

  const updateConfig = (section, field, value) => {
    setLocalConfig(prev => {
        if (!prev) return null;
        return { ...prev, [section]: { ...prev[section], [field]: value } };
    });
  };

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

  const tabs = [
    { id: 'general', label: 'GERAL', icon: Settings },
    { id: 'services', label: 'SERVIÇOS', icon: Server },
    { id: 'ui', label: 'INTERFACE', icon: Globe },
    { id: 'terminal', label: 'TERMINAL', icon: Terminal },
    { id: 'system', label: 'SISTEMA', icon: Database }
  ];

  return (
    <SimpleTransition 
        show={isOpen} 
        duration={300}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
        {!localConfig ? (
             <div className="flex flex-col items-center gap-4 animate-fade-in">
                 {configError ? (
                   /* Error state with retry / Estado de erro com retry */
                   <>
                     <AlertCircle size={36} className="text-red-400" />
                     <p className="text-white font-mono text-sm">Failed to load config / Falha ao carregar config</p>
                     <p className="text-gray-500 font-mono text-xs">Backend may be unavailable.</p>
                     <div className="flex gap-3 mt-2">
                       <button
                         onClick={() => { setConfigError(false); setLocalConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG))); }}
                         className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono hover:bg-cyan-500/20"
                       >Use Defaults</button>
                       <button onClick={onClose} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs font-mono">Cancel</button>
                     </div>
                   </>
                 ) : (
                   /* Loading state / Estado de carregamento */
                   <>
                     <RefreshCw size={32} className="animate-spin text-cyan-400" />
                     <p className="text-white font-mono text-sm">Loading System Config...</p>
                     <p className="text-gray-600 font-mono text-xs">Timeout in 10s if backend is unavailable.</p>
                     <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs font-mono">Cancel</button>
                   </>
                 )}
             </div>
        ) : (

            <div 
                className="bg-[#0a0a0a] border border-[#333] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl glass-panel relative animate-slide-up"
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                <div className="absolute inset-0 pointer-events-none rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.15)]" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] relative z-10 bg-[#0a0a0a]/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                            <Settings className="text-cyan-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">
                                System Settings
                            </h2>
                            <p className="text-xs text-gray-500 font-mono">Global Configuration & Preferences</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 bg-[#0f0f0f] border-r border-[#333] flex flex-col py-4 gap-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold transition-all relative group ${
                                        isActive 
                                        ? 'text-cyan-400 bg-cyan-500/10 border-r-2 border-cyan-400' 
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                    <Icon size={16} /> {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050505] relative z-10">
                        {activeTab === 'general' && (
                            <SlideTransition show={true} direction="right" duration={300}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 border-b border-[#222] pb-2">Localization & Appearance</h3>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-mono text-gray-400 mb-2">Language</label>
                                                <select 
                                                    value={localConfig.system?.language || 'auto'} 
                                                    onChange={(e) => updateConfig('system', 'language', e.target.value)} 
                                                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono transition-colors"
                                                >
                                                    <option value="auto">🌍 Auto Detect</option>
                                                    <option value="en">🇬🇧 English</option>
                                                    <option value="pt">🇧🇷 Português</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-mono text-gray-400 mb-2">Theme</label>
                                                <select 
                                                    value={localConfig.system?.theme || 'dark'} 
                                                    onChange={(e) => updateConfig('system', 'theme', e.target.value)} 
                                                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono transition-colors"
                                                >
                                                    <option value="dark">🌙 Dark Mode</option>
                                                    <option value="hacker">💻 Hacker (High Contrast)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 border-b border-[#222] pb-2">Behavior</h3>
                                        
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#222] bg-[#111] hover:border-[#444] transition-colors cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={localConfig.system?.auto_save_session || false} 
                                                    onChange={(e) => updateConfig('system', 'auto_save_session', e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 bg-gray-800"
                                                />
                                                <span className="text-sm text-gray-300 font-mono group-hover:text-white transition-colors">Auto-save sessions on exit</span>
                                            </label>

                                            <label className="flex items-center gap-3 p-3 rounded-lg border border-[#222] bg-[#111] hover:border-[#444] transition-colors cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={localConfig.system?.debug_mode || false} 
                                                    onChange={(e) => updateConfig('system', 'debug_mode', e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 bg-gray-800"
                                                />
                                                <span className="text-sm text-gray-300 font-mono group-hover:text-white transition-colors">Enable Debug Mode (Verdict Logs)</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </SlideTransition>
                        )}

                        {activeTab === 'services' && (
                             <SlideTransition show={true} direction="right" duration={300}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                                        <h3 className="text-xs font-bold text-cyan-400 mb-4 uppercase flex items-center gap-2">
                                            <Server size={14}/> Backend Configuration
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-mono text-gray-500 mb-1">Host</label>
                                                <input 
                                                    type="text" 
                                                    value={localConfig.services?.backend_host || '127.0.0.1'} 
                                                    onChange={(e) => updateConfig('services', 'backend_host', e.target.value)} 
                                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm font-mono focus:border-cyan-500 focus:outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-mono text-gray-500 mb-1">Port</label>
                                                <input 
                                                    type="number" 
                                                    value={localConfig.services?.flask_port || 5001} 
                                                    onChange={(e) => updateConfig('services', 'flask_port', parseInt(e.target.value))} 
                                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm font-mono focus:border-cyan-500 focus:outline-none" 
                                                />
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[10px] text-gray-600 font-mono flex items-center gap-1">
                                            <Shield size={10} /> Requires restart to apply network changes.
                                        </p>
                                    </div>
                                </div>
                             </SlideTransition>
                        )}

                         {activeTab === 'ui' && (
                             <SlideTransition show={true} direction="right" duration={300}>
                                <div className="space-y-6 animate-fade-in">
                                     <div className="p-4 bg-[#111] border border-[#222] rounded-lg">
                                        <h3 className="text-xs text-cyan-400 mb-4 font-bold uppercase tracking-wider">Custom Colors</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-mono">AI Text Color</label>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="color" 
                                                        value={localConfig.ui?.custom_colors?.ai_text || '#06b6d4'} 
                                                        onChange={(e) => updateNestedConfig('ui', 'custom_colors', 'ai_text', e.target.value)}
                                                        className="h-8 w-16 rounded cursor-pointer bg-transparent border-0" 
                                                    />
                                                    <span className="text-xs font-mono text-gray-500">{localConfig.ui?.custom_colors?.ai_text || '#06b6d4'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 font-mono">User Text Color</label>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="color" 
                                                        value={localConfig.ui?.custom_colors?.user_text || '#00ff00'} 
                                                        onChange={(e) => updateNestedConfig('ui', 'custom_colors', 'user_text', e.target.value)}
                                                        className="h-8 w-16 rounded cursor-pointer bg-transparent border-0" 
                                                    />
                                                    <span className="text-xs font-mono text-gray-500">{localConfig.ui?.custom_colors?.user_text || '#00ff00'}</span>
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                             </SlideTransition>
                        )}
                        
                        {(activeTab === 'terminal' || activeTab === 'system') && (
                             <SlideTransition show={true} direction="right" duration={300}>
                                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                    <Code size={48} className="text-gray-600 mb-4" />
                                    <p className="text-gray-500 font-mono">Advanced configuration coming soon.</p>
                                </div>
                             </SlideTransition>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#333] bg-[#0a0a0a] flex justify-between items-center relative z-10">
                    <div className="text-[10px] text-gray-600 font-mono">
                        v2.0.0-REF • HexAgentGUI
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
                            Cancel
                        </button>
                        <button onClick={handleSave} className="px-6 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-bold rounded hover:bg-cyan-500/20 transition-all flex items-center gap-2 uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                            <Save size={14} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        )}
    </SimpleTransition>
  );
};

export default SettingsModal;
