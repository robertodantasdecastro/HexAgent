import { EventSourcePolyfill } from 'event-source-polyfill';
import { Activity, Download, Play, RefreshCw, Square, Terminal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import APIClient from '../../utils/APIClient';

const HexStrikeMonitorPanel = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const logsEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Fetch status
  const fetchStatus = async () => {
    try {
      const res = await APIClient.getInstance().get('/hexstrike/status');
      if (res.status === 'success') {
        setStatus(res.data.status); // "running", "stopped", "starting"
      }
    } catch (e) {
      setStatus('error');
    }
  };

  // Start SSE connection
  const startSSE = () => {
    if (eventSourceRef.current) {
        if (typeof eventSourceRef.current.close === 'function') {
            eventSourceRef.current.close();
        } else {
            clearTimeout(eventSourceRef.current);
        }
    }
    const token = localStorage.getItem('token');
    const api = APIClient.getInstance();
    // Using EventSourcePolyfill for broader environment support
    const url = `${api.getBaseURL()}/hexstrike/logs/stream${token ? `?token=${token}` : ''}`;
    
    const es = new EventSourcePolyfill(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    es.onmessage = (e) => {
      setLogs(prev => {
        const newLogs = [...prev, e.data];
        return newLogs.length > 500 ? newLogs.slice(newLogs.length - 500) : newLogs;
      });
    };
    
    es.onerror = () => {
      es.close();
      // Only retry if not unmounting
      eventSourceRef.current = setTimeout(startSSE, 5000); 
    };
    
    eventSourceRef.current = es;
  };

  useEffect(() => {
    fetchStatus();
    startSSE();
    const interval = setInterval(fetchStatus, 3000); // Poll status
    
    return () => {
      clearInterval(interval);
      if (eventSourceRef.current) {
        if (typeof eventSourceRef.current.close === 'function') {
            eventSourceRef.current.close();
        } else {
            clearTimeout(eventSourceRef.current);
        }
      }
    };
  }, []);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await APIClient.getInstance().post(`/hexstrike/${action}`);
      await fetchStatus();
      setLogs(prev => [...prev, `[SYSTEM] HexStrike action: ${action.toUpperCase()}`]);
    } catch (e) {
      setLogs(prev => [...prev, `[ERROR] Failed to ${action}: ${e.message}`]);
    } finally {
      setLoading(false);
    }
  };

  // Safe rendering of ANSI to simple text
  const formatLog = (logStr) => {
    // eslint-disable-next-line
    const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
    return logStr.replace(ansiRegex, '');
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'starting': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const downloadLogs = () => {
    if (logs.length === 0) return;
    const blob = new Blob([logs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hexstrike-daemon-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} shadow-[0_0_10px_currentColor] animate-pulse`} />
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-wide">
              <Terminal className="text-cyan-400" size={24} />
              HexStrike Daemon Monitor
            </h2>
            <span className="text-xs uppercase px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono">
              {status}
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTROLS */}
        <div className="flex gap-2 p-3 bg-slate-800/30 border-b border-slate-800 shrink-0">
          <button
            onClick={() => handleAction('start')}
            disabled={loading || status === 'running'}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Play size={16} /> Start Server
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={loading || status === 'stopped'}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <Square size={16} /> Stop Server
          </button>
          <button
            onClick={() => handleAction('restart')}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading && !['unknown', 'error'].includes(status) ? 'animate-spin' : ''} /> Restart Server
          </button>
          
          <div className="w-px bg-slate-700 mx-1"></div>
          
          <button
            onClick={downloadLogs}
            disabled={logs.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            title="Download Logs"
          >
            <Download size={16} /> Export
          </button>
        </div>

        {/* TERMINAL AREA */}
        <div className="flex-1 bg-black p-4 overflow-y-auto font-mono text-sm leading-relaxed text-slate-300 h-96">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <Activity className="animate-pulse" size={32} />
              <p>Waiting for HexStrike logs...</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="break-words whitespace-pre-wrap hover:bg-slate-800/50 px-1 rounded flex gap-3">
                <span className="text-slate-600 select-none shrink-0">{String(index + 1).padStart(4, '0')}</span>
                <span className={log.includes('[ERROR]') || log.toLowerCase().includes('failed') ? 'text-red-400' : 'text-slate-300'}>
                  {formatLog(log)}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default HexStrikeMonitorPanel;
