/**
 * FileTreeView Component
 * Display hierarchical file structure with expansion/collapse
 * 
 * Componente de Visualização de Árvore de Arquivos
 * Exibe estrutura hierárquica de arquivos com expansão/colapso
 * 
 * Features / Recursos:
 * - Hierarchical display / Exibição hierárquica
 * - Expand/collapse folders / Expandir/colapsar pastas  
 * - File type icons / Ícones por tipo de arquivo
 * - File size display / Exibição de tamanho
 * - Click to select file / Clique para selecionar arquivo
 */

import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import { useState } from 'react';

const FileTreeView = ({ tree, onFileSelect, className = '' }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  
  /**
   * Toggle folder expansion state
   * Alternar estado de expansão da pasta
   */
  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  /**
   * Handle file/folder click
   * Lidar com clique em arquivo/pasta
   */
  const handleClick = (node) => {
    if (node.type === 'directory') {
      toggleFolder(node.path);
    } else {
      setSelectedFile(node.path);
      if (onFileSelect) {
        onFileSelect(node);
      }
    }
  };
  
  /**
   * Get file extension icon color
   * Obter cor do ícone por extensão
   */
  const getFileColor = (extension) => {
    const colorMap = {
      'py': 'text-blue-400',
      'js': 'text-yellow-400',
      'jsx': 'text-cyan-400',
      'ts': 'text-blue-500',
      'tsx': 'text-cyan-500',
      'json': 'text-green-400',
      'md': 'text-gray-400',
      'sh': 'text-green-500',
      'css': 'text-pink-400',
      'html': 'text-orange-400',
      'txt': 'text-gray-500'
    };
    return colorMap[extension] || 'text-gray-400';
  };
  
  /**
   * Format file size for display
   * Formatar tamanho de arquivo para exibição
   */
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };
  
  /**
   * Recursive tree node component
   * Componente de nó de árvore recursivo
   */
  const TreeNode = ({ node, level = 0 }) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;
    const indent = level * 16;
    
    return (
      <div>
        <div 
          className={`
            flex items-center gap-2 py-1 px-2 rounded cursor-pointer
            hover:bg-gray-800/50 transition-colors
            ${isSelected ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''}
          `}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => handleClick(node)}
          title={node.path}
        >
          {/* Expand/collapse chevron for directories */}
          {node.type === 'directory' && (
            isExpanded 
              ? <ChevronDown size={14} className="text-gray-500" />
              : <ChevronRight size={14} className="text-gray-500" />
          )}
          
          {/* Spacer for files to align with directories */}
          {node.type === 'file' && <div style={{ width: 14 }} />}
          
          {/* Icon */}
          {node.type === 'directory' ? (
            isExpanded 
              ? <FolderOpen size={14} className="text-yellow-500" />
              : <Folder size={14} className="text-yellow-600" />
          ) : (
            <File size={14} className={getFileColor(node.extension)} />
          )}
          
          {/* Name */}
          <span className={`text-sm flex-1 ${node.type === 'directory' ? 'font-semibold' : ''}`}>
            {node.name}
          </span>
          
          {/* File size */}
          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-600 ml-auto">
              {formatSize(node.size)}
            </span>
          )}
          
          {/* Directory child count */}
          {node.type === 'directory' && node.child_count !== undefined && (
            <span className="text-xs text-gray-600 ml-auto">
              {node.child_count} items
            </span>
          )}
        </div>
        
        {/* Recursively render children if directory is expanded */}
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map((child, idx) => (
              <TreeNode key={`${child.path}-${idx}`} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Empty state / Estado vazio
  if (!tree || tree.length === 0) {
    return (
      <div className={`file-tree bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="text-center text-gray-500 text-sm">
          <Folder size={32} className="mx-auto mb-2 opacity-50" />
          <p>No files to display</p>
          <p className="text-xs">Nenhum arquivo para exibir</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`file-tree bg-gray-900 border border-gray-700 rounded-lg p-2 ${className}`}>
      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        {tree.map((node, idx) => (
          <TreeNode key={`${node.path}-${idx}`} node={node} />
        ))}
      </div>
    </div>
  );
};

export default FileTreeView;
