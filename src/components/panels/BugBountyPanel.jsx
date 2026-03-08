import { Activity, Bug, CheckCircle, Crosshair, Globe, LayoutTemplate, Play, Search, ShieldAlert, Terminal, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import HexStrikeService from '../../services/HexStrikeService';
import Logger from '../../utils/Logger';

const WORKFLOWS = [
    { id: 'reconnaissance-workflow', name: 'Reconnaissance', icon: Globe, description: 'Deep subdomain enumeration, port scanning, and asset discovery.' },
    { id: 'vulnerability-hunting-workflow', name: 'Vulnerability Hunting', icon: Search, description: 'Active scanning with Nuclei, Nikto and custom templates.' },
    { id: 'business-logic-workflow', name: 'Business Logic Testing', icon: LayoutTemplate, description: 'Analyze intended behavior vs edge cases in web applications.' },
    { id: 'osint-workflow', name: 'OSINT Intelligence', icon: ShieldAlert, description: 'Gather public intelligence, leaked credentials, and surface footprints.' },
    { id: 'file-upload-testing', name: 'File Upload Testing', icon: Bug, description: 'Test restrictions, bypasses and malicious payload execution on upload forms.' },
    { id: 'comprehensive-assessment', name: 'Comprehensive Assessment', icon: Crosshair, description: 'Full-scale automated audit combining all offensive techniques.' }
];

const BugBountyPanel = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const logger = Logger.getInstance();
    
    const [activeWorkflow, setActiveWorkflow] = useState(WORKFLOWS[0]);
    const [target, setTarget] = useState('');
    const [intensity, setIntensity] = useState('normal'); // safe, normal, aggressive
    
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
            const response = await HexStrikeService.runBugBounty(activeWorkflow.id, payload);
            
            if (response.success && response.data) {
                setResults(response.data);
            } else {
                setError(response.message || response.error || 'Unknown error during workflow execution.');
            }
        } catch (err) {
            logger.error(`Failed to execute workflow ${activeWorkflow.id}`, err);
            setError(err.message || 'Connection to HexStrike Server failed.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-[#0a0a0a] rounded-lg w-full max-w-6xl h-[85vh] flex flex-col border border-purple-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] shrink-0 bg-[#0f0f13]">
                    <div className="flex items-center gap-3">
                        <Bug className="text-purple-400" size={24} />
                        <div>
                           <h2 className="text-xl font-bold text-white tracking-wide">Bug Bounty Operations</h2>
                           <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">HexStrike Automated Workflows</p>
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
                             Attack Traces
                        </div>
                        <div className="flex-1 overflow-y-auto py-2 space-y-1">
                             {WORKFLOWS.map((wf) => {
                                 const Icon = wf.icon;
                                 const isActive = activeWorkflow.id === wf.id;
                                 return (
                                     <button 
                                         key={wf.id}
                                         onClick={() => setActiveWorkflow(wf)}
                                         className={`w-full text-left px-4 py-3 flex items-start gap-3 transition font-mono text-sm border-l-2 ${isActive ? 'bg-purple-900/10 border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200'}`}
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
                                 <Activity className="animate-spin text-purple-500 mb-4" size={40} />
                                 <p className="text-purple-400 font-mono text-sm uppercase tracking-widest animate-pulse">Running Workflow...</p>
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
                                    <Crosshair size={14} /> Scope Target
                                </label>
                                <input 
                                    type="text" 
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    placeholder="e.g. example.com, 192.168.1.0/24"
                                    className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none transition font-mono"
                                />
                            </div>
                            
                            {/* Intensity Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Scan Intensity
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['safe', 'normal', 'aggressive'].map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setIntensity(level)}
                                            className={`py-2 px-1 text-xs font-mono uppercase rounded border transition-colors ${intensity === level ? 'bg-purple-900/30 border-purple-500 text-purple-400 font-bold' : 'bg-[#111] border-[#333] text-gray-500 hover:text-gray-300'}`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-orange-900/10 border border-orange-500/20 rounded-lg">
                                <p className="text-xs text-orange-500 flex items-start gap-2 leading-relaxed">
                                    <ShieldAlert size={16} className="shrink-0 mt-0.5" /> 
                                    Ensure explicit authorization before scanning. HexStrike will generate a comprehensive report logic based on the targets provided.
                                </p>
                            </div>
                        </div>

                        {/* Execute Button */}
                        <div className="pt-6 border-t border-[#333] mt-4">
                            <button 
                                onClick={handleRunWorkflow}
                                disabled={loading || !target}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-sm shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-bold"
                            >
                                <Play size={18} fill="currentColor" /> Initialize Workflow
                            </button>
                        </div>
                    </div>

                    {/* Console / Results View */}
                    <div className="flex-1 bg-black p-0 flex flex-col font-mono overflow-hidden">
                        <div className="px-4 py-2 bg-[#111] border-b border-[#333] flex items-center text-xs text-gray-500 uppercase tracking-widest">
                            <Terminal size={14} className="mr-2" /> Output Console
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 text-sm text-gray-300">
                            {!results && !error && !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 select-none">
                                    <Bug size={64} className="mb-4" />
                                    <p>Select target and intensity to deploy.</p>
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
                                        <span className="font-bold">Workflow Completed Successfully</span>
                                    </div>
                                    
                                    <div className="bg-[#0f0f0f] border border-[#222] rounded-lg p-4 overflow-x-auto">
                                        <pre className="text-xs text-blue-300">
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

export default BugBountyPanel;
