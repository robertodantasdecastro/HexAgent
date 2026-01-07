/**
 * WorkspacePanel Component
 * Sidebar panel for project and file management
 * 
 * Componente de Painel de Workspace
 * Painel lateral para gerenciamento de projetos e arquivos
 * 
 * Features / Recursos:
 * - Project listing / Listagem de projetos
 * - File tree view / Visualização de árvore de arquivos
 * - Project creation / Criação de projetos
 * - Project selection / Seleção de projetos
 */

import { ChevronLeft, ChevronRight, Folder, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import FileEditorPanel from './FileEditorPanel';
import FileTreeView from './FileTreeView';

const WorkspacePanel = ({ isOpen, onClose, onFileSelect }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // File Editor State
  const [openFiles, setOpenFiles] = useState({});
  const [activeFile, setActiveFile] = useState(null);

  /**
   * Load projects list on mount
   * Carregar lista de projetos ao montar
   */
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);
  
  /**
   * Load file tree when project is selected
   * Carregar árvore de arquivos quando projeto é selecionado
   */
  useEffect(() => {
    if (selectedProject) {
      loadFileTree(selectedProject);
    }
  }, [selectedProject]);
  
  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/project/list');
      const data = await response.json();
      
      if (data.projects) setProjects(data.projects);
    } catch (error) {
      console.error('[WorkspacePanel] Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadFileTree = async (projectName) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/project/${projectName}/tree`);
      const data = await response.json();
      
      if (data.tree) setFileTree(data.tree);
    } catch (error) {
      console.error('[WorkspacePanel] Failed to load file tree:', error);
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileClick = async (file) => {
    if (!file || !file.path) return;
    
    // Check if already open
    if (openFiles[file.path]) {
        setActiveFile(file.path);
        return;
    }

    // Load file content
    try {
        const response = await fetch('http://localhost:5000/file/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: file.path })
        });
        const data = await response.json();
        
        if (data.success) {
            setOpenFiles(prev => ({
                ...prev,
                [file.path]: { ...file, content: data.content, isDirty: false }
            }));
            setActiveFile(file.path);
            
            // Notify parent if needed (optional)
            if (onFileSelect) onFileSelect(file);
        }
    } catch (error) {
        console.error('Failed to open file:', error);
    }
  };

  const handleSaveFile = async (path, content) => {
    try {
        const response = await fetch('http://localhost:5000/file/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, content, overwrite: true })
        });
        const data = await response.json();
        
        if (data.success) {
            setOpenFiles(prev => ({
                ...prev,
                [path]: { ...prev[path], content, isDirty: false }
            }));
            // Show toast or status?
        }
    } catch (error) {
        console.error('Failed to save file:', error);
    }
  };

  const handleCloseFile = (path) => {
    setOpenFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[path];
        return newFiles;
    });
    
    if (activeFile === path) {
        const remaining = Object.keys(openFiles).filter(p => p !== path);
        setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={`
      fixed inset-0 z-40 flex bg-black/50 backdrop-blur-sm
    `}>
        {/* Main Workspace Container - Now full width modal-like or split */}
        <div className={`
            flex h-full bg-[#1e1e1e] border-r border-gray-700 shadow-2xl
            transition-all duration-300
            ${isCollapsed ? 'w-16' : 'w-full max-w-[90vw]'} 
        `}>
            
            {/* Sidebar (Project/Files) */}
            <div className={`
                flex flex-col h-full bg-[#252526] border-r border-[#333]
                ${isCollapsed ? 'w-16' : 'w-80'}
                transition-all duration-300
            `}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#2d2d2d]">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2">
                            <Folder size={18} className="text-yellow-500" />
                            <h2 className="font-bold text-gray-200 text-sm">EXPLORER</h2>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-[#3e3e42] rounded text-gray-400">
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
                        {!isCollapsed && (
                             <button onClick={onClose} className="p-1 hover:bg-[#3e3e42] rounded text-gray-400">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {!isCollapsed ? (
                    <div className="flex-1 overflow-y-auto">
                        {/* Projects List Selection */}
                         <div className="p-2">
                            <h3 className="text-xs font-bold text-gray-500 mb-2 px-2 uppercase">Projects</h3>
                            {projects.map(p => (
                                <button
                                    key={p.name}
                                    onClick={() => setSelectedProject(p.name)}
                                    className={`w-full text-left px-3 py-1 text-sm rounded flex items-center gap-2 ${selectedProject === p.name ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#2a2d2e]'}`}
                                >
                                    <Folder size={14} className={selectedProject === p.name ? 'text-yellow-400' : 'text-gray-500'} />
                                    <span className="truncate">{p.name}</span>
                                </button>
                            ))}
                         </div>
                        
                        {/* File Tree */}
                        {selectedProject && (
                            <div className="mt-2">
                                <h3 className="text-xs font-bold text-gray-500 mb-2 px-4 uppercase">{selectedProject}</h3>
                                <FileTreeView tree={fileTree} onFileSelect={handleFileClick} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-4 gap-4">
                        <Folder size={24} className="text-gray-500" />
                    </div>
                )}
            </div>

            {/* Editor Area (Right side) - Only show if not collapsed/minimized, but here we want full IDE feel */}
            <div className="flex-1 h-full overflow-hidden bg-[#1e1e1e]">
                <FileEditorPanel 
                    files={openFiles}
                    activeFile={activeFile}
                    onCloseFile={handleCloseFile}
                    onSaveFile={handleSaveFile}
                    onSwitchFile={setActiveFile}
                />
            </div>
      </div>
    </div>
  );
};

export default WorkspacePanel;
