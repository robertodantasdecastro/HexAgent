import React from 'react';
import { Shield, CheckCircle, Loader, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Loading Screen Component / Componente de Tela de Carregamento
 * 
 * Shows initialization progress for all services
 * Mostra progresso de inicialização de todos os serviços
 * 
 * Author: Roberto Dantas de Castro
 * Email: robertodantasdecastro@gmail.com
 */

const LoadingScreen = ({ initStatus, progress, error, onRetry, onContinue }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-[#00ff00]" />;
      case 'loading':
        return <Loader size={16} className="text-blue-400 animate-spin" />;
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-[#00ff00]';
      case 'loading': return 'text-blue-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505]">
      <div className="w-96 bg-[#0a0a0a] border border-[#333] rounded-lg p-8 shadow-2xl">
        {/* Header / Cabeçalho */}
        <div className="flex flex-col items-center mb-6">
          <img src="logo.png" className="w-16 h-16 object-contain mb-4" alt="HexAgent Logo" />
          <h1 className="text-2xl font-bold text-white tracking-wider">HEXAGENT GUI</h1>
          <p className="text-sm text-gray-400 mt-1">
            {error ? 'Initialization Error' : 'Initializing Services...'}
          </p>
          <p className="text-xs text-gray-500">
            {error ? 'Erro de Inicialização' : 'Inicializando Serviços...'}
          </p>
        </div>

        {/* Progress Bar / Barra de Progresso */}
        {!error && (
          <div className="mb-6">
            <div className="w-full bg-[#111] rounded-full h-2 overflow-hidden border border-[#333]">
              <div
                className="h-full bg-gradient-to-r from-[#00ff00] to-cyan-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">{progress}%</p>
          </div>
        )}

        {/* Service Status List / Lista de Status dos Serviços */}
        <div className="space-y-3 mb-6">
          {Object.entries(initStatus).map(([service, data]) => (
            <div key={service} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(data.status)}
                <span className={`text-sm font-mono ${getStatusColor(data.status)}`}>
                  {service === 'backend' && 'Backend Flask (5000)'}
                  {service === 'brain' && 'Brain HexSecGPT'}
                  {service === 'hexstrike' && 'HexStrike Engine (8888)'}
                  {service === 'config' && 'Configuration'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Error Details / Detalhes do Erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-semibold mb-2">Error Details:</p>
                <p className="text-xs text-gray-300 font-mono mb-3">{error.message}</p>
                
                <div className="text-xs text-gray-400">
                  <p className="font-semibold mb-1">📖 Support / Suporte:</p>
                  <p className="mb-1">
                    Wiki: <a 
                      href="https://github.com/robertodantasdecastro/HexAgent/wiki" 
                      className="text-blue-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/robertodantasdecastro/HexAgent/wiki
                    </a>
                  </p>
                  <p>
                    Email: <a 
                      href="mailto:robertodantasdecastro@gmail.com"
                      className="text-blue-400 hover:underline"
                    >
                      robertodantasdecastro@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons / Botões de Ação */}
        {error && (
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/30 rounded py-3 px-4 hover:bg-[#00ff00]/20 transition text-sm font-semibold"
            >
              Retry / Tentar Novamente
            </button>
            <button
              onClick={onContinue}
              className="w-full bg-gray-500/10 text-gray-400 border border-gray-500/30 rounded py-3 px-4 hover:bg-gray-500/20 transition text-sm font-semibold"
            >
              Continue Anyway / Continuar Mesmo Assim
            </button>
          </div>
        )}

        {/* Loading Message / Mensagem de Carregamento */}
        {!error && progress < 100 && (
          <p className="text-center text-xs text-gray-500 mt-4 font-mono">
            Please wait... / Aguarde...
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
