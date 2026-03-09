import { Key, Lock, Shield, ShieldAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import APIClient from '../../utils/APIClient';

export default function SudoModal({ isOpen, onClose, t, sudoActive, setSudoActive }) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [riskAccepted, setRiskAccepted] = useState(false);

    // Keep state cleanly synced when mounting
    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setError(null);
            setRiskAccepted(false);
        }
    }, [isOpen]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        if (!riskAccepted) {
            setError("You must accept the risks before elevating privileges.");
            return;
        }

        setIsLoading(true);

        try {
            const api = APIClient.getInstance();
            const res = await api.post('/security/sudo', { password });
            
            // Backend wraps in {success, data: {elevated}} envelope
            if (res?.data?.elevated || res?.elevated) {
                setSudoActive(true);
                onClose();
            } else {
                setError(t ? t('sudo.error.invalid_password', 'Invalid sudo password.') : 'Invalid sudo password.');
            }
        } catch (err) {
            setError(err.message || 'Failed to authenticate sudo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            const api = APIClient.getInstance();
            await api.delete('/security/sudo');
            setSudoActive(false);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0f0f0f] border border-[#333] shadow-2xl rounded-lg w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${sudoActive ? 'border-red-900/50 bg-red-950/20' : 'border-[#222] bg-[#141414]'}`}>
                    <div className="flex items-center gap-3">
                        {sudoActive ? (
                            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                        ) : (
                            <Shield className="w-5 h-5 text-gray-400" />
                        )}
                        <h2 className="font-semibold text-gray-200">
                            {sudoActive ? 'Sudo Mode Active' : 'Elevate Privileges'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-500 rounded hover:text-white hover:bg-white/10">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {sudoActive ? (
                        <div className="space-y-4">
                            <div className="p-4 border border-red-900/50 rounded-md bg-red-950/20 text-red-400 text-sm">
                                <strong>Warning:</strong> You are currently operating with Elevated Privileges. Agent tools and Terminal instances have raw Root access to your system.
                            </div>
                            <button
                                onClick={handleLogout}
                                disabled={isLoading}
                                className="w-full flex justify-center items-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition disabled:opacity-50"
                            >
                                <Lock className="w-4 h-4" />
                                {isLoading ? 'Revoking...' : 'Revoke Sudo Access'}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-400">Root Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-[#333] rounded-md bg-[#1a1a1a] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 sm:text-sm"
                                        placeholder="sudo password"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-start text-sm mt-4">
                               <input 
                                   type="checkbox"
                                   id="risk-checkbox"
                                   checked={riskAccepted}
                                   onChange={(e) => setRiskAccepted(e.target.checked)}
                                   className="mt-1 mr-2 rounded border-red-500/50 bg-[#1a1a1a] text-red-500 focus:ring-red-500"
                               />
                               <label htmlFor="risk-checkbox" className="text-gray-400 font-mono text-[11px] leading-tight">
                                   I acknowledge the risks of granting <span className="text-red-400 font-bold">Unattended Root Access</span> to Autonomous AI Agents.
                               </label>
                            </div>

                            {error && (
                                <div className="text-red-400 text-xs mt-2 bg-red-900/20 p-2 rounded border border-red-900/50">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading || !password || !riskAccepted}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? 'Authenticating...' : 'Authorize Root Mode'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
