"""
Workflow Controller - Handles workflow API endpoints
Controlador de Fluxo de Trabalho - Gerencia endpoints de API de fluxo de trabalho

Exposes endpoints for starting and monitoring workflows.
Expõe endpoints para iniciar e monitorar fluxos de trabalho.
"""

from core.base_controller import BaseController
from services.workflow_service import WorkflowService

class WorkflowController(BaseController):
    """
    Controller for workflow operations
    Controlador para operações de fluxo de trabalho
    """
    
    def __init__(self, core_ref=None):
        self.service = WorkflowService(agent_core=core_ref)
        super().__init__(
            name='workflow',
            import_name=__name__,
            url_prefix='/api/workflow'
        )
    
    def _register_routes(self):
        """Register workflow routes / Registra rotas de fluxo de trabalho"""
        
        @self.blueprint.route('/start', methods=['POST'])
        def start_workflow():
            """
            Start a new workflow
            Iniciar um novo fluxo de trabalho
            """
            try:
                self.log_request('POST /api/workflow/start')
                data = self.validate_request(['workflow_type', 'target'])
                
                result = self.service.execute_workflow(
                    workflow_type=data['workflow_type'],
                    target=data['target']
                )
                
                return self.success_response(
                    data=result,
                    message=result.get('message', 'Workflow started')
                )
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /api/workflow/start', e)
                return self.error_response("Failed to start workflow", 500)
                
        @self.blueprint.route('/status/<execution_id>', methods=['GET'])
        def get_status(execution_id):
            """
            Get workflow status
            Obter status do fluxo de trabalho
            """
            # Placeholder for future implementation
            return self.success_response(data={"status": "running", "progress": 50})
