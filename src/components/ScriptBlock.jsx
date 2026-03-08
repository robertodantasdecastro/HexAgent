/**
 * ScriptBlock Component
 * Special block for script files with save/execute/debug capabilities
 * 
 * Componente de Bloco de Script
 * Bloco especial para arquivos de script com capacidades de salvar/executar/depurar
 */

import { Bug, Download, FileCode, Play, Save } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AnsiRenderer } from '../utils/ansiRenderer';
import ScriptManager from '../utils/scriptManager';

const ScriptBlock = ({ 
  content, 
  language = 'bash',
  filename = 'script.sh',
  onSaved,
  onExecuted
}) => {
  const scriptManager = ScriptManager.getInstance();
  const [savePath, setSavePath] = useState(scriptManager.suggestPath(filename));
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  
  const handleSave = async (forceOverwrite = false) => {
    console.log('[ScriptBlock] Save clicked:', { savePath, filename, forceOverwrite });
    setIsSaving(true);
    try {
      const needsExec = scriptManager.needsExecutePermission(content);
      console.log('[ScriptBlock] Needs exec permission:', needsExec);
      
      const result = await scriptManager.saveScript(savePath, content, needsExec, forceOverwrite);
      
      console.log('[ScriptBlock] Response from saveScript:', result);
      
      if (!result.success && result.error === 'file_exists') {
        // File exists, show overwrite confirmation / Arquivo existe, mostrar confirmação
        console.log('[ScriptBlock] File exists, showing overwrite dialog');
        setShowOverwriteDialog(true);
        setIsSaving(false);
        return;
      }
      
      if (result.success) {
        console.log('[ScriptBlock] ✅ File saved successfully');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        
        if (onSaved) onSaved(result);
      } else {
        throw new Error(result.message || 'Failed to save file');
      }
    } catch (error) {
      console.error('[ScriptBlock] ❌ Save failed:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleConfirmOverwrite = () => {
    handleSave(true); // Force overwrite / Forçar sobrescrita
  };
  
  const handleExecute = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      // Save first if not saved
      if (!saved) {
        await handleSave();
      }
      
      const result = await scriptManager.executeScript(savePath);
      setExecutionResult(result);
      
      if (onExecuted) onExecuted(result);
    } catch (error) {
      setExecutionResult({
        stdout: '',
        stderr: error.message,
        exit_code: 1
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  const handleDebug = async () => {
    setIsExecuting(true);
    setExecutionResult(null);
    
    try {
      if (!saved) {
        await handleSave();
      }
      
      const result = await scriptManager.debugScript(savePath);
      setExecutionResult(result);
      
      if (onExecuted) onExecuted(result);
    } catch (error) {
      setExecutionResult({
        stdout: '',
        stderr: error.message,
        exit_code: 1
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <div className="script-block rounded-lg border-2 border-purple-500/30 bg-purple-900/10 my-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-purple-900/20 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-purple-400" />
          <span className="text-sm font-mono text-purple-300">{filename}</span>
          <span className="text-xs text-gray-500">({language})</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition disabled:opacity-50"
            title="Save script"
          >
            {saved ? <Download size={12} className="text-green-400" /> : <Save size={12} />}
            {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
          
          {/* Execute Button */}
          <button 
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition disabled:opacity-50"
            title="Execute script"
          >
            <Play size={12} />
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
          
          {/* Debug Button */}
          <button 
            onClick={handleDebug}
            disabled={isExecuting}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition disabled:opacity-50"
            title="Debug mode (verbose)"
          >
            <Bug size={12} />
            Debug
          </button>
        </div>
      </div>
      
      {/* Save Path Input */}
      <div className="px-4 py-2 bg-black/20 border-b border-purple-500/10">
        <label className="text-xs text-gray-500 block mb-1">Save to:</label>
        <input 
          type="text"
          value={savePath}
          onChange={(e) => setSavePath(e.target.value)}
          className="w-full bg-black/30 border border-gray-700 rounded px-2 py-1 text-sm font-mono text-gray-300 focus:outline-none focus:border-purple-500"
          placeholder="~/scripts/script.sh"
        />
      </div>
      
      {/* Code Content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
          showLineNumbers={true}
        >
          {content}
        </SyntaxHighlighter>
      </div>
      
      {/* Execution Result */}
      {executionResult && (
        <div className="border-t border-purple-500/20">
          <div className="px-4 py-2 bg-black/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-gray-500">Output:</span>
              <span className={`text-xs font-mono ${executionResult.exit_code === 0 ? 'text-green-400' : 'text-red-400'}`}>
                Exit Code: {executionResult.exit_code}
              </span>
            </div>
            
            {executionResult.stdout && (
              <div className="mb-2">
                <div className="text-[10px] text-gray-600 mb-1">STDOUT:</div>
                <div className="bg-black/40 rounded p-2 font-mono text-sm max-h-64 overflow-y-auto">
                  <AnsiRenderer text={executionResult.stdout} />
                </div>
              </div>
            )}
            
            {executionResult.stderr && (
              <div>
                <div className="text-[10px] text-red-600 mb-1">STDERR:</div>
                <div className="bg-red-900/20 rounded p-2 font-mono text-sm text-red-300 max-h-64 overflow-y-auto">
                  <AnsiRenderer text={executionResult.stderr} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Overwrite Confirmation Dialog / Diálogo de Confirmação de Sobrescrita */}
      <OverwriteConfirmDialog
        isOpen={showOverwriteDialog}
        onClose={() => setShowOverwriteDialog(false)}
        filePath={savePath}
        newContent={content}
        onConfirm={handleConfirmOverwrite}
      />
    </div>
  );
};

export default ScriptBlock;
