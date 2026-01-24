"""
System Controller - Handles system-level endpoints
Controlador de Sistema - Gerencia endpoints de nível de sistema

Provides endpoints for system health, initialization, status checking,
and shutdown operations.

Fornece endpoints para saúde do sistema, inicialização, verificação de status
e operações de desligamento.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
"""

from core.base_controller import BaseController
from flask import request
import os
import time


class SystemController(BaseController):
    """
    Controller for system-level operations
    Controlador para operações de nível de sistema
    
    Handles:
    - Health checks / Verificações de saúde
    - Initialization / Inicialização  
    - Status monitoring / Monitoramento de status
    - Shutdown / Desligamento
    - Cleanup / Limpeza
    """
    
    def __init__(self, core_ref=None, hexstrike_ref=None):
        """
        Initialize system controller
        Inicializa controlador de sistema
        
        Args:
            core_ref: Reference to AgentCore instance (if available)
                     Referência à instância AgentCore (se disponível)
            hexstrike_ref: Reference to HexStrike service (if available)
                          Referência ao serviço HexStrike (se disponível)
        """
        self.core = core_ref
        self.hexstrike = hexstrike_ref
        super().__init__(
            name='system',
            import_name=__name__,
            url_prefix=''  # No prefix for root-level endpoints
        )
    
    def _register_routes(self):
        """Register all system routes / Registra todas as rotas de sistema"""
        
        # ============================================================================
        # HEALTH CHECK - System availability check
        # Verificação de Saúde - Verifica disponibilidade do sistema
        # ============================================================================
        
        @self.blueprint.route('/health', methods=['GET'])
        def health_check():
            """
            Health check endpoint for monitoring
            Endpoint de verificação de saúde para monitoramento
            
            Returns:
                200: System is healthy / Sistema está saudável
            """
            try:
                self.log_request('GET /health')
                return self.success_response(
                    data={"status": "healthy", "timestamp": time.time()},
                    message="System operational"
                )
            except Exception as e:
                self.log_error('GET /health', e)
                return self.error_response("Health check failed", 500)
        
        # ============================================================================
        # INIT STATUS - Check if system is initialized
        # Status de Inicialização - Verifica se sistema está inicializado
        # ============================================================================
        
        @self.blueprint.route('/init_status', methods=['GET'])
        def get_init_status():
            """
            Get initialization status of the system
            Obtém status de inicialização do sistema
            
            Returns:
                Initialization state and component status
                Estado de inicialização e status de componentes
            """
            try:
                self.log_request('GET /init_status')
                
                # Check if core is initialized
                # Verifica se core está inicializado
                agent_initialized = self.core is not None
                standalone_mode = self.core is None
                
                status = {
                    "agent_initialized": agent_initialized,
                    "standalone": standalone_mode,
                    "components": {
                        "backend": True,  # Always true if responding
                        "agent_core": agent_initialized,
                        "hexstrike": self.hexstrike is not None
                    }
                }

                # Add detailed agent status if available
                # Adiciona status detalhado do agente se disponível
                if agent_initialized and self.core:
                     try:
                        agent_status = self.core.get_status()
                        status["brain"] = {
                            "ready": agent_status.get("brain_ready", False),
                            "provider": agent_status.get("provider", "unknown"),
                            "engine": agent_status.get("engine", "unknown"),
                            "model": agent_status.get("model", "unknown"),
                            "status": "ready" if agent_status.get("brain_ready") else "error"
                        }
                     except Exception as e:
                        self.logger.error(f"Error getting agent status: {e}")
                        status["brain"] = {"ready": False, "status": "error", "message": str(e)}
                
                return self.success_response(data=status)
            except Exception as e:
                self.log_error('GET /init_status', e)
                return self.error_response("Failed to get init status", 500)
        
        # ============================================================================
        # INITIALIZE - Initialize the AI agent core
        # Inicializar - Inicializa o núcleo do agente de IA
        # ============================================================================
        
        @self.blueprint.route('/init', methods=['POST'])
        def initialize_system():
            """
            Initialize the AI agent core with API key
            Inicializa o núcleo do agente de IA com chave API
            
            Handles both standalone mode (no AgentCore) and full mode.
            Gerencia tanto modo standalone (sem AgentCore) quanto modo completo.
            
            Returns:
                Success status and initialization message
                Status de sucesso e mensagem de inicialização
            """
            try:
                self.log_request('POST /init')
                
                # STANDALONE MODE: If AgentCore is None, init succeeds with limited features
                # MODO STANDALONE: Se AgentCore é None, init sucede com recursos limitados
                if self.core is None:
                    self.logger.info("Running in STANDALONE mode - AI features disabled")
                    return self.success_response(
                        data={
                            "agent_initialized": False,
                            "standalone": True
                        },
                        message="Running in STANDALONE mode. AI features disabled. Configure API key in Settings to enable."
                    )
                
                # FULL MODE: Get API key and check engine type
                # MODO COMPLETO: Obter chave API e verificar tipo de motor
                api_key = self._get_api_key()
                
                # Check if we are running a local engine that doesn't need a key
                # Verifica se estamos rodando um motor local que não precisa de chave
                from services.ai_config_service import AIConfigService
                ai_service = AIConfigService()
                config = ai_service.load_ai_config()
                engine = config.get('ai', {}).get('engine', 'openai').lower()
                
                # List of engines that don't STRICTLY require an API key
                # Lista de motores que não exigem ESTRITAMENTE uma chave API
                # Note: 'hexsecgpt' might be local or remote, typically local/hybrid
                local_engines = ['lmstudio', 'ollama', 'localai', '5ire', 'text-generation-webui']
                is_local = engine in local_engines
                
                # Only enforce API Key if NOT local
                # Apenas exige Chave API se NÃO for local
                if not api_key and not is_local:
                    return self.error_response(
                        f"API Key not found for engine '{engine}'. Please configure it in Settings.",
                        400
                    )
                
                # Log for debugging
                if is_local and not api_key:
                    self.logger.info(f"Initializing local engine '{engine}' without API Key (Allowed)")
                
                # Initialize core with API key AND config (Host/Port)
                # Inicializa core com chave API e config completa (Host/Port)
                engine_name, provider_config = ai_service.get_active_provider_config()
                
                # Check for explicit API key override (e.g. from Env or User Input)
                if api_key:
                    provider_config['api_key'] = api_key
                
                if self.core.initialize(api_key=api_key, engine=engine_name, provider_kwargs=provider_config):
                    # Try to start HexStrike if available
                    # Tenta iniciar HexStrike se disponível
                    hexstrike_started = self._start_hexstrike()
                    
                    message = "Neural Link Established."
                    if not hexstrike_started:
                        message += " WARNING: HexStrike Server might be offline. Check 'Power' button."
                    
                    return self.success_response(
                        data={"agent_initialized": True},
                        message=message
                    )
                else:
                    return self.error_response(
                        "Failed to initialize Agent Core (Check API Key / Logs)",
                        500
                    )
                    
            except Exception as e:
                self.log_error('POST /init', e)
                return self.error_response(
                    f"Brain Init Exception: {str(e)}",
                    500,
                    details=str(e) if self.logger.level == 10 else None  # Debug mode only
                )
        
        # ============================================================================
        # STATUS - Get system status (backend, brain, HexStrike)
        # Status - Obtém status do sistema (backend, brain, HexStrike)
        # ============================================================================
        
        @self.blueprint.route('/status', methods=['GET'])
        def get_system_status():
            """
            Get comprehensive system status
            Obtém status abrangente do sistema
            
            Returns:
                Status of all system components
                Status de todos os componentes do sistema
            """
            try:
                self.log_request('GET /status')
                
                status = {
                    "backend": {
                        "status": "running",
                        "uptime": time.time()
                    },
                    "brain": {
                        "initialized": self.core is not None,
                        "standalone": self.core is None
                    },
                    "hexstrike": {
                        "available": self.hexstrike is not None,
                        "running": False
                    }
                }
                
                # Check HexStrike status if available
                # Verifica status do HexStrike se disponível
                if self.hexstrike:
                    try:
                        health = self.hexstrike.check_health()
                        status["hexstrike"]["running"] = health.get("alive", False)
                    except:
                        pass
                
                return self.success_response(data=status)
            except Exception as e:
                self.log_error('GET /status', e)
                return self.error_response("Failed to get system status", 500)
        
        # ============================================================================
        # SHUTDOWN - Graceful system shutdown
        # Desligamento - Desligamento gracioso do sistema
        # ============================================================================
        
        @self.blueprint.route('/shutdown', methods=['POST'])
        def shutdown_system():
            """
            Gracefully shutdown the system
            Desliga o sistema graciosamente
            """
            try:
                self.log_request('POST /shutdown')
                self.logger.info("Shutdown requested")
                
                # Shutdown AgentCore if initialized
                # Desligar AgentCore se inicializado
                if self.core:
                    self.logger.info("Shutting down AgentCore...")
                    try:
                        self.core.shutdown()
                    except Exception as e:
                        self.logger.error(f"Error shutting down core: {e}")
                
                # Explicitly stop HexStrike Manager (Zombie Prevention)
                # Parar explicitamente o HexStrike Manager (Prevenção de Zumbis)
                try:
                    from services.hexstrike_manager import HexStrikeManager
                    manager = HexStrikeManager()
                    manager.stop()
                    self.logger.info("HexStrike Manager stopped.")
                except Exception as e:
                    self.logger.error(f"Error stopping HexStrike Manager: {e}")
                
                # Setup shutdown timer for Flask
                # Configurar timer de desligamento para Flask
                # Force exit in 1 second to allow response to be sent
                # Forçar saída em 1 segundo para permitir envio da resposta
                def delayed_exit():
                    time.sleep(1)
                    self.logger.info("Shutdown timer expired. Exiting process.")
                    os._exit(0)
                
                import threading
                t = threading.Thread(target=delayed_exit)
                t.start()
                
                return self.success_response(message="System shutting down...")
            except Exception as e:
                self.log_error('POST /shutdown', e)
                return self.error_response("Shutdown failed", 500)
        
        # ============================================================================
        # CLEANUP - Clean up temporary files and resources
        # Limpeza - Limpa arquivos temporários e recursos
        # ============================================================================
        
        @self.blueprint.route('/cleanup', methods=['POST'])
        def cleanup_system():
            """
            Clean up temporary files and unused resources
            Limpa arquivos temporários e recursos não utilizados
            
            Returns:
                Cleanup summary / Resumo de limpeza
            """
            try:
                self.log_request('POST /cleanup')
                
                # TODO: Implement actual cleanup logic
                # TODO: Implementar lógica de limpeza real
                cleaned_items = 0
                freed_space = 0
                
                return self.success_response(
                    data={
                        "items_cleaned": cleaned_items,
                        "space_freed_mb": freed_space
                    },
                    message="Cleanup completed"
                )
            except Exception as e:
                self.log_error('POST /cleanup', e)
                return self.error_response("Cleanup failed", 500)
    
    # ================================================================================
    # HELPER METHODS - Private utility functions
    # Métodos Auxiliares - Funções utilitárias privadas
    # ================================================================================
    
    def _get_api_key(self) -> str:
        """
        Get API key via AIConfigService (Single Source of Truth)
        Obtém chave API via AIConfigService (Fonte Única da Verdade)
        
        Returns:
            API key string or empty string
        """
        try:
            # 1. Try environment variables (Override)
            # 1. Tenta variáveis de ambiente (Sobrescrita)
            env_key = os.getenv('OPENROUTER_API_KEY') or os.getenv('API_KEY')
            if env_key:
                return env_key

            # 2. Use AI Config Service
            # 2. Usa Serviço de Config de IA
            from services.ai_config_service import AIConfigService
            ai_service = AIConfigService()
            config = ai_service.load_ai_config()
            
            return config.get('ai', {}).get('api_key', '')
            
        except Exception as e:
            self.logger.error(f"Error getting API key: {e}")
            return ""
    
    def _start_hexstrike(self) -> bool:
        """
        Attempt to start HexStrike service
        Tenta iniciar serviço HexStrike
        
        Returns:
            True if started or already running, False otherwise
            True se iniciado ou já rodando, False caso contrário
        """
        if not self.hexstrike or not self.core:
            return False
        
        try:
            # Check if already running
            # Verifica se já está rodando
            health = self.hexstrike.check_health()
            if health.get('alive') or health.get('status') == 'ok':
                return True
            
            # Try to start
            # Tenta iniciar
            self.logger.info("Starting HexStrike server...")
            if self.core._start_hexstrike_server():
                time.sleep(3)  # Wait for startup / Aguarda inicialização
                health = self.hexstrike.check_health()
                return health.get('alive', False)
        except Exception as e:
            self.logger.error(f"Failed to start HexStrike: {e}")
        
        return False
