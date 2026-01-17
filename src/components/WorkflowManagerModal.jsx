/**
 * WorkflowManagerModal Component
 * Interface for HexStrike Automated Workflows
 * 
 * Componente de Gerenciamento de Workflow
 * Interface para Workflows Automatizados do HexStrike
 */

import { Activity, AlertTriangle, CheckCircle, Crosshair, GitBranch, Play, RefreshCw, Shield, Target, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import APIClient from '../utils/APIClient';

const WorkflowManagerModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [target, setTarget] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('recon');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const workflows = [
    {
      id: 'recon',
      name: t('workflow.reconnaissance', 'Reconnaissance'),
      description: t('workflow.reconnaissance_desc', 'Comprehensive subdomain enumeration, DNS analysis, port scanning, and content discovery'),
      endpoint: '/api/workflow/start',
      type: 'reconnaissance-workflow',
      icon: Target
    },
    {
      id: 'vuln',
      name: t('workflow.vulnerability', 'Vulnerability Hunt'),
      description: t('workflow.vulnerability_desc', 'Discover known vulnerabilities through version detection, service enumeration, and exploit matching'),
      endpoint: '/api/workflow/start',
      type: 'vulnerability-hunting-workflow',
      icon: Crosshair
    },
    {
      id: 'osint',
      name: t('workflow.osint', 'OSINT Gathering'),
      description: t('workflow.osint_desc', 'Open Source Intelligence gathering from public sources, social media, and document analysis'),
      endpoint: '/api/workflow/start',
      type: 'osint-workflow',
      icon: Activity
    },
    {
      id: 'logic',
      name: t('workflow.business_logic', 'Business Logic'),
      description: t('workflow.business_logic_desc', 'Analyze API Logic flow and authentication bypasses'),
      endpoint: '/api/workflow/start',
      type: 'business-logic-workflow',
      icon: GitBranch
    },
    {
      id: 'full',
      name: t('workflow.full_assessment', 'Full Assessment'),
      description: t('workflow.full_assessment_desc', 'Complete end-to-end security assessment with all modules combined'),
      endpoint: '/api/workflow/start',
      type: 'comprehensive-assessment',
      icon: Shield
    }
  ];

  const handleExecute = async () => {
    if (!target) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const workflow = workflows.find(w => w.id === selectedWorkflow);

    try {
      const api = APIClient.getInstance();
      const result = await api.post(workflow.endpoint, {
        workflow_type: workflow.type,
        target: target
      });

      if (result.success) {
        setResult(result.data || result);
      } else {
        throw new Error(result.message || 'Execution failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-[#0a0a0a] border border-[#00ff00]/30 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
             <GitBranch className="text-cyan-400" size={20} />
             <h2 className="text-lg font-bold text-white tracking-wide">
                {t('workflow.title', 'GERENCIADOR DE WORKFLOW')}
             </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Workflow List */}
            <div className="w-72 bg-[#0f0f0f] border-r border-[#333] overflow-y-auto custom-scrollbar">
                <div className="p-4 space-y-2">
                    {workflows.map(wf => {
                        const Icon = wf.icon;
                        const isSelected = selectedWorkflow === wf.id;
                        return (
                            <button
                                key={wf.id}
                                onClick={() => setSelectedWorkflow(wf.id)}
                                className={`w-full text-left p-4 rounded border transition-all flex items-start gap-4 group ${
                                    isSelected 
                                    ? 'bg-cyan-900/10 border-cyan-500/50 text-white' 
                                    : 'bg-[#151515] border-[#222] text-gray-400 hover:border-[#444] hover:bg-[#1a1a1a]'
                                }`}
                            >
                                <Icon size={18} className={`mt-0.5 ${isSelected ? 'text-cyan-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-cyan-100' : 'text-gray-400'}`}>
                                        {wf.name.split('/')[0]}
                                    </div>
                                    <div className="text-[10px] opacity-60 leading-relaxed truncate">
                                        {wf.description}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                    
                    {/* Hero / Target Section */}
                    <div className="mb-8 p-6 bg-[#111] rounded border border-[#222] flex items-end gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3 block">
                                {t('workflow.target_label', 'Target Configuration')}
                            </label>
                            
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-500">
                                    <Target size={16} />
                                </span>
                                <input 
                                    type="text" 
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    placeholder={t('workflow.target_placeholder', 'example.com or IP address')}
                                    className="w-full bg-[#0a0a0a] border border-[#333] rounded py-2.5 pl-10 pr-4 text-sm text-white font-mono focus:border-cyan-500 outline-none transition-colors placeholder:text-gray-700"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleExecute}
                            disabled={loading || !target}
                            className="h-[42px] px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition-all disabled:opacity-50 disabled:grayscale flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                            <span className="text-xs font-bold uppercase tracking-wide">
                                {loading ? 'Running...' : 'Start Scan'}
                            </span>
                        </button>
                    </div>

                    {/* Results / Status Area */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded p-4 mb-4 animate-in fade-in slide-in-from-top-2 flex gap-3">
                             <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
                             <div>
                                <h4 className="text-sm font-bold text-red-400 mb-1">Execution Error</h4>
                                <p className="text-xs text-red-300 font-mono">{error}</p>
                             </div>
                        </div>
                    )}

                    {result ? (
                         <div className="border border-[#333] rounded bg-[#0f0f0f] overflow-hidden flex flex-col h-[calc(100%-140px)] animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-3 bg-[#151515] border-b border-[#222] flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-[#00ff00]" />
                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Plan Generated</span>
                                </div>
                                <span className="text-[10px] text-gray-600 font-mono bg-black px-2 py-1 rounded border border-[#222]">
                                    ID: {result.workflow_id || 'LOCAL-EXEC'}
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto bg-[#0a0a0a] p-4">
                                <pre className="text-xs font-mono text-gray-400 leading-relaxed">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-700">
                            <GitBranch size={64} className="mb-6 opacity-10" />
                            <p className="text-sm font-medium uppercase tracking-widest text-gray-600">
                                {t('workflow.select', 'Select Workflow & Target')}
                            </p>
                            <p className="text-xs mt-2 opacity-50 font-mono">
                                Awaiting Command...
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 border-t border-[#333] bg-[#0f0f0f] text-[10px] text-gray-600 font-mono flex justify-between">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff00]"></div>
                        HexStrike Engine v5.0
                    </span>
                    <span>Systems Ready</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManagerModal;
