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
  const api = APIClient.getInstance();
  const logger = Logger.getInstance();

  useEffect(() => {
    // Check Status and update service status details
    // Verificar status e detalhes dos serviços
    const checkStatus = async () => {
      try {
        const data = await api.get('/status');
        if (data.status === 'ok' || data.alive) {
          setStatus('ONLINE');
          setServiceStatus({
            flask: true,
            hexstrike: data.hexstrike_alive || false,
            brain: data.alive || data.brain_initialized || false
          });
        } else {
          setStatus('OFFLINE');
          setServiceStatus({ flask: false, hexstrike: false, brain: false });
        }
      } catch (e) {
        setStatus('DISCONNECTED');
        setServiceStatus({ flask: false, hexstrike: false, brain: false });
      }
    };

    // Wait for backend to be ready with retries (60 seconds total)
    const waitForBackend = async (maxRetries = 60, delayMs = 1000) => {
      for (let i = 0; i < maxRetries; i++) {
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
      logger.info('Initializing backend');
      for (let i = 0; i < retries; i++) {
        try {
          if (i > 0) {
            // Update UI to show retry
            logger.debug('Retrying Brain init', { attempt: i + 1, retries });
            setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: `Loading (${i + 1}/${retries})...` } }));
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
        // Step 1: Backend
        setInitStatus(prev => ({ ...prev, backend: { status: 'loading', message: 'Starting Flask...' } }));
        setInitProgress(10);

        const backendReady = await waitForBackend();
        if (!backendReady) {
          throw new Error('Backend failed to start');
        }
        setInitStatus(prev => ({ ...prev, backend: { status: 'success', message: 'Running' } }));
        setInitProgress(25);

        // Step 2: Brain (optional in standalone mode)
        setInitStatus(prev => ({ ...prev, brain: { status: 'loading', message: 'Loading Brain...' } }));
        setInitProgress(40);

        const initResult = await initBackend();
        if (!initResult) {
          logger.warn('Brain initialization failed - continuing in standalone mode');
          setInitStatus(prev => ({ ...prev, brain: { status: 'warning', message: 'Standalone Mode' } }));
        } else {
          setInitStatus(prev => ({ ...prev, brain: { status: 'success', message: 'Loaded' } }));
        }
        setInitProgress(60);

        // Step 3: Config
        setInitStatus(prev => ({ ...prev, config: { status: 'loading', message: 'Loading...' } }));
        setInitProgress(75);
        // Note: Config is handled by its own hook in App.jsx, here we just show progress
        setInitStatus(prev => ({ ...prev, config: { status: 'success', message: 'Loaded' } }));
        setInitProgress(85);

        // Step 4: HexStrike
        setInitStatus(prev => ({ ...prev, hexstrike: { status: 'loading', message: 'Checking...' } }));
        setInitProgress(90);

        await checkStatus();
        setInitStatus(prev => ({ ...prev, hexstrike: { status: 'pending', message: 'Offline' } }));
        setInitProgress(100);

        // Success - hide loading screen and start status polling
        setTimeout(() => setIsInitializing(false), 500);
        statusIntervalRef.current = setInterval(checkStatus, 5000);

      } catch (error) {
        logger.error('Init error', { error });
        setInitError({ message: error.message });
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
