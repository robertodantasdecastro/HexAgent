"""
Profile Controller - API Endpoints for Personalization
Controlador de Perfil - Endpoints API para Personalização

Exposes routes to get/update user profile data.
Expõe rotas para obter/atualizar dados de perfil do usuário.

@author: Roberto Dantas de Castro
"""

from core.base_controller import BaseController
from services.profile_service import ProfileService
from flask import request


class ProfileController(BaseController):
    """Controller for user profile operations / Controlador para operações de perfil"""
    
    def __init__(self):
        super().__init__(name='profile', import_name=__name__, url_prefix='/config/profile')
    
    def _register_routes(self):
        """Register profile routes / Registra rotas de perfil"""
        
        # Override the url_prefix behavior slightly or map root to GET/POST
        # Note: BaseController usually sets prefix. So this maps to /config/profile/
        
        @self.blueprint.route('/', methods=['GET'])
        def get_profile():
            """Get current user profile / Obter perfil atual do usuário"""
            try:
                service = ProfileService()
                data = service.load_profile()
                # BaseController.success_response format
                return self.success_response(data={'profile': data})
            except Exception as e:
                self.log_error('get_profile', e)
                return self.error_response(str(e), 500)

        @self.blueprint.route('/', methods=['POST'])
        def save_profile():
            """Save user profile / Salvar perfil do usuário"""
            try:
                data = request.json.get('profile')
                if not data:
                     return self.error_response("No profile data provided", 400)

                service = ProfileService()
                if service.save_profile(data):
                    return self.success_response(message="Profile saved")
                else:
                    return self.error_response("Failed to save profile", 500)
                    
            except Exception as e:
                self.log_error('save_profile', e)
                return self.error_response(str(e), 500)

# Expose the blueprint for app.py if it still needs direct access (though BaseController handles it)
# In app.py loop, 'controller.blueprint' is used.
profile_bp = None # Not needed if instantiated in app.py logic using blueprint property
