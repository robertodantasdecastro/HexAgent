"""
Configuration Controller - Updated to use separated System and AI services
Controlador de Configuração - Atualizado para usar serviços separados de Sistema e IA

Provides both legacy unified endpoints and new separated endpoints
Fornece endpoints unificados legados e novos endpoints separados
"""

from core.base_controller import BaseController
from services.system_config_service import SystemConfigService
from services.ai_config_service import AIConfigService
from core.errors import ConfigError, ValidationError
from flask import request


class ConfigController(BaseController):
    """
    Controller for configuration management endpoints
    Controlador para endpoints de gerenciamento de configuração
    
    Uses TWO independent services for clean separation
    Usa DOIS serviços independentes para separação limpa
    """
    
    def __init__(self):
        # Initialize BOTH services / Inicializar AMBOS os serviços
        self.system_service = SystemConfigService()
        self.ai_service = AIConfigService()
        
        super().__init__(
            name='config',
            import_name=__name__,
            url_prefix='/config'
        )
    
    def _register_routes(self):
        """Register all configuration routes / Registra todas as rotas de configuração"""
        
        # ============================================================================
        # LEGACY UNIFIED ENDPOINTS (Backward Compatibility)
        # Endpoints Unificados Legados (Compatibilidade com Versão Anterior)
        # ============================================================================
        
        @self.blueprint.route('/', methods=['GET'])
        def get_full_config():
            """
            Get complete configuration (system + AI merged)
            Obtém configuração completa (sistema + IA mesclados)
            
            LEGACY: For backward compatibility only
            LEGADO: Apenas para compatibilidade com versão anterior
            """
            try:
                self.log_request('GET /config (legacy)')
                
                # Load both configs separately
                system_config = self.system_service.load_system_config()
                ai_config = self.ai_service.load_ai_config()
                
                # Merge for legacy clients
                merged = {**system_config, **ai_config}
                
                return self.success_response(data={'config': merged})
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
            
            LEGACY: For backward compatibility only
            LEGADO: Apenas para compatibilidade com versão anterior
            """
            try:
                self.log_request('POST /config (legacy)')
                data = self.validate_request(['config'])
                config = data['config']
                
                # Split into system and AI configs
                system_keys = ['system', 'services', 'ui', 'terminal']
                ai_keys = ['ai']
                
                # Extract system config
                system_config = {k: v for k, v in config.items() if k in system_keys}
                if system_config:
                    self.system_service.save_system_config(system_config)
                
                # Extract AI config
                ai_config = {k: v for k, v in config.items() if k in ai_keys}
                if ai_config:
                    self.ai_service.save_ai_config(ai_config)
                
                return self.success_response(message="Configuration saved successfully")
            except ValueError as e:
                return self.error_response(str(e), 400)
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /config', e)
                return self.error_response("Failed to save configuration", 500)
        
        # ============================================================================
        # NEW SEPARATED ENDPOINTS (Clean Architecture)
        # Novos Endpoints Separados (Arquitetura Limpa)
        # ============================================================================
        
        @self.blueprint.route('/system', methods=['GET'])
        def get_system_config():
            """
            Get system configuration ONLY
            Obtém APENAS configuração do sistema
            """
            try:
                self.log_request('GET /config/system')
                config = self.system_service.load_system_config()
                return self.success_response(data={'config': config})
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('GET /config/system', e)
                return self.error_response("Failed to load system configuration", 500)
        
        @self.blueprint.route('/system', methods=['POST'])
        def save_system_config():
            """
            Save system configuration ONLY
            Salva APENAS configuração do sistema
            """
            try:
                self.log_request('POST /config/system')
                data = self.validate_request(['config'])
                self.system_service.save_system_config(data['config'])
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
            Get AI configuration ONLY
            Obtém APENAS configuração de IA
            """
            try:
                self.log_request('GET /config/ai')
                config = self.ai_service.load_ai_config()
                return self.success_response(data={'config': config})
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('GET /config/ai', e)
                return self.error_response("Failed to load AI configuration", 500)
        
        @self.blueprint.route('/ai', methods=['POST'])
        def save_ai_config():
            """
            Save AI configuration ONLY
            Salva APENAS configuração de IA
            """
            try:
                self.log_request('POST /config/ai')
                data = self.validate_request(['config'])
                self.ai_service.save_ai_config(data['config'])
                return self.success_response(message="AI configuration saved")
            except ValueError as e:
                return self.error_response(str(e), 400)
            except ConfigError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /config/ai', e)
                return self.error_response("Failed to save AI configuration", 500)
        
        # ============================================================================
        # PROVIDER/ENGINE ENDPOINTS
        # Endpoints de Provedor/Motor
        # ============================================================================
        
        @self.blueprint.route('/engines/list', methods=['GET'])
        def list_engines():
            """
            Get list of available AI engines
            Obtém lista de motores IA disponíveis
            """
            try:
                self.log_request('GET /engines/list')
                from core.providers import ProviderFactory
                
                engines = ProviderFactory.get_available_engines()
                return self.success_response(data={'engines': engines})
            except Exception as e:
                self.log_error('GET /engines/list', e)
                return self.error_response("Failed to list engines", 500)
        
        @self.blueprint.route('/engines/<engine>/models', methods=['GET'])
        def list_models(engine):
            """
            Get list of available models for specific engine
            Obtém lista de modelos disponíveis para motor específico
            """
            try:
                self.log_request(f'GET /engines/{engine}/models')
                from core.providers import ProviderFactory
                
                # Create temporary provider instance to get models
                # Criar instância temporária do provedor para obter modelos
                provider = ProviderFactory.create_provider(engine, {})
                models = provider.get_available_models()
                
                return self.success_response(data={'models': models})
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error(f'GET /engines/{engine}/models', e)
                return self.error_response(f"Failed to list models for {engine}", 500)
        
        @self.blueprint.route('/engines/test', methods=['POST'])
        def test_engine():
            """
            Test connection to AI engine
            Testa conexão com motor IA
            """
            try:
                self.log_request('POST /engines/test')
                data = self.validate_request(['engine', 'config'])
                
                from core.providers import ProviderFactory
                
                engine = data['engine']
                config = data['config']
                
                # Create provider and test connection
                # Criar provedor e testar conexão
                provider = ProviderFactory.create_provider(engine, config)
                result = provider.test_connection()
                
                return self.success_response(data=result)
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /engines/test', e)
                return self.error_response(f"Test failed: {str(e)}", 500)
