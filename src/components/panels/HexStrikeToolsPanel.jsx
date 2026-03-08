/**
 * HexStrikeToolsPanel Component
 * Modal dashboard for launching security tools natively via HexStrike
 * 
 * Painel Modal para lançamento de ferramentas de segurança nativas via HexStrike
 */

import { Activity, Box, ChevronRight, Crosshair, Globe, Layers, Play, Search, Shield, Terminal, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import HexStrikeService from '../../services/HexStrikeService';
import Logger from '../../utils/Logger';

const HexStrikeToolsPanel = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [tools, setTools] = useState({});
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedTool, setSelectedTool] = useState(null);
    const [executionTarget, setExecutionTarget] = useState('');
    const [executionParams, setExecutionParams] = useState('');
    const logger = Logger.getInstance();

    useEffect(() => {
        if (isOpen) {
            fetchTools();
        }
    }, [isOpen]);

    const fetchTools = async () => {
        setLoading(true);
        try {
            const response = await HexStrikeService.listTools();
            if (response.success && response.data) {
                // Determine categories based on the response format
                // If the backend returns a dict grouped by category, we use it directly.
                // Otherwise if it returns a flat list, we can group them.
                let toolsData = response.data;
                // Fake grouping if the backend returns a flat dict/list
                if (Array.isArray(toolsData)) {
                    // Group logic here if needed, assuming backend does it or we fake it
                    setTools({ "All Tools": toolsData });
                    setActiveCategory("All Tools");
                } else {
                    setTools(toolsData);
                    const cats = Object.keys(toolsData);
                    if (cats.length > 0) setActiveCategory(cats[0]);
                }
            } else {
               // Fallback mock strictly for showcasing the UI if backend is not ready
               const mock = {
                   "Network Recon": [
                       { name: "nmap", description: "Network exploration tool and security / port scanner", icon: <Globe size={16}/> },
                       { name: "masscan", description: "TCP port scanner, spews SYN packets asynchronously", icon: <Globe size={16}/> },
                       { name: "rustscan", description: "The Modern Port Scanner", icon: <Globe size={16}/> }
                   ],
                   "Web Scanners": [
                       { name: "nuclei", description: "Fast and customizable vulnerability scanner based on simple YAML based DSL.", icon: <Globe size={16}/> },
                       { name: "nikto", description: "Web server scanner which performs comprehensive tests", icon: <Globe size={16}/> },
                       { name: "gobuster", description: "Directory/File, DNS and VHost busting tool written in Go", icon: <Search size={16}/> }
                   ],
                   "Cloud Security": [
                       { name: "prowler", description: "Security assessments, audits, incident response, continuous monitoring", icon: <Box size={16}/> },
                       { name: "scout-suite", description: "Multi-Cloud Security Auditing Tool", icon: <Box size={16}/> }
                   ],
                   "Containers": [
                       { name: "trivy", description: "Vulnerability Scanner for Containers and other Artifacts", icon: <Layers size={16}/> },
                       { name: "kube-hunter", description: "Hunt for security weaknesses in Kubernetes clusters", icon: <Layers size={16}/> }
                   ]
               };
               setTools(mock);
               setActiveCategory("Network Recon");
            }
        } catch (error) {
            logger.error('Failed to fetch tools', error);
        } finally {
            setLoading(false);
        }
    };

    const runTool = async () => {
        if (!selectedTool) return;
        setLoading(true);
        try {
            // const schema = await HexStrikeService.getToolSchema(selectedTool.name);
            
            let params = {};
            if (executionTarget) params.target = executionTarget;
            
            // Note: simple param parsing just for Proof of Concept
            if (executionParams) {
                 const pairs = executionParams.split(" ");
                 pairs.forEach(p => {
                     const [k, v] = p.split("=");
                     if (k && v) params[k] = v;
                 });
            }

            const response = await HexStrikeService.executeTool(selectedTool.name, params);
            if (response.success) {
                alert(`Tool ${selectedTool.name} dispatched successfully! Check Active Processes.`);
                setSelectedTool(null);
                setExecutionTarget('');
            } else {
                alert(`Failed: ${response.message || response.error}`);
            }
        } catch (error) {
            logger.error(`Failed to run tool ${selectedTool.name}`, error);
            alert(`Error running tool: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const categories = Object.keys(tools);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-[#0a0a0a] rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col border border-blue-500/30 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                    <div className="flex items-center gap-3">
                        <Crosshair className="text-blue-400" size={24} />
                        <div>
                           <h2 className="text-lg font-bold text-white tracking-wide">HexStrike Arsenal</h2>
                           <p className="text-[10px] text-gray-500 font-mono uppercase">Tactical Tools & Scanners Deployment</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar: Categories */}
                    <div className="w-1/4 bg-[#111] border-r border-[#333] flex flex-col">
                        <div className="p-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-[#222]">
                             Categories
                        </div>
                        <div className="flex-1 overflow-y-auto py-2">
                             {categories.map(cat => (
                                 <button 
                                     key={cat}
                                     onClick={() => setActiveCategory(cat)}
                                     className={`w-full text-left px-4 py-3 flex items-center gap-3 transition font-mono text-sm border-l-2 ${activeCategory === cat ? 'bg-blue-900/10 border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-300'}`}
                                 >
                                     <Terminal size={16} />
                                     <span>{cat}</span>
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* Content: Tool List or Tool Configuration */}
                    <div className="flex-1 overflow-y-auto bg-black p-6 relative">
                         {loading && (
                             <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                                 <Activity className="animate-spin text-blue-500" size={32} />
                             </div>
                         )}

                         {!selectedTool ? (
                             <div className="space-y-4">
                                 <h3 className="text-md font-bold text-gray-200 border-b border-[#333] pb-2 mb-4">{activeCategory}</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {Array.isArray(tools[activeCategory]) ? tools[activeCategory].map((tool, idx) => (
                                         <div 
                                            key={idx} 
                                            className="bg-[#111] border border-[#222] hover:border-blue-500/50 rounded-lg p-4 cursor-pointer transition group flex flex-col justify-between"
                                            onClick={() => setSelectedTool(tool)}
                                         >
                                             <div>
                                                 <div className="flex items-center gap-2 mb-2">
                                                     {tool.icon || <Terminal size={18} className="text-gray-500 group-hover:text-blue-400 transition" />}
                                                     <span className="font-bold text-gray-300 group-hover:text-white">{tool.name}</span>
                                                 </div>
                                                 <p className="text-xs text-gray-500">{tool.description}</p>
                                             </div>
                                             <div className="mt-4 flex justify-end">
                                                 <span className="text-[10px] text-blue-500/0 group-hover:text-blue-500 flex items-center gap-1 uppercase font-bold tracking-wider font-mono transition">
                                                     Select <ChevronRight size={12} />
                                                 </span>
                                             </div>
                                         </div>
                                     )) : (
                                         <div className="col-span-full py-8 text-center text-gray-500 font-mono text-sm border border-dashed border-[#333] rounded-lg">
                                             <p>No tools available or error loading tools.</p>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         ) : (
                             <div className="h-full flex flex-col">
                                 <div className="mb-4">
                                     <button 
                                        onClick={() => setSelectedTool(null)}
                                        className="text-xs text-blue-500 hover:text-blue-400 font-mono tracking-wider flex items-center gap-1 mb-4"
                                     >
                                         ← Back to {activeCategory}
                                     </button>
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-blue-900/20 text-blue-400 rounded-lg border border-blue-500/30">
                                                {selectedTool.icon || <Terminal size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{selectedTool.name}</h3>
                                                <p className="text-sm text-gray-400">{selectedTool.description}</p>
                                            </div>
                                        </div>
                                     </div>
                                 </div>

                                 <div className="flex-1 bg-[#0c0c0c] border border-[#222] rounded-lg p-6 space-y-6">
                                    <div className="space-y-4">
                                         <div>
                                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                 <TargetIcon size={14} /> Target
                                             </label>
                                             <input 
                                                type="text" 
                                                value={executionTarget}
                                                onChange={(e) => setExecutionTarget(e.target.value)}
                                                placeholder="e.g. 192.168.1.0/24, example.com"
                                                className="w-full bg-[#111] border border-[#333] rounded px-4 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none transition font-mono"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                 <SettingsIcon size={14} /> Additional Parameters (Optional)
                                             </label>
                                             <input 
                                                type="text" 
                                                value={executionParams}
                                                onChange={(e) => setExecutionParams(e.target.value)}
                                                placeholder="e.g. ports=80,443 speed=5 mode=stealth"
                                                className="w-full bg-[#111] border border-[#333] rounded px-4 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none transition font-mono"
                                             />
                                         </div>
                                     </div>

                                     <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-lg">
                                         <p className="text-xs text-yellow-500 flex items-center gap-2">
                                             <Shield size={16} /> 
                                             Ensure you have explicit authorization before scanning the specified target. HexStrike actions are logged.
                                         </p>
                                     </div>
                                 </div>

                                 <div className="mt-6 flex justify-end gap-3">
                                     <button 
                                        onClick={() => setSelectedTool(null)}
                                        className="px-6 py-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded text-gray-400 font-mono text-sm transition"
                                     >
                                         Cancel
                                     </button>
                                     <button 
                                        onClick={runTool}
                                        disabled={loading || !executionTarget}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                     >
                                         <Play size={16} /> Deploy {selectedTool.name}
                                     </button>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper components for missing icons above
const TargetIcon = ({size}) => <Crosshair size={size} />;
const SettingsIcon = ({size}) => <Box size={size} />;

export default HexStrikeToolsPanel;
