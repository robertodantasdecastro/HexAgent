"""
Security Controller - Endpoint Manager for Elevated Privileges
Controlador de Segurança - Gerenciador de Endpoints para Privilégios Elevados

Provides the REST API for React to inject and revoke temporary Sudo credentials.
Fornece API REST para React embutir privlégios temporários no backend.

@author: Roberto Dantas de Castro
"""
from controllers.base_controller import BaseController
from services.security_service import security_service

class SecurityController(BaseController):
    def __init__(self):
        super().__init__(
            name='security',
            import_name=__name__,
            url_prefix='/security'
        )

    def _register_routes(self):
        self.blueprint.add_url_rule('/sudo', view_func=self.get_sudo_status, methods=['GET'])
        self.blueprint.add_url_rule('/sudo', view_func=self.authenticate_sudo, methods=['POST'])
        self.blueprint.add_url_rule('/sudo', view_func=self.revoke_sudo, methods=['DELETE'])

    def get_sudo_status(self):
        """
        Check if the backend is currently running with an elevated session in RAM.
        Verifica se o backend está operando com Sessão Elevada na memória.
        """
        try:
            is_active = security_service.is_elevated()
            return self.success_response({
                "elevated": is_active,
                "message": "Sudo session active" if is_active else "Running as standard user"
            })
        except Exception as e:
            self.log_error('GET /security/sudo', e)
            return self.error_response(str(e), 500)

    def authenticate_sudo(self):
        """
        Accepts the password payload from React Modal to enable At-Rest Sudo Mode
        Aceita a senha do modal vindo do React para Ativar Sudo
        """
        try:
            data = self.get_request_data()
            password = data.get('password')
            
            if not password:
                return self.error_response("Password is required / Senha Requerida", 400)
                
            success = security_service.authenticate_sudo(password)
            
            if success:
                return self.success_response({"elevated": True, "message": "Root Privileges Granted"})
            else:
                return self.error_response("Invalid sudo password / Senha Incorreta", 401)
                
        except Exception as e:
            self.log_error('POST /security/sudo', e)
            return self.error_response(str(e), 500)

    def revoke_sudo(self):
        """
        Destroys the At-Rest credential from memory.
        Destrói a credencial segura da memória.
        """
        try:
            security_service.revoke_sudo()
            return self.success_response({"elevated": False, "message": "Privileges Revoked"})
        except Exception as e:
            self.log_error('DELETE /security/sudo', e)
            return self.error_response(str(e), 500)
