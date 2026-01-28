/**
 * WorkflowModal Component
 * Componente Modal de Fluxo de Trabalho
 * 
 * Allows users to select and run predefined workflow templates.
 * Permite aos usuários selecionar e executar templates de fluxo de trabalho pré-definidos.
 * 
 * @author: Roberto Dantas de Castro
 */

import { Activity, GitBranch, Globe, Play, Search, Settings, Shield, Terminal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

// Mapping string icon names to Lucide components
const ICON_MAP = {
    'Terminal': Terminal,
    'Radar': Activity,
    'Globe': Globe,
    'Shield': Shield,
    'GitBranch': GitBranch
};

const WorkflowModal = ({ isOpen, onClose, api, onRunWorkflow }) => {
    const { t } = useTranslation();
    const [workflows, setWorkflows] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
        if (selectedWorkflow) {
            // Initialize defaults
            const defaults = {};
            selectedWorkflow.parameters?.forEach(p => {
                defaults[p.name] = p.default || '';
            });
            // If target variable exists in simple prompt workflows, keep it
            if (selectedWorkflow.variables?.includes('target')) {
               defaults['target'] = ''; 
            }
            setFormValues(defaults);
        }
    }, [selectedWorkflow]);

    const handleInputChange = (key, value) => {
        setFormValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleRun = () => {
        if (!selectedWorkflow) return;
        
        // Validation: Check required fields
        const missing = selectedWorkflow.parameters?.filter(p => p.required && !formValues[p.name]);
        if (missing && missing.length > 0) {
            alert(`Missing required fields: ${missing.map(m => m.label).join(', ')}`);
            return;
        }

        // Generic target fallback for prompt-based workflows
        const payload = { ...formValues };
        if (selectedWorkflow.variables?.includes('target') && !selectedWorkflow.parameters) {
             if (!targetInput) return;
             payload.target = targetInput;
        }

        onRunWorkflow(selectedWorkflow.id, payload);
        onClose();
    };

    // Filter
    const filteredWorkflows = workflows.filter(w => 
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        w.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[900px] h-[650px] bg-[#09090b] border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0c0c0e]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-900/20 rounded-lg text-purple-400">
                            <GitBranch size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-100">Workflow Library</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Select a mission profile</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar / List */}
                    <div className="w-1/3 border-r border-gray-800 flex flex-col bg-black/20">
                        <div className="p-4 border-b border-gray-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search workflows..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {filteredWorkflows.map(workflow => {
                                const IconComp = ICON_MAP[workflow.icon] || Terminal;
                                return (
                                    <div 
                                        key={workflow.id}
                                        onClick={() => setSelectedWorkflow(workflow)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${
                                            selectedWorkflow?.id === workflow.id 
                                            ? 'bg-purple-900/20 border-purple-500/50 shadow-lg shadow-purple-900/10' 
                                            : 'bg-[#121214] border-gray-800 hover:border-gray-700 hover:bg-[#1a1a1c]'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 ${selectedWorkflow?.id === workflow.id ? 'text-purple-400' : 'text-gray-500'}`}>
                                                <IconComp size={18} />
                                            </div>
                                            <div>
                                                <h3 className={`font-medium ${selectedWorkflow?.id === workflow.id ? 'text-purple-100' : 'text-gray-300'}`}>
                                                    {workflow.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{workflow.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="w-2/3 p-8 flex flex-col bg-[#0c0c0e] overflow-y-auto">
                        {selectedWorkflow ? (
                            <div className="flex-1 flex flex-col">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                                        {(() => {
                                             const Icon = ICON_MAP[selectedWorkflow.icon] || Terminal;
                                             return <Icon size={32} />;
                                        })()}
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-white mb-1">{selectedWorkflow.name}</h1>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded text-gray-400">ID: {selectedWorkflow.id}</span>
                                            {selectedWorkflow.type === 'native_api' && (
                                                <span className="text-xs font-mono bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-500/20">NATIVE API</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="prose prose-invert prose-sm mb-8">
                                    <p className="text-gray-400 leading-relaxed">{selectedWorkflow.description}</p>
                                </div>

                                {/* Dynamic Configuration Form */}
                                <div className="bg-black/40 rounded-xl p-6 border border-gray-800 flex-1">
                                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-6 border-b border-gray-800 pb-2 flex items-center gap-2">
                                        <Settings size={14} /> Mission Parameters
                                    </h3>
                                    
                                    <div className="space-y-5">
                                        {/* Legacy Prompt Workflow Support */}
                                        {(!selectedWorkflow.parameters && selectedWorkflow.variables?.includes('target')) && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-mono text-purple-400">TARGET_HOST</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. 192.168.1.1"
                                                    value={targetInput}
                                                    onChange={(e) => setTargetInput(e.target.value)}
                                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors"
                                                    autoFocus
                                                />
                                            </div>
                                        )}

                                        {/* Native Workflow Parameters */}
                                        {selectedWorkflow.parameters?.map((param) => (
                                            <div key={param.name} className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex justify-between">
                                                    {param.label}
                                                    {param.required && <span className="text-red-500 text-[10px]">REQUIRED</span>}
                                                </label>
                                                
                                                {param.type === 'select' ? (
                                                    <select
                                                        value={formValues[param.name] || ''}
                                                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                                                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors text-gray-200"
                                                    >
                                                        {param.options?.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : param.type === 'boolean' ? (
                                                    <div className="flex items-center gap-3">
                                                       <input 
                                                            type="checkbox"
                                                            checked={!!formValues[param.name]}
                                                            onChange={(e) => handleInputChange(param.name, e.target.checked)}
                                                            className="w-5 h-5 accent-purple-600 bg-[#1a1a1a] border-gray-700 rounded"
                                                        />
                                                        <span className="text-sm text-gray-300">Enable</span>
                                                    </div>
                                                ) : (
                                                    <input 
                                                        type="text" 
                                                        placeholder={param.placeholder || ''}
                                                        value={formValues[param.name] || ''}
                                                        onChange={(e) => handleInputChange(param.name, e.target.value)}
                                                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-3 text-sm focus:border-purple-500 focus:outline-none transition-colors font-mono"
                                                    />
                                                )}
                                                {param.description && <p className="text-[10px] text-gray-600">{param.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button 
                                        onClick={handleRun}
                                        disabled={isLoading}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5"
                                    >
                                        {isLoading ? <Activity className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                                        Launch Mission
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                                <GitBranch size={64} className="mb-6 opacity-20" />
                                <p className="text-lg font-medium">Select a mission profile to begin</p>
                                <p className="text-sm opacity-50">Choose from the available workflows on the left</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowModal;
