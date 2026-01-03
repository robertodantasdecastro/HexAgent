import React, { useEffect, useState } from 'react';
import { Power, CheckCircle, Loader } from 'lucide-react';

const ShutdownModal = ({ isOpen, onShutdownComplete }) => {
  const [steps, setSteps] = useState([
    { id: 'backend', label: 'Stopping Backend Services...', status: 'pending' },
    { id: 'hexstrike', label: 'Terminating HexStrike Engine...', status: 'pending' },
    { id: 'cleanup', label: 'Cleaning up Resources...', status: 'pending' }
  ]);

  useEffect(() => {
    if (isOpen) {
        startShutdown();
    }
  }, [isOpen]);

  const startShutdown = async () => {
      // Step 1: Request Backend Shutdown
      updateStep('backend', 'running');
      try {
          // We call a new endpoint /shutdown
          // Use fetch with short timeout since it might die quickly
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 2000);
           
           await fetch('http://localhost:5000/shutdown', { 
               method: 'POST',
               signal: controller.signal
           }).catch(e => console.log("Backend likely stopped", e)); // Ignore error if connections closes
           clearTimeout(timeoutId);
           
           updateStep('backend', 'completed');
      } catch (e) {
           updateStep('backend', 'completed'); // Assume stopped
      }

      // Step 2: HexStrike (Backend handles this, but we simulate visual progress for user)
      updateStep('hexstrike', 'running');
      await new Promise(r => setTimeout(r, 800)); // Fake delay for visualization
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
      <div className="w-[400px] p-6 bg-[#0a0a0a] border border-red-900/50 rounded-xl shadow-2xl flex flex-col items-center">
        <img src="/logo.png" className="w-16 h-16 object-contain mb-4 animate-pulse opacity-80" alt="Shutdown" />
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
      </div>
    </div>
  );
};

export default ShutdownModal;
