"""
Monitoring Controller
Controlador de Monitoramento

Handles endpoints for Shadow Mode and System Stats.
Gerencia endpoints para Modo Sombra e Estatísticas do Sistema.

@author: HexAgent Dev
"""
from core.base_controller import BaseController

class MonitoringController(BaseController):
    """
    Controller for Passive Monitoring.
    Controlador para Monitoramento Passivo.
    """
    
    def __init__(self, core_ref=None):
        self.core = core_ref
        super().__init__(
            name='monitoring',
            import_name=__name__,
            url_prefix='/monitoring'
        )
    
    def _register_routes(self):
        """Register routes."""
        
        @self.blueprint.route('/toggle', methods=['POST'])
        def toggle_monitoring():
            """Toggle Shadow Mode."""
            try:
                data = self.validate_request(['enabled'])
                if not self.core:
                    return self.error_response("Core not ready", 503)
                    
                active = self.core.toggle_shadow_mode(data['enabled'])
                status = "active" if active else "inactive"
                self.log_request(f'POST /monitoring/toggle -> {status}')
                
                return self.success_response(data={"active": active})
            except Exception as e:
                self.log_error('POST /monitoring/toggle', e)
                return self.error_response("Failed to toggle monitoring", 500)

        @self.blueprint.route('/stats', methods=['GET'])
        def get_stats():
            """Get Live Stats."""
            try:
                if not self.core:
                    return self.error_response("Core not ready", 503)
                
                # Check health also returns stats now, but this is direct
                stats = self.core.monitor.get_stats()
                return self.success_response(data=stats)
            except Exception as e:
                self.log_error('GET /monitoring/stats', e)
                return self.error_response("Failed to fetch stats", 500)
