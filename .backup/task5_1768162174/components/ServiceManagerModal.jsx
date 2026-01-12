/**
 * ServiceManagerModal Component
 * Modal for managing all HexAgentGUI services
 * 
 * Componente de Gerenciamento de Serviços
 * Modal para gerenciar todos os serviços do HexAgentGUI
 */

import { Activity, CheckCircle, Power, RefreshCw, Server, Terminal, XCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const ServiceManagerModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('backend');
  const [services, setServices] = useState({
    backend: { ready: false, status: 'pending', message: 'Loading...' },
    hexstrike: { ready: false, status: 'pending', message: 'Loading...' },
    brain: { ready: false, status: 'pending', message: 'Loading...' }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchServiceStatus();
      // Auto-refresh every 5 seconds
      const interval = setInterval(fetchServiceStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/init_status');
      const data = await response.json();
      
      setServices({
        backend: data.backend || { ready: true, status: 'success', message: 'Running' },
        hexstrike: data.hexstrike || { ready: false, status: 'error', message: 'Offline' },
        brain: data.brain || { ready: false, status: 'pending', message: 'Loading...' }
      });
    } catch (error) {
      console.error('[ServiceManager] Failed to fetch status:', error);
    }
  };

  const controlService = async (service, action) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/services/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, action })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Wait a bit and refresh status
        setTimeout(fetchServiceStatus, 2000);
      }
    } catch (error) {
      console.error(`[ServiceManager] Failed to ${action} ${service}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (ready, status) => {
    if (ready) return <CheckCircle className="text-green-400" size={20} />;
    if (status === 'error') return <XCircle className="text-red-400" size={20} />;
    return <Activity className="text-yellow-400 animate-pulse" size={20} />;
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'backend', name: 'Backend', icon: Server, service: services.backend },
    { id: 'hexstrike', name: 'HexStrike', icon: Terminal, service: services.hexstrike },
    { id: 'brain', name: 'Brain (AI)', icon: Zap, service: services.brain }
  ];

  const renderServiceTab = (tabId) => {
    const service = services[tabId];
    
    return (
      <div className="p-6 space-y-6">
        {/* Service Status Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(service.ready, service.status)}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {tabs.find(t => t.id === tabId)?.name}
                </h3>
                <p className={`text-sm ${getStatusColor(service.status)}`}>
                  {service.ready ? t('service.running', 'Running') : service.message}
                </p>
              </div>
            </div>
            
            {/* Service Controls */}
            <div className="flex gap-2">
              {tabId === 'hexstrike' && (
                <>
                  <button
                    onClick={() => controlService('hexstrike', 'start')}
                    disabled={loading || service.ready}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded transition
                      ${service.ready 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-500 text-white'
                      }
                    `}
                  >
                    <Power size={16} />
                    {t('service.start', 'Start')}
                  </button>
                  <button
                    onClick={() => controlService('hexstrike', 'stop')}
                    disabled={loading || !service.ready}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded transition
                      ${!service.ready 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-500 text-white'
                      }
                    `}
                  >
                    <Power size={16} />
                    {t('service.stop', 'Stop')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
            <div>
              <p className="text-xs text-gray-500 uppercase">{t('service.status', 'Status')}</p>
              <p className={`font-mono ${getStatusColor(service.status)}`}>
                {service.status.toUpperCase()}
              </p>
            </div>
            {service.port && (
              <div>
                <p className="text-xs text-gray-500 uppercase">{t('service.port', 'Port')}</p>
                <p className="font-mono text-white">{service.port}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase mb-1">{t('service.message', 'Message')}</p>
              <p className="text-sm text-gray-300">{service.message}</p>
            </div>
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">{t('service.about', 'About this service')}</h4>
          {tabId === 'backend' && (
            <p className="text-sm text-gray-400">
              {t('service.backend_desc', 'Flask backend server providing REST API for the HexAgent GUI.')}
            </p>
          )}
          {tabId === 'hexstrike' && (
            <p className="text-sm text-gray-400">
              {t('service.hexstrike_desc', 'Command execution engine for running terminal commands.')}
            </p>
          )}
          {tabId === 'brain' && (
            <p className="text-sm text-gray-400">
              {t('service.brain_desc', 'HexSecGPT AI brain for intelligent responses and reasoning.')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Server className="text-purple-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">{t('service.manager', 'Service Manager')}</h2>
              <p className="text-sm text-gray-400">{t('service.manager', 'Service Manager')}</p>
            </div>
          </div>
          <button
            onClick={fetchServiceStatus}
            className="p-2 hover:bg-gray-800 rounded transition"
            title={t('service.refresh', 'Refresh')}
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition font-medium
                  ${activeTab === tab.id 
                    ? 'border-purple-500 text-white' 
                    : 'border-transparent text-gray-400 hover:text-white'
                  }
                `}
              >
                <Icon size={18} />
                <span>{tab.name}</span>
                {tab.service.ready && (
                  <CheckCircle size={14} className="text-green-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {renderServiceTab(activeTab)}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded transition text-white"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceManagerModal;
