import BaseService from './BaseService';

class HexStrikeService extends BaseService {
  constructor() {
    super('/hexstrike');
  }

  /**
   * Obtém a lista de ferramentas disponíveis
   * @returns {Promise<Array>} Lista de ferramentas
   */
  async listTools() {
    return this.get('/tools');
  }

  /**
   * Executa uma ferramenta específica
   * @param {string} toolName - Nome da ferramenta (ex: 'nmap')
   * @param {Object} parameters - Parâmetros da ferramenta
   * @returns {Promise<Object>} Resultado da execução
   */
  async executeTool(toolName, parameters) {
    return this.post(`/tools/${toolName}/run`, parameters);
  }

  /**
   * Obtém o schema de parâmetros de uma ferramenta
   * @param {string} toolName - Nome da ferramenta
   * @returns {Promise<Object>} Schema da ferramenta
   */
  async getToolSchema(toolName) {
    return this.get(`/tools/${toolName}/schema`);
  }

  /**
   * Executa um workflow de Bug Bounty
   * @param {string} workflowId - ID do workflow
   * @param {Object} data - Payload do alvo
   * @returns {Promise<Object>} Resultado do workflow
   */
  async runBugBounty(workflowId, data) {
    return this.post(`/bugbounty/${workflowId}`, data);
  }

  /**
   * Inicia o Serviço HexStrike
   * @returns {Promise<Object>}
   */
  async startService() {
    return this.post('/start');
  }

  /**
   * Para o Serviço HexStrike
   * @returns {Promise<Object>}
   */
  async stopService() {
    return this.post('/stop');
  }

  /**
   * Retorna o status atual do daemon HexStrike
   * @returns {Promise<Object>}
   */
  async getStatus() {
    return this.get('/status');
  }

  /**
   * Executa um workflow de CTF
   * @param {string} workflowType - Tipo de workflow CTF
   * @param {Object} data - Payload
   * @returns {Promise<Object>} Resultado da execução
   */
  async runCtfWorkflow(workflowType, data) {
    return this.post(`/ctf/${workflowType}`, data);
  }

  /**
   * Lista os processos em background do HexStrike
   * @returns {Promise<Object>} Processos
   */
  async listProcesses() {
    return this.get('/processes');
  }

  /**
   * Termina um processo específico do HexStrike
   * @param {number|string} pid - ID do processo
   * @returns {Promise<Object>} Resultado
   */
  async terminateProcess(pid) {
    return this.post(`/processes/${pid}/terminate`);
  }

  /**
   * Pausa um processo específico
   * @param {number|string} pid - ID do processo
   * @returns {Promise<Object>} Resultado
   */
  async pauseProcess(pid) {
    return this.post(`/processes/${pid}/pause`);
  }

  /**
   * Retoma um processo específico
   * @param {number|string} pid - ID do processo
   * @returns {Promise<Object>} Resultado
   */
  async resumeProcess(pid) {
    return this.post(`/processes/${pid}/resume`);
  }
}

export default new HexStrikeService();
