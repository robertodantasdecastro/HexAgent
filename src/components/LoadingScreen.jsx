import { AlertTriangle, CheckCircle, Copy, Loader, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const LoadingScreen = ({ initStatus, progress, error, onRetry, onContinue }) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  const steps = [
    { id: 'backend', label: t('loading.components.backend', 'Servidor Backend'), status: initStatus.backend.status, message: initStatus.backend.message },
    { id: 'brain', label: t('loading.components.brain', 'Núcleo IA'), status: initStatus.brain.status, message: initStatus.brain.message },
    { id: 'hexstrike', label: t('loading.components.hexstrike', 'Cliente HexStrike'), status: initStatus.hexstrike.status, message: initStatus.hexstrike.message },
    { id: 'config', label: t('loading.components.config', 'Configuração'), status: initStatus.config.status, message: initStatus.config.message }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="text-[#00ff00]" />;
      case 'loading': return <Loader size={16} className="text-cyan-400 animate-spin" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'error': return <AlertTriangle size={16} className="text-red-500" />;
      default: return <div className="w-2 h-2 bg-gray-700 rounded-full" />;
    }
  };
  
  const handleClose = () => {
      if (window.require) {
          try {
              const { ipcRenderer } = window.require('electron');
              ipcRenderer.send('app-close-requested');
          } catch(e) {}
      } else {
          window.close();
      }
  };

  const copyError = () => {
    if (!error) return;
    const text = `Error: ${error.message}\nTimestamp: ${new Date().toISOString()}\nStack: ${JSON.stringify(error.stack || 'N/A')}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[100] selection:bg-cyan-500/30">
      <div className="w-[450px] bg-[#0a0a0a] border border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header - No Title Bar, just centered logo animation */}
        <div className="p-8 flex flex-col items-center border-b border-[#333]">
           <div className="flex justify-center mb-6">
                <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-[#222] flex items-center justify-center bg-[#050505]">
                    <img src="logo.png" className="w-12 h-12 object-contain opacity-80" alt="Logo" />
                </div>
                {/* Spinning Border - Cyan for Loading */}
                {!error ? (
                    <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                ) : (
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/50"></div>
                )}
                </div>
           </div>
           
           <h1 className="text-xl font-bold tracking-widest text-white mb-1 uppercase">HEXAGENT GUI</h1>
           <p className="text-xs text-cyan-400 font-mono tracking-wider animate-pulse">
               {error ? t('loading.init_failed', 'System Failure') : t('loading.initializing', 'Inicializando Sistema...')}
           </p>
        </div>

        <div className="p-6 bg-[#0a0a0a]">
            
            {/* Progress Bar (if no error) */}
            {!error && (
                <div className="mb-6">
                    <div className="w-full bg-[#111] rounded-full h-1 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-[#00ff00] transition-all duration-300 shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Steps List */}
            <div className="space-y-3">
                {steps.map(step => (
                    <div key={step.id} className="flex items-center gap-4 p-3 bg-[#111] rounded border border-[#222] hover:border-[#333] transition-colors group">
                        <div className="w-5 flex justify-center flex-shrink-0">
                            {getStatusIcon(step.status)}
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                            <span className={`text-xs font-mono uppercase tracking-wider ${
                                step.status === 'success' ? 'text-cyan-100' : 
                                step.status === 'loading' ? 'text-cyan-400' : 'text-gray-500'
                            }`}>
                                {step.label}
                            </span>
                            
                            {/* Detailed status pill */}
                             <span className="text-[10px] text-gray-600 bg-[#050505] px-2 py-0.5 rounded border border-[#222] font-mono group-hover:border-[#444] transition-colors">
                                {step.message}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error Actions */}
            {error && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                     <div className="bg-red-950/20 border border-red-500/30 rounded p-4 mb-4">
                         <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Critical Error</span>
                         </div>
                         <div className="text-[10px] text-gray-400 font-mono mb-3 break-words bg-black/50 p-2 rounded border border-red-900/30">
                             {error.message || "Unknown Initialization Failure"}
                         </div>
                         <div className="flex gap-2">
                            <button 
                                onClick={onRetry}
                                className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/50 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                {t('loading.retry', 'Retry')}
                            </button>
                            <button 
                                onClick={copyError}
                                className="px-3 bg-[#111] hover:bg-[#222] text-gray-400 border border-[#333] rounded transition-all"
                                title="Copy Logs"
                            >
                                <Copy size={14} />
                            </button>
                         </div>
                     </div>
                     <div className="flex justify-center">
                        <button 
                            onClick={handleClose}
                            className="text-[10px] text-gray-600 hover:text-gray-400 underline font-mono"
                        >
                            Force Quit Application
                        </button>
                     </div>
                </div>
            )}
            
            {/* System Logs Toggle (Footer-like) */}
            <div className="mt-6 pt-4 border-t border-[#222]">
                <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-cyan-500 transition-colors"
                >
                    <Terminal size={10} />
                    <span className="font-mono">
                        {showDetails ? '>_ Hide System Logs' : '>_ Show System Logs'}
                    </span>
                </button>
                
                {showDetails && (
                    <div className="mt-2 text-[10px] font-mono text-gray-500 bg-[#050505] p-3 rounded border border-[#222] overflow-x-auto max-h-24 custom-scrollbar select-text">
                        {Object.entries(initStatus).map(([k, v]) => (
                            <div key={k} className="mb-0.5 whitespace-nowrap">
                                <span className={v.status === 'success' ? 'text-green-600' : 'text-blue-600'}>{v.status.toUpperCase()}</span>
                                <span className="mx-1 text-gray-700">|</span>
                                {k.toUpperCase()}: {v.message}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
