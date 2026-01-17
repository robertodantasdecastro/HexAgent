import { Code, Cpu, Key, RefreshCw, Sliders, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import APIClient from '../utils/APIClient';

/**
 * AIConfigModal - Dynamic AI/LLM Configuration with ProviderFactory Integration
 * Modal dinâmico para configuração de IA/LLM com integração ao ProviderFactory
 */
const AIConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('engine');
  const [availableEngines, setAvailableEngines] = useState(['hexsecgpt']);
  const [availableModels, setAvailableModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  
  const [aiConfig, setAiConfig] = useState({
    engine: 'hexsecgpt',
    model: '',
    api_key: '',
    host: 'http://localhost',      // LM Studio server host
    port: 1234,                     // LM Studio server port  
    timeout: 60,                    // Request timeout (seconds)
    temperature: 0.7,
    max_tokens: 4000,
    max_iterations: 10,
    unlimited_iterations: false,
    auto_execute: false,
    system_prompt: ''
  });

  useEffect(() => {
    if (config?.ai) {
      setAiConfig({
        engine: config.ai.engine || 'hexsecgpt',
        model: config.ai.model || '',
        api_key: config.ai.api_key || '',
        host: config.ai.host || 'http://localhost',
        port: config.ai.port || 1234,
        timeout: config.ai.timeout || 60,
        temperature: config.ai.temperature || 0.7,
        max_tokens: config.ai.max_tokens || 4000,
        max_iterations: config.ai.max_iterations || 10,
        unlimited_iterations: config.ai.unlimited_iterations || false,
        auto_execute: config.ai.auto_execute || false,
        system_prompt: config.ai.system_prompt || ''
      });
    }
  }, [config, isOpen]);

  // Fetch available models when engine changes / Busca modelos quando engine muda
  useEffect(() => {
    if (isOpen && aiConfig.engine) {
      fetchAvailableModels(aiConfig.engine);
    }
  }, [aiConfig.engine, isOpen]);

  const fetchAvailableModels = async (engine) => {
    try {
      setLoading(true);
      // Corrected endpoint: /config/engines/:engine/models
      const api = APIClient.getInstance();
      const result = await api.get(`/config/engines/${engine}/models`);
      
      if (result.success) {
        setAvailableModels(result.data.models || []);
        
        // Set default model if current is empty / Define modelo padrão se atual está vazio
        if (!aiConfig.model && result.data.models && result.data.models.length > 0) {
          setAiConfig(prev => ({ ...prev, model: result.data.models[0] }));
        }
      } else {
        throw new Error(result.message || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      // Fallback for HexSecGPT / Fallback para HexSecGPT
      if (engine === 'hexsecgpt') {
        const fallbackModels = [
          'google/gemini-2.0-flash-exp:free',
          'google/gemini-pro',
          'meta-llama/llama-3.2-90b-vision-instruct:free'
        ];
        setAvailableModels(fallbackModels);
        if (!aiConfig.model) {
          setAiConfig(prev => ({ ...prev, model: fallbackModels[0] }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // Build engine-specific configuration / Construir configuração específica do engine
    const configToSave = {
      ai: {
        engine: aiConfig.engine,
        model: aiConfig.model,
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.max_tokens,
        max_iterations: aiConfig.max_iterations,
        unlimited_iterations: aiConfig.unlimited_iterations,
        auto_execute: aiConfig.auto_execute,
        system_prompt: aiConfig.system_prompt,
        // Conditional fields based on engine / Campos condicionais baseados no engine
        ...(aiConfig.engine === 'hexsecgpt' && {
          api_key: aiConfig.api_key
        }),
        ...(aiConfig.engine === 'lmstudio' && {
          host: aiConfig.host,
          port: aiConfig.port,
          timeout: aiConfig.timeout
        })
      }
    };
    
    onSave(configToSave);
    onClose();
  };

  const testConnection = async () => {
    try {
      setConnectionTestResult({ loading: true });
      
      // Build engine-specific config / Construir config específica do engine
      const testConfig = aiConfig.engine === 'lmstudio'
        ? {
            host: aiConfig.host,
            port: aiConfig.port,
            model: aiConfig.model,
            timeout: aiConfig.timeout
          }
        : {
            api_key: aiConfig.api_key,
            model: aiConfig.model
          };
      
      // Corrected endpoint: /config/engines/test
      const api = APIClient.getInstance();
      const result = await api.post('/config/engines/test', {
        engine: aiConfig.engine,
        config: testConfig
      });
      
      if (result.success) {
        setConnectionTestResult(result.data);
      } else {
        throw new Error(result.message || 'Test failed');
      }
      
      setTimeout(() => setConnectionTestResult(null), 5000);
    } catch (error) {
      setConnectionTestResult({
        success: false,
        error: error.message
      });
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'engine', label: t('aiconfig.tabs.engine', 'Motor'), icon: Cpu },
    { id: 'api', label: t('aiconfig.tabs.api', 'API'), icon: Key },
    { id: 'params', label: t('aiconfig.tabs.params', 'Parâmetros'), icon: Sliders },
    { id: 'behavior', label: t('aiconfig.tabs.behavior', 'Comportamento'), icon: Zap },
    { id: 'advanced', label: t('aiconfig.tabs.advanced', 'Avançado'), icon: Code }
  ];

  // Engine descriptions / Descrições dos engines
  const engineDescriptions = {
    hexsecgpt: {
      name: 'HexSecGPT',
      description: 'OpenRouter-based multi-model access / Acesso multi-modelo via OpenRouter',
      requires_api_key: true
    },
    openai: {
      name: 'OpenAI',
      description: 'Direct OpenAI API (ChatGPT) / API direta OpenAI (ChatGPT)',
      requires_api_key: true,
      status: 'template'
    },
    deepseek: {
      name: 'DeepSeek',
      description: 'DeepSeek AI models / Modelos DeepSeek AI',
      requires_api_key: true,
      status: 'template'
    },
    ollama: {
      name: 'Ollama',
      description: 'Local AI models (offline) / Modelos IA locais (offline)',
      requires_api_key: false,
      status: 'template'
    }
  };

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
                  value={aiConfig.engine}
                  onChange={(e) => setAiConfig({...aiConfig, engine: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                >
                  {availableEngines.map(engine => {
                    const desc = engineDescriptions[engine] || { name: engine };
                    return (
                      <option key={engine} value={engine}>
                        {desc.name} {desc.status === 'template' ? '(Template)' : ''}
                      </option>
                    );
                  })}
                </select>
                
                {/* Engine Description */}
                {engineDescriptions[aiConfig.engine] && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-xs text-blue-400 font-mono">
                      💡 {engineDescriptions[aiConfig.engine].description}
                    </p>
                    {engineDescriptions[aiConfig.engine].status === 'template' && (
                      <p className="text-xs text-yellow-400 font-mono mt-1">
                        ⚠️ Este provider está em template. Implemente seguindo provider_development_guide.md
                      </p>
                    )}
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
                    onClick={() => fetchAvailableModels(aiConfig.engine)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    disabled={loading}
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    Atualizar
                  </button>
                </div>
                <select
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                  disabled={loading || availableModels.length === 0}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                >
                  {availableModels.length === 0 && (
                    <option>Nenhum modelo disponível / No models available</option>
                  )}
                  {availableModels.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {availableModels.length} modelo(s) disponível(is) para {aiConfig.engine}
                </p>
              </div>
            </div>
          )}

          {/* API Configuration Tab */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              {/* HexSecGPT - API Key Configuration */}
              {aiConfig.engine === 'hexsecgpt' && (
                <div>
                  <label className="block text-sm font-mono text-gray-300 mb-2">
                    <Key className="inline mr-1" size={14} />
                    API Key / Chave API
                  </label>
                  <input
                    type="password"
                    value={aiConfig.api_key}
                    onChange={(e) => setAiConfig({...aiConfig, api_key: e.target.value})}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Obtenha sua chave em <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">openrouter.ai/ keys</a>
                  </p>
                </div>
              )}

              {/* LM Studio - Local Server Configuration */}
              {aiConfig.engine === 'lmstudio' && (
                <>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded mb-4">
                    <p className="text-xs text-blue-400 font-mono">
                      💡 <strong>LM Studio Local:</strong> Privacidade total, sem internet, modelos sob seu controle
                    </p>
                    <p className="text-xs text-blue-400 font-mono mt-1">
                      Inicie o servidor local no LM Studio antes de usar
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Server Host / Host do Servidor
                    </label>
                    <input
                      type="text"
                      value={aiConfig.host}
                      onChange={(e) => setAiConfig({...aiConfig, host: e.target.value})}
                      placeholder="http://localhost"
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      URL do servidor LM Studio (local ou remoto)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Server Port / Porta do Servidor
                    </label>
                    <input
                      type="number"
                      value={aiConfig.port}
                      onChange={(e) => setAiConfig({...aiConfig, port: parseInt(e.target.value) || 1234})}
                      min="1"
                      max="65535"
                      placeholder="1234"
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      Porta padrão do LM Studio: 1234
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-mono text-gray-300 mb-2">
                      Request Timeout / Timeout da Requisição: {aiConfig.timeout}s
                    </label>
                    <input
                      type="range"
                      value={aiConfig.timeout}
                      onChange={(e) => setAiConfig({...aiConfig, timeout: parseInt(e.target.value)})}
                      min="10"
                      max="300"
                      step="10"
                      className="w-full accent-cyan-400"
                    />
                    <div className="flex justify-between text-xs text-gray-500 font-mono mt-1">
                      <span>10s (rápido)</span>
                      <span>300s (lento)</span>
                    </div>
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
                  Temperatura / Temperature: {aiConfig.temperature.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={aiConfig.temperature}
                  onChange={(e) => setAiConfig({...aiConfig, temperature: parseFloat(e.target.value)})}
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
                  value={aiConfig.max_tokens}
                  onChange={(e) => setAiConfig({...aiConfig, max_tokens: parseInt(e.target.value)})}
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
                  checked={aiConfig.auto_execute}
                  onChange={(e) => setAiConfig({...aiConfig, auto_execute: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Iterações Máximas / Max Iterations: {aiConfig.unlimited_iterations ? '∞' : aiConfig.max_iterations}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={aiConfig.max_iterations}
                  onChange={(e) => setAiConfig({...aiConfig, max_iterations: parseInt(e.target.value)})}
                  disabled={aiConfig.unlimited_iterations}
                  className="w-full"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="unlimited"
                    checked={aiConfig.unlimited_iterations}
                    onChange={(e) => setAiConfig({...aiConfig, unlimited_iterations: e.target.checked})}
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
                  value={aiConfig.system_prompt}
                  onChange={(e) => setAiConfig({...aiConfig, system_prompt: e.target.value})}
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
