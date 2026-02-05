/**
 * MCP Registry Component
 * Componente de Registro MCP
 * 
 * Manages MCP Servers configuration.
 * Gerencia configuração de Servidores MCP.
 */

import { Code, Plus, Server, Terminal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';

const MCPRegistry = () => {
    const [servers, setServers] = useState({});
    const [loading, setLoading] = useState(false);
    const [newServer, setNewServer] = useState({ name: '', command: '', args: '' });
    const [tools, setTools] = useState([]);
    const [showTools, setShowTools] = useState(false);
    const logger = Logger.getInstance();

    useEffect(() => {
        fetchServers();
    }, []);

    const fetchServers = async () => {
        try {
            const api = APIClient.getInstance();
            const response = await api.get('/mcp/config');
            if (response.success) {
                // Backend returns the full config object { servers: { ... } } directly or wrapped in data?
                // BaseController generic success returns: { success: true, data: config }
                // So response.data is the config.
                // config has 'servers'.
                setServers(response.data.servers || {});
            }
        } catch (error) {
            logger.error('Failed to fetch MCP servers', error);
        }
    };

    const fetchTools = async () => {
        try {
            const api = APIClient.getInstance();
            const response = await api.get('/mcp/tools');
            if (response.success) {
                setTools(response.data || []);
            }
        } catch (error) {
            logger.error('Failed to fetch tools', error);
        }
    };

    useEffect(() => {
        if (showTools) fetchTools();
    }, [showTools]);

    const handleAddServer = async (e) => {
        e.preventDefault();
        if (!newServer.name || !newServer.command) return;

        setLoading(true);
        try {
            const api = APIClient.getInstance();
            const argsList = newServer.args.split(' ').filter(a => a.trim() !== '');
            
            // 1. Get current config
            const currentConfigResp = await api.get('/mcp/config');
            let config = currentConfigResp.data || { servers: {} };
            if (!config.servers) config.servers = {};

            // 2. Add server
            config.servers[newServer.name] = {
                command: newServer.command,
                args: argsList,
                env: {}, // Todo: Env support
                enabled: true
            };

            // 3. Save config
            const saveResp = await api.post('/mcp/config', config);

            // 4. Restart Manager
            if (saveResp.success) {
                 await api.post('/mcp/restart', {});
                 setNewServer({ name: '', command: '', args: '' });
                 fetchServers();
            }
        } catch (error) {
            logger.error('Failed to add server', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (name) => {
        if (!confirm(`Delete MCP server "${name}"? / Deletar servidor MCP "${name}"?`)) return;
        
        try {
            const api = APIClient.getInstance();
            
            // 1. Get config
            const currentConfigResp = await api.get('/mcp/config');
            let config = currentConfigResp.data || {};
            
            // 2. Remove
            if (config.servers && config.servers[name]) {
                delete config.servers[name];
                
                // 3. Save & Restart
                const saveResp = await api.post('/mcp/config', config);
                 if (saveResp.success) {
                     await api.post('/mcp/restart', {});
                     fetchServers();
                 }
            }
        } catch (error) {
            logger.error('Failed to delete server', error);
        }
    };

    return (
        <div className="text-gray-300 font-mono">
            <div className="mb-6 bg-black/40 p-4 rounded border border-[#333]">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-[#00ff00]" />
                    Add New MCP Server / Adicionar Servidor
                </h3>
                <form onSubmit={handleAddServer} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Server Name / Nome</label>
                            <input
                                type="text"
                                value={newServer.name}
                                onChange={e => setNewServer({...newServer, name: e.target.value})}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs focus:border-cyan-500 outline-none"
                                placeholder="e.g., filesystem"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Command / Comando</label>
                            <input
                                type="text"
                                value={newServer.command}
                                onChange={e => setNewServer({...newServer, command: e.target.value})}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs focus:border-cyan-500 outline-none"
                                placeholder="e.g., npx, python"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Arguments / Argumentos</label>
                        <input
                            type="text"
                            value={newServer.args}
                            onChange={e => setNewServer({...newServer, args: e.target.value})}
                            className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-xs focus:border-cyan-500 outline-none font-mono"
                            placeholder="-y @modelcontextprotocol/server-filesystem /path"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#00ff00]/10 hover:bg-[#00ff00]/20 text-[#00ff00] border border-[#00ff00]/30 px-4 py-2 rounded text-xs transition w-full"
                    >
                        {loading ? 'Adding... / Adicionando...' : 'Add Server / Adicionar Servidor'}
                    </button>
                </form>
            </div>

            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Server size={18} className="text-cyan-400" />
                    Configured Servers / Servidores Configurados
                </h3>
                <button 
                    onClick={() => setShowTools(!showTools)}
                    className={`text-xs px-2 py-1 rounded border transition ${showTools ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-[#111] text-gray-500 border-[#333]'}`}
                >
                    {showTools ? 'Hide Tools' : 'Show Tools'}
                </button>
            </div>

            {showTools && (
                <div className="mb-6 space-y-2 bg-[#050505] p-3 rounded border border-[#222]">
                    <h4 className="text-xs font-bold text-gray-400 uppercase">Discovered Tools ({tools.length})</h4>
                    {tools.length === 0 ? (
                        <div className="text-gray-600 text-[10px] italic">No tools discovered. Check server connection.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {tools.map((tool, idx) => (
                                <div key={idx} className="bg-[#111] p-2 rounded border border-[#222] text-[10px]">
                                    <div className="font-bold text-cyan-400">{tool.name}</div>
                                    <div className="text-gray-500 truncate">{tool.description}</div>
                                    <div className="text-gray-600 font-mono mt-1 text-[9px]">{tool.server}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className="space-y-3">
                {Object.keys(servers).length === 0 && (
                    <div className="text-gray-500 italic text-center py-4">No servers configured / Nenhum servidor configurado.</div>
                )}
                
                {Object.entries(servers).map(([name, conf]) => (
                    <div key={name} className="bg-[#111] border border-[#333] p-4 rounded flex items-start justify-between group hover:border-cyan-500/30 transition">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white text-sm">{name}</span>
                                {conf.enabled !== false && <span className="text-[10px] bg-[#00ff00]/10 text-[#00ff00] px-1 rounded border border-[#00ff00]/20">ENABLED / ATIVO</span>}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Terminal size={12} />
                                <span className="text-cyan-400">{conf.command}</span>
                                <span className="text-gray-400">{(conf.args || []).join(' ')}</span>
                            </div>
                            {conf.env && Object.keys(conf.env).length > 0 && (
                                <div className="mt-1 text-[10px] text-gray-600 flex items-center gap-1">
                                    <Code size={10} />
                                    ENV: {Object.keys(conf.env).join(', ')}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(name)}
                            className="text-gray-600 hover:text-red-500 transition p-1"
                            title="Remove Server"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MCPRegistry;
