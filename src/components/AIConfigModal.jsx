import { Code, Cpu, Key, Sliders, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

/**
 * AIConfigModal - Dedicated AI/LLM Configuration
 * Modal dedicado para configuração de IA/LLM
 * 
 * Separated from system settings for better organization
 * Separado das configurações de sistema para melhor organização
 */
const AIConfigModal = ({ isOpen, onClose, config, onSave }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('engine');
  const [aiConfig, setAiConfig] = useState({
    model: 'openai/gpt-4-turbo',
    api_key: '',
    api_url: '',
    temperature: 0.7,
    max_tokens: 4000,
    max_iterations: 10,
    unlimited_iterations: false,
    auto_execute: false,
    web_search_enabled: false,
    system_prompt: '',
    stream_responses: true
  });

  useEffect(() => {
    if (config?.ai) {
      setAiConfig({
        model: config.ai.model || 'openai/gpt-4-turbo',
        api_key: config.ai.api_key || '',
        api_url: config.ai.api_url || '',
        temperature: config.ai.temperature || 0.7,
        max_tokens: config.ai.max_tokens || 4000,
        max_iterations: config.ai.max_iterations || 10,
        unlimited_iterations: config.ai.unlimited_iterations || false,
        auto_execute: config.ai.auto_execute || false,
        web_search_enabled: config.ai.web_search_enabled || false,
        system_prompt: config.ai.system_prompt || '',
        stream_responses: config.ai.stream_responses !== false
      });
    }
  }, [config]);

  const handleSave = () => {
    onSave({ ai: aiConfig });
    onClose();
  };

  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: aiConfig.api_key, model: aiConfig.model })
      });
      const data = await response.json();
      alert(data.success ? t('aiconfig.api.test_success', '✅ Connection successful!') : `${t('aiconfig.api.test_failed', '❌ Connection failed:')} ${data.error}`);
    } catch (error) {
      alert(`${t('aiconfig.api.test_failed', '❌ Connection failed:')} ${error.message}`);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'engine', label: t('aiconfig.tabs.engine', 'Engine'), icon: Cpu },
    { id: 'api', label: t('aiconfig.tabs.api', 'API'), icon: Key },
    { id: 'params', label: t('aiconfig.tabs.params', 'Parameters'), icon: Sliders },
    { id: 'behavior', label: t('aiconfig.tabs.behavior', 'Behavior'), icon: Zap },
    { id: 'advanced', label: t('aiconfig.tabs.advanced', 'Advanced'), icon: Code }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-[#00ff00]/30 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <Cpu className="text-cyan-400" size={20} />
            <h2 className="text-lg font-bold text-white">{t('aiconfig.title', 'AI Configuration')}</h2>
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
          {/* Engine Selection */}
          {activeTab === 'engine' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">{t('aiconfig.engine.model', 'Model')}</label>
                <select
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                >
                  <optgroup label="OpenAI">
                    <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="openai/gpt-4">GPT-4</option>
                    <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </optgroup>
                  <optgroup label="Anthropic">
                    <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                    <option value="anthropic/claude-3-sonnet">Claude 3 Sonnet</option>
                  </optgroup>
                  <optgroup label="Google">
                    <option value="google/gemini-pro">Gemini Pro</option>
                  </optgroup>
                  <optgroup label="Meta">
                    <option value="meta-llama/llama-3-70b">Llama 3 70B</option>
                  </optgroup>
                </select>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-4">
                <p className="text-xs text-blue-400 font-mono">
                  💡 <strong>Tip:</strong> GPT-4 Turbo offers the best balance of capability and cost.
                  Use Claude 3 Opus for complex reasoning tasks.
                </p>
              </div>
            </div>
          )}

          {/* API Configuration */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  API Key / Chave API
                </label>
                <input
                  type="password"
                  value={aiConfig.api_key}
                  onChange={(e) => setAiConfig({...aiConfig, api_key: e.target.value})}
                  placeholder="sk-..."
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
                <p className="text-xs text-gray-500 mt-1 font-mono">{t('aiconfig.api.key_desc', 'Stored securely in ~/.hexagent-gui/config.json')}</p>
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">{t('aiconfig.api.url', 'API URL')} ({t('common.optional', 'Optional')})</label>
                <input
                  type="text"
                  value={aiConfig.api_url}
                  onChange={(e) => setAiConfig({...aiConfig, api_url: e.target.value})}
                  placeholder="https://api.openrouter.ai/api/v1"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={testConnection}
                className="w-full py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded hover:bg-green-500/30 transition-all font-mono text-sm"
              >
                {t('aiconfig.test_connection', 'Test Connection')} / {t('aiconfig.api.test', 'Testar Conexão')}
              </button>
            </div>
          )}

          {/* Model Parameters */}
          {activeTab === 'params' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Temperature: {aiConfig.temperature.toFixed(2)}
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
                  <span>Precise / Preciso (0.0)</span>
                  <span>Creative / Criativo (2.0)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Max Tokens / Tokens Máximos
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

          {/* Behavior Settings */}
          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#333]">
                <div>
                  <p className="text-sm font-mono text-white">Auto-Execute Commands</p>
                  <p className="text-xs text-gray-500">Automatically run AI-suggested commands</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConfig.auto_execute}
                  onChange={(e) => setAiConfig({...aiConfig, auto_execute: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#333]">
                <div>
                  <p className="text-sm font-mono text-white">Web Search</p>
                  <p className="text-xs text-gray-500">Enable web search capabilities</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConfig.web_search_enabled}
                  onChange={(e) => setAiConfig({...aiConfig, web_search_enabled: e.target.checked})}
                  className="w-4 h-4"
                />
              </div>

              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Max Iterations / Iterações Máximas: {aiConfig.unlimited_iterations ? '∞' : aiConfig.max_iterations}
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
                    Unlimited / Ilimitado
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚡ Lower iterations = more efficient. AI should complete tasks in fewer steps.
                </p>
              </div>
            </div>
          )}

          {/* Advanced */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-300 mb-2">
                  Custom System Prompt / Prompt de Sistema Customizado
                </label>
                <textarea
                  value={aiConfig.system_prompt}
                  onChange={(e) => setAiConfig({...aiConfig, system_prompt: e.target.value})}
                  rows={6}
                  placeholder="You are a helpful AI assistant specialized in..."
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded border border-[#333]">
                <div>
                  <p className="text-sm font-mono text-white">Stream Responses</p>
                  <p className="text-xs text-gray-500">Show AI responses in real-time</p>
                </div>
                <input
                  type="checkbox"
                  checked={aiConfig.stream_responses}
                  onChange={(e) => setAiConfig({...aiConfig, stream_responses: e.target.checked})}
                  className="w-4 h-4"
                />
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
            Cancel / Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-500/30 transition-all font-mono text-sm"
          >
            Save Configuration / Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;
