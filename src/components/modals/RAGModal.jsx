import {
    AlertCircle,
    BarChart3,
    Clock,
    Database,
    Download,
    FileJson,
    Globe,
    HardDrive, Key,
    Loader2,
    Play,
    Radio,
    RefreshCw,
    X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import APIClient from '../../utils/APIClient';

const TABS = [
  { id: 'overview',  label: 'Visão Geral',  icon: BarChart3  },
  { id: 'sources',   label: 'Fontes',        icon: Radio      },
  { id: 'storage',   label: 'Storage',       icon: HardDrive  },
  { id: 'apikeys',   label: 'API Keys',      icon: Key        },
  { id: 'schedule',  label: 'Agendamento',   icon: Clock      },
  { id: 'export',    label: 'Exportação',    icon: Download   },
];

const CATEGORY_COLORS = {
  cve:         '#ef4444',
  exploit:     '#f97316',
  technique:   '#8b5cf6',
  payload:     '#06b6d4',
  threat_intel:'#ec4899',
  news:        '#22c55e',
};

const CATEGORY_LABELS = {
  cve:         'CVE',
  exploit:     'Exploit',
  technique:   'Técnica ATT&CK',
  payload:     'Payload',
  threat_intel:'Threat Intel',
  news:        'Notícias',
};

export default function RAGModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingSource, setSyncingSource] = useState({});
  const [syncProgress, setSyncProgress] = useState({});
  const [syncLogs, setSyncLogs] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exportStats, setExportStats] = useState(null);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadAll();
    }
  }, [isOpen]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [syncLogs]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const api = APIClient.getInstance();
      const [cfgRes, statsRes, srcRes, expRes] = await Promise.allSettled([
        api.get('/rag/config'),
        api.get('/rag/stats'),
        api.get('/rag/sources'),
        api.get('/rag/export/stats'),
      ]);
      if (cfgRes.status === 'fulfilled') setConfig(cfgRes.value?.data || cfgRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value?.data || statsRes.value);
      if (srcRes.status === 'fulfilled') setSources(srcRes.value?.data?.sources || srcRes.value?.sources || []);
      if (expRes.status === 'fulfilled') setExportStats(expRes.value?.data || expRes.value);
    } catch(e) {
      console.error('[RAGModal] Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updatedConfig) => {
    setSaving(true);
    try {
      const api = APIClient.getInstance();
      await api.put('/rag/config', updatedConfig);
      setConfig(updatedConfig);
    } catch(e) {
      console.error('[RAGModal] Save error:', e);
    } finally {
      setSaving(false);
    }
  };

  // ── Sync Individual Source ─────────────────────────────────────────────────
  const syncSource = async (sourceId) => {
    setSyncingSource(p => ({ ...p, [sourceId]: true }));
    setSyncLogs(prev => [...prev, { type: 'log', msg: `▶ Iniciando sync: ${sourceId}` }]);
    setActiveTab('sources');

    try {
      const api = APIClient.getInstance();
      const baseURL = api.getBaseURL();
      const resp = await fetch(`${baseURL}/rag/sync/${sourceId}`, { method: 'POST' });
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split('\n')) {
          if (line.startsWith('data:')) {
            try {
              const evt = JSON.parse(line.slice(5).trim());
              const d = evt.data || {};
              if (evt.type === 'log' || evt.type === 'progress') {
                if (d.percent !== undefined) {
                  setSyncProgress(p => ({ ...p, [sourceId]: d.percent }));
                }
                setSyncLogs(prev => [...prev, { type: evt.type, msg: d.message || d.step || '' }]);
              }
              if (evt.type === 'done') {
                setSyncProgress(p => ({ ...p, [sourceId]: 100 }));
                setSyncLogs(prev => [...prev, { type: 'done', msg: d.message || '✅ Done' }]);
              }
              if (evt.type === 'error')
                setSyncLogs(prev => [...prev, { type: 'error', msg: `❌ ${d.message}` }]);
            } catch (_) {}
          }
        }
      }
      await loadAll();
    } catch(e) {
      setSyncLogs(prev => [...prev, { type: 'error', msg: `❌ ${e.message}` }]);
    } finally {
      setSyncingSource(p => { const n = {...p}; delete n[sourceId]; return n; });
      setSyncProgress(p => { const n = {...p}; delete n[sourceId]; return n; });
    }
  };

  // ── Sync All (Unify) ───────────────────────────────────────────────────────
  const syncAll = async () => {
    setSyncingAll(true);
    setSyncLogs([{ type: 'log', msg: '🔄 Iniciando unificação de todas as fontes...' }]);
    setOverallProgress(0);
    setActiveTab('sources');

    try {
      const api = APIClient.getInstance();
      const baseURL = api.getBaseURL();
      const resp = await fetch(`${baseURL}/rag/sync`, { method: 'POST' });
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split('\n')) {
          if (line.startsWith('data:')) {
            try {
              const evt = JSON.parse(line.slice(5).trim());
              const d = evt.data || {};
              if (d.overall_percent !== undefined) setOverallProgress(d.overall_percent);
              if (d.current_source && d.percent !== undefined) {
                setSyncProgress(p => ({ ...p, [d.current_source]: d.percent }));
              }
              if (evt.type !== 'progress' || d.message)
                setSyncLogs(prev => [...prev, {
                  type: evt.type,
                  msg: d.message || d.step || d.current_source || ''
                }]);
            } catch (_) {}
          }
        }
      }
      await loadAll();
    } catch(e) {
      setSyncLogs(prev => [...prev, { type: 'error', msg: `❌ ${e.message}` }]);
    } finally {
      setSyncingAll(false);
      setOverallProgress(100);
      setSyncProgress({});
    }
  };

  const exportDataset = async () => {
    try {
      const api = APIClient.getInstance();
      const res = await api.post('/rag/export', {});
      setSyncLogs(prev => [...prev, {
        type: 'done',
        msg: res?.data?.message || res?.message || '✅ Export concluído'
      }]);
      await loadAll();
    } catch(e) {
      setSyncLogs(prev => [...prev, { type: 'error', msg: `❌ ${e.message}` }]);
    }
  };

  const toggleSource = async (sourceId, enabled) => {
    if (!config) return;
    const updated = JSON.parse(JSON.stringify(config));
    const src = updated?.rag?.sources?.find(s => s.id === sourceId);
    if (src) {
      src.enabled = enabled;
      await saveConfig(updated);
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, enabled } : s));
    }
  };

  if (!isOpen) return null;

  const ragEnabled = config?.rag?.enabled ?? false;
  const grouped = sources.reduce((acc, s) => {
    const cat = s.category || 'news';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="rag-modal" style={{
        width: '900px', maxHeight: '85vh',
        background: '#0f1117', border: '1px solid #1e2333',
        borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #1e2333',
          background: 'linear-gradient(135deg, #0f1117 0%, #1a1f2e 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={20} color="#06b6d4" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>
              RAG Security Intelligence
            </span>
            <span style={{
              fontSize: '0.65rem', background: '#1e2333', color: '#94a3b8',
              padding: '2px 8px', borderRadius: '999px'
            }}>v1.0</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Global enable toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>RAG Ativo</span>
              <div
                onClick={() => {
                  if (!config) return;
                  const u = JSON.parse(JSON.stringify(config));
                  u.rag.enabled = !u.rag.enabled;
                  saveConfig(u);
                }}
                style={{
                  width: '36px', height: '20px', borderRadius: '999px', cursor: 'pointer',
                  background: ragEnabled ? '#06b6d4' : '#374151',
                  position: 'relative', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: ragEnabled ? '18px' : '2px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s'
                }} />
              </div>
            </label>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: '4px'
            }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #1e2333',
          background: '#0d1117', overflowX: 'auto'
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 16px', border: 'none', cursor: 'pointer',
                background: 'none', whiteSpace: 'nowrap',
                color: active ? '#06b6d4' : '#64748b',
                borderBottom: active ? '2px solid #06b6d4' : '2px solid transparent',
                fontWeight: active ? 600 : 400, fontSize: '0.8rem',
                transition: 'all 0.15s'
              }}>
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', paddingTop: '40px', color: '#94a3b8' }}>
              <Loader2 size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '10px' }}>Carregando...</p>
            </div>
          ) : (

            <>
              {/* ── OVERVIEW ─────────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '0.9rem' }}>Painel de Inteligência</h3>
                    <button onClick={syncAll} disabled={syncingAll} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: '#06b6d4', color: '#000', border: 'none',
                      borderRadius: '6px', padding: '7px 14px', cursor: 'pointer',
                      fontSize: '0.8rem', fontWeight: 600, opacity: syncingAll ? 0.7 : 1
                    }}>
                      {syncingAll ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}
                      {syncingAll ? 'Unificando...' : 'Unificar Tudo'}
                    </button>
                  </div>

                  {/* Stats Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'Fontes Ativas', value: stats?.enabled_sources ?? '—', icon: Radio, color: '#06b6d4' },
                      { label: 'Documentos', value: (stats?.total_documents ?? 0).toLocaleString(), icon: Database, color: '#8b5cf6' },
                      { label: 'Erros', value: stats?.sources_by_status?.error ?? 0, icon: AlertCircle, color: '#ef4444' },
                    ].map(c => {
                      const Icon = c.icon;
                      return (
                        <div key={c.label} style={{
                          background: '#1a1f2e', borderRadius: '8px',
                          padding: '14px', border: `1px solid ${c.color}22`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{c.label}</span>
                            <Icon size={14} color={c.color} />
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: c.color, marginTop: '4px' }}>
                            {c.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Collections */}
                  <h4 style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Coleções ChromaDB
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {Object.entries(stats?.collections || {}).map(([name, col]) => (
                      <div key={name} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#1a1f2e', borderRadius: '6px', padding: '8px 12px'
                      }}>
                        <span style={{ color: '#e2e8f0', fontSize: '0.8rem', textTransform: 'capitalize' }}>{name}</span>
                        <span style={{
                          color: '#06b6d4', fontSize: '0.8rem', fontWeight: 600
                        }}>{(col.doc_count || 0).toLocaleString()} docs</span>
                      </div>
                    ))}
                  </div>

                  {/* Sync Logs */}
                  {syncLogs.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <h4 style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Log de Sincronização
                      </h4>
                      {syncingAll && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ background: '#1e2333', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${overallProgress}%`, background: '#06b6d4', height: '100%', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{overallProgress}%</span>
                        </div>
                      )}
                      <div style={{
                        background: '#0d1117', borderRadius: '6px', padding: '10px',
                        maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.72rem'
                      }}>
                        {syncLogs.map((log, i) => (
                          <div key={i} style={{
                            color: log.type === 'error' ? '#ef4444' : log.type === 'done' ? '#22c55e' : '#94a3b8',
                            marginBottom: '2px'
                          }}>{log.msg}</div>
                        ))}
                        <div ref={logsEndRef} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SOURCES ──────────────────────────────────────────────── */}
              {activeTab === 'sources' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '0.9rem' }}>
                      Fontes de Dados ({sources.length})
                    </h3>
                    <button onClick={syncAll} disabled={syncingAll} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: syncingAll ? '#374151' : '#8b5cf6', color: '#fff',
                      border: 'none', borderRadius: '6px', padding: '7px 14px',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                    }}>
                      {syncingAll ? <Loader2 size={14} /> : <Globe size={14} />}
                      {syncingAll ? `${overallProgress}%` : 'Sincronizar Todas'}
                    </button>
                  </div>

                  {syncingAll && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ background: '#1e2333', borderRadius: '999px', height: '4px', marginBottom: '4px' }}>
                        <div style={{ width: `${overallProgress}%`, background: '#8b5cf6', height: '100%', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  {/* Sources grouped by category */}
                  {Object.entries(grouped).map(([cat, catSources]) => (
                    <div key={cat} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#94a3b8' }} />
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                          {CATEGORY_LABELS[cat] || cat} ({catSources.length})
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {catSources.map(src => {
                          const isSyncing = !!syncingSource[src.id];
                          const statusColor = src._status === 'ok' ? '#22c55e' : src._status === 'error' ? '#ef4444' : src._status === 'running' ? '#f59e0b' : '#64748b';
                          return (
                            <div key={src.id} style={{
                              background: '#1a1f2e', borderRadius: '8px', padding: '10px 14px',
                              display: 'flex', alignItems: 'center', gap: '10px',
                              border: `1px solid ${src.enabled ? '#1e2333' : '#0d1117'}`
                            }}>
                              {/* Toggle */}
                              <div
                                onClick={() => toggleSource(src.id, !src.enabled)}
                                style={{
                                  width: '32px', height: '18px', borderRadius: '999px',
                                  background: src.enabled ? '#06b6d4' : '#374151',
                                  flex: '0 0 auto', position: 'relative', cursor: 'pointer'
                                }}
                              >
                                <div style={{
                                  position: 'absolute', top: '2px',
                                  left: src.enabled ? '16px' : '2px',
                                  width: '14px', height: '14px', borderRadius: '50%',
                                  background: '#fff', transition: 'left 0.15s'
                                }} />
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{src.name}</span>
                                  {src.api_key_ref && (
                                    <Key size={10} color="#f59e0b" title="Requer API Key" />
                                  )}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '1px' }}>
                                  {src.description}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
                                  <span style={{ fontSize: '0.65rem', color: '#475569' }}>
                                    {src.interval} · {src.doc_count?.toLocaleString() || '0'} docs
                                  </span>
                                  {src.last_sync && (
                                    <span style={{ fontSize: '0.65rem', color: '#475569' }}>
                                      último: {new Date(src.last_sync).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '0.65rem', color: statusColor, fontWeight: 600 }}>
                                    ● {src._status || 'idle'}
                                  </span>
                                </div>
                                {syncProgress[src.id] !== undefined && (isSyncing || syncingAll) && (
                                  <div style={{ marginTop: '6px' }}>
                                    <div style={{ background: '#0d1117', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                                      <div style={{ width: `${syncProgress[src.id]}%`, background: '#06b6d4', height: '100%', transition: 'width 0.3s' }} />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Sync button */}
                              <button
                                onClick={() => src.enabled && syncSource(src.id)}
                                disabled={isSyncing || !src.enabled}
                                title={src.enabled ? 'Sincronizar fonte' : 'Fonte desabilitada'}
                                style={{
                                  background: src.enabled ? '#1e2333' : '#0d1117',
                                  border: '1px solid #2d3748', borderRadius: '6px',
                                  padding: '5px 10px', cursor: src.enabled ? 'pointer' : 'not-allowed',
                                  color: src.enabled ? '#06b6d4' : '#374151',
                                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem'
                                }}>
                                {isSyncing ? <Loader2 size={12} /> : <Play size={12} />}
                                {isSyncing ? `${syncingSource[src.id] || ''}%` : 'Sync'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Sync Logs */}
                  {syncLogs.length > 0 && (
                    <div style={{ marginTop: '10px', background: '#0d1117', borderRadius: '6px', padding: '10px', maxHeight: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                      {syncLogs.slice(-20).map((log, i) => (
                        <div key={i} style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'done' ? '#22c55e' : '#94a3b8' }}>
                          {log.msg}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  )}
                </div>
              )}

              {/* ── STORAGE ──────────────────────────────────────────────── */}
              {activeTab === 'storage' && (
                <StorageTab config={config} saveConfig={saveConfig} saving={saving} />
              )}

              {/* ── API KEYS ─────────────────────────────────────────────── */}
              {activeTab === 'apikeys' && (
                <APIKeysTab config={config} saveConfig={saveConfig} saving={saving} />
              )}

              {/* ── SCHEDULE ─────────────────────────────────────────────── */}
              {activeTab === 'schedule' && (
                <ScheduleTab config={config} saveConfig={saveConfig} saving={saving} />
              )}

              {/* ── EXPORT ───────────────────────────────────────────────── */}
              {activeTab === 'export' && (
                <ExportTab
                  config={config} saveConfig={saveConfig}
                  exportStats={exportStats}
                  onExport={exportDataset}
                  syncLogs={syncLogs}
                  saving={saving}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Storage Tab ───────────────────────────────────────────────────────────────
function StorageTab({ config, saveConfig, saving }) {
  const storage = config?.rag?.storage || {};
  const [type, setType] = useState(storage.type || 'local');
  const [localPath, setLocalPath] = useState(storage.local_path || '~/.hexagent-gui/rag_data');
  const [externalPath, setExternalPath] = useState(storage.external_path || '');
  const [cloudProvider, setCloudProvider] = useState(storage.cloud?.provider || 'none');
  const [cloudBucket, setCloudBucket] = useState(storage.cloud?.bucket || '');

  const save = async () => {
    const u = JSON.parse(JSON.stringify(config));
    u.rag.storage = {
      type,
      local_path: localPath,
      external_path: externalPath,
      cloud: { provider: cloudProvider, bucket: cloudBucket, prefix: 'hexagent-rag/' }
    };
    await saveConfig(u);
  };

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '16px' }}>Configuração de Storage</h3>
      {/* Type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { id: 'local',    label: '🖥️ Local',          desc: 'Padrão — armazena em ~/.hexagent-gui' },
          { id: 'external', label: '💽 Drive Externo',  desc: 'Caminho personalizado ou HD externo' },
          { id: 'cloud',    label: '☁️ Nuvem',           desc: 'S3, GCS ou Azure Blob Storage' },
        ].map(opt => (
          <div key={opt.id} onClick={() => setType(opt.id)} style={{
            border: `1px solid ${type === opt.id ? '#06b6d4' : '#1e2333'}`,
            borderRadius: '8px', padding: '12px', cursor: 'pointer',
            background: type === opt.id ? '#06b6d411' : '#1a1f2e'
          }}>
            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.8rem' }}>{opt.label}</div>
            <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '4px' }}>{opt.desc}</div>
          </div>
        ))}
      </div>

      {type === 'local' && (
        <label style={{ display: 'block', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Caminho Local</span>
          <input value={localPath} onChange={e => setLocalPath(e.target.value)} style={{
            width: '100%', background: '#0d1117', border: '1px solid #1e2333',
            borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box'
          }} />
        </label>
      )}
      {type === 'external' && (
        <label style={{ display: 'block', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Caminho do Drive Externo</span>
          <input value={externalPath} onChange={e => setExternalPath(e.target.value) } placeholder="/mnt/externo/rag_data" style={{
            width: '100%', background: '#0d1117', border: '1px solid #1e2333',
            borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box'
          }} />
        </label>
      )}
      {type === 'cloud' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Provider</span>
            <select value={cloudProvider} onChange={e => setCloudProvider(e.target.value)} style={{
              width: '100%', background: '#0d1117', border: '1px solid #1e2333',
              borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '0.8rem'
            }}>
              <option value="none">Selecione...</option>
              <option value="s3">AWS S3</option>
              <option value="gcs">Google Cloud Storage</option>
              <option value="azure">Azure Blob Storage</option>
            </select>
          </label>
          <label>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bucket / Container</span>
            <input value={cloudBucket} onChange={e => setCloudBucket(e.target.value)} placeholder="meu-bucket" style={{
              width: '100%', background: '#0d1117', border: '1px solid #1e2333',
              borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box'
            }} />
          </label>
        </div>
      )}

      <button onClick={save} disabled={saving} style={{
        marginTop: '16px', background: '#06b6d4', color: '#000', border: 'none',
        borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
      }}>
        {saving ? 'Salvando...' : '💾 Salvar Storage'}
      </button>
    </div>
  );
}

// ── API Keys Tab ──────────────────────────────────────────────────────────────
function APIKeysTab({ config, saveConfig, saving }) {
  const [keys, setKeys] = useState(config?.rag?.api_keys || {});
  const [visible, setVisible] = useState({});

  const save = async () => {
    const u = JSON.parse(JSON.stringify(config));
    u.rag.api_keys = keys;
    await saveConfig(u);
  };

  const KEY_INFO = [
    { id: 'brave_search',   label: 'Brave Search API',    desc: 'Buscas web avançadas (fallback: DuckDuckGo gratuito)', url: 'https://brave.com/search/api/' },
    { id: 'otx_api_key',    label: 'AlienVault OTX',      desc: 'Inteligência de ameaças em tempo real', url: 'https://otx.alienvault.com' },
    { id: 'virustotal_key', label: 'VirusTotal',           desc: 'Análise de arquivos e URLs para detecção de malware', url: 'https://virustotal.com' },
    { id: 'shodan_key',     label: 'Shodan',               desc: 'Inteligência de hosts expostos na internet', url: 'https://shodan.io' },
  ];

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '4px' }}>API Keys Opcionais</h3>
      <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '16px' }}>
        Todas as chaves são opcionais. O sistema funciona sem elas (DuckDuckGo como fallback gratuito).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {KEY_INFO.map(k => {
          const hasKey = !!keys[k.id];
          return (
            <div key={k.id} style={{ background: '#1a1f2e', borderRadius: '8px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 500 }}>{k.label}</span>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{k.desc}</div>
                </div>
                <span style={{
                  fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px',
                  background: hasKey ? '#22c55e22' : '#f59e0b22',
                  color: hasKey ? '#22c55e' : '#f59e0b',
                }}>
                  {hasKey ? '✅ Configurada' : '⚠️ Não configurada'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type={visible[k.id] ? 'text' : 'password'}
                  value={keys[k.id] || ''}
                  onChange={e => setKeys(prev => ({ ...prev, [k.id]: e.target.value }))}
                  placeholder={`Insira sua chave ${k.label}...`}
                  style={{
                    flex: 1, background: '#0d1117', border: '1px solid #1e2333',
                    borderRadius: '6px', padding: '7px 10px', color: '#e2e8f0', fontSize: '0.78rem'
                  }}
                />
                <button
                  onClick={() => setVisible(p => ({ ...p, [k.id]: !p[k.id] }))}
                  style={{ background: '#1e2333', border: '1px solid #2d3748', borderRadius: '6px', color: '#94a3b8', padding: '0 10px', cursor: 'pointer' }}
                >
                  {visible[k.id] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={save} disabled={saving} style={{
        marginTop: '16px', background: '#06b6d4', color: '#000', border: 'none',
        borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
      }}>
        {saving ? 'Salvando...' : '🔑 Salvar API Keys'}
      </button>
    </div>
  );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab({ config, saveConfig, saving }) {
  const sched = config?.rag?.schedule || {};
  const notif = config?.rag?.notifications || {};
  const [enabled, setEnabled]   = useState(sched.enabled ?? false);
  const [time, setTime]         = useState(sched.daily_sync_time || '03:00');
  const [onStartup, setOnStartup] = useState(sched.sync_on_startup ?? false);
  const [notifEnabled, setNotifEnabled] = useState(notif.enabled ?? true);
  const [notifTypes, setNotifTypes] = useState(notif.types || []);

  const NOTIF_OPTS = [
    { id: 'sync_complete',   label: '✅ Sync concluído' },
    { id: 'sync_error',      label: '❌ Erros de sync' },
    { id: 'new_critical_cve',label: '🚨 CVE Crítico (CVSS ≥ 9)' },
    { id: 'export_ready',    label: '📤 Export pronto' },
  ];

  const toggleNotif = (id) => {
    setNotifTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const save = async () => {
    const u = JSON.parse(JSON.stringify(config));
    u.rag.schedule = { enabled, daily_sync_time: time, sync_on_startup: onStartup };
    u.rag.notifications = { enabled: notifEnabled, types: notifTypes };
    await saveConfig(u);
  };

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '16px' }}>Agendamento & Notificações</h3>
      
      <div style={{ background: '#1a1f2e', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>Sync Automático</span>
          <div onClick={() => setEnabled(!enabled)} style={{
            width: '36px', height: '20px', borderRadius: '999px', cursor: 'pointer',
            background: enabled ? '#06b6d4' : '#374151', position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '2px', left: enabled ? '18px':'2px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
          </div>
        </div>
        {enabled && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ flex: 1 }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Horário diário</span>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{
                width: '100%', background: '#0d1117', border: '1px solid #1e2333',
                borderRadius: '6px', padding: '7px 10px', color: '#e2e8f0', fontSize: '0.8rem'
              }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
              <input type="checkbox" checked={onStartup} onChange={e => setOnStartup(e.target.checked)} />
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sync ao iniciar</span>
            </label>
          </div>
        )}
      </div>

      <div style={{ background: '#1a1f2e', borderRadius: '8px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>Notificações</span>
          <div onClick={() => setNotifEnabled(!notifEnabled)} style={{
            width: '36px', height: '20px', borderRadius: '999px', cursor: 'pointer',
            background: notifEnabled ? '#06b6d4' : '#374151', position: 'relative'
          }}>
            <div style={{ position: 'absolute', top: '2px', left: notifEnabled ? '18px':'2px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
          </div>
        </div>
        {notifEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {NOTIF_OPTS.map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={notifTypes.includes(opt.id)} onChange={() => toggleNotif(opt.id)} />
                <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} style={{
        marginTop: '16px', background: '#06b6d4', color: '#000', border: 'none',
        borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem'
      }}>
        {saving ? 'Salvando...' : '⏰ Salvar Agendamento'}
      </button>
    </div>
  );
}

// ── Export Tab ────────────────────────────────────────────────────────────────
function ExportTab({ config, saveConfig, exportStats, onExport, syncLogs, saving }) {
  const expCfg = config?.rag?.export || {};
  const [outputPath, setOutputPath] = useState(expCfg.output_path || '~/.hexagent-gui/rag_data/exports');
  const [minQuality, setMinQuality] = useState(expCfg.min_quality_score ?? 0.7);
  const [exporting, setExporting] = useState(false);

  const save = async () => {
    const u = JSON.parse(JSON.stringify(config));
    u.rag.export = { ...u.rag.export, output_path: outputPath, min_quality_score: minQuality };
    await saveConfig(u);
  };

  const handleExport = async () => {
    setExporting(true);
    await onExport();
    setExporting(false);
  };

  return (
    <div>
      <h3 style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '4px' }}>Exportação para Fine-tuning</h3>
      <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '16px' }}>
        Exporta interações coletadas em formato JSONL compatível com <code style={{ color: '#06b6d4' }}>rag_pipeline.sh export-training</code> do Local_RAG.
      </p>

      {/* Buffer stats */}
      {exportStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Pares de Treino', value: exportStats.count || 0, color: '#8b5cf6' },
            { label: 'Qualidade Média', value: exportStats.avg_quality?.toFixed(2) || '—', color: '#22c55e' },
            { label: 'Categorias', value: Object.keys(exportStats.categories || {}).length, color: '#f59e0b' },
          ].map(c => (
            <div key={c.label} style={{ background: '#1a1f2e', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{c.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <label>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Diretório de saída</span>
          <input value={outputPath} onChange={e => setOutputPath(e.target.value)} style={{
            width: '100%', background: '#0d1117', border: '1px solid #1e2333',
            borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box'
          }} />
        </label>

        <label>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Qualidade mínima</span>
            <span style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700 }}>{minQuality.toFixed(1)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={minQuality}
            onChange={e => setMinQuality(parseFloat(e.target.value))}
            style={{ width: '100%', marginTop: '6px', accentColor: '#06b6d4' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b' }}>
            <span>0.0 — Tudo</span><span>0.5 — Bom</span><span>1.0 — Perfeito</span>
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={save} disabled={saving} style={{
          background: '#1e2333', color: '#e2e8f0', border: '1px solid #2d3748',
          borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500
        }}>
          {saving ? 'Salvando...' : '💾 Salvar Config'}
        </button>
        <button onClick={handleExport} disabled={exporting || !exportStats?.count} style={{
          background: exporting || !exportStats?.count ? '#374151' : '#8b5cf6',
          color: '#fff', border: 'none', borderRadius: '6px',
          padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          {exporting ? <Loader2 size={14} /> : <FileJson size={14} />}
          {exporting ? 'Exportando...' : `⬇ Exportar ${exportStats?.count || 0} pares`}
        </button>
      </div>

      {/* Local_RAG usage note */}
      <div style={{
        marginTop: '16px', background: '#06b6d411',
        border: '1px solid #06b6d422', borderRadius: '8px', padding: '12px'
      }}>
        <div style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 600, marginBottom: '4px' }}>📚 Como usar com Local_RAG</div>
        <code style={{ fontSize: '0.67rem', color: '#94a3b8', whiteSpace: 'pre-line', display: 'block' }}>
          {`cd ~/Desenvolvimento/Local_RAG
./scripts/rag_pipeline.sh query \\
  --collection hexstrike \\
  --session-id pentest-$(date +%Y%m%d) \\
  --task-type shell_command_generation \\
  --remember`}
        </code>
      </div>
    </div>
  );
}
