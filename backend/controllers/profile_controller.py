"""
Profile Controller
Controlador de Perfil

Handles user profile and persona configuration endpoints.
Gerencia endpoints de configuração de perfil e persona de usuário.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from controllers.base_controller import BaseController
from services.profile_service import ProfileService
from core.errors import ConfigError

class ProfileController(BaseController):
    """
    Controller for Profile configuration
    Controlador para configuração de Perfil
    """
    
    def __init__(self, core_ref=None):
        self.service = ProfileService()
        self.core = core_ref
        super().__init__(
            name='profile',
            import_name=__name__,
            url_prefix='/config/profile'
        )
    
    def _register_routes(self):
        """Register profile routes / Registra rotas de perfil"""
        
        @self.blueprint.route('/', methods=['GET'])
        def get_profile():
            """Get profile config / Obter config de perfil"""
            try:
                self.log_request('GET /config/profile')
                config = self.service.load_profile()
                return self.success_response(data=config)
            except Exception as e:
                self.log_error('GET /config/profile', e)
                return self.error_response("Failed to load profile", 500)

        @self.blueprint.route('/', methods=['POST'])
        def save_profile():
            """Save profile config / Salvar config de perfil"""
            try:
                self.log_request('POST /config/profile')
                data = self.validate_request(['config'])
                self.service.save_profile(data['config'])
                
                # Update Core Context if running
                # Atualizar Contexto do Core se estiver rodando
                if self.core:
                    ctx = self.service.get_system_prompt_context()
                    self.core.set_profile_context(ctx)
                
                return self.success_response(message="Profile saved")
            except Exception as e:
                self.log_error('POST /config/profile', e)
                return self.error_response("Failed to save profile", 500)
                
        @self.blueprint.route('/personas', methods=['GET'])
        def list_personas():
            """Get available personas / Obter personas disponíveis"""
            try:
                self.log_request('GET /config/profile/personas')
                from services.persona_service import persona_service
                personas = persona_service.list_personas()
                return self.success_response(data={"personas": personas})
            except Exception as e:
                self.log_error('GET /config/profile/personas', e)
                return self.error_response("Failed to list personas", 500)
