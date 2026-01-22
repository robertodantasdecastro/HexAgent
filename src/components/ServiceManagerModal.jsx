/**
 * ServiceManagerModal Component
 * Modal for managing all HexAgentGUI services
 * 
 * Componente de Gerenciamento de Serviços
 * Modal para gerenciar todos os serviços do HexAgentGUI
 */

import { Box, Power, RefreshCw, Server, Settings, Shield, XCircle, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';
import MCPRegistry from './MCPRegistry';

const ServiceManagerModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('services'); // services | mcp
  const [services, setServices] = useState({
    backend: { ready: false, status: 'pending', message: 'Checking...' },
    hexstrike: { ready: false, status: 'pending', message: 'Checking...' },
    brain: { ready: false, status: 'pending', message: 'Checking...' }
  });
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const logger = Logger.getInstance();

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'services') {
      fetchServiceStatus();
      // Auto-refresh every 3 seconds for faster feedback (only on services tab)
      const interval = setInterval(fetchServiceStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  const fetchServiceStatus = async () => {
    try {
      const api = APIClient.getInstance();
      const systemData = await api.get('/init_status');
      
      let servicesStatus = {};
      try {
          const servicesData = await api.get('/status/services');
          servicesStatus = servicesData.data || {};
      } catch (e) {
          logger.warn('ServiceManager: Failed to fetch services status', e);
      }
      
      if (isMounted.current && systemData.success) {
        const data = systemData.data || {};
        const servicesData = servicesStatus;
        
        setServices({
          backend: data.backend || { ready: true, status: 'running', message: 'Core System Online' },
          hexstrike: {
              ready: servicesData.hexstrike === 'running',
              status: servicesData.hexstrike || 'stopped',
              message: servicesData.hexstrike === 'running' ? 'Active & Listening (Port 8888)' : (servicesData.hexstrike === 'starting' ? 'Initializing...' : 'Service Stopped'),
              host: servicesData.hexstrike_host || '127.0.0.1' // Assume local if not present
          },
          brain: data.brain || { ready: false, status: 'pending', message: 'AI Engine Loading...' }
        });
      }
    } catch (error) {
      logger.error('ServiceManager: Failed to fetch status', error);
    }
  };

  const controlService = async (service, action, options = {}) => {
    setLoading(true);
    try {
      const api = APIClient.getInstance();
      let endpoint = '/services/control'; // Default
      let body = { service, action };

      if (service === 'hexstrike') {
          if (action === 'configure_access') {
              endpoint = '/services/configure_access';
              body = { service: 'hexstrike', access: options.access }; // options passed as 3rd arg
          } else {
              endpoint = action === 'start' ? '/start_service' : '/stop_service';
              body = { service: 'hexstrike' };
          }
      }

      const data = await api.post(endpoint, body);
      
      if (data.success && isMounted.current) {
          // Optimistic update
          if (service === 'hexstrike') {
            if (action === 'configure_access') {
                setServices(prev => ({
                    ...prev,
                    hexstrike: {
                        ...prev.hexstrike,
                        host: data.data.host
                    }
                }));
            } else {
              setServices(prev => ({
                  ...prev,
                  hexstrike: {
                      ...prev.hexstrike,
                      status: action === 'start' ? 'starting' : 'stopping',
                      message: action === 'start' ? 'Sending Start Command...' : 'Stopping Process...'
                  }
              }));
            }
          }
        // Wait a bit and refresh status
        setTimeout(fetchServiceStatus, 1500);
      }
    } catch (error) {
      logger.error(`ServiceManager: Failed to ${action} ${service}`, error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'success': return 'text-[#00ff00]';
      case 'starting':
      case 'pending': return 'text-yellow-400';
      case 'stopped':
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const getStatusBg = (status) => {
    switch (status) {
      case 'running':
      case 'success': return 'bg-[#00ff00]/5 border-[#00ff00]/30';
      case 'starting':
      case 'pending': return 'bg-yellow-400/5 border-yellow-400/30';
      default: return 'bg-red-500/5 border-red-500/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#0a0a0a] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#00ff00]/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <Server className="text-cyan-400" size={20} />
                <h2 className="text-lg font-bold text-white tracking-wide">
                    {t('service.manager', 'Service Manager')}
                </h2>
             </div>

             {/* Navigation Tabs */}
             <div className="flex items-center gap-1 bg-black/40 rounded p-1 border border-[#222]">
                 <button 
                    onClick={() => setActiveTab('services')}
                    className={`px-3 py-1 rounded text-xs font-mono transition flex items-center gap-2 ${activeTab === 'services' ? 'bg-[#222] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     <Zap size={12} />
                     Services
                 </button>
                 <button 
                    onClick={() => setActiveTab('mcp')}
                    className={`px-3 py-1 rounded text-xs font-mono transition flex items-center gap-2 ${activeTab === 'mcp' ? 'bg-[#222] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     <Settings size={12} />
                     MCP Registry
                 </button>
             </div>
          </div>

          <div className="flex gap-2">
            {activeTab === 'services' && (
                <button
                    onClick={fetchServiceStatus}
                    className="text-gray-400 hover:text-cyan-400 transition"
                    title={t('service.refresh', 'Refresh')}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            )}
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition"
            >
                <XCircle size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
            
            {activeTab === 'services' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Backend Service Card */}
                    <div className={`rounded-lg p-5 border transition-all ${getStatusBg(services.backend.status)}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-black/40 rounded border border-[#333]">
                                    <Box size={20} className="text-blue-400" />
                                </div>
                                <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wider">Backend Core</h3>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border bg-black/50 ${getStatusColor(services.backend.status)} border-transparent`}>
                                {services.backend.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 h-8 font-mono">
                            Flask API Server running on port 5000. Handles all request routing.
                        </p>
                        <div className="pt-3 border-t border-[#333] flex justify-between items-center text-[10px] font-mono text-gray-500">
                            <span>Host: 127.0.0.1</span>
                            <span>Internal</span>
                        </div>
                    </div>

                    {/* Brain/AI Service Card */}
                    <div className={`rounded-lg p-5 border transition-all ${getStatusBg(services.brain.status)}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-black/40 rounded border border-[#333]">
                                    <Zap size={20} className="text-yellow-400" />
                                </div>
                                <h3 className="font-bold text-sm text-gray-200 uppercase tracking-wider">AI Engine</h3>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border ${
                                services.brain.status === 'ready' || services.brain.status === 'running' 
                                ? 'border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00]' 
                                : 'border-red-500/30 bg-red-500/10 text-red-500'
                            }`}>
                                {services.brain.status === 'ready' ? 'RUNNING' : (services.brain.status || 'OFFLINE')}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4 h-8 font-mono">
                        AI Provider Factory Status. Active Strategy: <span className="text-blue-400">{services.brain.engine || 'Auto'}</span>
                        </p>
                        <div className="pt-3 border-t border-[#333] flex justify-between items-center text-[10px] font-mono text-gray-500">
                            <span>Model: <span className="text-gray-300">{services.brain.model || 'Configured'}</span></span>
                            <span>Provider: <span className="text-gray-300">{services.brain.provider || 'Standard'}</span></span>
                        </div>
                    </div>

                    {/* HexStrike Service Card */}
                    <div className={`md:col-span-2 rounded-lg p-6 border transition-all ${getStatusBg(services.hexstrike.status)}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-black/40 rounded border border-[#333]">
                                    <Shield size={24} className={services.hexstrike.ready ? "text-[#00ff00]" : "text-gray-400"} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">HexStrike AI</h3>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Vulnerability Scanner & Command Engine</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex flex-col items-end mr-4 hidden md:flex">
                                    <span className={`text-xs font-bold font-mono tracking-wider uppercase ${getStatusColor(services.hexstrike.status)}`}>
                                        {services.hexstrike.status}
                                    </span>
                                    <span className="text-[10px] text-gray-500">Port: 8888</span>
                                </div>
                                
                                {services.hexstrike.status === 'running' ? (
                                    <button
                                        onClick={() => controlService('hexstrike', 'stop')}
                                        disabled={loading}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition font-mono text-xs"
                                    >
                                        <Power size={14} />
                                        STOP SERVICE
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => controlService('hexstrike', 'start')}
                                        disabled={loading}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#00ff00]/10 hover:bg-[#00ff00]/20 border border-[#00ff00]/30 text-[#00ff00] rounded-lg transition shadow-lg shadow-green-900/20 font-mono text-xs"
                                    >
                                        <Power size={14} />
                                        {loading ? 'STARTING...' : 'START SERVICE'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Network Access Control & Output */}
                        <div className="mt-4 flex flex-col md:flex-row gap-4">
                             {/* Access Toggle */}
                             <div className="flex-none w-full md:w-48 bg-black/40 rounded p-3 border border-[#333]">
                                <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Network Access</h4>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => controlService('hexstrike', 'configure_access', { access: 'local' })}
                                        disabled={loading || services.hexstrike.status !== 'running'}
                                        className={`px-3 py-1.5 rounded text-[10px] font-mono border transition text-left flex items-center gap-2 ${services.hexstrike.host !== '0.0.0.0' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-[#111] border-[#333] text-gray-500 hover:text-gray-300'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${services.hexstrike.host !== '0.0.0.0' ? 'bg-blue-400' : 'bg-gray-600'}`} />
                                        <span>Local (127.0.0.1)</span>
                                    </button>
                                    <button 
                                        onClick={() => controlService('hexstrike', 'configure_access', { access: 'public' })}
                                        disabled={loading || services.hexstrike.status !== 'running'} // Only allow changing when running or fully stopped? Actually safer to allow anytime but backend handles restart
                                        className={`px-3 py-1.5 rounded text-[10px] font-mono border transition text-left flex items-center gap-2 ${services.hexstrike.host === '0.0.0.0' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-[#111] border-[#333] text-gray-500 hover:text-gray-300'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${services.hexstrike.host === '0.0.0.0' ? 'bg-red-400' : 'bg-gray-600'}`} />
                                        <span>Public (0.0.0.0)</span>
                                    </button>
                                </div>
                             </div>

                            {/* Console / Info Area */}
                            <div className="flex-1 bg-black/80 rounded p-4 font-mono text-xs border border-[#333]">
                                <div className="flex items-center justify-between mb-2 border-b border-[#222] pb-1">
                                    <span className="text-gray-500 uppercase tracking-wider">Service Output</span>
                                    {services.hexstrike.status === 'running' && <span className="flex items-center gap-2 text-[#00ff00]"><div className="w-1.5 h-1.5 rounded-full bg-[#00ff00] animate-pulse"/> Live</span>}
                                </div>
                                <div className="text-gray-300 whitespace-pre-wrap h-[88px] overflow-y-auto custom-scrollbar">
                                    {services.hexstrike.message}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'mcp' && (
                <MCPRegistry />
            )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#111] hover:bg-[#222] border border-[#333] rounded text-gray-300 text-xs font-mono transition"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceManagerModal;
