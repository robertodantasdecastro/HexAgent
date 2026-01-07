
import Editor from '@monaco-editor/react';
import { Circle, FileCode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * FileEditorPanel Component
 * Monaco Editor integration with multi-tab support
 * 
 * Componente FileEditorPanel
 * Integração do Monaco Editor com suporte a múltiplas abas
 */
const FileEditorPanel = ({ files, activeFile, onCloseFile, onSaveFile, onSwitchFile, className }) => {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef(null);

  // Update content when active file changes
  useEffect(() => {
    if (activeFile && files[activeFile]) {
      setContent(files[activeFile].content || '');
      setIsDirty(files[activeFile].isDirty || false);
    } else {
      setContent('');
    }
  }, [activeFile, files]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add Ctrl+S keybinding
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  // Handle content change
  const handleChange = (value) => {
    setContent(value);
    if (!isDirty && activeFile) {
      setIsDirty(true);
      // Notify parent about dirty state if needed
      // Here we assume local state handling for UI feedback first
    }
  };

  // Handle save action
  const handleSave = () => {
    if (activeFile && onSaveFile) {
        onSaveFile(activeFile, content);
        setIsDirty(false);
    }
  };

  // Determine language capabilities based on extension
  const getLanguage = (filename) => {
    if (!filename) return 'text';
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', html: 'html', css: 'css', json: 'json', md: 'markdown',
      sh: 'shell', bash: 'shell', sql: 'sql', java: 'java', cpp: 'cpp', c: 'c',
      go: 'go', rust: 'rust', php: 'php', rb: 'ruby', xml: 'xml', yaml: 'yaml', yml: 'yaml'
    };
    return map[ext] || 'text';
  };

  // Get filename from path
  const getBasename = (path) => path?.split('/').pop() || 'Untitled';

  if (!activeFile && Object.keys(files).length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-gray-500 space-y-4 ${className}`}>
        <FileCode size={48} className="opacity-20" />
        <p className="text-sm">No file open / Nenhum arquivo aberto</p>
        <p className="text-xs text-gray-600">Select a file from the sidebar to edit</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-[#1e1e1e] ${className}`}>
      {/* Tabs Header */}
      <div className="flex bg-[#252526] overflow-x-auto scrollbar-hide">
        {Object.keys(files).map((path) => {
            const isActive = path === activeFile;
            const file = files[path];
            return (
                <div 
                    key={path}
                    onClick={() => onSwitchFile(path)}
                    className={`
                        group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px]
                        border-r border-[#1e1e1e]/50 cursor-pointer select-none text-xs font-mono
                        ${isActive ? 'bg-[#1e1e1e] text-white border-t-2 border-t-yellow-500' : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e]'}
                    `}
                >
                    <span className="truncate flex-1" title={path}>{getBasename(path)}</span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                        {file.isDirty || (isActive && isDirty) ? (
                            <Circle size={8} className="fill-white text-white" />
                        ) : (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onCloseFile(path); }}
                                className={`opacity-0 group-hover:opacity-100 hover:text-white p-0.5 rounded ${isActive ? 'opacity-100' : ''}`}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </span>
                </div>
            );
        })}
      </div>

      {/* Editor Toolbar (Optional, e.g. Path breadcrumbs) */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#1e1e1e] border-b border-[#333]">
        <span className="text-xs text-gray-500 truncate font-mono">{activeFile}</span>
        {isDirty && (
            <span className="text-[10px] text-yellow-500 flex items-center gap-1">
                <Circle size={6} fill="currentColor" /> Unsaved
            </span>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
         {activeFile && (
             <Editor
                height="100%"
                defaultLanguage="text"
                language={getLanguage(activeFile)}
                value={content}
                theme="vs-dark"
                onChange={handleChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    fontLigatures: true
                }}
             />
         )}
      </div>
    </div>
  );
};

export default FileEditorPanel;
