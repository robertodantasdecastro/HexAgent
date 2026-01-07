/**
 * WorkflowManagerModal Component
 * Interface for HexStrike Automated Workflows
 * 
 * Componente de Gerenciamento de Workflow
 * Interface para Workflows Automatizados do HexStrike
 */

import { Activity, CheckCircle, Crosshair, GitBranch, Play, RefreshCw, Shield, Target, X } from 'lucide-react';
import { useState } from 'react';

const WorkflowManagerModal = ({ isOpen, onClose }) => {
  const [target, setTarget] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('recon');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const workflows = [
    {
      id: 'recon',
      name: 'Reconnaissance / Reconhecimento',
      description: 'Comprehensive subdomain enumeration, port scanning, and technology detection.',
      endpoint: '/api/workflow/start',
      type: 'reconnaissance-workflow',
      icon: Target
    },
    {
      id: 'vuln',
      name: 'Vulnerability Hunt / Caça a Vulnerabilidades',
      description: 'Targeted vulnerability scanning prioritized by impact and exploitability.',
      endpoint: '/api/workflow/start',
      type: 'vulnerability-hunting-workflow',
      icon: Crosshair
    },
    {
      id: 'osint',
      name: 'OSINT Gathering / Coleta OSINT',
      description: 'Open Source Intelligence gathering from public sources.',
      endpoint: '/api/workflow/start',
      type: 'osint-workflow',
      icon: Activity
    },
    {
      id: 'logic',
      name: 'Business Logic / Lógica de Negócio',
      description: 'Testing for logical flaws and authentication bypasses.',
      endpoint: '/api/workflow/start',
      type: 'business-logic-workflow',
      icon: GitBranch
    },
    {
      id: 'full',
      name: 'Full Assessment / Avaliação Completa',
      description: 'Complete end-to-end assessment including all phases.',
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
      const response = await fetch('http://localhost:5000' + workflow.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: workflow.type,
          target: target
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        throw new Error(data.error || 'Execution failed');
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
      <div className="bg-[#0f0f0f] border border-[#333] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#222] bg-[#111]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
                <GitBranch className="text-purple-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Workflow Manager</h2>
              <p className="text-xs text-gray-500 font-mono">Automated HexStrike Strategies</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#222] rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Workflow List */}
            <div className="w-64 bg-[#111] border-r border-[#222] overflow-y-auto">
                <div className="p-4 space-y-2">
                    {workflows.map(wf => {
                        const Icon = wf.icon;
                        const isSelected = selectedWorkflow === wf.id;
                        return (
                            <button
                                key={wf.id}
                                onClick={() => setSelectedWorkflow(wf.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${isSelected ? 'bg-purple-900/20 border-purple-500/50 text-white' : 'bg-[#151515] border-[#222] text-gray-400 hover:border-[#444] hover:bg-[#1a1a1a]'}`}
                            >
                                <Icon size={18} className={`mt-0.5 ${isSelected ? 'text-purple-400' : 'text-gray-500'}`} />
                                <div>
                                    <div className={`text-sm font-medium ${isSelected ? 'text-purple-200' : 'text-gray-300'}`}>{wf.name.split('/')[0]}</div>
                                    <div className="text-[10px] opacity-60 mt-1 line-clamp-2">{wf.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Target Input Section */}
                    <div className="mb-8">
                        <label className="text-xs font-mono text-purple-400 uppercase mb-2 block">Target Configuration</label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <span className="absolute left-3 top-3 text-gray-500">
                                    <Target size={16} />
                                </span>
                                <input 
                                    type="text" 
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                    placeholder="Enter domain, IP, or URL (e.g., example.com)"
                                    className="w-full bg-[#151515] border border-[#333] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white font-mono focus:border-purple-500 outline-none transition-colors"
                                />
                            </div>
                            <button 
                                onClick={handleExecute}
                                disabled={loading || !target}
                                className="px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                                {loading ? 'Running...' : 'Start Workflow'}
                            </button>
                        </div>
                    </div>

                    {/* Results / Status Area */}
                    {error && (
                        <div className="bg-red-900/10 border border-red-500/30 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-red-400 mb-1">
                                <XCircle size={16} />
                                <span className="font-bold text-sm">Execution Error</span>
                            </div>
                            <p className="text-sm text-red-300 opacity-90">{error}</p>
                        </div>
                    )}

                    {result ? (
                         <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                            <div className="p-3 bg-[#1a1a1a] border-b border-[#222] flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-green-500" />
                                    <span className="text-sm font-mono text-green-400">Workflow Plan Generated</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">ID: {result.workflow_id || 'N/A'}</span>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <pre className="p-4 text-xs font-mono text-gray-300 custom-scrollbar max-h-[400px]">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-600 border-2 border-dashed border-[#222] rounded-lg bg-[#0f0f0f]">
                            <GitBranch size={48} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">Select a workflow and set a target to begin.</p>
                            <p className="text-xs mt-1 opacity-60">Results will appear here.</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-4 border-t border-[#222] bg-[#111] text-[10px] text-gray-500 font-mono flex justify-between">
                    <span>HexStrike Engine v5.0</span>
                    <span>Ready</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for error icon
const XCircle = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);

export default WorkflowManagerModal;
