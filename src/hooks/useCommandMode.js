/**
 * useCommandMode - Custom Hook for Command Mode State Management
 * Hook Customizado para Gerenciamento de Estado do Modo Comando
 * 
 * Provides a terminal-like experience where user input is executed as commands.
 * Supports AI-assisted command generation via special syntax (e.g., '? list files').
 * 
 * @author Antigravity AI
 */

import { useCallback, useEffect, useState } from 'react';
import ChatService from '../services/ChatService';
import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';

const useCommandMode = (aiConfig) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState('command'); // Always 'command' in this mode
  const [cwd, setCwd] = useState('~/'); // Track current working directory
  
  // Services
  const chatService = ChatService.getInstance();
  const logger = Logger.getInstance();
  const api = APIClient.getInstance();

  // Add initial welcome message
  useEffect(() => {
    setHistory([{
        id: 'init',
        type: 'system',
        content: 'HexAgent Terminal v2.0\nType commands to execute or start with "?" for AI assistance.\n',
        timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  /**
   * Execute a command or ask AI
   */
  const executeCommand = useCallback(async (input) => {
    if (!input.trim() || isLoading) return;

    setLoading(true);
    const timestamp = new Date().toLocaleTimeString();

    // 1. Add User Input to History
    setHistory(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp
    }]);

    // 2. Check for AI assistance prefix (?)
    if (input.startsWith('?') || input.startsWith('/')) {
        // AI Assistance Logic
        const prompt = input.substring(1).trim();
        try {
            // We reuse ChatService but with specific Command Mode context
            // Ideally, backend should have a 'command_mode' endpoint, but 'chat' works for now
            // if we instruct it properly.
            
            // For Phase 3, we might want a specific backend strategy, but let's reuse chat for MVP
            const context = [{
                role: 'system',
                content: `You are in Command Mode. The user is asking for a shell command to: "${prompt}".
                Return ONLY the command(s) to execute, wrapped in markdown code blocks. 
                Do not provide conversational filler unless explanations are critical.
                Target OS: Linux. Current CWD: ${cwd}`
            }];

            await chatService.sendMessage(prompt, context, {
                autoExecute: false, // In cmd mode, we might want to confirm first
                maxIterations: 1,
                stream: true
            });

        } catch (error) {
            logger.error('AI Command Gen Failed', error);
            setHistory(prev => [...prev, {
                id: Date.now() + 1,
                type: 'error',
                content: `AI generation failed: ${error.message}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
            setLoading(false);
        }
    } else {
        // 3. Direct Execution
        try {
            const res = await api.post('/execute', { command: input });
            
            setHistory(prev => [...prev, {
                id: Date.now() + 1,
                type: 'output',
                content: res.output,
                result: {
                    success: res.success,
                    exit_code: res.exit_code
                },
                timestamp: new Date().toLocaleTimeString()
            }]);
        } catch (e) {
             setHistory(prev => [...prev, {
                id: Date.now() + 1,
                type: 'error',
                content: `Execution failed: ${e.message}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        } finally {
            setLoading(false);
        }
    }

  }, [isLoading, api, chatService, logger, cwd]);

  /**
   * Stop generation
   */
  const stopExecution = useCallback(() => {
    chatService.abortCurrentRequest();
    setLoading(false);
    setHistory(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: '^C (Interrupted)',
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, [chatService]);

  // ========================================================================
  // ChatService Subscriptions (For AI Assistance)
  // ========================================================================
  
  useEffect(() => {
    const unsubMessage = chatService.onMessage((chunk) => {
        const { type, content } = chunk;
        if (type === 'text' || type === 'command_proposal') {
             setHistory(prev => {
                const last = prev[prev.length - 1];
                if (last && last.type === 'ai_response' && !last.completed) {
                    return prev.map((item, idx) => idx === prev.length - 1 ? {...item, content: item.content + content} : item);
                } else {
                    return [...prev, {
                        id: Date.now(),
                        type: 'ai_response',
                        content: content,
                        timestamp: new Date().toLocaleTimeString(),
                        completed: false
                    }];
                }
             });
        }
    });

    const unsubComplete = chatService.onComplete(() => {
        setLoading(false);
        setHistory(prev => {
            const last = prev[prev.length - 1];
            if (last && last.type === 'ai_response') {
                return prev.map((item, idx) => idx === prev.length - 1 ? {...item, completed: true} : item);
            }
            return prev;
        });
    });

    return () => { unsubMessage(); unsubComplete(); };
  }, [chatService]);

  return {
    history,
    isLoading,
    executeCommand,
    stopExecution,
    cwd
  };
};

export default useCommandMode;
