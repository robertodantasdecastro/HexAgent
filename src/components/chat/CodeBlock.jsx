import { CheckCircle, Copy, Download, Edit, Play, Terminal } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect, useRef, useState } from 'react';
import { AnsiRenderer } from '../../utils/ansiRenderer';
import APIClient from '../../utils/APIClient';

/**
 * CodeBlock Component
 * Componente de Bloco de Código
 * 
 * Displays code snippets with syntax highlighting and actions (Copy, Save, Execute).
 * Exibe trechos de código com destaque de sintaxe e ações (Copiar, Salvar, Executar).
 * 
 * @component
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 */
const CodeBlock = ({ code, language, onExecute, colors }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const [sentToTerm, setSentToTerm] = useState(false);
  const codeRef = useRef(null);

  useEffect(() => {
    if (codeRef.current && !editing) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language, editing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editing ? editedCode : code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const extensions = { python: 'py', javascript: 'js', bash: 'sh', json: 'json', markdown: 'md' };
    const ext = extensions[language] || 'txt';
    const filename = prompt('Nome do arquivo / File name:', `script.${ext}`);
    if (filename) {
      const blob = new Blob([editing ? editedCode : code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleExecute = () => {
    if (onExecute) onExecute(editing ? editedCode : code, language);
  };

  const handleTerminalRun = async () => {
    const api = APIClient.getInstance();
    const cmd = editing ? editedCode : code;
    try {
        await api.post('/terminal/input', { data: cmd + '\n' });
        setSentToTerm(true);
        setTimeout(() => setSentToTerm(false), 2000);
    } catch(e) {
        console.error("Terminal Run Failed", e);
    }
  };

  const handleEdit = () => {
    setEditing(!editing);
    if (editing) {
      // Save changes callback could be added here
      // Callback de salvar alterações poderia ser adicionado aqui
    }
  };

  const isExecutable = ['bash', 'python', 'javascript', 'sh'].includes(language);
  const isShell = ['bash', 'sh'].includes(language);

  return (
    <div className="my-2 rounded-lg bg-[#1e1e1e] border border-[#333] overflow-hidden">
      {/* Action Bar / Barra de Ação */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-[#444]">
        <span className="text-xs text-gray-400 font-mono">{language || 'plaintext'}</span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition">
            {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button onClick={handleSave} className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition">
            {saved ? <CheckCircle size={12} /> : <Download size={12} />}
            {saved ? 'Salvo' : 'Salvar'}
          </button>
          <button onClick={handleEdit} className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] transition ${editing ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}>
            <Edit size={12} />
            {editing ? 'Fechar' : 'Editar'}
          </button>
          {isShell && (
             <button onClick={handleTerminalRun} className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] text-cyan-400 hover:text-cyan-300 transition" title="Type into Terminal / Digitar no Terminal">
                {sentToTerm ? <CheckCircle size={12} /> : <Terminal size={12} />}
                {sentToTerm ? 'Enviado' : 'Terminal'}
             </button>
          )}
          {isExecutable && onExecute && (
            <button onClick={handleExecute} className="flex items-center gap-1 px-2 py-1 text-[10px] rounded hover:bg-[#3d3d3d] text-green-400 hover:text-green-300 transition">
              <Play size={12} />
              Executar
            </button>
          )}
        </div>
      </div>
      {/* Code Content / Conteúdo do Código */}
      {editing ? (
        <textarea
          value={editedCode}
          onChange={(e) => setEditedCode(e.target.value)}
          className="w-full bg-[#1e1e1e] text-gray-200 p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
          rows={editedCode.split('\n').length + 1}
        />
      ) : language === 'bash' && (code.includes('\u001b[') || code.includes('\x1b[') || code.match(/\[\d+(?:;\d+)*m/)) ? (
        // Bash with ANSI codes - use AnsiRenderer
        // Bash com códigos ANSI - usa AnsiRenderer
        <div className="p-3 overflow-x-auto bg-black font-mono text-sm text-gray-200">
          <AnsiRenderer text={code} customColors={colors?.custom_ansi} />
        </div>
      ) : (
        <pre className="p-3 overflow-x-auto"><code ref={codeRef} className={`language-${language || 'plaintext'}`}>{code}</code></pre>
      )}
    </div>
  );
};

export default CodeBlock;
