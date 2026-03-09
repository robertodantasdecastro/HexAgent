"""
Configuration Controller - Updated to use separated System and AI services
Controlador de Configuração - Atualizado para usar serviços separados de Sistema e IA

Provides both legacy unified endpoints and new separated endpoints
Fornece endpoints unificados legados e novos endpoints separados
"""

from controllers.base_controller import BaseController
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
    
    def __init__(self, core_ref=None):
        # Initialize BOTH services / Inicializar AMBOS os serviços
        self.system_service = SystemConfigService()
        self.ai_service = AIConfigService()
        self.agent_core = core_ref
        
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
        @self.blueprint.route('/system/<path:key_path>', methods=['GET'])
        def get_system_config(key_path=None):
            """
            Get system configuration or sub-key
            Obtém configuração do sistema ou sub-chave
            
            Example: /config/system/ui/block_rules
            """
            try:
                self.log_request(f'GET /config/system/{key_path}' if key_path else 'GET /config/system')
                config = self.system_service.load_system_config()
                
                if key_path:
                    # Traverse keys / Percorrer chaves
                    keys = key_path.split('/')
                    current = config
                    
                    for k in keys:
                        if isinstance(current, dict) and k in current:
                            current = current[k]
                        else:
                            # Not found / Não encontrado
                            self.log_error(f"Config key not found: {key_path}", None)
                            return self.error_response(f"Config key not found: {key_path}", 404)
                            
                    return self.success_response(data=current) # Return direct data, not wrapped in {config: ...} if specific key
                
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
        
        @self.blueprint.route('/personas', methods=['GET'])
        def list_personas():
            """
            List available agent personas
            Listar personas de agentes disponíveis
            """
            try:
                self.log_request('GET /config/personas')
                personas = self.ai_service.list_personas()
                return self.success_response(data={"personas": personas})
            except Exception as e:
                self.log_error('GET /config/personas', e)
                return self.error_response("Failed to list personas", 500)
                
        
        @self.blueprint.route('/ai', methods=['GET'])
        def get_ai_config():
            """
            Get AI configuration ONLY
            Obtém APENAS configuração de IA
            """
            try:
                self.log_request('GET /config/ai')
                config = self.ai_service.load_ai_config()
                
                # BUG FIX: Expose flat fields (engine, model, has_api_key) at response root
                # so the frontend AIConfigManager can read them without unpacking profiles.
                # CORREÇÃO: Expor campos planos (engine, model, has_api_key) na raiz da resposta
                # para o front-end leia sem desempacotar profiles (estava retornando model=undefined).
                ai = config.get('ai', {})
                engine = ai.get('engine', 'openai')
                profiles = ai.get('profiles', {})
                active_profile = profiles.get(engine, {})
                model = active_profile.get('model') or ai.get('model')
                has_api_key = bool(active_profile.get('api_key') or ai.get('api_key'))
                
                return self.success_response(data={
                    'config': config,
                    'engine': engine,
                    'model': model,
                    'has_api_key': has_api_key,
                    'active_persona': ai.get('active_persona', ''),
                    'max_iterations': ai.get('max_iterations', 10),
                    'unlimited_iterations': ai.get('unlimited_iterations', False)
                })
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
                if not self.ai_service.validate_ai_config(data['config']):
                    self.logger.error("AI Config Validation Failed")
                    return self.error_response("Invalid AI Configuration (Missing API Key or Model)", 400)

                self.ai_service.save_ai_config(data['config'])
                
                # HOT RELOAD: Update AgentCore if available
                # RECARGA QUENTE: Atualizar AgentCore se disponível
                if self.agent_core:
                    try:
                        # Reload from disk (which was just saved above) to get the clean flattened version
                        # Recarregar do disco (recém salvo) para obter versão achatada limpa
                        engine, provider_config = self.ai_service.get_active_provider_config()
                        
                        api_key = provider_config.get('api_key')
                        model = provider_config.get('model')
                        
                        success = self.agent_core.initialize(
                            api_key=api_key,
                            engine=engine,
                            model=model,
                            system_prompt=self.ai_service.get_system_prompt(),
                            provider_kwargs=provider_config
                        )
                        if success:
                            self.logger.info("AgentCore hot-reloaded successfully")
                        else:
                            self.logger.warning("AgentCore hot-reload returned false")
                            
                    except Exception as e:
                        self.logger.error("Failed to hot-reload AgentCore", e)
                
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
                from flask import request
                
                # Use simplified helper from AI Config Service
                # Usar helper simplificado do Serviço de Configuração de IA
                active_engine, provider_config = self.ai_service.get_active_provider_config()
                
                # Check for overrides in Query Params (for testing draft configs)
                # Verificar overrides em Query Params (para testar configs de rascunho)
                # This allows the UI to fetch models for a config that isn't saved yet
                draft_host = request.args.get('host')
                draft_port = request.args.get('port')
                draft_key = request.args.get('api_key')
                
                if draft_host:
                    provider_config['host'] = draft_host
                
                if draft_port:
                    try:
                        provider_config['port'] = int(draft_port)
                    except ValueError:
                        pass # Ignore invalid port
                        
                if draft_key:
                    provider_config['api_key'] = draft_key

                # Verify if requested engine matches configured
                # Se o motor solicitado não é o configurado, ainda precisamos criar uma config válida
                # para ele (tentando usar os mesmos parâmetros de Host/Port)
                if engine.lower() != active_engine.lower():
                     self.logger.info(f"Requested engine {engine} differs from active {active_engine}, inheriting kwargs")
                
                # Create provider instance to get models
                # Criar instância do provedor para obter modelos
                self.logger.info(f"Fetching models for {engine} with config: {provider_config}")
                provider = ProviderFactory.create_provider(engine, provider_config)
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

        # ============================================================================
        # UTILITIES - Validation and Maintenance
        # Utilitários - Validação e Manutenção
        # ============================================================================

        @self.blueprint.route('/validate', methods=['POST'])
        def validate_config():
            """
            Validate configuration integrity
            Validar integridade da configuração
            """
            try:
                self.log_request('POST /config/validate')
                data = self.validate_request(['config'])
                config = data['config']
                
                # Validate system config part
                # Validar parte de configuração do sistema
                system_valid = True
                if 'system' in config:
                    system_valid = self.system_service.validate_system_config(config)
                
                # Validate AI config part
                # Validar parte de configuração de IA
                ai_valid = True
                if 'ai' in config:
                    ai_valid = self.ai_service.validate_ai_config(config)
                
                return self.success_response(
                    data={"valid": system_valid and ai_valid},
                    message="Configuration valid" if (system_valid and ai_valid) else "Configuration invalid"
                )
            except Exception as e:
                self.log_error('POST /config/validate', e)
                return self.error_response("Validation failed", 500)

        @self.blueprint.route('/backups', methods=['GET'])
        def list_backups():
            """
            List configuration backups
            Listar backups de configuração
            """
            try:
                self.log_request('GET /config/backups')
                # Use standard FileManager logic via backup path listing
                # Uses pathlib to list config-*.json backups
                from pathlib import Path
                backup_dir = Path.home() / '.hexagent-gui' / 'backups'
                
                backups = []
                if backup_dir.exists():
                    for date_dir in backup_dir.iterdir():
                        if date_dir.is_dir():
                            for f in date_dir.glob('*config*.json'):
                                backups.append({
                                    "filename": f.name,
                                    "date": date_dir.name,
                                    "path": str(f)
                                })
                
                return self.success_response(data={"backups": backups})
            except Exception as e:
                self.log_error('GET /config/backups', e)
                return self.error_response("Failed to list backups", 500)

        @self.blueprint.route('/restore/<timestamp>', methods=['POST'])
        def restore_backup(timestamp):
            """
            Restore configuration from backup
            Restaurar configuração de backup
            """
            try:
                self.log_request(f'POST /config/restore/{timestamp}')
                
                from pathlib import Path
                import shutil
                from datetime import datetime
                
                home_dir = Path.home() / '.hexagent-gui'
                backups_dir = home_dir / 'backups'
                target_backup = backups_dir / timestamp
                config_dir = home_dir / 'config'
                
                if not target_backup.exists():
                     return self.error_response(f"Backup {timestamp} not found", 404)
                
                # 1. Safety Backup of Current Config
                # 1. Backup de Segurança da Configuração Atual
                if config_dir.exists():
                    safety_ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                    safety_dir = backups_dir / f"{safety_ts}_safety_restore"
                    shutil.copytree(config_dir, safety_dir)
                    self.logger.info(f"Created safety backup at {safety_dir}")
                
                # 2. Clear Current Config
                # 2. Limpar Configuração Atual
                if config_dir.exists():
                    shutil.rmtree(config_dir)
                config_dir.mkdir(parents=True, exist_ok=True)
                
                # 3. Restore Files
                # 3. Restaurar Arquivos
                # We copy individual json files to avoid directory structure issues
                # Copiamos arquivos json individuais para evitar problemas de estrutura
                restored_count = 0
                for item in target_backup.iterdir():
                     if item.is_file() and item.suffix == '.json':
                         shutil.copy2(item, config_dir / item.name)
                         restored_count += 1
                
                return self.success_response(
                    message=f"Restored {restored_count} config files from {timestamp}",
                    data={"safety_backup": safety_ts if 'safety_ts' in locals() else None}
                )
                
            except Exception as e:
                self.log_error(f'POST /config/restore/{timestamp}', e)
                return self.error_response(f"Restore failed: {str(e)}", 500)
