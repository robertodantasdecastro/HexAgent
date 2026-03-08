import { Hammer, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import APIClient from '../../utils/APIClient';

const ToolMenu = ({ onExecute, className = "" }) => {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchTools = async () => {
            setLoading(true);
            try {
                // Fetch from backend
                const api = APIClient.getInstance();
                // Assuming APIClient wraps fetch. 
                // We access the raw endpoint /api/hexstrike/tools
                // Use APIClient instance
                const result = await api.get('/hexstrike/tools');
                
                if (result.success && result.data && result.data.tools) {
                    setTools(result.data.tools);
                } else {
                     // Fallback mock if backend not ready or empty
                     setTools([
                         { name: 'nmap', description: 'Network Scanner', category: 'recon' },
                         { name: 'nuclei', description: 'Vulnerability Scanner', category: 'vuln' },
                         { name: 'gobuster', description: 'Directory Brute Force', category: 'recon' },
                         { name: 'sqlmap', description: 'SQL Injection', category: 'exploitation' }
                     ]);
                }
            } catch (e) {
                console.error("Failed to fetch tools", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTools();
    }, []);

    const categories = {
        'recon': 'text-blue-400',
        'vuln': 'text-red-400',
        'exploitation': 'text-orange-400',
        'other': 'text-gray-400'
    };

    return (
        <div className={`flex flex-col h-full bg-[#0d1117] border-l border-[#333] p-2 w-[200px] ${className}`}>
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-mono uppercase border-b border-[#333] pb-1">
                <Hammer size={12} /> HexStrike Tools
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                {loading ? (
                    <div className="text-xs text-gray-600 animate-pulse">Loading Tools...</div>
                ) : tools.length === 0 ? (
                     <div className="text-xs text-gray-600">No tools found</div>
                ) : (
                    tools.map((tool, idx) => (
                        <div 
                            key={idx}
                            onClick={() => onExecute(tool.name + " --help")}
                            className="group flex flex-col p-2 rounded cursor-pointer hover:bg-[#1a1a1a] border border-transparent hover:border-[#333] transition-all"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold text-xs ${categories[tool.category] || 'text-cyan-400'}`}>
                                    {tool.name}
                                </span>
                                <Play size={10} className="text-gray-600 group-hover:text-green-500 opacity-0 group-hover:opacity-100 transition" />
                            </div>
                            <span className="text-[10px] text-gray-500 line-clamp-1">{tool.description}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ToolMenu;
