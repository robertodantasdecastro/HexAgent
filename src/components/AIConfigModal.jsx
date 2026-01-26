import { Cpu, Key, RefreshCw, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
// ... (imports)

// ...

// Tabs definition moved inside component to access 't'

/**
 * AIConfigModal - Dynamic AI/LLM Configuration with ProviderFactory Integration
 * Modal dinâmico para configuração de IA/LLM com integração ao ProviderFactory
 */
const AIConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('engine');
  const [availableEngines, setAvailableEngines] = useState(['openai', 'deepseek', 'claude', 'lmstudio', '5ire', 'openrouter']);
  const [loading, setLoading] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  
  // Local state for config editing
  const [localConfig, setLocalConfig] = useState(config || {
      engine: 'openai',
      model: 'gpt-4o',
      max_iterations: 10,
      temperature: 0.7,
      max_tokens: 4000,
      auto_execute: false
  });

  // Effect to update local state when prop changes
  // Effect to update local state when prop changes
  useEffect(() => {
    if (config) {
        setLocalConfig(config);
    }
  }, [config]);

  const testConnection = async () => {
    setLoading(true);
    setConnectionTestResult({ loading: true });
    // ... logic (omitted, will remain)
  };

  const fetchAvailableModels = async (engine) => {
      // ... logic
  };

  const handleSave = () => {
    if (onSave) {
        onSave(localConfig);
    }
  };
  const engineDescriptions = {
    openai: {
      name: 'OpenAI',
      description: 'Standard OpenAI API (GPT-4o, GPT-4 Turbo)',
      requires_api_key: true
    },
    deepseek: {
      name: 'DeepSeek',
      description: 'DeepSeek AI Models (High Performance, Low Cost)',
      requires_api_key: true
    },
    openrouter: {
      name: 'OpenRouter.ai',
      description: 'Access to All Models (GPT, Claude, Llama, Mistral)',
      requires_api_key: true
    },
    claude: {
      name: 'Claude',
      description: 'Anthropic Claude 3.5 Sonnet & Opus',
      requires_api_key: true
    },
    lmstudio: {
      name: 'LM Studio',
      description: 'Local Offline Inference (OpenAI Compatible)',
      requires_api_key: false,
      is_local: true
    },
    '5ire': {
      name: '5ire',
      description: '5ire Local Inference Environment',
      requires_api_key: false,
      is_local: true
    }
  };

  const tabs = [
    { id: 'engine', label: 'Motor / Engine', icon: Cpu },
    { id: 'api', label: 'API & Conexão', icon: Key },
    { id: 'params', label: 'Parâmetros', icon: Settings },
    { id: 'behavior', label: 'Comportamento', icon: RefreshCw },
    { id: 'advanced', label: 'Avançado', icon: Settings }
  ];

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
                  onChange={(e) => setLocalConfig({...localConfig, engine: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                >
                  {Object.keys(engineDescriptions).map(engine => (
                    <option key={engine} value={engine}>
                      {engineDescriptions[engine].name}
                    </option>
                  ))}
                </select>
                
                {/* Engine Description */}
                {engineDescriptions[localConfig.engine] && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-xs text-blue-400 font-mono">
                      💡 {engineDescriptions[localConfig.engine].description}
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
                    onClick={() => fetchAvailableModels(localConfig.engine)}
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
            </div>
          )}

          {/* API Configuration Tab */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              {/* API Key Configuration - For Engines that require it */}
              {(engineDescriptions[localConfig.engine]?.requires_api_key) && (
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    <Key className="inline mr-1" size={14} />
                    API Key / Chave API
                  </label>
                  <input
                    type="password"
                    value={localConfig.api_key}
                    onChange={(e) => setLocalConfig({...localConfig, api_key: e.target.value})}
                    placeholder={`Auth Key for ${engineDescriptions[localConfig.engine].name}`}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Local Server Configuration (LM Studio / 5ire) */}
              {(engineDescriptions[localConfig.engine]?.is_local) && (
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
            <div className="space-y-6">
                <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
                    <h3 className="text-sm font-bold text-green-400 mb-2">HexStrike AI Integration</h3>
                    <p className="text-xs text-gray-400 mb-4">
                        Configuration for the vulnerability scanner and command execution engine.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-mono text-gray-300 mb-1">Status</label>
                             <div className="text-xs font-mono text-green-400 bg-black/40 px-2 py-1 rounded inline-block border border-green-500/20">
                                 ACTIVE (Managed by System)
                             </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-mono text-gray-300 mb-2">HexStrike URL</label>
                         <div className="flex gap-2">
                            <input
                                type="text"
                                value="http://localhost:8888" 
                                disabled
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-gray-500 font-mono text-sm cursor-not-allowed"
                            />
                            <div className="p-2 bg-[#222] rounded border border-[#333] text-gray-400 text-xs flex items-center">
                                Locked
                            </div>
                         </div>
                         <p className="text-[10px] text-gray-600 mt-1">
                             Managed by System Config. To change port, go to Settings `{'>'}` Services.
                         </p>
                    </div>
                </div>
            </div>
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
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/30 transition-all font-mono text-sm"
          >
            Salvar Configuração / Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;
