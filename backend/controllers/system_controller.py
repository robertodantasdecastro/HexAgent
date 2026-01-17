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
                
                # FULL MODE: Try to get API key and initialize
                # MODO COMPLETO: Tenta obter chave API e inicializar
                api_key = self._get_api_key()
                
                if not api_key:
                    return self.error_response(
                        "API Key not found. Please configure it in Settings.",
                        400
                    )
                
                # Initialize core with API key
                # Inicializa core com chave API
                if self.core.initialize(api_key):
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
                
                # Setup shutdown timer for Flask
                # Configurar timer de desligamento para Flask
                # Note: We rely on the frontend to close the Electron window 
                # or the process manager to kill the process after this response.
                
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
        Get API key from environment or config
        Obtém chave API do ambiente ou config
        
        Returns:
            API key string or empty string
            String de chave API ou string vazia
        """
        # 1. Try environment variables first
        # 1. Tenta variáveis de ambiente primeiro
        api_key = os.getenv('OPENROUTER_API_KEY') or os.getenv('API_KEY')
        if api_key:
            return api_key

        # 2. Try loading from user config file
        # 2. Tentar carregar do arquivo de config do usuário
        try:
            from pathlib import Path
            import json
            
            config_path = Path.home() / '.hexagent-gui' / 'config.json'
            if config_path.exists():
                with open(config_path, 'r') as f:
                    config = json.load(f)
                    return config.get('ai', {}).get('api_key', '')
        except Exception as e:
            self.logger.error(f"Error reading config for API key: {e}")
            
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
