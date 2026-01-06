/**
 * FileEditorPanel Component
 * Inline file editor with Monaco integration
 * 
 * Componente de Painel de Editor de Arquivos
 * Editor inline com integração Monaco
 */

import Editor from '@monaco-editor/react';
import { Save, X } from 'lucide-react';
import { useState } from 'react';

const FileEditorPanel = ({ openFiles = [], onClose, onSave, activeFileIndex = 0, onTabChange }) => {
  const [editedContent, setEditedContent] = useState({});
  const [saving, setSaving] = useState(false);

  if (openFiles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg">No files open</p>
          <p className="text-sm">Select a file from workspace to edit</p>
          <p className="text-sm mt-2 text-gray-600">Nenhum arquivo aberto</p>
          <p className="text-xs text-gray-600">Selecione um arquivo do workspace para editar</p>
        </div>
      </div>
    );
  }

  const activeFile = openFiles[activeFileIndex] || openFiles[0];
  const currentContent = editedContent[activeFile.path] ?? activeFile.content;
  const hasUnsavedChanges = editedContent[activeFile.path] !== undefined;

  const handleEditorChange = (value) => {
    setEditedContent(prev => ({
      ...prev,
      [activeFile.path]: value
    }));
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      await onSave(activeFile.path, currentContent);
      // Clear edited state after successful save
      setEditedContent(prev => {
        const newState = { ...prev };
        delete newState[activeFile.path];
        return newState;
      });
    } catch (error) {
      console.error('[FileEditorPanel] Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTab = (index) => {
    const fileToClose = openFiles[index];
    const hasChanges = editedContent[fileToClose.path] !== undefined;
    
    if (hasChanges) {
      const confirm = window.confirm(
        `You have unsaved changes in ${fileToClose.name}. Close anyway?\n\n` +
        `Você tem alterações não salvas em ${fileToClose.name}. Fechar mesmo assim?`
      );
      if (!confirm) return;
    }
    
    onClose(index);
  };

  const getLanguageFromPath = (path) => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'sh': 'shell',
      'bash': 'shell',
      'json': 'json',
      'md': 'markdown',
      'html': 'html',
      'css': 'css',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml'
    };
    return langMap[ext] || 'plaintext';
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900 min-w-0">
      {/* Tab Bar */}
      <div className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {openFiles.map((file, index) => {
          const isActive = index === activeFileIndex;
          const hasChanges = editedContent[file.path] !== undefined;
          
          return (
            <div
              key={file.path}
              className={`
                flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer
                transition-colors min-w-0 max-w-xs
                ${isActive 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
                }
              `}
              onClick={() => onTabChange(index)}
            >
              <span className="truncate text-sm font-mono">
                {file.name}
                {hasChanges && <span className="text-yellow-500 ml-1">●</span>}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(index);
                }}
                className="hover:bg-gray-600 rounded p-0.5 transition"
                title="Close / Fechar"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={getLanguageFromPath(activeFile.path)}
          value={currentContent}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80, 120],
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            tabSize: 2,
            insertSpaces: true
          }}
        />
        
        {/* Save Button (Floating) */}
        {hasUnsavedChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={`
              absolute bottom-4 right-4 z-10
              flex items-center gap-2 px-4 py-2 rounded-lg
              transition-all shadow-lg
              ${saving 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-500'
              }
              text-white font-medium
            `}
            title="Save (Ctrl+S) / Salvar (Ctrl+S)"
          >
            <Save size={16} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>{activeFile.path}</span>
          <span>•</span>
          <span>{getLanguageFromPath(activeFile.path).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4">
          {hasUnsavedChanges && (
            <>
              <span className="text-yellow-500">● Unsaved changes</span>
              <span>•</span>
            </>
          )}
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default FileEditorPanel;
