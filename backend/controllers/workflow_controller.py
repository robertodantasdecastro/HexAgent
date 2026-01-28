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
        
        @self.blueprint.route('/', methods=['GET'])
        def list_workflows():
            """List available workflows"""
            try:
                workflows = self.service.list_workflows()
                return self.success_response(data=workflows)
            except Exception as e:
                return self.error_response(str(e))

        @self.blueprint.route('/<workflow_id>', methods=['GET'])
        def get_workflow_details(workflow_id):
            """Get workflow details"""
            try:
                workflow = self.service.get_workflow(workflow_id)
                if not workflow:
                    return self.error_response("Workflow not found", 404)
                return self.success_response(data=workflow)
            except Exception as e:
                return self.error_response(str(e))

        @self.blueprint.route('/start', methods=['POST'])
        def start_workflow():
            """
            Start a new workflow
            Iniciar um novo fluxo de trabalho
            """
            try:
                self.log_request('POST /api/workflow/start')
                data = self.validate_request(['workflow_type'])
                
                # Extract known param 'target', pass the rest as kwargs dict
                target = data.get('target', '') 
                
                result = self.service.execute_workflow(
                    workflow_type=data['workflow_type'],
                    target=target,
                    params=data
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
