"""
Configuration Controller - Handles all configuration endpoints
Controlador de Configuração - Gerencia todos os endpoints de configuração

Provides endpoints for loading, saving, and managing system and AI configurations.
Fornece endpoints para carregar, salvar e gerenciar configurações do sistema e IA.
"""

from core.base_controller import BaseController
from services.config_service import ConfigService
from core.errors import ConfigError, ValidationError
from flask import request


class ConfigController(BaseController):
    """
    Controller for configuration management endpoints
    Controlador para endpoints de gerenciamento de configuração
    """
    
    def __init__(self):
        self.service = ConfigService()
        super().__init__(
            name='config',
            import_name=__name__,
            url_prefix='/config'
        )
    
    def _register_routes(self):
        """Register all configuration routes / Registra todas as rotas de configuração"""
        
        # ============================================================================
        # UNIFIED CONFIG ENDPOINTS (Backward Compatibility)
        # Endpoints Unificados de Config (Compatibilidade com Versão Anterior)
        # ============================================================================
        
        @self.blueprint.route('/', methods=['GET'])
        def get_full_config():
            """
            Get complete configuration (system + AI)
            Obtém configuração completa (sistema + IA)
            """
            try:
                self.log_request('GET /config')
                config = self.service.load_full_config()
                return self.success_response(data={'config': config})
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('GET /config', e)
                return self.error_response("Failed to load configuration", 500)
        
        @self.blueprint.route('/', methods=['POST'])
        def save_full_config():
            """
            Save complete configuration (splits automatically)
            Salva configuração completa (divide automaticamente)
            """
            try:
                self.log_request('POST /config')
                data = self.validate_request(['config'])
                self.service.save_full_config(data['config'])
                return self.success_response(message="Configuration saved successfully")
            except ValueError as e:
                return self.error_response(str(e), 400)
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /config', e)
                return self.error_response("Failed to save configuration", 500)
        
        # ============================================================================
        # SEPARATED CONFIG ENDPOINTS (New Dual System)
        # Endpoints Separados de Config (Novo Sistema Dual)
        # ============================================================================
        
        @self.blueprint.route('/system', methods=['GET'])
        def get_system_config():
            """
            Get system configuration only
            Obtém apenas configuração do sistema
            """
            try:
                self.log_request('GET /config/system')
                config = self.service.load_system_config()
                return self.success_response(data={'config': config})
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('GET /config/system', e)
                return self.error_response("Failed to load system configuration", 500)
        
        @self.blueprint.route('/system', methods=['POST'])
        def save_system_config():
            """
            Save system configuration only
            Salva apenas configuração do sistema
            """
            try:
                self.log_request('POST /config/system')
                data = self.validate_request(['config'])
                self.service.save_system_config(data['config'])
                return self.success_response(message="System configuration saved")
            except ValueError as e:
                return self.error_response(str(e), 400)
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /config/system', e)
                return self.error_response("Failed to save system configuration", 500)
        
        @self.blueprint.route('/ai', methods=['GET'])
        def get_ai_config():
            """
            Get AI configuration only
            Obtém apenas configuração de IA
            """
            try:
                self.log_request('GET /config/ai')
                config = self.service.load_ai_config()
                return self.success_response(data={'config': config})
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('GET /config/ai', e)
                return self.error_response("Failed to load AI configuration", 500)
        
        @self.blueprint.route('/ai', methods=['POST'])
        def save_ai_config():
            """
            Save AI configuration only
            Salva apenas configuração de IA
            """
            try:
                self.log_request('POST /config/ai')
                data = self.validate_request(['config'])
                self.service.save_ai_config(data['config'])
                return self.success_response(message="AI configuration saved")
            except ValueError as e:
                return self.error_response(str(e), 400)
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /config/ai', e)
                return self.error_response("Failed to save AI configuration", 500)
