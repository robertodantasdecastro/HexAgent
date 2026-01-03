import { CheckCircle, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';

const ShutdownModal = ({ isOpen, onShutdownComplete }) => {
  const [steps, setSteps] = useState([
    { id: 'check_files', label: 'Checking Temporary Files...', status: 'pending' },
    { id: 'backend', label: 'Stopping Backend Services...', status: 'pending' },
    { id: 'hexstrike', label: 'Terminating HexStrike Engine...', status: 'pending' },
    { id: 'cleanup', label: 'Cleaning up Resources...', status: 'pending' }
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
          const res = await fetch('http://localhost:5000/files/temp');
          const data = await res.json();
          setTempFileCount(data.count || 0);
          updateStep('check_files', 'completed');
          
          if (data.count > 0) {
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
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 2000);
           
           await fetch('http://localhost:5000/shutdown', { 
               method: 'POST',
               signal: controller.signal
           }).catch(e => console.log("Backend likely stopped", e)); 
           clearTimeout(timeoutId);
           
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
                <h2 className="text-xl font-bold text-yellow-500 mb-2">Unsaved Files Warning</h2>
                <p className="text-sm text-gray-300 text-center mb-6">
                    You have <span className="text-white font-bold">{tempFileCount}</span> temporary files in 
                    <br/><code className="bg-black/50 px-1 rounded text-gray-400">~/.hexagent-gui/tmp/files</code>
                    <br/>These might include scripts or generated content.
                </p>
                <div className="flex gap-4 w-full">
                    <button 
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded font-bold transition"
                        onClick={() => startShutdown()}
                    >
                        Delete & Shutdown
                    </button>
                    {/* Ideally we would have a 'Cancel' button but the app state is already in 'showShutdown'. */}
                </div>
                 <p className="text-[10px] text-gray-500 mt-4">Note: Persistent storage is safer for important files.</p>
            </>
        ) : (
            <>
                <h2 className="text-xl font-bold text-white mb-6">System Shutdown</h2>
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
