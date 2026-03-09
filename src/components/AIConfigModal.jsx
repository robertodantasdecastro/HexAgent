// ... imports unchanged
import { Cpu, Key, RefreshCw, Settings, Shield, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react'; // Added useRef
import { DEFAULT_AI_CONFIG, ENGINE_DESCRIPTIONS } from '../constants/aiConfig';
import { useTranslation } from '../hooks/useTranslation';
import APIClient from '../utils/APIClient';
import HexStrikeConfigTab from './chat/HexStrikeConfigTab';

import ProfileConfigTab from './chat/ProfileConfigTab';

/**
 * Helper to ensure robust state initialization
 */
const getInitialConfig = (cfg) => {
    const base = cfg?.ai || cfg || {};
    const engine = base.engine || DEFAULT_AI_CONFIG.engine || 'openai';

    // Check if we have profiles and the active profile
    let activeProfile = {};
    if (base.profiles && base.profiles[engine]) {
        activeProfile = base.profiles[engine];
    }
    
    // Merge defaults with provided config AND active profile
    return {
        ...DEFAULT_AI_CONFIG,
        ...base, // Global settings
        ...activeProfile, // Active Profile settings (Overwrites base keys)
        
        // Ensure critical fields are strings/numbers with fallback hierarchy:
        // 1. Active Profile (New Architecture)
        // 2. Base (Legacy/Flat)
        // 3. Defaults
        api_key: activeProfile.api_key || base.api_key || DEFAULT_AI_CONFIG.api_key || '',
        host: activeProfile.host || base.host || DEFAULT_AI_CONFIG.host || 'http://localhost',
        port: activeProfile.port || base.port || DEFAULT_AI_CONFIG.port || 1234,
        timeout: activeProfile.timeout || base.timeout || DEFAULT_AI_CONFIG.timeout || 60,
        
        active_persona: base.active_persona || '',
        
        // Ensure engine is set
        engine: engine
    };
};

const AIConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const { t } = useTranslation();
  
  // PRIMARY STATE: Configuration of the ACTIVE engine + Globals
  const [localConfig, setLocalConfig] = useState(getInitialConfig(config));
  
  // NEW STATE: Multi-Profile Map (Stores separated configs for openai, lmstudio, etc)
  const [profilesMap, setProfilesMap] = useState({});

  const [activeTab, setActiveTab] = useState('engine');
  const [loading, setLoading] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [availablePersonas, setAvailablePersonas] = useState([]);
  
  const [profileConfig, setProfileConfig] = useState({});
  const [hexConfig, setHexConfig] = useState({});
  const [moltConfig, setMoltConfig] = useState({});
  const [configLoaded, setConfigLoaded] = useState({ profile: false, hex: false, molt: false });

  // Initialize Local Config AND Profiles Map
  useEffect(() => {
    if (config) {
        setLocalConfig(getInitialConfig(config));
        
        // Initialize Profiles Map from backend config if available
        if (config.ai && config.ai.profiles) {
            setProfilesMap(config.ai.profiles);
        }
    }
  }, [config]);

  // Handle Engine Switch with Profile Persistence
  const handleEngineChange = (newEngine) => {
      // 1. Snapshot current settings to the OLD engine's profile
      const oldEngine = localConfig.engine;
      const currentProfileSnapshot = {
          api_key: localConfig.api_key,
          host: localConfig.host,
          port: localConfig.port,
          model: localConfig.model,
          base_url: localConfig.base_url,
          timeout: localConfig.timeout,
          max_tokens: localConfig.max_tokens,
          temperature: localConfig.temperature,
          system_prompt: localConfig.system_prompt
      };

      // Update profiles map
      const updatedProfiles = {
          ...profilesMap,
          [oldEngine]: currentProfileSnapshot
      };
      setProfilesMap(updatedProfiles);

      // 2. Load settings for the NEW engine (or defaults)
      const nextProfile = updatedProfiles[newEngine] || {}; // Use updated map
      
      // Default fallback values if profile doesn't exist
      const defaultHost = newEngine === 'lmstudio' ? 'http://10.211.55.2' : 'http://localhost'; // Smart default
      
      setLocalConfig(prev => ({
          ...prev, // Keep globals like language, auto_execute
          engine: newEngine,
          
          // Load Profile-Specific Fields
          api_key: nextProfile.api_key || '',
          host: nextProfile.host || defaultHost, // Use saved host or default
          port: nextProfile.port || (newEngine === '5ire' ? 5000 : 1234),
          model: nextProfile.model || '', // Will trigger auto-fetch if empty
          timeout: nextProfile.timeout || 60,
          max_tokens: nextProfile.max_tokens || 4096,
          temperature: nextProfile.temperature || 0.7,
          system_prompt: nextProfile.system_prompt || ''
      }));
  };

  const api = APIClient.getInstance();

  // ... fetchSpecificConfig implementation (unchanged) ...
  const fetchSpecificConfig = async (type) => {
      if (type === 'profile' && configLoaded.profile) return;
      if (type === 'hexstrike' && configLoaded.hex) return;
      
      setLoading(true);
      try {
          if (type === 'profile') {
              const res = await api.get('/config/profile');
              if (res.success) { setProfileConfig(res.data); setConfigLoaded(prev => ({...prev, profile: true})); }
          } else if (type === 'hexstrike') {
              const res = await api.get('/hexstrike/config');
              if (res.success) { setHexConfig(res.data); setConfigLoaded(prev => ({...prev, hex: true})); }
          }
      } catch (err) { console.error(`Failed to load ${type}`, err); } finally { setLoading(false); }
  };

  useEffect(() => {
     if (activeTab === 'profile') fetchSpecificConfig('profile');
     if (activeTab === 'hexstrike') fetchSpecificConfig('hexstrike');

  }, [activeTab]);

  const testConnection = async () => {
    setLoading(true);
    setConnectionTestResult({ loading: true });
    try {
      console.log('[AIConfigModal] Testing connection...', {
        engine: localConfig.engine,
        host: localConfig.host,
        port: localConfig.port
      });
      
      const response = await api.post('/config/engines/test', {
        engine: localConfig.engine,
        config: localConfig
      });
      console.log('[AIConfigModal] Test response:', response);

      // CRITICAL FIX: Check response.data.success FIRST (backend payload)
      // Not response.success (APIClient wrapper which just means "HTTP request succeeded")
      // CORREÇÃO CRÍTICA: Verificar response.data.success PRIMEIRO (payload do backend)
      // Não response.success (wrapper APIClient que apenas significa "requisição HTTP sucedeu")
      
      if (response.data && typeof response.data.success !== 'undefined') {
        // Backend explicitly provided success field (preferred)
        // Backend forneceu explicitamente campo success (preferido)
        setConnectionTestResult({
          success: response.data.success,
          message: response.data.message || response.data.message_pt || (response.data.success ? 'Connected' : 'Connection failed'),
          error: response.data.error,
          loading: false
        });
      } else if (response.success) {
        // Fallback: APIClient says request was successful (200 OK)
        // Fallback: APIClient diz que requisição foi bem-sucedida (200 OK)
        setConnectionTestResult({
          success: true,
          message: response.message || response.data?.message || 'Connected successfully',
          loading: false
        });
      } else {
        // Fallback: APIClient says request failed
        // Fallback: APIClient diz que requisição falhou
        setConnectionTestResult({
          success: false,
          error: response.message || response.error || 'Unknown error',
          loading: false
        });
      }
    } catch (error) {
      console.error('[AIConfigModal] Test connection error:', error);
      setConnectionTestResult({
        success: false,
        error: error.message || 'Connection failed',
        loading: false
      });
    } finally {
      setLoading(false);
    }
  };

  /*
   * Fetch models for specific engine
   * Busca modelos para motor específico
   */
  const fetchAvailableModels = useCallback(async (engine, currentConfig) => {
    setLoading(true);
    try {
      const api = APIClient.getInstance();
      const queryParams = new URLSearchParams();
      const cfg = currentConfig || localConfig;
      if (cfg.host) queryParams.append('host', cfg.host);
      if (cfg.port) queryParams.append('port', cfg.port.toString());
      if (cfg.api_key) queryParams.append('api_key', cfg.api_key);

      const response = await api.get(`/config/engines/${engine}/models?${queryParams.toString()}`);
      // DEBUG: Log full response structure / Logar estrutura completa da resposta
      console.log('[DEBUG fetchAvailableModels] Full response:', response);
      
      // Try both response structures / Tentar ambas estruturas de resposta
      let models = null;
      
      if (response && response.data && response.data.models) {
        // APIClient wrapper structure: {success: true, data: {models: [...]}}
        models = response.data.models;
      } else if (response && response.models) {
        // Direct structure: {models: [...]}
        models = response.models;
      }
      
      if (models && Array.isArray(models)) {
        setAvailableModels(models);
        
        // Auto-select first model if current is invalid or empty
        // Selecionar automaticamente o primeiro modelo se o atual for inválido ou vazio
        if (models.length > 0) {
            const currentModel = cfg.model;
            // Check if current model exists in the new list
            // Verificar se o modelo atual existe na nova lista
            const modelExists = models.includes(currentModel);
            
            if (!modelExists) {
                // Update local config with the first available model
                // Atualizar config local com o primeiro modelo disponível
                setLocalConfig(prev => ({ 
                    ...prev, 
                    model: models[0] 
                }));
            }
        }
      } else { setAvailableModels([]); }
    } catch (error) { console.error('Model fetch error', error); setAvailableModels([]); } finally { setLoading(false); }
  }, []); 

  const fetchAvailablePersonas = useCallback(async () => {
    try {
      const api = APIClient.getInstance();
      const response = await api.get('/config/personas');
      if (response && response.data && response.data.personas) {
        setAvailablePersonas(response.data.personas);
      }
    } catch (error) { console.error('Persona fetch error', error); }
  }, []);

  useEffect(() => {
      // Auto-fetch when engine loads/changes
      if (isOpen) {
          if (localConfig.engine) {
              fetchAvailableModels(localConfig.engine, localConfig);
          }
          fetchAvailablePersonas();
      }
  }, [localConfig.engine, isOpen, fetchAvailableModels, fetchAvailablePersonas]);

  const handleSave = async () => {
    setLoading(true);
    try {
        if (onSave) {
             // 1. Prepare Final Config with Profiles
             const activeProfileData = {
                  api_key: localConfig.api_key,
                  host: localConfig.host,
                  port: localConfig.port,
                  model: localConfig.model,
                  base_url: localConfig.base_url,
                  timeout: localConfig.timeout,
                  max_tokens: localConfig.max_tokens,
                  temperature: localConfig.temperature,
                  system_prompt: localConfig.system_prompt
             };

             const finalProfiles = {
                 ...profilesMap,
                 [localConfig.engine]: activeProfileData // Upsert active profile
             };

             const fullConfigPayload = {
                 ...config, // Keep system settings
                 ai: {
                     ...config?.ai,
                     ...localConfig, // Globals + Active
                     profiles: finalProfiles // Nested Profiles
                 }
             };

             await onSave(fullConfigPayload);
        }

        if (configLoaded.profile) await api.post('/config/profile', { config: profileConfig });
        if (configLoaded.hex) await api.post('/hexstrike/config', { config: hexConfig });

        
        onClose();
    } catch (error) { console.error("Save Error:", error); } finally { setLoading(false); }
  };
  
  // ... tabs and render ...
  // Re-using the same tabs and render logic, 
  // ONLY updating the select onChange handler
  
  const tabs = [
    { id: 'engine', label: 'Motor / Engine', icon: Cpu },
    { id: 'api', label: 'API & Connection', icon: Key },
    { id: 'params', label: 'Params', icon: Settings },
    { id: 'behavior', label: 'Behavior', icon: RefreshCw },
    { id: 'profile', label: 'Persona', icon: User },
    { id: 'hexstrike', label: 'Agent Ops', icon: Shield },

  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-[#00ff00]/30 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <Cpu className="text-cyan-400" size={20} />
            <h2 className="text-lg font-bold text-white">Configuração de IA / AI Configuration</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-[#333]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm font-mono transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Engine Selection Tab */}
          {activeTab === 'engine' && (
            <div className="space-y-4">
              {/* Engine Selector */}
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Motor IA / AI Engine
                </label>
                <select
                  value={localConfig.engine}
                  onChange={(e) => handleEngineChange(e.target.value)} 
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                >
                  {ENGINE_DESCRIPTIONS && Object.keys(ENGINE_DESCRIPTIONS).map(engine => (
                    <option key={engine} value={engine}>
                      {ENGINE_DESCRIPTIONS[engine].name}
                    </option>
                  ))}
                </select>
                
                {/* Engine Description */}
                {ENGINE_DESCRIPTIONS && ENGINE_DESCRIPTIONS[localConfig.engine] && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-xs text-blue-400 font-mono">
                      💡 {ENGINE_DESCRIPTIONS[localConfig.engine].description}
                    </p>
                  </div>
                )}
              </div>

              {/* Model Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-mono text-gray-300">
                    Modelo / Model
                  </label>
                  <button
                    onClick={() => fetchAvailableModels(localConfig.engine, localConfig)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    disabled={loading}
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                  </button>
                </div>
                <select
                  value={localConfig.model}
                  onChange={(e) => setLocalConfig({...localConfig, model: e.target.value})}
                  disabled={loading}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                >
                  <option value="">{localConfig.model ? localConfig.model : 'Selecione ou digite / Select or type'}</option>
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <input 
                    type="text" 
                    placeholder="Custom Model ID (Optional)"
                    className="w-full mt-2 bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    value={localConfig.model}
                    onChange={(e) => setLocalConfig({...localConfig, model: e.target.value})}
                />
              </div>

              {/* Persona Selector */}
              <div className="pt-4 border-t border-[#333]">
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  <User className="inline mr-1" size={14} />
                  Agente Base / Base Persona
                </label>
                <select
                  value={localConfig.active_persona}
                  onChange={(e) => setLocalConfig({...localConfig, active_persona: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Padrão (Nenhum) / Default</option>
                  {availablePersonas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define o comportamento e tools da IA / Set Agent behavior & tools
                </p>
              </div>
            </div>
          )}

          {/* API Configuration Tab */}
          {activeTab === 'api' && ENGINE_DESCRIPTIONS && (
            <div className="space-y-4">
              {/* API Key Configuration - For Engines that require it */}
              {(ENGINE_DESCRIPTIONS[localConfig.engine]?.requires_api_key) && (
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    <Key className="inline mr-1" size={14} />
                    API Key / Chave API
                  </label>
                  <input
                    type="password"
                    value={localConfig.api_key}
                    onChange={(e) => setLocalConfig({...localConfig, api_key: e.target.value})}
                    placeholder={`Auth Key for ${ENGINE_DESCRIPTIONS[localConfig.engine].name}`}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Local Server Configuration (LM Studio / 5ire) */}
              {(ENGINE_DESCRIPTIONS[localConfig.engine]?.is_local) && (
                <>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded mb-4">
                    <p className="text-xs text-blue-400 font-mono">
                      💡 <strong>Local Inference:</strong> {localConfig.engine === '5ire' ? '5ire Environment' : 'LM Studio'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Server Host / Host do Servidor
                    </label>
                    <input
                      type="text"
                      value={localConfig.host}
                       onChange={(e) => setLocalConfig({...localConfig, host: e.target.value})}
                      placeholder="http://localhost"
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Server Port / Porta do Servidor
                    </label>
                    <input
                      type="number"
                      value={localConfig.port}
                      onChange={(e) => setLocalConfig({...localConfig, port: parseInt(e.target.value) || (localConfig.engine === '5ire' ? 5000 : 1234)})}
                      placeholder={localConfig.engine === '5ire' ? "5000" : "1234"}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Request Timeout / Timeout: {localConfig.timeout}s
                    </label>
                    <input
                      type="range"
                      value={localConfig.timeout}
                      onChange={(e) => setLocalConfig({...localConfig, timeout: parseInt(e.target.value)})}
                      min="10"
                      max="300"
                      step="10"
                      className="w-full accent-cyan-400"
                    />
                  </div>
                </>
              )}

              {/* Connection Test - All Engines */}
              <button
                onClick={testConnection}
                disabled={connectionTestResult?.loading}
                className="w-full py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded hover:bg-green-500/30 transition-all font-mono text-sm disabled:opacity-50"
              >
                {connectionTestResult?.loading ? 'Testando...' : 'Testar Conexão / Test Connection'}
              </button>

              {/* Test Result */}
              {connectionTestResult && !connectionTestResult.loading && (
                <div className={`p-3 rounded border ${
                  connectionTestResult.success
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <p className={`text-sm font-mono ${
                    connectionTestResult.success ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {connectionTestResult.success ? '✅ ' : '❌ '}
                    {connectionTestResult.message || connectionTestResult.message_pt}
                  </p>
                  {connectionTestResult.error && (
                    <p className="text-xs text-red-300 mt-1 font-mono">
                      Error: {connectionTestResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Parameters Tab */}
          {activeTab === 'params' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Temperatura / Temperature: {localConfig.temperature.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localConfig.temperature}
                  onChange={(e) => setLocalConfig({...localConfig, temperature: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Preciso / Precise (0.0)</span>
                  <span>Criativo / Creative (2.0)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={localConfig.max_tokens}
                  onChange={(e) => setLocalConfig({...localConfig, max_tokens: parseInt(e.target.value)})}
                  min="100"
                  max="128000"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* Behavior Tab */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#333]">
                <div>
                  <p className="text-sm font-mono text-white">Auto-Executar Comandos / Auto-Execute Commands</p>
                  <p className="text-xs text-gray-500">Executar automaticamente comandos sugeridos pela IA</p>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.auto_execute}
                  onChange={(e) => setLocalConfig({...localConfig, auto_execute: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Iterações Máximas / Max Iterations: {localConfig.unlimited_iterations ? '∞' : localConfig.max_iterations}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={localConfig.max_iterations}
                  onChange={(e) => setLocalConfig({...localConfig, max_iterations: parseInt(e.target.value)})}
                  disabled={localConfig.unlimited_iterations}
                  className="w-full"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="unlimited"
                    checked={localConfig.unlimited_iterations}
                    onChange={(e) => setLocalConfig({...localConfig, unlimited_iterations: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="unlimited" className="text-xs text-gray-400 font-mono">
                    Ilimitado / Unlimited
                  </label>
                </div>
              </div>
            </div>
          )}

            {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  System Prompt Customizado / Custom System Prompt
                </label>
                <textarea
                  value={localConfig.system_prompt}
                  onChange={(e) => setLocalConfig({...localConfig, system_prompt: e.target.value})}
                  rows={6}
                  placeholder="You are HexAgent, an elite autonomous cybersecurity AI assistant..."
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe vazio para usar prompt padrão / Leave empty for default prompt
                </p>
              </div>
            </div>
          )}

            {/* HexStrike Tab */}
          {activeTab === 'hexstrike' && (
             <HexStrikeConfigTab config={hexConfig} onChange={setHexConfig} />
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
             <ProfileConfigTab config={profileConfig} onChange={setProfileConfig} />
          )}


        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#333]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-mono text-gray-400 hover:text-white transition-colors"
          >
            Cancelar / Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/30 transition-all font-mono text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
            {loading ? 'Salvando... / Saving...' : 'Salvar Configuração / Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;
