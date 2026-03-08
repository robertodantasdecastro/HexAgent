/**
 * ActiveProcessesPanel Component
 * Modal dashboard for monitoring and controlling async HexStrike tasks
 * 
 * Painel Modal para monitoramento e controle de tarefas assíncronas do HexStrike
 */

import { Activity, AlertTriangle, CheckCircle, Clock, PauseCircle, PlayCircle, RefreshCw, Server, Shield, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import HexStrikeService from '../../services/HexStrikeService';
import Logger from '../../utils/Logger';

const ActiveProcessesPanel = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [processes, setProcesses] = useState([]);
    const [dashboardStats, setDashboardStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // stores PID of process being acted upon
    const isMounted = useRef(true);
    const logger = Logger.getInstance();

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchData();
            const interval = setInterval(fetchData, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            // In a real scenario, we might want to fetch dashboard stats instead if it includes both
            const response = await HexStrikeService.listProcesses();
            
            if (response.success && isMounted.current) {
                // Determine format
                let data = response.data || [];
                // If API returns dict with processes list inside
                if (!Array.isArray(data) && data.processes) {
                     data = data.processes;
                } else if (!Array.isArray(data)) {
                     // Try to map dictionary to array if the backend returned { pid: { details } }
                     data = Object.keys(data).map(pid => ({ pid, ...data[pid] }));
                }
                setProcesses(data);
                
                // You could also fetch Dashboard metrics here if needed
            }
        } catch (error) {
            logger.error('Failed to fetch processes', error);
        }
    };

    const handleAction = async (pid, actionRef) => {
        setActionLoading(pid);
        try {
            let response;
            if (actionRef === 'terminate') response = await HexStrikeService.terminateProcess(pid);
            else if (actionRef === 'pause') response = await HexStrikeService.pauseProcess(pid);
            else if (actionRef === 'resume') response = await HexStrikeService.resumeProcess(pid);
            else throw new Error('Unknown action');

            if (response.success) {
                // Optimistic refresh
                await fetchData();
            } else {
                alert(`Action failed: ${response.message || response.error}`);
            }
        } catch (error) {
            logger.error(`Failed to ${actionRef} process ${pid}`, error);
        } finally {
            if (isMounted.current) setActionLoading(null);
        }
    };

    if (!isOpen) return null;

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'running': return <Activity className="text-blue-400 animate-pulse" size={16} />;
            case 'paused': return <PauseCircle className="text-yellow-500" size={16} />;
            case 'completed': return <CheckCircle className="text-green-500" size={16} />;
            case 'error':
            case 'failed': return <AlertTriangle className="text-red-500" size={16} />;
            default: return <Clock className="text-gray-400" size={16} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-[#0a0a0a] rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col border border-purple-500/30 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Server className="text-purple-400" size={24} />
                            <div>
                               <h2 className="text-lg font-bold text-white tracking-wide">Mission Control</h2>
                               <p className="text-[10px] text-gray-500 font-mono uppercase">Active Threat Scans & Tasks</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-[#222]">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span className="text-[10px] text-gray-400 font-mono tracking-wider">LIVE POLLING</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchData} className="text-gray-400 hover:text-cyan-400 transition" title="Force Refresh">
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <XCircle size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-black p-6">
                    {processes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                            <Shield size={64} className="opacity-20" />
                            <p className="font-mono text-sm tracking-wider uppercase">No active operations detected</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {processes.map((proc, idx) => (
                                <div key={proc.pid || idx} className="bg-[#111] border border-[#222] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-[#333]">
                                    
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 bg-black/50 p-2 rounded-lg border border-[#222]">
                                            {getStatusIcon(proc.status)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-gray-200 uppercase tracking-wide font-mono text-sm">
                                                    {proc.command ? proc.command.split(' ')[0] : (proc.name || 'Unknown Task')}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest bg-[#222] text-gray-400">
                                                    PID: {proc.pid || 'N/A'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 break-all w-full max-w-xl line-clamp-2 font-mono">
                                                {proc.command || proc.description || 'No command details available'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {(proc.status === 'running' || !proc.status) && (
                                            <button 
                                                onClick={() => handleAction(proc.pid, 'pause')}
                                                disabled={actionLoading === proc.pid}
                                                className="px-3 py-1.5 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-500/30 text-yellow-500 rounded text-xs font-mono transition flex items-center gap-2"
                                            >
                                                <PauseCircle size={14} /> Pause
                                            </button>
                                        )}
                                        {proc.status === 'paused' && (
                                            <button 
                                                onClick={() => handleAction(proc.pid, 'resume')}
                                                disabled={actionLoading === proc.pid}
                                                className="px-3 py-1.5 bg-green-900/20 hover:bg-green-900/40 border border-green-500/30 text-green-500 rounded text-xs font-mono transition flex items-center gap-2"
                                            >
                                                <PlayCircle size={14} /> Resume
                                            </button>
                                        )}
                                        {proc.status !== 'completed' && proc.status !== 'failed' && (
                                            <button 
                                                onClick={() => handleAction(proc.pid, 'terminate')}
                                                disabled={actionLoading === proc.pid}
                                                className="px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-500 rounded text-xs font-mono transition flex items-center gap-2"
                                            >
                                                <XCircle size={14} /> Terminate
                                            </button>
                                        )}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActiveProcessesPanel;
