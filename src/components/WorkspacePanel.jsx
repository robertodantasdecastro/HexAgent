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

import { ChevronLeft, ChevronRight, Folder, FolderPlus, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import FileTreeView from './FileTreeView';

const WorkspacePanel = ({ isOpen, onClose, onFileSelect }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
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
      
      if (data.projects) {
        setProjects(data.projects);
      }
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
      
      if (data.tree) {
        setFileTree(data.tree);
      }
    } catch (error) {
      console.error('[WorkspacePanel] Failed to load file tree:', error);
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSelect = (file) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={`
      fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 
      transition-all duration-300 z-40 flex
      ${isCollapsed ? 'w-12' : 'w-80'}
    `}>
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-gray-800 border border-gray-600 rounded-full p-1 hover:bg-gray-700 transition z-50"
        title={isCollapsed ? "Expand workspace" : "Collapse workspace"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      {!isCollapsed && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-2">
              <Folder size={20} className="text-yellow-500" />
              <h2 className="font-bold text-white">Workspace</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadProjects}
                disabled={loading}
                className="p-1 hover:bg-gray-700 rounded transition"
                title="Refresh / Atualizar"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-700 rounded transition"
                title="Close / Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          
          {/* Projects List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-400">
                  Projects / Projetos
                </h3>
                <button
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-500 rounded transition"
                  title="Create new project / Criar novo projeto"
                >
                  <FolderPlus size={12} />
                  New
                </button>
              </div>
              
              {loading && !projects.length ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-xs">Loading...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FolderPlus size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No projects yet</p>
                  <p className="text-xs">Nenhum projeto ainda</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {projects.map((project, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedProject(project.name)}
                      className={`
                        w-full text-left px-3 py-2 rounded transition
                        ${selectedProject === project.name 
                          ? 'bg-purple-900/50 border-l-2 border-purple-500' 
                          : 'hover:bg-gray-800'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <Folder size={14} className="text-yellow-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-white truncate">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {project.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-600 mt-1">
                            {project.file_count || 0} files
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* File Tree for Selected Project */}
            {selectedProject && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">
                  Files / Arquivos
                </h3>
                <FileTreeView 
                  tree={fileTree} 
                  onFileSelect={handleFileSelect}
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Collapsed State Icon */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-4">
          <Folder size={20} className="text-yellow-500" />
          <div className="text-xs text-gray-500 writing-mode-vertical transform rotate-180">
            Workspace
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacePanel;
