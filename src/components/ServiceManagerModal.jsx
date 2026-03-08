/**
 * ServiceManagerModal Component
 * Modal for managing all HexAgentGUI services
 * 
 * Componente de Gerenciamento de Serviços
 * Modal para gerenciar todos os serviços do HexAgentGUI
 */

import { Box, RefreshCw, Server, Settings, Shield, XCircle, Zap } from 'lucide-react';
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
      } else {
          logger.warn(`ServiceManager: Unknown service "${service}"`);
          setLoading(false);
          return;
      }

      const data = await api.post(endpoint, body);

      if (data.success && isMounted.current) {
          if (action === 'configure_access') {
              setServices(prev => ({
                  ...prev,
                  hexstrike: { ...prev.hexstrike, host: data.data?.host }
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
          setTimeout(fetchServiceStatus, 1500);
      }
    } catch (error) {
      logger.error(`ServiceManager: Failed to ${action} ${service}`, error);
    } finally {
      if (isMounted.current) setLoading(false);
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
      case 'success': 
      case 'active':
      case 'ready': // Added ready to match Brain status
        return 'bg-[#00ff00]/5 border-[#00ff00]/30 opacity-100'; // Force opacity 100
      case 'starting':
      case 'pending': 
        return 'bg-yellow-400/5 border-yellow-400/30 opacity-90';
      case 'stopped':
      case 'error': 
      default:
        return 'bg-red-500/5 border-red-500/20 opacity-100';
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
                <div className="space-y-6">
                    {/* Section: System Core */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Backend Service Card - Compact */}
                        <div className={`rounded-xl p-4 border transition-all relative overflow-hidden group ${getStatusBg(services.backend.status)}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Box size={64} />
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                                    <Box size={16} className="text-blue-400" /> Backend Core
                                </h3>
                                <span className={`text-[10px] font-mono uppercase font-bold ${getStatusColor(services.backend.status)}`}>
                                    {services.backend.status}
                                </span>
                            </div>
                             <div className="text-[10px] text-gray-500 font-mono mb-2">
                                Port: 5001 (Internal)
                            </div>
                            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className={`h-full ${services.backend.ready ? 'bg-blue-500 w-full' : 'bg-gray-600 w-1/3 animate-pulse'}`}></div>
                            </div>
                        </div>

                        {/* AI Engine Card - Compact */}
                         <div className={`rounded-xl p-4 border transition-all relative overflow-hidden group ${getStatusBg(services.brain.status)}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Zap size={64} />
                            </div>
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                                    <Zap size={16} className="text-yellow-400" /> AI Engine
                                </h3>
                                <span className={`text-[10px] font-mono uppercase font-bold ${services.brain.status === 'ready' ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {services.brain.status === 'ready' ? 'ACTIVE' : (services.brain.status || 'OFFLINE')}
                                </span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono flex flex-col gap-0.5">
                                <span>Provider: <strong className="text-gray-300">{services.brain.provider || 'Auto'}</strong></span>
                                <span className="truncate">Model: {services.brain.model || 'Default'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Agents */}
                    <div className="grid grid-cols-1 gap-4">
                        
                        {/* HexStrike AI - Horizontal Card */}
                        <div className={`rounded-xl border transition-all flex flex-col md:flex-row overflow-hidden ${getStatusBg(services.hexstrike.status)}`}>
                             {/* Left: Status & Control */}
                             <div className="p-5 flex flex-col justify-between w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#333] bg-black/20">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                         <Shield size={18} className={services.hexstrike.ready ? "text-green-400" : "text-gray-400"} />
                                         <h3 className="font-bold text-gray-100">HexStrike AI</h3>
                                    </div>
                                    <p className="text-[10px] text-gray-400 leading-tight">
                                        Vulnerability Scanner Engine.
                                    </p>
                                </div>
                                
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                     <div className="col-span-2">
                                        {services.hexstrike.status === 'running' ? (
                                            <button
                                                onClick={() => controlService('hexstrike', 'stop')}
                                                disabled={loading}
                                                className="w-full py-1.5 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded transition font-mono text-xs"
                                            >
                                                STOP
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => controlService('hexstrike', 'start')}
                                                disabled={loading}
                                                className="w-full py-1.5 bg-green-900/20 hover:bg-green-900/40 border border-green-900/50 text-green-400 rounded transition font-mono text-xs"
                                            >
                                                START
                                            </button>
                                        )}
                                     </div>
                                     {/* Network Access Toggles - Mini */}
                                     <button 
                                        onClick={() => controlService('hexstrike', 'configure_access', { access: 'local' })}
                                        disabled={loading || services.hexstrike.status !== 'running'}
                                        title="Local Access Only"
                                        className={`py-1 rounded text-[10px] font-mono border transition flex items-center justify-center gap-1 ${services.hexstrike.host !== '0.0.0.0' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-[#111] border-[#333] text-gray-500'}`}
                                    >
                                        <div className={`w-1 h-1 rounded-full ${services.hexstrike.host !== '0.0.0.0' ? 'bg-blue-400' : 'bg-gray-600'}`} /> Local
                                    </button>
                                    <button 
                                        onClick={() => controlService('hexstrike', 'configure_access', { access: 'public' })}
                                        disabled={loading || services.hexstrike.status !== 'running'}
                                        title="Public Network Access (0.0.0.0)"
                                        className={`py-1 rounded text-[10px] font-mono border transition flex items-center justify-center gap-1 ${services.hexstrike.host === '0.0.0.0' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-[#111] border-[#333] text-gray-500'}`}
                                    >
                                        <div className={`w-1 h-1 rounded-full ${services.hexstrike.host === '0.0.0.0' ? 'bg-red-400' : 'bg-gray-600'}`} /> Public
                                    </button>
                                </div>
                             </div>

                             {/* Right: Console */}
                             <div className="flex-1 p-4 bg-black/40 font-mono text-[10px] flex flex-col">
                                <div className="flex justify-between items-center border-b border-[#333] pb-1 mb-2">
                                     <span className="text-gray-500">Service Output (Port 8888)</span>
                                     <span className={services.hexstrike.status === 'running' ? "text-green-500" : "text-gray-600"}>
                                         ● {services.hexstrike.status.toUpperCase()}
                                     </span>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                     <div className="absolute inset-0 overflow-y-auto custom-scrollbar text-gray-300 whitespace-pre-wrap">
                                        {services.hexstrike.message || "Ready."}
                                     </div>
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
