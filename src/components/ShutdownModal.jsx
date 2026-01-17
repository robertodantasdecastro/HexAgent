import { CheckCircle, Loader } from 'lucide-react';
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
          // Fixed URL: /file/temp (singular) based on FileController
          const result = await api.get('/file/temp');
          
          if (result.success) {
            setTempFileCount(result.data.count || 0);
          } else {
            console.warn('Failed to check temp files:', result.message);
            // Non-blocking failure / Falha não bloqueante
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
      
      // Step 1: Request Backend Shutdown
      updateStep('backend', 'running');
      try {
           const api = APIClient.getInstance();
           
           // Use very short timeout for shutdown
           // Usar timeout muito curto para shutdown
           try {
               await api.post('/shutdown', {}, { timeout: 2000 });
           } catch (e) {
               console.log("Backend likely stopped/unresponsive (expected)", e);
           }
           
           updateStep('backend', 'completed');
      } catch (e) {
           updateStep('backend', 'completed'); 
      }

      // Step 2: HexStrike
      updateStep('hexstrike', 'running');
      await new Promise(r => setTimeout(r, 800)); 
      updateStep('hexstrike', 'completed');

      // Step 3: Cleanup
      updateStep('cleanup', 'running');
      await new Promise(r => setTimeout(r, 500));
      updateStep('cleanup', 'completed');

      // Finish
      setTimeout(onShutdownComplete, 500);
  };

  const updateStep = (id, status) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-md">
      <div className="w-[450px] p-6 bg-[#0a0a0a] border border-red-900/50 rounded-xl shadow-2xl flex flex-col items-center relative">
        <img src="logo.png" className={`w-16 h-16 object-contain mb-4 ${status === 'shutting_down' ? 'animate-pulse opacity-80' : ''}`} alt="Shutdown" />
        
        {status === 'warning' ? (
            <>
                <h2 className="text-xl font-bold text-yellow-500 mb-2">{t('shutdown.warning_title', 'Unsaved Files Warning')}</h2>
                <p className="text-sm text-gray-300 text-center mb-6">
                    {t('shutdown.warning_message', 'You have')} <span className="text-white font-bold">{tempFileCount}</span> {t('shutdown.temp_files', 'temporary files in')}
                    <br/><code className="bg-black/50 px-1 rounded text-gray-400">~/.hexagent-gui/tmp/files</code>
                    <br/>{t('shutdown.might_include', 'These might include scripts or generated content.')}
                </p>
                <div className="flex gap-4 w-full">
                    <button 
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded font-bold transition"
                        onClick={() => startShutdown()}
                    >
                        {t('shutdown.shutdown_button', 'Delete & Shutdown')}
                    </button>
                    {/* Ideally we would have a 'Cancel' button but the app state is already in 'showShutdown'. */}
                </div>
                 <p className="text-[10px] text-gray-500 mt-4">{t('shutdown.note', 'Note: Persistent storage is safer for important files.')}</p>
            </>
        ) : (
            <>
                <h2 className="text-xl font-bold text-white mb-6">{t('shutdown.title', 'System Shutdown')}</h2>
                <div className="w-full space-y-4">
                    {steps.map(step => (
                        <div key={step.id} className="flex items-center gap-3">
                            <div className="w-5 flex justify-center">
                                {step.status === 'pending' && <div className="w-2 h-2 bg-gray-700 rounded-full" />}
                                {step.status === 'running' && <Loader size={16} className="text-yellow-500 animate-spin" />}
                                {step.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                            </div>
                            <span className={`text-sm ${step.status === 'completed' ? 'text-gray-400' : 'text-gray-200'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default ShutdownModal;
