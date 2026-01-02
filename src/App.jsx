import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Cpu, Shield, AlertTriangle, Power, Code } from 'lucide-react';

// Parse agent content into formatted sections
const parseAgentContent = (content) => {
  const sections = [];
  const lines = content.split('\n');
  let currentSection = { type: 'ai', content: '' };
  
  for (const line of lines) {
    if (line.startsWith('🔧 Executando:')) {
      // Save current section if it has content
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      // Start command section
      currentSection = { type: 'command', content: line };
    } else if (line.startsWith('Command Executed') || line.startsWith('Comando Executado')) {
      // Save current section
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      // Start terminal output section
      currentSection = { type: 'terminal', content: line };
    } else {
      // Append to current section
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  }
  
  // Add final section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
};

// Block Component with enhanced formatting
const Block = ({ type, content, result, timestamp }) => {
  // Parse content for agent responses
  const sections = type === 'agent' ? parseAgentContent(content) : [];
  
  return (
    <div className="mb-4 rounded-lg bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-lg transition-all hover:border-[#00ff00]/30 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-[#333]">
        <div className="flex items-center gap-2">
          {type === 'user' ? <Terminal size={14} className="text-[#00ff00]" /> : <Cpu size={14} className="text-cyan-400" />}
          <span className="text-xs text-gray-400 font-mono">{timestamp}</span>
        </div>
        {type === 'agent' && <div className="text-[10px] text-cyan-400 border border-cyan-400/20 px-1 rounded">HEXAGENT</div>}
      </div>
      
      <div className="p-4 font-mono text-sm space-y-3">
        {type === 'user' ? (
          <div className="text-[#00ff00] whitespace-pre-wrap">{content}</div>
        ) : (
          sections.map((section, idx) => {
            if (section.type === 'ai') {
              // AI explanation/response - cyan/blue
              return (
                <div key={idx} className="text-cyan-300 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>
              );
            } else if (section.type === 'command') {
              // Command execution - yellow/orange with icon
              return (
                <div key={idx} className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                  <Code size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-yellow-300 font-semibold">{section.content}</span>
                </div>
              );
            } else if (section.type === 'terminal') {
              // Terminal output - green monospace
              return (
                <div key={idx} className="bg-black/50 border border-[#00ff00]/20 rounded p-3">
                  <div className="text-[#00ff00] font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {section.content}
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
        
        {result && (
           <div className="mt-2 p-2 bg-black rounded border border-[#333] text-gray-300 whitespace-pre-wrap">
             {result}
           </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [input, setInput] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [status, setStatus] = useState('OFFLINE');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const bottomRef = useRef(null);

  const toggleService = async () => {
      setToggleLoading(true);
      const endpoint = status === 'ONLINE' ? '/stop_service' : '/start_service';
      try {
          await fetch(`http://localhost:5000${endpoint}`, { method: 'POST' });
          // Status update will happen next poll
      } catch (e) {
          console.error("Toggle failed", e);
      } finally {
          setToggleLoading(false);
      }
  };

  useEffect(() => {
    let intervalId = null;

    // Check Status
    const checkStatus = async () => {
      try {
        const res = await fetch('http://localhost:5000/status');
        const data = await res.json();
        if (data.status === 'ok' || data.alive) {
            setStatus('ONLINE');
        } else {
            setStatus('OFFLINE');
        }
      } catch (e) {
        setStatus('DISCONNECTED');
      }
    };

    // Wait for backend to be ready with retries (20 seconds total)
    const waitForBackend = async (maxRetries = 20, delayMs = 1000) => {
        for (let i = 0; i < maxRetries; i++) {
            try {
                console.log(`[HexAgentGUI] Checking backend (attempt ${i + 1}/${maxRetries})...`);
                const response = await fetch('http://localhost:5000/health');
                if (response.ok) {
                    console.log("[HexAgentGUI] Backend is ready!");
                    return true;
                }
            } catch (e) {
                // Backend not ready yet, wait and retry
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        console.error("[HexAgent GUI] Backend failed to start after retries");
        return false;
    };

    // Init Backend - MUST complete before user can chat
    const initBackend = async () => {
         console.log("[HexAgentGUI] Initializing backend...");
         try {
             const response = await fetch('http://localhost:5000/init', { method: 'POST' });
             if (!response.ok) {
                 throw new Error(`HTTP ${response.status}: ${response.statusText}`);
             }
             const data = await response.json();
             console.log("[HexAgentGUI] Init response:", data);
             if (!data.success) {
                 console.error("[HexAgentGUI] Init failed:", data.error || data.message);
             } else {
                 console.log("[HexAgentGUI] Brain initialized successfully!");
             }
             return data.success;
         } catch(e) { 
             console.error("[HexAgentGUI] Init exception:", e); 
             return false;
         }
    };

    // Use IIFE to properly await async operations
    (async () => {
        // Wait for backend to be ready first
        const backendReady = await waitForBackend();
        if (!backendReady) {
            console.error("[HexAgentGUI] Cannot initialize - backend not available");
            return;
        }
        try {
            const success = await initBackend();
            if (success) {
                console.log("[HexAgentGUI] Starting status polling...");
            }
            checkStatus();
            intervalId = setInterval(checkStatus, 5000);
        } catch (error) {
            console.error("[HexAgentGUI] Initialization error:", error);
        }
    })();

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [blocks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userBlock = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setBlocks(prev => [...prev, userBlock]);
    const cmd = input;
    setInput('');
    setLoading(true);

    try {
        // Chat with language support and optional web search
        const response = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: cmd, 
                language: 'pt',
                web_search: webSearchEnabled 
            })
        });

        if (!response.body) throw new Error('No body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let agentText = '';
        
        // Create agent block placeholder
        setBlocks(prev => [...prev, {
            id: Date.now() + 1,
            type: 'agent',
            content: '',
            timestamp: new Date().toLocaleTimeString()
        }]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.chunk) {
                        agentText += json.chunk;
                        // Update last block
                        setBlocks(prev => {
                            const newBlocks = [...prev];
                            newBlocks[newBlocks.length - 1].content = agentText;
                            return newBlocks;
                        });
                    }
                } catch (e) {}
            }
        }
    } catch (e) {
        setBlocks(prev => [...prev, {
            id: Date.now(),
            type: 'agent',
            content: `Error: ${e.message}`,
            timestamp: new Date().toLocaleTimeString()
        }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="h-10 bg-[#0a0a0a] border-b border-[#333] flex items-center justify-between px-4 pr-24 select-none drag-region">
          <div className="flex items-center gap-2">
              <Shield size={16} className="text-[#00ff00]" />
              <span className="font-bold text-sm tracking-wider">HEXAGENT GUI</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
              <button 
                  onClick={toggleService}
                  disabled={toggleLoading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded transition-all border ${
                      status === 'ONLINE' 
                      ? 'border-[#00ff00]/30 bg-[#00ff00]/10 text-[#00ff00] hover:bg-[#00ff00]/20' 
                      : 'border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  }`}
              >
                  <Power size={12} />
                  <span>{toggleLoading ? '...' : (status === 'ONLINE' ? 'ON' : 'OFF')}</span>
              </button>
              <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-[#00ff00] animate-pulse' : 'bg-red-500'}`}></div>
                  <span className={status === 'ONLINE' ? 'text-[#00ff00]' : 'text-red-500'}>{status}</span>
              </div>
          </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                  <Shield size={64} className="mb-4" />
                  <p>System Ready. Waiting for input.</p>
              </div>
          )}
          {blocks.map(block => (
              <Block key={block.id} {...block} />
          ))}
          <div ref={bottomRef} />
      </main>

      {/* Input Area (Sticky Bottom) */}
      <div className="p-4 bg-[#0a0a0a] border-t border-[#333]">
          <form onSubmit={handleSubmit} className="relative">
              <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask HexAgent or execute command... (Enter to send, Shift+Enter for new line)"
                  className="w-full bg-[#111] border border-[#333] rounded-md py-3 px-4 pl-10 pr-20 focus:outline-none focus:border-[#00ff00] transition-colors font-mono text-sm resize-none"
                  rows={2}
                  autoFocus
              />
              <Terminal size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <div className="absolute right-2 top-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`p-1.5 rounded transition-colors ${
                      webSearchEnabled 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 hover:bg-gray-500/20'
                    }`}
                    title={webSearchEnabled ? 'Web search enabled' : 'Web search disabled'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="p-1.5 bg-[#00ff00]/10 text-[#00ff00] rounded hover:bg-[#00ff00]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      <Send size={16} />
                  </button>
              </div>
          </form>
          <div className="mt-2 flex justify-between text-[10px] text-gray-600">
              <span>HexSecGPT Connected {webSearchEnabled && '• Web Search ON'}</span>
              <span>v1.0.0 Alpha</span>
          </div>
      </div>
    </div>
  );
};

export default App;
