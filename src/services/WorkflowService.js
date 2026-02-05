/**
 * WorkflowService - AI Workflow Management Service
 * Serviço de Gerenciamento de Workflows de IA
 * 
 * Handles AI workflow operations including list, execute, create, update, and delete.
 * Gerencia operações de workflow de IA incluindo listar, executar, criar, atualizar e deletar.
 * 
 * @pattern Singleton + Strategy
 * @dependencies APIClient
 * @author Antigravity AI
 * @version 1.0.0
 */

import APIClient from '../utils/APIClient';

class WorkflowService {
  /**
   * Singleton instance / Instância Singleton
   * @private
   * @static
   */
  static _instance = null;

  /**
   * API Client instance / Instância do Cliente API
   * @private
   */
  _api;

  /**
   * Cached workflows / Workflows em cache
   * @private
   */
  _cachedWorkflows = null;

  /**
   * Private constructor (Singleton pattern)
   * Construtor privado (padrão Singleton)
   * @private
   */
  constructor() {
    if (WorkflowService._instance) {
      throw new Error(
        'WorkflowService is a singleton. Use WorkflowService.getInstance() instead. / ' +
        'WorkflowService é um singleton. Use WorkflowService.getInstance() ao invés disso.'
      );
    }
    this._api = APIClient.getInstance();
  }

  /**
   * Get singleton instance / Obter instância singleton
   * @static
   * @returns {WorkflowService} WorkflowService instance / Instância do WorkflowService
   */
  static getInstance() {
    if (!WorkflowService._instance) {
      WorkflowService._instance = new WorkflowService();
    }
    return WorkflowService._instance;
  }

  /**
   * List all available workflows / Listar todos os workflows disponíveis
   * @param {boolean} [useCache=true] - Use cached workflows / Usar workflows em cache
   * @returns {Promise<Array<Object>>} Array of workflows / Array de workflows
   */
  async listWorkflows(useCache = true) {
    if (useCache && this._cachedWorkflows) {
      console.log('[WorkflowService] Returning cached workflows');
      return this._cachedWorkflows;
    }

    try {
      console.log('[WorkflowService] Listing workflows');
      
      const data = await this._api.get('/workflows');

      if (data && Array.isArray(data.workflows)) {
        this._cachedWorkflows = data.workflows;
        console.log(`[WorkflowService] Found ${data.workflows.length} workflows`);
        return data.workflows;
      }

      return [];
    } catch (error) {
      console.error('[WorkflowService] Failed to list workflows:', error);
      return [];
    }
  }

  /**
   * Execute a workflow / Executar um workflow
   * @param {string} name - Workflow name / Nome do workflow
   * @param {Object} [params={}] - Workflow parameters / Parâmetros do workflow
   * @returns {Promise<Object>} Execution result / Resultado da execução
   * @throws {Error} If execution fails / Se a execução falhar
   */
  async executeWorkflow(name, params = {}) {
    if (!name || typeof name !== 'string') {
      throw new Error('Workflow name is required / Nome do workflow é obrigatório');
    }

    try {
      console.log(`[WorkflowService] Executing workflow: ${name}`);
      
      const data = await this._api.post('/workflow/execute', {
        name,
        params
      });

      console.log(`[WorkflowService] Workflow "${name}" executed successfully`);
      
      return {
        success: true,
        name,
        result: data.result || data,
        output: data.output || null
      };
    } catch (error) {
      console.error(`[WorkflowService] Failed to execute workflow "${name}":`, error);
      throw new Error(`Failed to execute workflow: ${error.message}`);
    }
  }

  /**
   * Create a new workflow / Criar um novo workflow
   * @param {Object} definition - Workflow definition / Definição do workflow
   * @returns {Promise<Object>} Created workflow / Workflow criado
   * @throws {Error} If creation fails / Se a criação falhar
   */
  async createWorkflow(definition) {
    if (!definition || typeof definition !== 'object') {
      throw new Error('Workflow definition is required / Definição do workflow é obrigatória');
    }

    if (!definition.name) {
      throw new Error('Workflow name is required / Nome do workflow é obrigatório');
    }

    try {
      console.log(`[WorkflowService] Creating workflow: ${definition.name}`);
      
      const data = await this._api.post('/workflow', definition);

      // Invalidate cache / Invalidar cache
      this._cachedWorkflows = null;

      console.log(`[WorkflowService] Workflow "${definition.name}" created successfully`);
      
      return {
        success: true,
        workflow: data.workflow || data
      };
    } catch (error) {
      console.error(`[WorkflowService] Failed to create workflow:`, error);
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  /**
   * Update an existing workflow / Atualizar um workflow existente
   * @param {string} name - Workflow name / Nome do workflow
   * @param {Object} definition - Updated workflow definition / Definição atualizada do workflow
   * @returns {Promise<Object>} Updated workflow / Workflow atualizado
   * @throws {Error} If update fails / Se a atualização falhar
   */
  async updateWorkflow(name, definition) {
    if (!name || typeof name !== 'string') {
      throw new Error('Workflow name is required / Nome do workflow é obrigatório');
    }

    if (!definition || typeof definition !== 'object') {
      throw new Error('Workflow definition is required / Definição do workflow é obrigatória');
    }

    try {
      console.log(`[WorkflowService] Updating workflow: ${name}`);
      
      const data = await this._api.put(`/workflow/${encodeURIComponent(name)}`, definition);

      // Invalidate cache / Invalidar cache
      this._cachedWorkflows = null;

      console.log(`[WorkflowService] Workflow "${name}" updated successfully`);
      
      return {
        success: true,
        workflow: data.workflow || data
      };
    } catch (error) {
      console.error(`[WorkflowService] Failed to update workflow "${name}":`, error);
      throw new Error(`Failed to update workflow: ${error.message}`);
    }
  }

  /**
   * Delete a workflow / Deletar um workflow
   * @param {string} name - Workflow name / Nome do workflow
   * @returns {Promise<Object>} Deletion result / Resultado da deleção
   * @throws {Error} If deletion fails / Se a deleção falhar
   */
  async deleteWorkflow(name) {
    if (!name || typeof name !== 'string') {
      throw new Error('Workflow name is required / Nome do workflow é obrigatório');
    }

    try {
      console.log(`[WorkflowService] Deleting workflow: ${name}`);
      
      await this._api.delete(`/workflow/${encodeURIComponent(name)}`);

      // Invalidate cache / Invalidar cache
      this._cachedWorkflows = null;

      console.log(`[WorkflowService] Workflow "${name}" deleted successfully`);
      
      return {
        success: true,
        name
      };
    } catch (error) {
      console.error(`[WorkflowService] Failed to delete workflow "${name}":`, error);
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  /**
   * Clear workflow cache / Limpar cache de workflows
   * @returns {void}
   */
  clearCache() {
    this._cachedWorkflows = null;
    console.log('[WorkflowService] Cache cleared');
  }

  /**
   * Get workflow by name / Obter workflow por nome
   * @param {string} name - Workflow name / Nome do workflow
   * @returns {Promise<Object|null>} Workflow or null / Workflow ou null
   */
  async getWorkflow(name) {
    if (!name || typeof name !== 'string') {
      return null;
    }

    const workflows = await this.listWorkflows();
    return workflows.find(w => w.name === name) || null;
  }
}

// Export singleton instance / Exportar instância singleton
export default WorkflowService;
