/**
 * Monitoring Dashboard Component
 * Painel de Monitoramento
 * 
 * Displays Live System Stats and Network Traffic.
 * Exibe Stats do Sistema em Tempo Real e Tráfego de Rede.
 */
import { Activity, Cpu, Network, ShieldAlert, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import APIClient from '../utils/APIClient';
import { SimpleTransition } from './SimpleTransition';

const MonitoringDashboard = ({ isOpen, onClose }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Poll stats every 2 seconds when open
    useEffect(() => {
        let interval;
        if (isOpen) {
            fetchStats();
            interval = setInterval(fetchStats, 2000);
        }
        return () => clearInterval(interval);
    }, [isOpen]);

    const fetchStats = async () => {
        try {
            const api = APIClient.getInstance();
            const response = await api.get('/monitoring/stats');
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    if (!isOpen) return null;

    return (
        <SimpleTransition 
            show={isOpen} 
            duration={300}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
            <div
                onClick={onClose}
                className="w-full h-full flex items-center justify-center"
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0a0a0a] border border-purple-500/30 rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden glass-panel scale-100 opacity-100 transition-all duration-300"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#111]/50">
                        <div className="flex items-center gap-3">
                            <Activity className="text-purple-400 animate-pulse" size={20} />
                            <h2 className="text-lg font-bold text-white tracking-wide">Shadow Mode Dashboard</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <XCircle size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* 1. System Vitality */}
                        <div className="col-span-1 space-y-4">
                            <div className="bg-[#111] border border-[#222] rounded p-4">
                                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Cpu size={14} /> Vitality
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">CPU Load</span>
                                            <span className={`font-mono ${stats?.cpu > 80 ? 'text-red-500' : 'text-cyan-400'}`}>
                                                {stats?.cpu || 0}%
                                            </span>
                                        </div>
                                        <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${stats?.cpu > 80 ? 'bg-red-500' : 'bg-cyan-500'} transition-all duration-500`} 
                                                style={{ width: `${stats?.cpu || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-400">Memory</span>
                                            <span className="font-mono text-purple-400">{stats?.memory || 0}%</span>
                                        </div>
                                        <div className="h-1 bg-[#222] rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-500 transition-all duration-500" 
                                                style={{ width: `${stats?.memory || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alerts Panel */}
                            <div className="bg-[#111] border border-[#222] rounded p-4 h-[200px] overflow-y-auto">
                                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ShieldAlert size={14} /> Intrusion Alerts
                                </h3>
                                {stats?.alerts && stats.alerts.length > 0 ? (
                                    <ul className="space-y-2">
                                        {stats.alerts.map((alert, idx) => (
                                            <li key={idx} className="text-xs text-red-400 font-mono bg-red-900/10 p-2 rounded border border-red-900/30 flex items-start gap-2">
                                                <span>⚠️</span> {alert}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-xs text-gray-600 font-mono text-center mt-10">
                                        No active threats detected.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Network Traffic */}
                        <div className="col-span-1 md:col-span-2 bg-[#111] border border-[#222] rounded p-4 flex flex-col">
                            <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Network size={14} /> Active Connections</span>
                                <span className="text-cyan-400 font-mono">{stats?.net_connections || 0} ESTABLISHED</span>
                            </h3>
                            
                            <div className="flex-1 overflow-hidden relative bg-black/50 rounded border border-[#222]">
                                <table className="w-full text-left text-[10px] font-mono">
                                    <thead className="bg-[#1a1a1a] text-gray-400">
                                        <tr>
                                            <th className="p-2">Local Address</th>
                                            <th className="p-2">Remote Address</th>
                                            <th className="p-2">PID</th>
                                            <th className="p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#222]">
                                        {stats?.active_connections_list?.map((conn, idx) => (
                                            <tr key={idx} className="hover:bg-[#1a1a1a] transition">
                                                <td className="p-2 text-cyan-300">{conn.local}</td>
                                                <td className="p-2 text-yellow-300">{conn.remote}</td>
                                                <td className="p-2 text-gray-400">{conn.pid}</td>
                                                <td className="p-2 text-green-500">ESTABLISHED</td>
                                            </tr>
                                        ))}
                                        {(!stats?.active_connections_list || stats.active_connections_list.length === 0) && (
                                             <tr>
                                                 <td colSpan={4} className="p-4 text-center text-gray-600">No active traffic captured.</td>
                                             </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                    
                    {/* Footer */}
                    <div className="p-4 border-t border-[#333] bg-[#111]/30 flex justify-end">
                        <div className="text-[10px] text-gray-600 font-mono flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Live Monitoring Active ({stats ? 'Connected' : 'Connecting...'})
                        </div>
                    </div>
                </div>
            </div>
        </SimpleTransition>
    );
};

export default MonitoringDashboard;
