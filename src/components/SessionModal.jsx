import { Clock, FolderOpen, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';

const SessionModal = ({ isOpen, onClose, onLoadSession, onSaveSession, currentSessionName }) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    const api = APIClient.getInstance();
    const logger = Logger.getInstance();
    try {
      const data = await api.post('/sessions', { action: 'list' });
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (e) {
      logger.error('Failed to fetch sessions', { error: e });
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
    if (!confirm(t('session.delete_confirm', "Delete session '{name}'?").replace('{name}', name))) return;
    const api = APIClient.getInstance();
    try {
      await api.post('/sessions', { action: 'delete', name });
      fetchSessions();
    } catch(e) {
      alert(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#0a0a0a] border border-[#00ff00]/30 rounded-lg w-full max-w-3xl flex flex-col max-h-[80vh] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
             <Clock className="text-cyan-400" size={20} />
             <h2 className="text-lg font-bold text-white tracking-wide">
                {t('session.manager', 'Gerenciador de Sessões')}
             </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#0a0a0a]">
            
            {/* List */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-[#333]">
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FolderOpen size={12} /> {t('session.saved', 'Saved Sessions')}
                </h3>
                
                {loading ? (
                    <div className="text-center py-10 text-gray-600 animate-pulse font-mono text-xs">{t('session.loading', 'Loading...')}</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 italic font-mono text-xs">{t('session.no_sessions', 'No saved sessions found.')}</div>
                ) : (
                    <div className="space-y-2">
                        {sessions.map(session => (
                            <div key={session} className="group flex items-center justify-between p-3 rounded bg-[#111] border border-[#222] hover:border-cyan-500/30 hover:bg-[#151515] transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-cyan-900/10 text-cyan-500 flex items-center justify-center font-mono text-[10px] border border-cyan-500/20">
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
                                        className="p-1.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                                        title={t('session.load', 'Load')}
                                    >
                                        <FolderOpen size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(session)}
                                        className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                        title={t('session.delete', 'Delete')}
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
            <div className="w-full md:w-72 bg-[#0f0f0f] p-6 flex flex-col gap-6">
                <div>
                     <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4 border-b border-[#333] pb-2">
                         {t('session.current', 'Current Session')}
                     </h3>
                    
                     <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 mb-1.5 block uppercase tracking-wider">{t('session.name', 'Session Name')}</label>
                            <input 
                                type="text" 
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                                placeholder="my_session"
                            />
                        </div>
                        
                        <button 
                            onClick={handleSave}
                            className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={14} /> {t('session.save_current', 'SAVE SESSION')}
                        </button>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="p-4 bg-[#111] rounded border border-[#222]">
                        <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
                           {t('session.description', 'Sessions save the full conversation history to your local filesystem.')}
                        </p>
                        <div className="mt-2 text-[10px] text-yellow-500/60 font-mono flex items-center gap-1">
                             <span>Note:</span> {t('session.warning', 'Files stored typically in ~/.hexagent-gui/sessions/')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
