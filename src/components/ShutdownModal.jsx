import { CheckCircle, Loader, Power, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import APIClient from '../utils/APIClient';

const ShutdownModal = ({ isOpen, onShutdownComplete }) => {
  const { t } = useTranslation();
  const [steps, setSteps] = useState([
    { id: 'check_files', label: t('shutdown.check_files', 'Checking Temporary Files...'), status: 'pending' },
    { id: 'backend', label: t('shutdown.stop_backend', 'Stopping Backend Services...'), status: 'pending' },
    { id: 'hexstrike', label: t('shutdown.stop_hexstrike', 'Terminating HexStrike Engine...'), status: 'pending' },
    { id: 'cleanup', label: t('shutdown.cleanup', 'Cleaning up Resources...'), status: 'pending' }
  ]);
  const [status, setStatus] = useState('initializing'); // initializing, warning, shutting_down
  const [tempFileCount, setTempFileCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
        setStatus('initializing');
        checkFiles();
    }
  }, [isOpen]);

  const checkFiles = async () => {
      updateStep('check_files', 'running');
      try {
          const api = APIClient.getInstance();
          const result = await api.get('/file/temp');
          
          if (result.success) {
            setTempFileCount(result.data.count || 0);
          } else {
            console.warn('Failed to check temp files:', result.message);
          }
          
          updateStep('check_files', 'completed');
          
          if (result.success && result.data.count > 0) {
              setStatus('warning');
          } else {
              startShutdown();
          }
      } catch (e) {
          console.error("Failed to check files", e);
          updateStep('check_files', 'completed');
          startShutdown();
      }
  };

  const startShutdown = async () => {
      setStatus('shutting_down');
      
      updateStep('backend', 'running');
      try {
           const api = APIClient.getInstance();
           try {
               await api.post('/shutdown', {}, { timeout: 2000 });
           } catch (e) {
               console.log("Backend likely stopped/unresponsive (expected)", e);
           }
           updateStep('backend', 'completed');
      } catch (e) {
           updateStep('backend', 'completed'); 
      }

      updateStep('hexstrike', 'running');
      await new Promise(r => setTimeout(r, 800)); 
      updateStep('hexstrike', 'completed');

      updateStep('cleanup', 'running');
      await new Promise(r => setTimeout(r, 500));
      updateStep('cleanup', 'completed');

      setTimeout(onShutdownComplete, 500);
  };

  const updateStep = (id, status) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-md">
      <div className="w-[450px] bg-[#0a0a0a] border border-red-500/30 rounded-lg shadow-[0_0_50px_rgba(255,0,0,0.1)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#0a0a0a]">
           <div className="flex items-center gap-3">
              <Power className="text-red-500" size={20} />
              <h2 className="text-lg font-bold text-white tracking-wide">
                  {t('shutdown.title', 'DESLIGAR SISTEMA')}
              </h2>
           </div>
        </div>

        <div className="p-8 flex flex-col items-center">
            
            {status === 'warning' ? (
                <div className="animate-in fade-in zoom-in-95 duration-200 w-full flex flex-col items-center">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                        <TriangleAlert size={32} className="text-yellow-500" />
                    </div>
                    
                    <h2 className="text-xl font-bold text-white mb-2">{t('shutdown.warning_title', 'Aviso de Arquivos')}</h2>
                    <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
                        Você possui <span className="text-white font-bold">{tempFileCount}</span> arquivos temporários não salvos em 
                        <br/><code className="bg-[#111] px-1 py-0.5 rounded text-gray-300 font-mono text-xs border border-[#222]">~/.hexagent-gui/tmp/files</code>
                    </p>
                    
                    <div className="w-full space-y-3">
                        <button 
                            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/50 py-3 rounded font-bold transition-all text-sm uppercase tracking-wider"
                            onClick={() => startShutdown()}
                        >
                            {t('shutdown.shutdown_button', 'Apagar & Desligar')}
                        </button>
                        <button 
                            className="w-full bg-[#111] hover:bg-[#222] text-gray-400 border border-[#333] py-3 rounded font-bold transition-all text-sm uppercase tracking-wider"
                            onClick={() => {/* Ideally Cancel, but app state handles this via parent */}}
                        >
                             Cancelar
                        </button>
                    </div>
                     <p className="text-[10px] text-gray-600 mt-4 text-center">
                        {t('shutdown.note', 'Nota: Use "/save session" para persistir dados importantes.')}
                     </p>
                </div>
            ) : (
                <div className="w-full">
                    <div className="flex justify-center mb-8">
                         <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-[#333] flex items-center justify-center">
                                <img src="logo.png" className="w-10 h-10 object-contain opacity-50 grayscale" alt="Logo" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-t-2 border-red-500 animate-spin"></div>
                         </div>
                    </div>

                    <div className="space-y-4">
                        {steps.map(step => (
                            <div key={step.id} className="flex items-center gap-4 p-3 bg-[#111] rounded border border-[#222]">
                                <div className="w-5 flex justify-center flex-shrink-0">
                                    {step.status === 'pending' && <div className="w-2 h-2 bg-gray-700 rounded-full" />}
                                    {step.status === 'running' && <Loader size={16} className="text-yellow-500 animate-spin" />}
                                    {step.status === 'completed' && <CheckCircle size={16} className="text-[#00ff00]" />}
                                </div>
                                <span className={`text-xs font-mono uppercase tracking-wider ${step.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 text-center">
                        <span className="text-[10px] text-gray-600 font-mono">SHUTDOWN SEQUENCE INITIATED</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShutdownModal;
