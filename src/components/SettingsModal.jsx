import { Activity, Cpu, Database, Globe, Key, Save, Server, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import { loadConfig } from '../utils/configManager';
import BrainSelector from './BrainSelector';

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
        theme: 'dark',
        auto_save_session: true,
        debug_mode: false,
        cleanup_on_exit: false,
        shell_type: 'auto'
    },
    ui: {
        custom_colors: {}
    }
  });

  const [activeTab, setActiveTab] = useState('general'); // general, api, models, terminal, features, brain, services, appearance, system

  // Loading/saving state / Estado de carregamento/salvamento
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // success, error

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

  // Load configs from backend / Carregar configs do backend
  useEffect(() => {
    const loadAllConfigs = async () => {
      setIsLoading(true);
      try {
        // Load basic configs needed for existing functionality
        const generalConfig = await loadConfig('core/general');
        const modelsConfig = await loadConfig('ai/models');
        
        // Update state if configs loaded
        if (generalConfig) {
          console.log('[Settings] Loaded general config:', generalConfig);
        }
        if (modelsConfig) {
          console.log('[Settings] Loaded models config:', modelsConfig);
        }
      } catch (error) {
        console.error('[Settings] Failed to load configs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadAllConfigs();
    }
  }, [isOpen]);

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

  const updateSystem = (field, value) => {
    setLocalConfig(prev => ({
        ...prev,
        system: { ...prev.system, [field]: value }
    }));
  }

  if (!isOpen) return null;

  console.log('[SettingsModal] Rendering with isOpen:', isOpen, 'config:', config);

  // Ensure localConfig has values even if config is null
  const activeConfig = localConfig || {
    ai: { language: 'auto', max_iterations: 10, temperature: 0.7, model: 'openai/gpt-4-turbo', api_key: '', api_url: '', web_search_enabled: false, unlimited_iterations: false },
    services: { flask_port: 5000, hexstrike_port: 8888, backend_host: '127.0.0.1' },
    system: { theme: 'dark' },
    ui: { custom_colors: {} }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-md" onClick={onClose}>
      <Draggable handle=".drag-handle" bounds="parent" defaultPosition={{x: 0, y: 0}}>
        <div 
          className="bg-[#0a0a0a]/95 border border-[#00ff00] rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm"
          style={{
            width: '75vw',
            minWidth: '800px',
            maxWidth: '95vw',
            height: '80vh',
            minHeight: '600px',
            maxHeight: '95vh',
            boxShadow: '0 0 30px rgba(0, 255, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        
        {/* Header - Draggable */}
        <div className="drag-handle flex items-center justify-between px-6 py-4 border-b border-[#00ff00]/30 bg-gradient-to-r from-[#001a00] to-[#003300] cursor-move">
          <h2 className="text-lg font-bold text-[#00ff00] flex items-center gap-2 font-mono select-none">
            <Settings size={20} /> {t ? t('settings.title') : 'CONFIGURATION'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition hover:rotate-90">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#333] bg-[#0f0f0f] overflow-x-auto">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 px-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Settings size={14} /> GENERAL
            </button>
            <button 
                onClick={() => setActiveTab('api')}
                className={`flex-1 py-3 px-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'api' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Key size={14} /> API KEYS
            </button>
            <button 
                onClick={() => setActiveTab('models')}
                className={`flex-1 py-3 px-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'models' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Activity size={14} /> MODELS
            </button>
            <button 
                onClick={() => setActiveTab('brain')}
                className={`flex-1 py-3 px-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'brain' ? 'border-[#00ff00] text-[#00ff00] bg-[#00ff00]/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Cpu size={14} /> {t ? t('settings.tab_brain') : 'BRAIN'}
            </button>
            <button 
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-3 px-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'services' ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Server size={14} /> SERVICES
            </button>
            <button 
                onClick={() => setActiveTab('appearance')}
                className={`flex-1 py-3 px-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'appearance' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Globe size={14} /> {t ? t('settings.tab_appearance') : 'APPEARANCE'}
            </button>
            <button 
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-3 px-2 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'system' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Database size={14} /> {t ? t('settings.tab_general') : 'SYSTEM'}
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-sm text-gray-400 mb-4">
                        Core application settings and preferences
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Auto Save Sessions</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={localConfig.system?.auto_save_session ?? true}
                                    onChange={(e) => updateSystem('auto_save_session', e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-300">Automatically save chat sessions</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Debug Mode</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    checked={localConfig.system?.debug_mode ?? false}
                                    onChange={(e) => updateSystem('debug_mode', e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-gray-300">Enable debug logging</span>
                            </div>
                        </div>
                        <div className="text-xs text-yellow-500 mt-4">
                            💡 More general settings coming soon in ~/.hexagent-gui/config/
                        </div>
                    </div>
                </div>
            )}

            {/* API KEYS TAB */}
            {activeTab === 'api' && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-sm text-gray-400 mb-4">
                        Configure API keys for AI providers
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">OpenAI API Key</label>
                            <input 
                                type="password"
                                placeholder="sk-..."
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">OpenRouter API Key</label>
                            <input 
                                type="password"
                                placeholder="sk-or-..."
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-red-500 focus:outline-none"
                            />
                        </div>
                        <div className="text-xs text-blue-500 mt-4">
                            🔒 Keys stored in ~/.hexagent-gui/config/core/api_keys.json
                        </div>
                    </div>
                </div>
            )}

            {/* MODELS TAB */}
            {activeTab === 'models' && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-sm text-gray-400 mb-4">
                        AI model selection and parameters
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Default Model</label>
                            <select className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-pink-500 focus:outline-none">
                                <option>openai/gpt-4-turbo</option>
                                <option>openai/gpt-4</option>
                                <option>openai/gpt-3.5-turbo</option>
                                <option>openrouter/anthropic/claude-3-sonnet</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Temperature: 0.7</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="2" 
                                step="0.1" 
                                defaultValue="0.7"
                                className="w-full"
                            />
                        </div>
                        <div className="text-xs text-pink-500 mt-4">
                            ⚙️ Config in ~/.hexagent-gui/config/ai/models.json
                        </div>
                    </div>
                </div>
            )}
            
            {/* BRAIN TAB - AI Engine Selector */}
            {activeTab === 'brain' && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <BrainSelector 
                        currentBrain={localConfig.ai?.provider || 'openai'}
                        onBrainChange={(brainKey) => updateAI('provider', brainKey)}
                    />
                </div>
            )}
            
            {/* TERMINAL TAB */}
            {activeTab === 'terminal' && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-sm text-gray-400 mb-4">
                        Terminal and shell configuration
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Shell Type</label>
                            <select className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none">
                                <option value="auto">Auto-detect</option>
                                <option value="bash">Bash</option>
                                <option value="zsh">Zsh</option>
                                <option value="fish">Fish</option>
                                <option value="powershell">PowerShell</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Color Scheme</label>
                            <select className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none">
                                <option value="kali-zsh">Kali Linux (zsh)</option>
                                <option value="ubuntu">Ubuntu</option>
                                <option value="dracula">Dracula</option>
                                <option value="monokai">Monokai</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Font Size</label>
                            <input 
                                type="number" 
                                min="10" 
                                max="24" 
                                defaultValue="14"
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5 font-mono">Command History</label>
                            <div className="flex items-center gap-2 mb-2">
                                <input type="checkbox" defaultChecked className="w-4 h-4"/>
                                <span className="text-sm text-gray-300">Enable history</span>
                            </div>
                            <input 
                                type="number" 
                                placeholder="Max history size" 
                                defaultValue="1000"
                                className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-green-500 focus:outline-none"
                            />
                        </div>
                        <div className="text-xs text-green-500 mt-4">
                            🖥️ Config in ~/.hexagent-gui/config/terminal/
                        </div>
                    </div>
                </div>
            )}

            {/* FEATURES TAB */}
            {activeTab === 'features' && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-sm text-gray-400 mb-4">
                        Application features and capabilities
                    </div>
                    <div className="space-y-4">
                        <div className="border border-[#333] rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="text-sm font-bold text-white">Web Search</div>
                                    <div className="text-xs text-gray-400">Enable AI to search the web for information</div>
                                </div>
                                <div className="relative inline-block w-12 h-6">
                                    <input type="checkbox" className="sr-only peer"/>
                                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border border-[#333] rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="text-sm font-bold text-white">Auto-Execute</div>
                                    <div className="text-xs text-gray-400">Automatically run safe commands</div>
                                </div>
                                <div className="relative inline-block w-12 h-6">
                                    <input type="checkbox" className="sr-only peer"/>
                                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                </div>
                            </div>
                        </div>

                        <div className="border border-[#333] rounded p-4">
                            <label className="block text-sm font-bold text-white mb-2">Max Iterations</label>
                            <div className="text-xs text-gray-400 mb-3">Maximum number of AI reasoning iterations</div>
                            <input 
                                type="range" 
                                min="1" 
                                max="20" 
                                defaultValue="6"
                                className="w-full"
                            />
                            <div className="text-xs text-gray-300 mt-1">Current: 6</div>
                        </div>

                        <div className="border border-[#333] rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="text-sm font-bold text-white">Auto-Save Sessions</div>
                                    <div className="text-xs text-gray-400">Automatically save chat sessions</div>
                                </div>
                                <div className="relative inline-block w-12 h-6">
                                    <input type="checkbox" defaultChecked className="sr-only peer"/>
                                    <div className="w-12 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-purple-500 mt-4">
                            ⚡ Config in ~/.hexagent-gui/config/features/
                        </div>
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
                    
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider border-b border-[#333] pb-1">Shell History</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-mono">Shell Type</label>
                                <select
                                    value={localConfig.system?.shell_type || 'auto'}
                                    onChange={(e) => updateSystem('shell_type', e.target.value)}
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
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
                                    className="w-full bg-black border border-[#333] rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none font-mono"
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
      </Draggable>
    </div>
  );
};

export default SettingsModal;
