/**
 * Command Proposal Component
 * Componente de Proposta de Comando
 * 
 * Displays AI-proposed commands with approve/reject buttons and metadata.
 * Exibe comandos propostos pela IA com botões aprovar/rejeitar e metadados.
 * 
 * @author Roberto Dantas de Castro <${email}@gmail.com>
 * @version 1.0.0
 */

import './CommandProposal.css';

/**
 * CommandProposal Component
 * 
 * Props:
 * - command: string - The command to execute / O comando a executar
 * - metadata: object - Command metadata (iteration, auto_execute, etc.)
 * - onApprove: function - Called when user approves command
 * - onReject: function - Called when user rejects command
 */
export const CommandProposal = ({ command, metadata = {}, onApprove, onReject }) => {
  const {
    iteration = 0,
    total_commands = 1,
    command_index = 1,
    max_iterations = 10,
    auto_execute = false,
    hexstrike_available = false
  } = metadata;

  return (
    <div className="command-proposal-container">
      <div className="command-proposal">
        {/* Header / Cabeçalho */}
        <div className="command-header">
          <div className="command-title">
            <span className="command-icon">💻</span>
            <span className="command-label">
              Proposed Command / Comando Proposto
            </span>
          </div>
          <div className="command-badge">
            #{command_index}/{total_commands}
          </div>
        </div>

        {/* Command Code Block / Bloco de Código do Comando */}
        <pre className="command-code">
          <code>{command}</code>
        </pre>

        {/* Metadata / Metadados */}
        <div className="command-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Iteration:</span>
            <span className="metadata-value">
              {iteration}/{max_iterations}
            </span>
          </div>
          
          <div className="metadata-item">
            <span className="metadata-label">HexStrike:</span>
            <span className={`metadata-value status-${hexstrike_available ? 'ok' : 'warn'}`}>
              {hexstrike_available ? '✓ Available' : '⚠ Unavailable'}
            </span>
          </div>
        </div>

        {/* Actions or Auto-Execute Info / Ações ou Info de Auto-Execução */}
        {auto_execute ? (
          <div className="command-auto-execute">
            <div className="auto-execute-spinner"></div>
            <span>⚡ Auto-executing... / Executando automaticamente...</span>
          </div>
        ) : (
          <div className="command-actions">
            <button 
              onClick={onApprove} 
              className="btn-approve"
              disabled={!hexstrike_available}
              title={hexstrike_available ? 'Execute command' : 'HexStrike not available'}
            >
              <span className="btn-icon">✓</span>
              <span className="btn-text">Execute / Executar</span>
            </button>
            
            <button 
              onClick={onReject} 
              className="btn-reject"
              title="Skip this command"
            >
              <span className="btn-icon">✗</span>
              <span className="btn-text">Skip / Pular</span>
            </button>
          </div>
        )}

        {/* Warning if HexStrike unavailable / Aviso se HexStrike indisponível */}
        {!hexstrike_available && !auto_execute && (
          <div className="command-warning">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              HexStrike is not available. Commands cannot be executed. / 
              HexStrike não está disponível. Comandos não podem ser executados.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandProposal;
