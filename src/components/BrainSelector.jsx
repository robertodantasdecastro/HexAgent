/**
 * BrainSelector Component
 * Componente Seletor de Motores de IA
 * 
 * Manages AI engine selection and real-time status checking
 * Gerencia seleção de motor de IA e verificação de status em tempo real
 */

import { AlertCircle, Check, Download, ExternalLink, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const BrainSelector = ({ onBrainChange, currentBrain }) => {
  const [brains, setBrains] = useState(null);
  const [selectedBrain, setSelectedBrain] = useState(currentBrain || null);
  const [brainStatus, setBrainStatus] = useState({});
  const [checking, setChecking] = useState({});
  const [models, setModels] = useState({});

  // Load brain definitions / Carregar definições de motores
  useEffect(() => {
    loadBrainDefinitions();
  }, []);

  // Auto-check status when brain selected / Auto-verificar status ao selecionar
  useEffect(() => {
    if (selectedBrain) {
      checkBrainStatus(selectedBrain);
    }
  }, [selectedBrain]);

  const loadBrainDefinitions = async () => {
    try {
      // Try loading from backend first / Tentar carregar do backend primeiro
      const response = await fetch('http://localhost:5000/config/user/ai/brains');
      if (response.ok) {
        const data = await response.json();
        setBrains(data);
      } else {
        // Fallback to fetch from template file
        const templateResponse = await fetch('/config_templates/ai/brains.json');
        if (templateResponse.ok) {
          const templateData = await templateResponse.json();
          setBrains(templateData);
        }
      }
    } catch (error) {
      console.error('[BrainSelector] Failed to load brains:', error);
      // Set empty brains to prevent infinite loading
      setBrains({ cloud_engines: {}, local_engines: {} });
    }
  };

  const checkBrainStatus = async (brainKey) => {
    const brain = getBrainConfig(brainKey);
    if (!brain) return;

    setChecking(prev => ({ ...prev, [brainKey]: true }));
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(brain.health_endpoint, {
        signal: controller.signal,
        method: 'GET'
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setBrainStatus(prev => ({
          ...prev,
          [brainKey]: { status: 'online', error: null }
        }));
        
        // Load available models / Carregar modelos disponíveis
        await loadModels(brainKey, brain);
      } else {
        setBrainStatus(prev => ({
          ...prev,
          [brainKey]: { status: 'offline', error: 'Service not responding' }
        }));
      }
    } catch (error) {
      setBrainStatus(prev => ({
        ...prev,
        [brainKey]: {
          status: 'offline',
          error: error.name === 'AbortError' ? 'Timeout' : error.message
        }
      }));
    } finally {
      setChecking(prev => ({ ...prev, [brainKey]: false }));
    }
  };

  const loadModels = async (brainKey, brain) => {
    try {
      // Different loading strategies based on brain type
      // Diferentes estratégias dependendo do tipo
      if (brainKey.includes('openai')) {
        // OpenAI models are static for now
        setModels(prev => ({ ...prev, [brainKey]: brain.models }));
      } else if (brainKey.includes('ollama')) {
        // Fetch from Ollama API
        const res = await fetch(`${brain.health_endpoint.replace('/api/tags', '')}/api/tags`);
        const data = await res.json();
        setModels(prev => ({ ...prev, [brainKey]: data.models?.map(m => m.name) || [] }));
      } else {
        // Fallback to static list
        setModels(prev => ({ ...prev, [brainKey]: brain.models || [] }));
      }
    } catch (error) {
      console.error(`[BrainSelector] Failed to load models for ${brainKey}:`, error);
      setModels(prev => ({ ...prev, [brainKey]: brain.models || [] }));
    }
  };

  const getBrainConfig = (brainKey) => {
    if (!brains) return null;
    
    for (const category of Object.values(brains)) {
      if (category[brainKey]) {
        return { ...category[brainKey], key: brainKey };
      }
    }
    return null;
  };

  const handleBrainSelect = (brainKey) => {
    setSelectedBrain(brainKey);
    onBrainChange?.(brainKey);
  };

  if (!brains) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="animate-spin text-[#00ff00]" size={24} />
        <span className="ml-2 text-gray-400">Loading engines...</span>
      </div>
    );
  }

  const StatusIndicator = ({ brainKey }) => {
    const status = brainStatus[brainKey];
    const isChecking = checking[brainKey];

    if (isChecking) {
      return <RefreshCw size={14} className="animate-spin text-yellow-500" />;
    }

    if (!status) {
      return <div className="w-3 h-3 rounded-full bg-gray-600" />;
    }

    if (status.status === 'online') {
      return (
        <div className="flex items-center gap-1">
          <Check size={14} className="text-green-500" />
         <span className="text-xs text-green-500">Online</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <X size={14} className="text-red-500" />
        <span className="text-xs text-red-500">Offline</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-400 mb-4">
        Select your AI inference engine / Selecione seu motor de inferência IA
      </div>

      {/* Cloud Engines / Motores Cloud */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#00ff00] flex items-center gap-2">
          ☁️ Cloud / Online Engines
        </h3>
        {brains.cloud_engines && Object.entries(brains.cloud_engines).map(([key, brain]) => (
          <div
            key={key}
            onClick={() => handleBrainSelect(key)}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedBrain === key
                ? 'border-[#00ff00] bg-[#00ff00]/5'
                : 'border-[#333] hover:border-[#555]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{brain.icon}</span>
                <div>
                  <div className="font-bold text-white">{brain.name}</div>
                  <div className="text-xs text-gray-500">
                    {models[key]?.length || brain.models?.length || 0} models available
                  </div>
                </div>
              </div>
              <StatusIndicator brainKey={key} />
            </div>

            {selectedBrain === key && brainStatus[key]?.status === 'offline' && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-bold">Engine Offline</div>
                  <div>Configure your API key in the API KEYS tab</div>
                </div>
              </div>
            )}

            {selectedBrain === key && models[key]?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#333]">
                <div className="text-xs text-gray-400 mb-2">Available Models:</div>
                <div className="flex flex-wrap gap-1">
                  {models[key].slice(0, 5).map(model => (
                    <span key={model} className="text-xs bg-[#00ff00]/10 text-[#00ff00] px-2 py-1 rounded">
                      {model}
                    </span>
                  ))}
                  {models[key].length > 5 && (
                    <span className="text-xs text-gray-500 px-2 py-1">
                      +{models[key].length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Local Engines / Motores Locais */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
          💻 Local / Custom Engines
        </h3>
        {brains.local_engines && Object.entries(brains.local_engines).map(([key, brain]) => (
          <div
            key={key}
            onClick={() => handleBrainSelect(key)}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedBrain === key
                ? 'border-cyan-500 bg-cyan-500/5'
                : 'border-[#333] hover:border-[#555]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{brain.icon}</span>
                <div>
                  <div className="font-bold text-white">{brain.name}</div>
                  <div className="text-xs text-gray-500">{brain.type}</div>
                </div>
              </div>
              <StatusIndicator brainKey={key} />
            </div>

            {selectedBrain === key && brainStatus[key]?.status === 'offline' && brain.install_url && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-bold mb-1">Engine Not Running</div>
                  <div className="mb-2">Install or start the service</div>
                  <a
                    href={brain.install_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <Download size={12} />
                    <span>Download {brain.name}</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Test Connection Button */}
      <div className="pt-4 border-t border-[#333]">
        <button
          onClick={() => selectedBrain && checkBrainStatus(selectedBrain)}
          disabled={!selectedBrain || checking[selectedBrain]}
          className="w-full py-2 bg-[#00ff00]/10 border border-[#00ff00] text-[#00ff00] rounded hover:bg-[#00ff00]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono text-sm"
        >
          <RefreshCw size={14} className={checking[selectedBrain] ? 'animate-spin' : ''} />
          {checking[selectedBrain] ? 'Testing Connection...' : 'Test Connection'}
        </button>
      </div>
    </div>
  );
};

export default BrainSelector;
