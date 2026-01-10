/**
 * SaveFilesDialog Component
 * Shows unsaved files on exit and prompts user to save
 * 
 * Dialog de Salvamento de Arquivos
 * Mostra arquivos não salvos ao sair e solicita salvamento
 */

import { AlertCircle, FolderOpen, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const SaveFilesDialog = ({ files = [], onComplete }) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState(new Set(files.map(f => f.path)));
  const [saveLocation, setSaveLocation] = useState('~/Documents/HexAgent');
  const [saving, setSaving] = useState(false);
  
  const toggleFile = (filepath) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filepath)) {
      newSelected.delete(filepath);
    } else {
      newSelected.add(filepath);
    }
    setSelectedFiles(newSelected);
  };
  
  const toggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.path)));
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    
    try {
      const filesToSave = files.filter(f => selectedFiles.has(f.path));
      
      // Save each file via backend
      for (const file of filesToSave) {
        await fetch('http://localhost:5000/session/files/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filepath: file.path,
            content: file.content,
            destination: saveLocation
          })
        });
      }
      
      onComplete(true);
    } catch (error) {
      console.error('[SaveFilesDialog] Save failed:', error);
      alert('Erro ao salvar arquivos: ' + error.message);
      setSaving(false);
    }
  };
  
  const handleDiscard = () => {
    if (confirm(`Descartar ${files.length} arquivo(s) não salvos?`)) {
      onComplete(false);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getTypeIcon = (type) => {
    const icons = {
      code: '📝',
      config: '⚙️',
      log: '📄',
      readme: '📖',
      data: '📊',
      unknown: '📁'
    };
    return icons[type] || icons.unknown;
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
      <div 
        className="bg-[#0a0a0a] border border-yellow-500 rounded-xl shadow-2xl max-w-2xl w-full mx-4"
        style={{ boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-yellow-500/30">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <AlertCircle className="text-yellow-500" size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-yellow-500 font-mono">
              {t('savefiles.title', 'Unsaved Files')}
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              {files.length} {t('savefiles.files_created', 'file(s) created during this session')}
            </p>
          </div>
        </div>
        
        {/* File list */}
        <div className="p-6">
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white">
              <input 
                type="checkbox"
                checked={selectedFiles.size === files.length}
                onChange={toggleAll}
                className="w-4 h-4"
              />
              <span className="font-bold">
                {t('savefiles.select_all', 'Select all')} ({selectedFiles.size}/{files.length})
              </span>
            </label>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto border border-[#333] rounded-lg p-3 bg-black/30">
            {files.map(file => (
              <label 
                key={file.path}
                className="flex items-start gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition"
              >
                <input 
                  type="checkbox"
                  checked={selectedFiles.has(file.path)}
                  onChange={() => toggleFile(file.path)}
                  className="w-4 h-4 mt-1"
                />
                
                <span className="text-xl">{getTypeIcon(file.type)}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-white truncate">
                    {file.path}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>{file.type}</span>
                    <span>{formatFileSize(file.size)}</span>
                    <span>{new Date(file.created).toLocaleTimeString()}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
          
          {/* Save location */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
              <FolderOpen size={14} />
              {t('savefiles.save_location', 'Save location')}:
            </label>
            <input 
              type="text"
              value={saveLocation}
              onChange={(e) => setSaveLocation(e.target.value)}
              placeholder="~/Documents/HexAgent"
              className="w-full bg-black border border-[#333] rounded px-4 py-2 text-white text-sm focus:border-yellow-500 focus:outline-none font-mono"
            />
            <p className="text-xs text-gray-600 mt-1">
              {t('savefiles.relative_structure', 'Files will be saved with their relative directory structure')}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-[#333]">
          <button 
            onClick={handleSave}
            disabled={selectedFiles.size === 0 || saving}
            className="flex-1 py-3 bg-[#00ff00] text-black font-bold rounded-lg hover:bg-[#00cc00] transition font-mono text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? t('savefiles.saving', 'Saving...') : `${t('savefiles.save', 'Save')} ${selectedFiles.size} ${t('savefiles.files', 'file(s)')}`}
          </button>
          
          <button 
            onClick={handleDiscard}
            disabled={saving}
            className="flex-1 py-3 bg-red-500/20 border border-red-500/50 text-red-400 font-bold rounded-lg hover:bg-red-500/30 transition font-mono text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {t('savefiles.discard_all', 'Discard All')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveFilesDialog;
