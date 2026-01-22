import { useEffect, useRef, useState } from 'react';
import APIClient from '../utils/APIClient';
import Logger from '../utils/Logger';

/**
 * useBackendInit Hook
 * Hook de Inicialização do Backend
 * 
 * Manages the complex process of initializing the HexAgentGUI backend services:
 * 1. Flask Server Check
 * 2. Connect AI Brain
 * 3. Load Configuration
 * 4. Check HexStrike Status
 * 
 * Gerencia o processo complexo de inicialização dos serviços backend HexAgentGUI:
 * 1. Verificação do Servidor Flask
 * 2. Conectar Cérebro IA
 * 3. Carregar Configuração
 * 4. Verificar Status do HexStrike
 * 
 * @module useBackendInit
 * @author Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
 * @version 1.0.0
 */
const useBackendInit = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [initError, setInitError] = useState(null);
  const [initStatus, setInitStatus] = useState({
    backend: { status: 'pending', message: 'Starting...' },
    brain: { status: 'pending', message: 'Starting...' },
    hexstrike: { status: 'pending', message: 'Starting...' },
    config: { status: 'pending', message: 'Starting...' }
  });

  const [status, setStatus] = useState('OFFLINE');
  const [serviceStatus, setServiceStatus] = useState({ flask: false, hexstrike: false, brain: false });

  const statusIntervalRef = useRef(null);
  const isMounted = useRef(true);
  const api = APIClient.getInstance();
  const logger = Logger.getInstance();

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    // Check Status and update service status details
    // Verificar status e detalhes dos serviços
    // Check Status and update service status details
    // Verificar status e detalhes dos serviços
    const checkStatus = async () => {
      try {
        const response = await api.get('/status');
        if (!isMounted.current) return;

        // Parse response - Handle wrapped 'data' from BaseController or direct
        const data = response.data || response;
        
        // Determine backend health
        // Check both new nested format and potential flat legacy format
        const isBackendRunning = 
            data.backend?.status === 'running' || 
            response.status === 'healthy' ||
            data.status === 'ok';

        if (isBackendRunning) {
          setStatus('ONLINE');
          setServiceStatus({
            flask: true,
            hexstrike: data.hexstrike?.running || data.hexstrike_alive || false,
            brain: data.brain?.initialized || data.alive || data.brain_initialized || false
          });
        } else {
          setStatus('OFFLINE');
          setServiceStatus({ flask: false, hexstrike: false, brain: false });
        }
      } catch (e) {
        if (!isMounted.current) return;
        setStatus('DISCONNECTED');
        setServiceStatus({ flask: false, hexstrike: false, brain: false });
      }
    };

    // Wait for backend to be ready with retries (60 seconds total)
    const waitForBackend = async (maxRetries = 60, delayMs = 1000) => {
      for (let i = 0; i < maxRetries; i++) {
        if (!isMounted.current) return false;
        try {
          logger.debug('Checking backend', { attempt: i + 1, max: maxRetries });
          const isHealthy = await api.healthCheck();
          if (isHealthy) {
            logger.info('Backend is ready!');
            return true;
          }
        } catch (e) {
          // Backend not ready yet, wait and retry
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      logger.error('Backend failed to start after retries');
      return false;
    };

    // Init Backend - MUST complete before user can chat
    const initBackend = async (retries = 3, delay = 15000) => {
      if (!isMounted.current) return false;
      logger.info('Initializing backend');
      for (let i = 0; i < retries; i++) {
        if (!isMounted.current) return false;
        try {
          if (i > 0) {
            // Update UI to show retry
            logger.debug('Retrying Brain init', { attempt: i + 1, retries });
            if (isMounted.current) {
                setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: `Loading (${i + 1}/${retries})...` } }));
            }
            await new Promise(r => setTimeout(r, delay));
          }

          const data = await api.post('/init');
          logger.debug('Init response', { data });

          if (data.success) {
            logger.info('Brain initialized successfully!');
            return true;
          }
          logger.error('Init failed', { error: data.error || data.message });
        } catch (e) {
          logger.error('Init exception', { attempt: i + 1, error: e });
        }
      }
      return false;
    };

    const initialize = async () => {
      try {
        if (!isMounted.current) return;
        
        // Step 1: Backend Connection (Required Foundation)
        // Passo 1: Conexão Backend (Fundação Necessária)
        setInitStatus(prev => ({ ...prev, backend: { status: 'loading', message: 'Starting Server...' } }));
        setInitProgress(10);

        const backendReady = await waitForBackend();
        if (!isMounted.current) return;
        if (!backendReady) {
          throw new Error('Backend failed to start');
        }
        setInitStatus(prev => ({ ...prev, backend: { status: 'success', message: 'Connected' } }));
        setInitProgress(30);

        // Step 2: Load Configuration (Priority over Brain)
        // Passo 2: Carregar Configuração (Prioridade sobre Cérebro)
        setInitStatus(prev => ({ ...prev, config: { status: 'loading', message: 'Loading Config...' } }));
        setInitProgress(50);
        
        let hasApiKey = false;
        try {
            // Fetch AI config to check for API Key presence
            // Buscar config de IA para verificar presença da API Key
            const aiConfigRes = await api.get('/config/ai');
            const aiConfig = aiConfigRes.data.config || aiConfigRes.data;
            hasApiKey = !!(aiConfig?.ai?.api_key || aiConfig?.api_key);
            
            setInitStatus(prev => ({ 
                ...prev, 
                config: { status: 'success', message: hasApiKey ? 'Loaded' : 'No API Key' } 
            }));
        } catch (e) {
            logger.warn('Config load warning', e);
            setInitStatus(prev => ({ 
                ...prev, 
                config: { status: 'warning', message: 'Default' } 
            }));
        }
        setInitProgress(70);

        // Step 3: Brain Initialization
        // Passo 3: Inicialização do Cérebro
        setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: 'Initializing Core...' } }));
        setInitProgress(80);

        const initResult = await initBackend();
        if (!isMounted.current) return;
        
        if (!initResult) {
          if (!hasApiKey) {
             // Expected failure if no key / Falha esperada se sem chave
             setInitStatus(prev => ({ ...prev, brain: { status: 'warning', message: 'Waiting Key' } })); 
          } else {
             logger.warn('Brain initialization failed - continuing in standalone mode');
             setInitStatus(prev => ({ ...prev, brain: { status: 'warning', message: 'Standalone Mode' } }));
          }
        } else {
          setInitStatus(prev => ({ ...prev, brain: { status: 'success', message: 'Online' } }));
        }
        setInitProgress(90);

        // Step 4: HexStrike Auto-Start
        // Passo 4: Inicialização Automática do HexStrike
        setInitStatus(prev => ({ ...prev, hexstrike: { status: 'loading', message: 'Auto-starting Service...' } }));
        setInitProgress(90);

        const startHexStrike = async (maxRetries = 3) => {
            for (let i = 0; i < maxRetries; i++) {
                if (!isMounted.current) return false;
                try {
                    logger.debug(`HexStrike Auto-Start Attempt ${i + 1}/${maxRetries}`);
                    
                    // Check if already running first
                    // Verifica se já está rodando primeiro
                    const statusCheck = await api.get('/status/services');
                    if (statusCheck.data?.hexstrike === 'running') {
                        logger.info('HexStrike already running');
                        return true;
                    }

                    // Attempt start
                    // Tenta iniciar
                    const res = await api.post('/start_service', { service: 'hexstrike' });
                    if (res.success) {
                        logger.info('HexStrike start command sent successfully');
                        // Wait briefly to confirm status
                        await new Promise(r => setTimeout(r, 2000));
                        return true;
                    }
                } catch (e) {
                    logger.warn(`HexStrike auto-start attempt ${i + 1} failed`, e);
                }
                
                // Wait before retry if not last attempt
                if (i < maxRetries - 1) {
                    setInitStatus(prev => ({ 
                        ...prev, 
                        hexstrike: { status: 'loading', message: `Retry Start (${i + 1}/${maxRetries})...` } 
                    }));
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
            return false;
        };

        await startHexStrike(3);

        // Final Status Check
        await checkStatus();
        if (!isMounted.current) return;
        
        // Even if HexStrike failed to start, we proceed to load the app
        // Mesmo se HexStrike falhar ao iniciar, prosseguimos com o carregamento do app
        setInitStatus(prev => ({ ...prev, hexstrike: { status: 'pending', message: 'Ready' } }));
        setInitProgress(100);

        // Success - hide loading screen and start status polling
        setTimeout(() => {
            if (isMounted.current) setIsInitializing(false);
        }, 800);
        
        if (isMounted.current) {
            statusIntervalRef.current = setInterval(checkStatus, 5000);
        }

      } catch (error) {
        logger.error('Init error', { error });
        if (isMounted.current) {
            setInitError({ message: error.message });
        }
      }
    };

    initialize();

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    };
  }, []);

  return {
    isInitializing,
    setIsInitializing,
    initProgress,
    initError,
    initStatus,
    status,
    serviceStatus
  };
};

export default useBackendInit;
