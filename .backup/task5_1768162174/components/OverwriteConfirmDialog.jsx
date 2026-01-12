/**
 * OverwriteConfirmDialog Component
 * Confirmation dialog before overwriting files with diff preview
 * 
 * Componente de Diálogo de Confirmação de Sobrescrita
 * Diálogo de confirmação antes de sobrescrever arquivos com preview de diff
 * 
 * Features / Recursos:
 * - Fetch and display diff from backend / Buscar e exibir diff do backend
 * - Syntax-highlighted diff view / Visualização de diff com destaque de sintaxe
 * - Statistics (additions/deletions) / Estatísticas (adições/remoções)
 * - Cancel or confirm actions / Ações de cancelar ou confirmar
 */

import { AlertTriangle, Check, Minus, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const OverwriteConfirmDialog = ({ 
  isOpen, 
  onClose, 
  filePath, 
  newContent, 
  onConfirm 
}) => {
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Fetch diff from backend when dialog opens
   * Buscar diff do backend quando diálogo abre
   */
  useEffect(() => {
    if (isOpen && filePath && newContent) {
      fetchDiff();
    }
  }, [isOpen, filePath, newContent]);
  
  const fetchDiff = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/file/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: filePath, 
          content: newContent 
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (!data.file_exists) {
        setDiffData({ is_new_file: true });
      } else {
        setDiffData(data);
      }
    } catch (err) {
      console.error('[OverwriteConfirmDialog] Failed to fetch diff:', err);
      setError('Failed to fetch diff: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Format diff lines with syntax highlighting
   * Formatar linhas de diff com destaque de sintaxe
   */
  const formatDiffLine = (line, index) => {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      return (
        <div key={index} className="flex items-start gap-2 bg-green-900/20">
          <Plus size={12} className="text-green-400 mt-1 flex-shrink-0" />
          <span className="text-green-300 font-mono text-xs">{line.substring(1)}</span>
        </div>
      );
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      return (
        <div key={index} className="flex items-start gap-2 bg-red-900/20">
          <Minus size={12} className="text-red-400 mt-1 flex-shrink-0" />
          <span className="text-red-300 font-mono text-xs">{line.substring(1)}</span>
        </div>
      );
    } else if (line.startsWith('@@')) {
      return (
        <div key={index} className="text-cyan-400 font-mono text-xs bg-cyan-900/10 px-2 py-1 my-1">
          {line}
        </div>
      );
    } else if (line.startsWith('+++') || line.startsWith('---')) {
      return (
        <div key={index} className="text-gray-500 font-mono text-xs font-bold">
          {line}
        </div>
      );
    } else {
      return (
        <div key={index} className="text-gray-400 font-mono text-xs pl-5">
          {line}
        </div>
      );
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header / Cabeçalho */}
        <div className="flex items-center gap-3 p-4 border-b border-yellow-500/30 bg-yellow-900/10">
          <AlertTriangle className="text-yellow-500 flex-shrink-0" size={24} />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-yellow-500">
              Confirm Overwrite / Confirmar Sobrescrita
            </h2>
            <p className="text-sm text-gray-300 truncate mt-1">
              <code className="text-cyan-400">{filePath}</code>
            </p>
          </div>
        </div>
        
        {/* Content / Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading diff...</p>
                <p className="text-xs">Carregando diff...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded p-4 text-red-300">
              <p className="font-bold">Error / Erro:</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : diffData?.is_new_file ? (
            <div className="bg-green-900/20 border border-green-500/30 rounded p-4 text-green-300">
              <p className="font-bold">✨ New File / Novo Arquivo</p>
              <p className="text-sm mt-2">
                This file doesn't exist yet and will be created.
              </p>
              <p className="text-sm">
                Este arquivo ainda não existe e será criado.
              </p>
            </div>
          ) : diffData?.has_changes === false ? (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 text-blue-300">
              <p className="font-bold">ℹ️ No Changes / Sem Mudanças</p>
              <p className="text-sm mt-2">
                The new content is identical to the existing file.
              </p>
              <p className="text-sm">
                O novo conteúdo é idêntico ao arquivo existente.
              </p>
            </div>
          ) : diffData ? (
            <>
              {/* Statistics / Estatísticas */}
              <div className="flex gap-4 mb-4 text-sm">
                <div className="bg-green-900/20 px-3 py-2 rounded border border-green-500/30">
                  <Plus size={14} className="inline text-green-400 mr-1" />
                  <span className="text-green-300 font-bold">{diffData.additions}</span>
                  <span className="text-gray-400 ml-1">additions</span>
                </div>
                <div className="bg-red-900/20 px-3 py-2 rounded border border-red-500/30">
                  <Minus size={14} className="inline text-red-400 mr-1" />
                  <span className="text-red-300 font-bold">{diffData.deletions}</span>
                  <span className="text-gray-400 ml-1">deletions</span>
                </div>
                <div className="bg-gray-800 px-3 py-2 rounded border border-gray-600">
                  <span className="text-gray-300">
                    {diffData.old_size} → {diffData.new_size} bytes
                  </span>
                </div>
              </div>
              
              {/* Diff view / Visualização de diff */}
              <div className="bg-black rounded border border-gray-700 p-3 overflow-x-auto">
                {diffData.diff ? (
                  diffData.diff.split('\n').map((line, idx) => formatDiffLine(line, idx))
                ) : (
                  <p className="text-gray-500 text-sm">No diff available</p>
                )}
              </div>
            </>
          ) : null}
        </div>
        
        {/* Actions / Ações */}
        <div className="flex gap-3 p-4 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center gap-2 transition"
          >
            <X size={16} />
            <span>Cancel / Cancelar</span>
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Check size={16} />
            <span>Overwrite / Sobrescrever</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverwriteConfirmDialog;
