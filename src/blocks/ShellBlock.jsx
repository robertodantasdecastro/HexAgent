/**
 * ShellBlock Component
 * Componente de Bloco de Shell
 * 
 * Visualizes command execution using xterm.js for a realistic terminal experience.
 * Visualiza execução de comandos usando xterm.js para uma experiência de terminal realista.
 * 
 * Features:
 * - Real xterm instance / Instância real do xterm
 * - Auto-fit to container / Ajuste automático ao container
 * - Web links support / Suporte a links web
 * - Custom Cyberpunk theme / Tema Cyberpunk customizado
 * 
 * @author: Roberto Dantas de Castro
 */

import { AlertCircle, Check, Copy, Terminal as TerminalIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

// Import xterm styles if not already imported globally or via CSS
// Importar estilos xterm se não importado globalmente ou via CSS
import 'xterm/css/xterm.css';

const ShellBlock = ({ content, metadata = {}, status = 'active' }) => {
  const [copied, setCopied] = useState(false);
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddon = useRef(null);
  
  const command = metadata.command || 'unknown command';
  const exitCode = metadata.exit_code;
  const isError = exitCode !== undefined && exitCode !== 0;

  // Initialize xterm.js
  // Inicializar xterm.js
  useEffect(() => {
    if (!terminalRef.current) return;

    // Prevent double init
    if (xtermInstance.current) return;

    const term = new Terminal({
      cursorBlink: status === 'active',
      fontSize: 12,
      fontFamily: "'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: '#09090b', // zinc-950
        foreground: '#e4e4e7', // zinc-200
        cursor: '#22d3ee', // cyan-400
        selectionBackground: 'rgba(34, 211, 238, 0.3)',
        black: '#000000',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#ffffff',
        brightBlack: '#71717a',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff'
      },
      convertEol: true,
      disableStdin: true, // Read-only for now until WebSocket input
      rows: 10 // Initial rows
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fit.fit();

    xtermInstance.current = term;
    fitAddon.current = fit;

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
        try {
            fit.fit();
        } catch (e) {
            // Ignore fit errors on detached elements
        }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermInstance.current = null;
    };
  }, []); // Run once on mount

  // Sync content updates
  // Sincronizar atualizações de conteúdo
  useEffect(() => {
    if (!xtermInstance.current) return;
    
    // Clear and write full content
    // Note: Ideally allow appending, but for Block architecture we might get full chunks or diffs.
    // Assuming 'content' grows appropriately (ChatManager appends).
    // Writing full content to xterm repeatedly is bad for perf.
    // BUT: React state updates give us full content.
    // Optimized Approach: xterm keeps its own state. We should only write *new* content if possible.
    // For now, simple approach: Reset and write.
    // FIXME: This will flash on every update. 
    // BETTER: Check length.
    
    const term = xtermInstance.current;
    
    // Simple delta check using length is risky for ANSI codes but okay for basic streams
    // A melhor abordagem para stream é o BlockManager enviar apenas o chunk novo.
    // Mas o BlockManager concatena e envia 'content' completo.
    // Vamos limpar e reescrever por enquanto, mas para produção precisamos de delta.
    
    term.clear();
    term.write(content);
    
    // Scroll to bottom
    term.scrollToBottom();

    // Re-fit just in case
    fitAddon.current?.fit();

  }, [content]);

  // Update cursor state based on status
  useEffect(() => {
      if (xtermInstance.current) {
         xtermInstance.current.options.cursorBlink = status === 'active';
      }
  }, [status]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`my-3 rounded-lg overflow-hidden border transition-all duration-300 ${
      status === 'active' ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20' :
      isError ? 'border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-gray-700/50 hover:border-gray-600'
    } bg-black`}>
      
      {/* Header Bar */}
      <div className={`flex items-center justify-between px-3 py-2 border-b transition-colors ${
          status === 'active' ? 'bg-cyan-950/30 border-cyan-900/50' : 
          isError ? 'bg-red-950/20 border-red-900/30' : 'bg-gray-900 border-gray-800'
      }`}>
        <div className="flex items-center gap-2 overflow-hidden">
            <div className={`p-1 rounded ${status === 'active' ? 'bg-cyan-900/50' : 'bg-gray-800'}`}>
                <TerminalIcon size={12} className={status === 'active' ? 'text-cyan-400' : 'text-gray-400'} />
            </div>
            <div className="font-mono text-xs text-gray-300 truncate font-medium flex items-center" title={command}>
                <span className="text-green-500 mr-2 font-bold select-none">$</span>
                {command}
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Status Badge */}
            <div className="flex items-center">
                {status === 'active' && (
                     <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-800 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"/> RUNNING
                     </span>
                )}
                {status === 'done' && (
                    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                        isError ? 'bg-red-950/50 text-red-400 border-red-900' : 'bg-green-950/30 text-green-400 border-green-900'
                    }`}>
                        {isError ? <AlertCircle size={10} /> : <Check size={10} />}
                        {isError ? `EXIT ${exitCode}` : 'SUCCESS'}
                    </span>
                )}
            </div>
            
            <button 
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                title="Copy Output"
            >
                {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12} />}
            </button>
        </div>
      </div>

      {/* Xterm Container */}
      <div className="relative p-2 bg-[#09090b]">
           <div ref={terminalRef} className="w-full h-[300px]" />
      </div>
    </div>
  );
};

export default ShellBlock;
