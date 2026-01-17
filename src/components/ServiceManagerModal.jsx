/**
 * ServiceManagerModal Component
 * Modal for managing all HexAgentGUI services
 * 
 * Componente de Gerenciamento de Serviços
 * Modal para gerenciar todos os serviços do HexAgentGUI
 */

import { Box, Power, RefreshCw, Server, Shield, XCircle, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';

const ServiceManagerModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
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
    if (isOpen) {
      fetchServiceStatus();
      // Auto-refresh every 3 seconds for faster feedback
      const interval = setInterval(fetchServiceStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

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
      
      if (isMounted.current) {
        setServices({
          backend: systemData.backend || { ready: true, status: 'running', message: 'Core System Online' },
          hexstrike: {
              ready: servicesStatus.hexstrike === 'running',
              status: servicesStatus.hexstrike || 'stopped',
              message: servicesStatus.hexstrike === 'running' ? 'Active & Listening (Port 8888)' : (servicesStatus.hexstrike === 'starting' ? 'Initializing...' : 'Service Stopped')
          },
          brain: systemData.brain || { ready: false, status: 'pending', message: 'AI Engine Loading...' }
        });
      }
    } catch (error) {
      logger.error('ServiceManager: Failed to fetch status', error);
    }
  };

  const controlService = async (service, action) => {
    setLoading(true);
    try {
      const api = APIClient.getInstance();
      let endpoint = '/services/control'; // Default
      let body = { service, action };

      if (service === 'hexstrike') {
          endpoint = action === 'start' ? '/start_service' : '/stop_service';
          body = { service: 'hexstrike' };
      }

      const data = await api.post(endpoint, body);
      
      if (data.success && isMounted.current) {
          // Optimistic update
          if (service === 'hexstrike') {
              setServices(prev => ({
                  ...prev,
                  hexstrike: {
                      ...prev.hexstrike,
                      status: action === 'start' ? 'starting' : 'stopping',
                      message: action === 'start' ? 'Sending Start Command...' : 'Stopping Process...'
                  }
              }));
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
      case 'success': return 'bg-[#00ff00]/10 border-[#00ff00]/30';
      case 'starting':
      case 'pending': return 'bg-yellow-400/10 border-yellow-400/30';
      default: return 'bg-red-500/5 border-red-500/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#333] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#222] bg-[#111]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Server className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">{t('service.manager', 'Service Manager')}</h2>
              <p className="text-sm text-gray-500 font-mono">System & External Tools Lifecycle</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
                onClick={fetchServiceStatus}
                className="p-2 hover:bg-[#222] rounded-lg transition text-gray-400 hover:text-white"
                title={t('service.refresh', 'Refresh')}
            >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
                onClick={onClose}
                className="p-2 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition text-gray-400"
            >
                <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Content: Card Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0a0a]">
            
            {/* Backend Service Card */}
            <div className={`rounded-xl p-5 border transition-all ${getStatusBg(services.backend.status)}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-black/40 rounded border border-white/10">
                            <Box size={20} className="text-blue-400" />
                         </div>
                         <h3 className="font-bold text-lg text-gray-200">Backend Core</h3>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold uppercase border ${getStatusBg(services.backend.status).replace('/10', '/0')} ${getStatusColor(services.backend.status)}`}>
                        {services.backend.status}
                    </span>
                </div>
                <p className="text-sm text-gray-400 mb-4 h-10">
                    Flask API Server running on port 5000. Handles all request routing and file operations.
                </p>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono text-gray-500">
                    <span>Host: 127.0.0.1</span>
                    <span>Internal</span>
                </div>
            </div>

            {/* Brain/AI Service Card */}
            <div className={`rounded-xl p-5 border transition-all ${getStatusBg(services.brain.status)}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-black/40 rounded border border-white/10">
                            <Zap size={20} className="text-yellow-400" />
                         </div>
                         <h3 className="font-bold text-lg text-gray-200">AI Engine</h3>
                    </div>
                    {/* Simplified status for AI since it's internal */}
                    <span className="px-2 py-1 rounded text-xs font-mono font-bold uppercase border border-blue-500/30 bg-blue-500/10 text-blue-400">
                        READY
                    </span>
                </div>
                <p className="text-sm text-gray-400 mb-4 h-10">
                   HexSecGPT Integration. Connection to OpenRouter/LocalAI active.
                </p>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs font-mono text-gray-500">
                    <span>Model: {services.brain.model || 'Configured'}</span>
                    <span>Provider: HexSecGPT</span>
                </div>
            </div>

            {/* HexStrike Service Card - THE MAIN ONE */}
            <div className={`md:col-span-2 rounded-xl p-6 border-2 transition-all ${getStatusBg(services.hexstrike.status)}`}>
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                         <div className="p-3 bg-black/40 rounded-lg border border-white/10">
                            <Shield size={28} className={services.hexstrike.ready ? "text-[#00ff00]" : "text-gray-400"} />
                         </div>
                         <div>
                            <h3 className="font-bold text-xl text-white">HexStrike AI</h3>
                            <p className="text-sm text-gray-400">Vulnerability Scanner & Command Engine</p>
                         </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex flex-col items-end mr-4 hidden md:flex">
                             <span className={`text-sm font-bold font-mono tracking-wider uppercase ${getStatusColor(services.hexstrike.status)}`}>
                                {services.hexstrike.status}
                             </span>
                             <span className="text-xs text-gray-500">Port: 8888</span>
                        </div>
                        
                        {services.hexstrike.status === 'running' ? (
                            <button
                                onClick={() => controlService('hexstrike', 'stop')}
                                disabled={loading}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-200 rounded-lg transition group"
                            >
                                <Power size={18} className="group-hover:scale-110 transition" />
                                Stop Service
                            </button>
                        ) : (
                            <button
                                onClick={() => controlService('hexstrike', 'start')}
                                disabled={loading} // Removing ready check to allow restart if stuck
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#00ff00]/10 hover:bg-[#00ff00]/20 border border-[#00ff00]/50 text-[#00ff00] rounded-lg transition group shadow-[0_0_15px_rgba(0,255,0,0.1)] hover:shadow-[0_0_25px_rgba(0,255,0,0.2)]"
                            >
                                <Power size={18} className="group-hover:scale-110 transition" />
                                {loading ? 'Processing...' : 'Start Service'}
                            </button>
                        )}
                    </div>
                 </div>

                 {/* Console / Info Area */}
                 <div className="bg-black/50 rounded-lg p-4 font-mono text-sm border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider">Service Output / Status</span>
                        {services.hexstrike.status === 'running' && <span className="flex items-center gap-2 text-xs text-[#00ff00]"><div className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse"/> Live</span>}
                    </div>
                    <div className="text-gray-300">
                        {services.hexstrike.message}
                    </div>
                    {services.hexstrike.status === 'stopped' && (
                        <div className="mt-2 text-yellow-600/70 text-xs">
                           Tip: Ensure "hexstrike-ai" is installed in ~/iatools/hexstrike-ai/
                        </div>
                    )}
                 </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#111] border-t border-[#222] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#222] hover:bg-[#333] border border-[#444] rounded-lg text-white transition"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceManagerModal;
