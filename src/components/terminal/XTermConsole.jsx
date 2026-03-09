import { EventSourcePolyfill } from 'event-source-polyfill';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import APIClient from '../../utils/APIClient';

const XTermConsole = forwardRef(({ onData, onResize, onCommand }, ref) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const eventSourceRef = useRef(null);
  
  // Phase 5: Híbrido Co-Pilot Linter State
  const cmdBufferRef = useRef('');
  const lintTimeoutRef = useRef(null);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: '#58a6ff33',
        black: '#0d1117',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#d2a8ff',
        brightBlack: '#484f58',
        brightRed: '#ffa198',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#f0f6fc',
      },
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    
    // Fit initially and periodically to ensure correct size
    // Ajustar inicialmente e periodicamente para garantir tamanho correto
    setTimeout(() => fitAddon.fit(), 100);

    // Initial Message
    term.writeln('\x1b[1;32mHexAgent Hybrid Terminal v2.0\x1b[0m');
    term.writeln('Connecting to PTY Backend...');

    const api = APIClient.getInstance();

    // 1. Setup Input Handler (Frontend -> Backend)
    // 1. Configurar Manipulador de Entrada
    term.onData((data) => {
       // Send raw keystrokes to backend
       // Enviar teclas cruas para o backend
       api.post('/terminal/input', { data: data }).catch(err => {
           console.error("PTY Input Failed:", err);
       });
       
       // --- INÍCIO INTERCEPTAÇÃO LINTER (CO-PILOT) ---
       if (data === '\r' || data === '\n' || data === '\x03') { // Enter ou Ctrl+C
           cmdBufferRef.current = '';
           if (suggestion) setSuggestion(null);
           clearTimeout(lintTimeoutRef.current);
       } else if (data === '\x7F') { // Backspace
           cmdBufferRef.current = cmdBufferRef.current.slice(0, -1);
       } else if (data >= String.fromCharCode(0x20) && data <= String.fromCharCode(0x7E)) {
           // ASCII Imprimível
           cmdBufferRef.current += data;
       }

       // Debounce da Validação Assistiva
       clearTimeout(lintTimeoutRef.current);
       // Somente lints commandos sendo digitados com mais de 3 caracteres
       if (cmdBufferRef.current.trim().length >= 3) {
           lintTimeoutRef.current = setTimeout(() => {
               api.post('/terminal/lint', { command: cmdBufferRef.current.trim(), cwd: '/' })
                  .then(res => {
                      if (res.data?.success && res.data.data?.suggestion) {
                          setSuggestion(res.data.data.suggestion);
                      } else {
                          setSuggestion(null);
                      }
                  })
                  .catch(() => setSuggestion(null));
           }, 800); // 800ms debounce
       } else {
           setSuggestion(null);
       }
       // --- FIM INTERCEPTAÇÃO LINTER ---
       
       // Optional: Pass to parent if needed for specialized handling
       if (onData) onData(data);
    });

    // 2. Setup Resize Handler
    // 2. Configurar Redimensionamento
    term.onResize((size) => {
       api.post('/terminal/resize', { cols: size.cols, rows: size.rows });
       if (onResize) onResize(size);
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 3. Connect Output Stream (Backend -> Frontend)
    // 3. Conectar Fluxo de Saída
    const connectStream = () => {
        const streamUrl = `${api.getBaseURL()}/terminal/stream`;
        // Use Polyfill for Electron compatibility
        const es = new EventSourcePolyfill(streamUrl);
        
        es.onopen = () => {
            term.writeln('\r\n\x1b[1;34m[Connected]\x1b[0m\r\n');
            // Force resize update to sync backend PTY size
            fitAddon.fit();
            api.post('/terminal/resize', { cols: term.cols, rows: term.rows });
        };

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.content) {
                    term.write(payload.content);
                }
            } catch (e) {
                console.error("Parse Error:", e);
            }
        };

        es.onerror = (e) => {
            console.error("PTY Stream Error", e);
            es.close();
            // Optional: Reconnect logic could go here
            // term.writeln('\r\n\x1b[1;31m[Disconnected]\x1b[0m');
        };

        eventSourceRef.current = es;
    };

    connectStream();

    // Handle Window Resize
    const handleResize = () => {
        fitAddon.fit();
        // Resize event will be triggered by fitAddon automatically if dimensions change? 
        // No, fitAddon.fit() resizes the terminal, which triggers onResize event we hooked above.
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (eventSourceRef.current) {
          eventSourceRef.current.close();
      }
      term.dispose();
    };
  }, []);

  // Expose methods to parent / Expor métodos para o pai
  useImperativeHandle(ref, () => ({
    write: (data) => {
        if (xtermRef.current) xtermRef.current.write(data);
    },
    writeln: (data) => {
        if (xtermRef.current) xtermRef.current.writeln(data);
    },
    clear: () => {
        if (xtermRef.current) xtermRef.current.clear();
    },
    fit: () => {
        if (fitAddonRef.current) fitAddonRef.current.fit();
    },
    // Interactive Command Execution (Deep Link)
    // Execução de Comando Interativo (Deep Link)
    execute: (command) => {
        const api = APIClient.getInstance();
        // Send command + newline / Enviar comando + nova linha
        api.post('/terminal/input', { data: command + '\n' });
    }
  }));

  return (
    <div className="relative w-full h-64 bg-[#0d1117] rounded-lg overflow-hidden border border-gray-700 p-2 shadow-inner">
      <div ref={terminalRef} className="w-full h-full" />
      
      {/* Voo Passivo Co-Pilot Suggestion Pill */}
      {suggestion && (
        <div className="absolute bottom-4 right-4 bg-cyan-950/90 border border-cyan-500/50 p-2.5 rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-3 backdrop-blur-sm z-10 animate-fade-in">
           <span className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
               Linter
           </span>
           <span className="text-gray-200 font-mono text-sm">{suggestion}</span>
        </div>
      )}
    </div>
  );
});

export default XTermConsole;
