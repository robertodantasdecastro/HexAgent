/**
 * ProfileModal Component
 * Modal for User Personalization (Personas)
 * 
 * Componente de Modal de Perfil
 * Modal para Personalização do Usuário (Personas)
 */
import { MessageSquare, Save, Shield, User, XCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';
import { SimpleTransition } from './SimpleTransition';

const ProfileModal = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState({
        user: { name: '', role: '' },
        persona: { tone: 'professional', verbosity: 'balanced' },
        custom_instructions: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const logger = Logger.getInstance();

    useEffect(() => {
        if (isOpen) fetchProfile();
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const api = APIClient.getInstance();
            const response = await api.get('/config/profile');
            if (response.success && response.data) {
                // Ensure structure
                const data = response.data;
                setConfig({
                    user: data.user || { name: '', role: '' },
                    persona: data.persona || { tone: 'professional', verbosity: 'balanced' },
                    custom_instructions: data.custom_instructions || ''
                });
            }
        } catch (error) {
            logger.error('Failed to load profile', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const api = APIClient.getInstance();
            const response = await api.post('/config/profile', { config: config });
            if (response.success) {
                onClose();
            }
        } catch (error) {
            logger.error('Failed to save profile', error);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (section, field, value) => {
        if (section === 'root') {
            setConfig(prev => ({ ...prev, [field]: value }));
        } else {
            setConfig(prev => ({
                ...prev,
                [section]: { ...prev[section], [field]: value }
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <SimpleTransition 
            show={isOpen} 
            duration={300}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <div
                onClick={onClose}
                className="w-full h-full flex items-center justify-center"
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0a0a0a] border border-cyan-500/30 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden glass-panel scale-100 opacity-100 transition-all duration-300 animate-slide-up"
                    style={{ animation: 'slideUp 0.3s ease-out' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#111]/50">
                        <div className="flex items-center gap-3">
                            <User className="text-cyan-400" size={20} />
                            <h2 className="text-lg font-bold text-white tracking-wide">User Persona Profile</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <XCircle size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500 animate-pulse">Loading Profile...</div>
                        ) : (
                            <>
                                {/* User Identity Section */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Shield size={14} /> Identity
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Display Name</label>
                                            <input 
                                                type="text" 
                                                value={config.user.name} 
                                                onChange={(e) => handleChange('user', 'name', e.target.value)}
                                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none transition"
                                                placeholder="Operator Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Role / Title</label>
                                            <input 
                                                type="text" 
                                                value={config.user.role} 
                                                onChange={(e) => handleChange('user', 'role', e.target.value)}
                                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none transition"
                                                placeholder="Security Analyst"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Persona Settings */}
                                <div className="space-y-4 border-t border-[#222] pt-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={14} /> AI Persona
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Tone</label>
                                            <select 
                                                value={config.persona.tone}
                                                onChange={(e) => handleChange('persona', 'tone', e.target.value)}
                                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none cursor-pointer"
                                            >
                                                <option value="professional">Professional (Default)</option>
                                                <option value="cyberpunk">Cyberpunk / Edgy</option>
                                                <option value="friendly">Friendly / Helpful</option>
                                                <option value="concise">Concise / Robot</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Verbosity</label>
                                            <select 
                                                value={config.persona.verbosity}
                                                onChange={(e) => handleChange('persona', 'verbosity', e.target.value)}
                                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none cursor-pointer"
                                            >
                                                <option value="balanced">Balanced</option>
                                                <option value="verbose">Verbose (Explain Everything)</option>
                                                <option value="concise">Concise (Code Only)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Instructions */}
                                <div className="space-y-4 border-t border-[#222] pt-4">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={14} /> Custom Constraints
                                    </h3>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Global System Prompt Injection</label>
                                        <textarea 
                                            value={config.custom_instructions}
                                            onChange={(e) => handleChange('root', 'custom_instructions', e.target.value)}
                                            className="w-full h-24 bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 focus:border-cyan-500 outline-none transition resize-none font-mono"
                                            placeholder="e.g. Always prefer Python over Bash. Never explain obvious code."
                                        />
                                        <p className="text-[10px] text-gray-600 mt-1">These instructions will be appended to every system prompt.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[#333] bg-[#111]/30 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-xs text-gray-400 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-cyan-900/20"
                        >
                            <Save size={14} />
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </div>
            </div>
        </SimpleTransition>
    );
};

export default ProfileModal;
