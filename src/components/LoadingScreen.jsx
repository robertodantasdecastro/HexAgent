import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Copy, Loader, RefreshCw, Terminal, XCircle } from 'lucide-react';
import { useState } from 'react';

/**
 * LoadingScreen Component
 * 
 * Features:
 * - Draggable Header (App Region)
 * - Robust Error Display (Copyable, prevent overflow)
 * - Status Details Toggle (Verbose logs)
 */

const LoadingScreen = ({ initStatus, progress, error, onRetry, onContinue }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="text-[#00ff00]" />;
      case 'loading': return <Loader size={16} className="text-blue-400 animate-spin" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      default: return <div className="w-4 h-4 rounded-full border-2 border-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-[#00ff00]';
      case 'loading': return 'text-blue-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const saveLogs = async () => {
    try {
        const text = `Error: ${error?.message}\nBackend: ${JSON.stringify(initStatus.backend)}\nBrain: ${JSON.stringify(initStatus.brain)}\nHexStrike: ${JSON.stringify(initStatus.hexstrike)}`;
        // Use Electron API if available or simpler clipboard + alert method for now, 
        // OR call backend to save file.
        // Let's call backend to save to logs
        await fetch('http://localhost:5000/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `echo "${text.replace(/"/g, '\\"')}" > ~/.hexagent-gui/log/startup_error.log` })
        });
        alert("Logs saved to ~/.hexagent-gui/log/startup_error.log");
    } catch(e) {
        alert("Failed to save logs automatically. Please use Copy.");
    }
  };

  const handleClose = () => {
      // If Electron, close window
      if (window.require) {
          try {
              const { ipcRenderer } = window.require('electron');
              ipcRenderer.send('app-close-requested'); // Or quit
          } catch(e) {}
      } else {
          window.close();
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 relative">
      
      {/* GLOBAL DRAG BAR - Fixed at top of window */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-transparent z-50 flex justify-end items-center px-2 drag-region">
          {/* Window Controls could go here if frameless */}
      </div>

      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#333] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 relative">
        
        {/* Card Header (Also Draggable for intuition) */}
        <div 
          className="bg-[#111] border-b border-[#333] p-4 flex flex-col items-center cursor-move drag-region"
        >
          <img src="logo.png" className="w-12 h-12 object-contain mb-2 pointer-events-none" alt="Logo" />
          <h1 className="text-xl font-bold tracking-wider pointer-events-none">HEXAGENT GUI</h1>
          <p className="text-xs text-gray-500 pointer-events-none">
            {error ? 'Initialization Failed / Falha na Inicialização' : 'System Initialize / Inicializando Sistema'}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Progress Bar */}
          {!error && (
            <div className="mb-6">
              <div className="w-full bg-[#111] rounded-full h-1.5 overflow-hidden border border-[#333]">
                <div
                  className="h-full bg-gradient-to-r from-[#00ff00] to-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(0,255,0,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 text-right mt-1 font-mono">{progress}%</p>
            </div>
          )}

          {/* Service Grid */}
          <div className="space-y-3 mb-6 bg-[#0f0f0f] p-3 rounded border border-[#222]">
            {Object.entries(initStatus).map(([service, data]) => (
              <div key={service} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  {getStatusIcon(data.status)}
                  <span className={`text-sm font-mono transition-colors ${getStatusColor(data.status)}`}>
                    {service === 'backend' && 'Backend Flask (5000)'}
                    {service === 'brain' && 'Brain HexSecGPT'}
                    {service === 'hexstrike' && 'HexStrike Engine (8888)'}
                    {service === 'config' && 'Configuration'}
                  </span>
                </div>
                {/* Status Message Ppill */}
                <span className="text-[10px] text-gray-600 bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#222]">
                   {data.message || data.status}
                </span>
              </div>
            ))}
          </div>

          {/* Error Display */}
          {error && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4 mb-4 relative group">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-red-400 mb-1">Critical Startup Error</h3>
                      <div className="text-xs text-gray-300 font-mono break-words whitespace-pre-wrap bg-black/50 p-2 rounded border border-red-900/30 mb-2 select-text">
                        {error.message || "Unknown Error"}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                          <button 
                            onClick={copyError}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-[10px] border border-red-500/30 transition-colors"
                          >
                             <Copy size={10} /> Copy Logs
                          </button>
                          <button 
                            onClick={saveLogs}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-[10px] border border-blue-500/30 transition-colors"
                          >
                             <Terminal size={10} /> Save Logs
                          </button>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Help Links */}
               <div className="text-xs text-center text-gray-500 mb-6 space-y-1">
                  <p>Need Help? / Precisa de Ajuda?</p>
                  <a href="https://github.com/robertodantasdecastro/HexAgent/wiki" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline block truncate">
                    github.com/robertodantasdecastro/HexAgent/wiki
                  </a>
               </div>
            </div>
          )}

          {/* Details Toggle */}
          <div className="mb-4">
             <button 
               onClick={() => setShowDetails(!showDetails)}
               className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full p-2 hover:bg-[#1a1a1a] rounded border border-transparent hover:border-[#333]"
             >
                {showDetails ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <Terminal size={12} />
                <span>System Logs / Logs do Sistema</span>
             </button>
             
             {showDetails && (
               <div className="mt-2 text-[10px] font-mono text-gray-400 bg-black p-3 rounded border border-[#222] overflow-x-auto max-h-32 custom-scrollbar select-text">
                   <div className="mb-1 text-cyan-500">$ check_status --verbose</div>
                   {Object.entries(initStatus).map(([k, v]) => (
                      <div key={k} className="mb-0.5">
                         <span className="text-blue-500">[{k.toUpperCase()}]</span> {v.status.toUpperCase()} - {v.message}
                      </div>
                   ))}
                   {error && <div className="text-red-500 mt-2">[FATAL] {error.message}</div>}
               </div>
             )}
          </div>
        </div>

        {/* Footer Actions */}
        {error && (
          <div className="p-4 bg-[#111] border-t border-[#333] grid grid-cols-2 gap-3">
             <button
               onClick={onRetry}
               className="col-span-2 w-full bg-[#00ff00] text-black font-bold text-sm py-2 rounded hover:bg-[#00cc00] transition-colors flex items-center justify-center gap-2"
            >
               <RefreshCw size={14} /> Restart Services
            </button>
             <button
               onClick={handleClose}
               className="w-full bg-[#222] text-gray-300 font-mono text-xs py-2 rounded hover:bg-[#333] transition-colors border border-[#333]"
            >
               Close App
            </button>
            <button
               onClick={onContinue}
               className="w-full bg-[#222] text-gray-300 font-mono text-xs py-2 rounded hover:bg-[#333] transition-colors border border-[#333]"
            >
               Force Continue
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { bg: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
