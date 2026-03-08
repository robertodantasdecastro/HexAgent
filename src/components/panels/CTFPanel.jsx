import { Activity, Beaker, CheckCircle, Code, Crosshair, Flag, Globe, Lock, Search, ShieldAlert, Terminal, Unlock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import HexStrikeService from '../../services/HexStrikeService';
import Logger from '../../utils/Logger';

const WORKFLOWS = [
    { id: 'crypto-cracking', name: 'Cryptography & Hashes', icon: Lock, description: 'Crack hashes, decode ciphers, and identify cryptographic patterns.' },
    { id: 'stego-extract', name: 'Steganography Analysis', icon: Search, description: 'Extract hidden data from images, audio, and binary files.' },
    { id: 'pwn-exploit', name: 'Binary Exploitation (Pwn)', icon: Crosshair, description: 'Generate exploit templates, ROP chains, and analyze binaries.' },
    { id: 'web-vuln', name: 'Web Exploitation', icon: Globe, description: 'Exploit SQLi, LFI, RCE and bypass WAFs in web challenges.' },
    { id: 'forensics-analysis', name: 'Digital Forensics', icon: Beaker, description: 'Analyze PCAP captures, memory dumps, and file metadata.' },
    { id: 'reverse-engineering', name: 'Reverse Engineering', icon: Code, description: 'Decompile, disassemble, and hook functions dynamically.' },
    { id: 'privesc-enum', name: 'Privilege Escalation', icon: Unlock, description: 'Automate local enumeration for Linux/Windows privesc vectors.' }
];

const CTFPanel = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const logger = Logger.getInstance();
    
    const [activeWorkflow, setActiveWorkflow] = useState(WORKFLOWS[0]);
    const [target, setTarget] = useState('');
    const [payload, setPayload] = useState(''); // Extra config useful for CTFs
    
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    // Reset state when closing/opening or changing workflow
    useEffect(() => {
        setResults(null);
        setError(null);
    }, [isOpen, activeWorkflow]);

    const handleRunWorkflow = async () => {
        if (!target) return;
        
        setLoading(true);
        setResults(null);
        setError(null);
        
        try {
            const response = await HexStrikeService.runCtfWorkflow(activeWorkflow.id, requestPayload);
            
            if (response.success && response.data) {
                setResults(response.data);
            } else {
                setError(response.message || response.error || 'Unknown error during workflow execution.');
            }
        } catch (err) {
            logger.error(`Failed to execute CTF workflow ${activeWorkflow.id}`, err);
            setError(err.message || 'Connection to HexStrike Server failed.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-[#0a0a0a] rounded-lg w-full max-w-6xl h-[85vh] flex flex-col border border-green-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] shrink-0 bg-[#070b07]">
                    <div className="flex items-center gap-3">
                        <Flag className="text-green-500" size={24} />
                        <div>
                           <h2 className="text-xl font-bold text-white tracking-wide">Capture The Flag (CTF)</h2>
                           <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">HexStrike Offensive Workflows</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Sidebar: Workflows */}
                    <div className="w-1/4 bg-[#111] border-r border-[#333] flex flex-col shrink-0">
                        <div className="p-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[#222]">
                             Categories
                        </div>
                        <div className="flex-1 overflow-y-auto py-2 space-y-1">
                             {WORKFLOWS.map((wf) => {
                                 const Icon = wf.icon;
                                 const isActive = activeWorkflow.id === wf.id;
                                 return (
                                     <button 
                                         key={wf.id}
                                         onClick={() => setActiveWorkflow(wf)}
                                         className={`w-full text-left px-4 py-3 flex items-start gap-3 transition font-mono text-sm border-l-2 ${isActive ? 'bg-green-900/10 border-green-500 text-green-400' : 'border-transparent text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200'}`}
                                     >
                                         <Icon size={18} className="mt-0.5 shrink-0" />
                                         <div className="flex flex-col">
                                            <span className="font-bold">{wf.name}</span>
                                            {isActive && <span className="text-[10px] text-gray-500 mt-1 leading-tight">{wf.description}</span>}
                                         </div>
                                     </button>
                                 );
                             })}
                        </div>
                    </div>

                    {/* Content: Configuration & Execution */}
                    <div className="w-1/3 border-r border-[#333] bg-[#0c0c0c] p-6 flex flex-col overflow-y-auto shrink-0 relative">
                        {loading && (
                             <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                                 <Activity className="animate-spin text-green-500 mb-4" size={40} />
                                 <p className="text-green-400 font-mono text-sm uppercase tracking-widest animate-pulse">Running Exploit...</p>
                             </div>
                        )}
                        
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">{activeWorkflow.name}</h3>
                            <p className="text-sm text-gray-400">{activeWorkflow.description}</p>
                        </div>
                        
                        <div className="space-y-6 flex-1">
                            {/* Target Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Crosshair size={14} /> Scope Target / File
                                </label>
                                <input 
                                    type="text" 
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    placeholder="e.g. hash string, IP, or /path/to/binary"
                                    className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-sm text-white focus:border-green-500 focus:outline-none transition font-mono"
                                />
                            </div>
                            
                            {/* Optional Payload Area */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Code size={14} /> Payload / Wordlist / Args
                                </label>
                                <textarea 
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                    placeholder="Optional JSON or string payload to inject"
                                    rows={4}
                                    className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-sm text-white focus:border-green-500 focus:outline-none transition font-mono"
                                />
                            </div>

                            <div className="p-4 bg-green-900/10 border border-green-500/20 rounded-lg">
                                <p className="text-xs text-green-500 flex items-start gap-2 leading-relaxed">
                                    <ShieldAlert size={16} className="shrink-0 mt-0.5" /> 
                                    Ensure this matches the CTF rules of engagement. AI will formulate extraction chains based on the provided vectors.
                                </p>
                            </div>
                        </div>

                        {/* Execute Button */}
                        <div className="pt-6 border-t border-[#333] mt-4">
                            <button 
                                onClick={handleRunWorkflow}
                                disabled={loading || !target}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-black font-mono shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-bold rounded"
                            >
                                <Flag size={18} fill="currentColor" /> Initialize Workflow
                            </button>
                        </div>
                    </div>

                    {/* Console / Results View */}
                    <div className="flex-1 bg-black p-0 flex flex-col font-mono overflow-hidden">
                        <div className="px-4 py-2 bg-[#111] border-b border-[#333] flex items-center text-xs text-green-500 uppercase tracking-widest">
                            <Terminal size={14} className="mr-2" /> Output Console
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-300">
                            {!results && !error && !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-800 opacity-50 select-none">
                                    <Flag size={64} className="mb-4" />
                                    <p>Select target and configure payload to deploy.</p>
                                </div>
                            )}

                            {error && (
                                <div className="text-red-400 p-4 border border-red-500/20 bg-red-900/10 rounded-lg flex items-start gap-3">
                                    <XCircle className="shrink-0 mt-0.5" size={18} />
                                    <div className="whitespace-pre-wrap">{error}</div>
                                </div>
                            )}

                            {results && (
                                <div className="space-y-4 animate-in fade-in duration-500">
                                    <div className="flex items-center gap-2 text-green-400 mb-6">
                                        <CheckCircle size={18} />
                                        <span className="font-bold">Execution Completed</span>
                                    </div>
                                    
                                    <div className="bg-[#0f0f0f] border border-[#222] rounded-lg p-4 overflow-x-auto">
                                        <pre className="text-xs text-green-300">
                                            {JSON.stringify(results, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CTFPanel;
