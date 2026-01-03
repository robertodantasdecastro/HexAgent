import { Clock, FolderOpen, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const SessionModal = ({ isOpen, onClose, onLoadSession, onSaveSession, currentSessionName }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' })
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      setNewSessionName(currentSessionName || `session_${new Date().toISOString().slice(0,10)}`);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!newSessionName.trim()) return;
    await onSaveSession(newSessionName);
    fetchSessions(); // Refresh
  };

  const handleDelete = async (name) => {
    if (!confirm(`Delete session '${name}'?`)) return;
    try {
        await fetch('http://localhost:5000/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', name })
        });
        fetchSessions();
    } catch(e) {
        alert(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-[#333] rounded-lg w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#111]">
          <div className="flex items-center gap-2">
            <Clock className="text-purple-500" size={20} />
            <h2 className="font-bold text-gray-200">Session Manager</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* List */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar border-r border-[#333]">
                <h3 className="text-xs font-mono text-gray-500 uppercase mb-3 flex items-center gap-2">
                    <FolderOpen size={12} /> Saved Sessions
                </h3>
                
                {loading ? (
                    <div className="text-center py-10 text-gray-600 animate-pulse">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 italic">No saved sessions found.</div>
                ) : (
                    <div className="space-y-2">
                        {sessions.map(session => (
                            <div key={session} className="group flex items-center justify-between p-3 rounded bg-[#151515] border border-[#222] hover:border-purple-500/50 hover:bg-[#1a1a1a] transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-purple-900/20 text-purple-500 flex items-center justify-center font-mono text-xs">
                                        JSON
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-200">{session}</span>
                                        <span className="text-[10px] text-gray-600 font-mono">{(new Date()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => onLoadSession(session)}
                                        className="p-1.5 rounded bg-green-900/20 text-green-500 hover:bg-green-900/40"
                                        title="Load Session"
                                    >
                                        <FolderOpen size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(session)}
                                        className="p-1.5 rounded bg-red-900/20 text-red-500 hover:bg-red-900/40"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Session Actions */}
            <div className="w-full md:w-64 bg-[#0f0f0f] p-4 flex flex-col gap-4">
                <h3 className="text-xs font-mono text-gray-500 uppercase mb-1">Current Session</h3>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Session Name</label>
                        <input 
                            type="text" 
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-[#333] rounded p-2 text-xs text-white focus:border-purple-500 outline-none"
                            placeholder="my_session"
                        />
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={14} /> Save Current
                    </button>

                    <div className="h-px bg-[#333] my-2" />
                    
                    <div className="text-[10px] text-gray-500 leading-relaxed">
                        <p>Sessions save the full conversation history, including generated code blocks and AI responses.</p>
                        <p className="mt-2 text-yellow-500/80">⚠️ Generated files are stored separately in your workspace.</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
