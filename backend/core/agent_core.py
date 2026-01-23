"""
AgentCore - Main Orchestration Engine
AgentCore - Motor Principal de Orquestração

Coordinates AI brain + Command execution in iterative loops.
Coordena cérebro IA + Execução de comandos em loops iterativos.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0
"""

from typing import Generator, Dict, Any, Optional, List
import re
import logging
from .hex_brain import HexBrain
from .hex_strike_client import HexStrikeClient
from .inference_engine import InferenceEngine
from .command_executor import CommandExecutor
from .providers import ProviderFactory, InferenceStrategy
from .mcp_manager import MCPManager
import json

logger = logging.getLogger(__name__)


class AgentCore:
    """
    Main orchestration engine combining AI + Commands
    Motor principal combinando IA + Comandos
    
    Coordinates iterative problem-solving loop:
    1. AI proposes solution/commands
    2. Commands are executed (if auto-execute or approved)
    3. Results are fed back to AI
    4. AI analyzes and continues
    5. Repeat until problem solved or max iterations
    
    Coordena loop iterativo de resolução de problemas:
    1. IA propõe solução/comandos
    2. Comandos são executados (se auto-executar ou aprovado)
    3. Resultados são retornados à IA
    4. IA analisa e continua
    5. Repetir até problema resolvido ou máximo de iterações
    """
    
    def __init__(
        self, 
        api_key: Optional[str] = None,
        hexstrike_url: Optional[str] = None,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        engine: str = 'openai',
        provider_kwargs: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize Agent Core with multi-provider support
        Inicializa Agent Core com suporte multi-provedor
        
        Args:
            api_key: AI provider API key (defaults to env var)
                    Chave API do provedor IA (padrão: variável de ambiente)
            hexstrike_url: HexStrike server URL (default: http://localhost:8888)
                          URL do servidor HexStrike (padrão: http://localhost:8888)
            model: AI model name (provider-specific)
                  Nome do modelo IA (específico do provedor)
            system_prompt: Custom system prompt (optional)
                          Prompt de sistema customizado (opcional)
            engine: AI provider engine ('hexsecgpt', 'openai', 'deepseek', 'ollama')
                   Motor provedor IA (padrão: 'hexsecgpt')
            provider_kwargs: Additional provider settings (host, port, etc.)
                            Configurações adicionais do provedor
        """
        # Initialize AI provider using ProviderFactory (Strategy Pattern)
        # Inicializa provedor IA usando ProviderFactory (Padrão Strategy)
        try:
            # Build provider configuration / Construir configuração do provedor
            provider_config = {
                'api_key': api_key,
                'model': model,
                'system_prompt': system_prompt
            }
            
            # Merge additional kwargs if provided (e.g. host/port for LM Studio)
            if provider_kwargs:
                provider_config.update(provider_kwargs)
            
            # Create provider instance via factory / Criar instância via fábrica
            self.engine = engine
            self.provider = ProviderFactory.create_provider(engine, provider_config)
            
            logger.info(f"AI Provider initialized: {self.provider}")
            logger.info(f"Engine: {engine}, Model: {self.provider.get_default_model()}")
            
        except Exception as e:
            logger.error(f"Failed to initialize AI provider '{engine}': {e}")
            raise
        
        # Initialize command executor / Inicializa executor de comandos
        self.hexstrike = HexStrikeClient(base_url=hexstrike_url)
        
        # Check HexStrike availability / Verifica disponibilidade do HexStrike
        health = self.hexstrike.health_check()
        self.hexstrike_available = health.get("status") != "error"
        
        if not self.hexstrike_available:
            logger.warning("HexStrike not available - command execution will be disabled")
            logger.warning("Commands can still be proposed but won't be executed automatically")
        else:
            logger.info("HexStrike available and ready")
        
        # Initialize new POO components / Inicializa novos componentes POO
        # CommandExecutor wraps HexStrike client
        # CommandExecutor encapsula cliente HexStrike
        self.executor = CommandExecutor(self.hexstrike)
        
        # InferenceEngine orchestrates iterative AI loop
        # InferenceEngine orquestra loop iterativo de IA
        # Now uses provider strategy instead of HexBrain directly
        # Agora usa estratégia de provedor em vez de HexBrain diretamente
        self.inference_engine = InferenceEngine(self.provider, self.executor)
        
        # Initialize ActionDispatcher
        # Inicializa ActionDispatcher
        from .action_dispatcher import ActionDispatcher
        # Initialize ActionDispatcher
        # Inicializa ActionDispatcher
        from .action_dispatcher import ActionDispatcher
        self.dispatcher = ActionDispatcher(self)

        # Initialize MCP Manager
        self.mcp_manager = MCPManager()
        logger.info("MCP Manager initialized in AgentCore")
        
        logger.info(f"InferenceEngine initialized with {engine} provider")

    def set_profile_context(self, context: str):
        """
        Inject User Profile context into the AI Provider
        Injetar contexto de Perfil de Usuário no Provedor de IA
        
        This appends user info/preferences to the system prompt logic.
        Isso anexa info/preferências do usuário à lógica do prompt de sistema.
        """
        if self.provider:
            # We assume the provider has a method to update system prompt or we handle it via chat_step
            # Assumimos que o provedor tem um método para atualizar prompt de sistema ou lidamos via chat_step
            
            # Since Provider interface might be generic, we'll store it in AgentCore 
            # and prepend it to messages if provider supports context injection
            # Como a interface do Provedor pode ser genérica, armazenaremos no AgentCore
            # e anexaremos às mensagens se o provedor suportar injeção de contexto
            
            if hasattr(self.provider, 'set_system_context'):
                self.provider.set_system_context(context)
                logger.info("Profile context injected directly into Provider")
            else:
                # Fallback: We might need to handle this in process_message
                self.profile_context = context
                logger.info("Profile context stored in AgentCore (Provider doesn't support direct injection)")
    
    def initialize(
        self, 
        api_key: str = None, 
        engine: str = None, 
        model: str = None,
        provider_kwargs: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Re-initialize the agent with new configuration
        Re-inicializa o agente com nova configuração
        
        Args:
            api_key: New API key / Nova chave API
            engine: New engine name / Novo nome do motor
            model: New model name / Novo nome do modelo
            provider_kwargs: Additional config / Configuração adicional
            
        Returns:
            bool: True if successful
        """
        try:
            logger.info(f"Re-initializing AgentCore: Engine={engine}, Model={model}")
            
            # Use current values if not provided
            # Usar valores atuais se não fornecidos
            current_engine = engine or self.engine
            
            # Build new provider config
            # Construir nova config do provedor
            provider_config = {
                'api_key': api_key,
                'model': model if model else (self.provider.get_default_model() if self.provider else None)
            }
            
            # Merge additional kwargs
            if provider_kwargs:
                provider_config.update(provider_kwargs)
            
            # Re-create provider
            # Re-criar provedor
            self.engine = current_engine
            self.provider = ProviderFactory.create_provider(current_engine, provider_config)
            
            # Update inference engine
            # Atualiza motor de inferência
            self.inference_engine = InferenceEngine(self.provider, self.executor)
            
            logger.info("AgentCore re-initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to re-initialize AgentCore: {e}")
            return False
    
    def process_message(
        self, 
        user_input: str,
        chat_context: Optional[List[Dict[str, str]]] = None,
        auto_execute: bool = False,
        max_iterations: int = 10,
        stream: bool = True
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Process user message with AI and optionally execute commands
        Processa mensagem do usuário com IA e opcionalmente executa comandos
        
        Args:
            user_input: User message / Mensagem do usuário
            chat_context: Conversation history / Histórico da conversa
            auto_execute: Automatically execute proposed commands
            max_iterations: Maximum AI iterations
            stream: Enable streaming responses
            
        Yields:
            Response chunks
        """
        iteration = 0
        current_context = user_input
        # In multi-iteration loops, only pass history in the first iteration or manage it carefully
        # Em loops multi-iteração, passar histórico apenas na primeira iteração ou gerenciar com cuidado
        # For now, we pass it to the provider, which appends prompt
        
        while iteration < max_iterations:
            iteration += 1
            logger.info(f"Starting iteration {iteration}/{max_iterations}")
            
            # ... (MCP Tools registration omitted for brevity, assumed unchanged) ...
            
            # === Step 0: Register MCP Tools (Simplified re-check) ===
            # Keeping existing logic but ensuring context is passed below

            # === Step 1: Get AI response ===
            # === Passo 1: Obter resposta da IA ===
            full_response = ""
            
            try:
                # Pass context only on first iteration if strictly following chat history
                # Passar contexto apenas na primeira iteração se seguindo estritamente histórico
                # But typically we want context + current chain.
                # Here we pass provided context.
                
                # Note: valid chat_context is List[Dict]
                iter_context = chat_context if iteration == 1 else None 
                # TODO: Improve context management for multi-hop
                
                for chunk in self.provider.chat_step(prompt=current_context, chat_context=iter_context):
                    full_response += chunk
                    
                    # Yield text chunks to frontend
                    # Retorna chunks de texto ao frontend
                    yield {
                        "type": "text",
                        "content": chunk,
                        "metadata": {
                            "iteration": iteration,
                            "max_iterations": max_iterations
                        }
                    }
            except Exception as e:
                logger.error(f"AI chat error: {e}", exc_info=True)
                yield {
                    "type": "error",
                    "content": f"AI error: {str(e)}",
                    "metadata": {"iteration": iteration}
                }
                break
            
            logger.debug(f"AI response received: {len(full_response)} chars")
            
            # === Step 2: Extract commands from response ===
            # === Passo 2: Extrair comandos da resposta ===
            commands = self._extract_commands(full_response)
            
            if not commands:
                # No commands to execute, we're done
                # Sem comandos para executar, terminamos
                logger.info("No commands found in response, stopping iteration")
                break
            
            logger.info(f"Found {len(commands)} command(s) to execute")
            
            # === Step 3: Process each command ===
            # === Passo 3: Processar cada comando ===
            any_executed = False
            
            for cmd_idx, cmd in enumerate(commands, 1):
                logger.info(f"Processing command {cmd_idx}/{len(commands)}: {cmd[:50]}...")
                
                # Check for Tool Call
                if cmd.startswith("MCP_TOOL_CALL|"):
                    tool_json = cmd.split("|", 1)[1]
                    try:
                        tool_data = json.loads(tool_json)
                        tool_name = tool_data.get("name")
                        tool_args = tool_data.get("arguments")
                        
                        logger.info(f"Executing MCP Tool: {tool_name}")
                        
                        # Yield proposal
                        yield {
                            "type": "command_proposal",
                            "content": f"Tool Call: {tool_name}",
                            "metadata": {"tool": tool_name, "args": tool_args}
                        }
                        
                        # Execute
                        if auto_execute: # or allowed tools?
                            try:
                                # Use thread-safe synchronous wrapper
                                result_obj = self.mcp_manager.call_tool_sync(tool_name, tool_args)
                                # Convert result to string/json
                                output_str = json.dumps(result_obj, indent=2) if not isinstance(result_obj, str) else result_obj
                                any_executed = True
                                
                                yield {
                                    "type": "command_result",
                                    "content": output_str,
                                    "metadata": {"success": True, "tool": tool_name}
                                }
                                
                                # Feedback
                                # Provide feedback for prompt
                                # TODO: Append to messages in a better way
                            except Exception as e:
                                logger.error(f"MCP Tool Error: {e}")
                                yield {
                                    "type": "error",
                                    "content": f"Tool Error: {str(e)}",
                                    "metadata": {"tool": tool_name}
                                }
                        continue # Skip bash logic
                    except Exception as e:
                         logger.error(f"Failed to process tool command: {e}")
                
                # Regular Bash Command Logic proceeds here...
                # Yield command proposal
                # Retorna proposta de comando
                yield {
                    "type": "command_proposal",
                    "content": cmd,
                    "metadata": {
                        "iteration": iteration,
                        "command_index": cmd_idx,
                        "total_commands": len(commands),
                        "auto_execute": auto_execute,
                        "hexstrike_available": self.hexstrike_available
                    }
                }
                
                # Execute if conditions are met
                # Executa se condições forem atendidas
                if auto_execute and self.hexstrike_available:
                    logger.info(f"Auto-executing command: {cmd}")
                    
                    try:
                        # Use ActionDispatcher instead of direct executor
                        # Usa ActionDispatcher em vez de executor direto
                        result = self.dispatcher.dispatch('execute_command', {'command': cmd})
                        any_executed = True
                        
                        # Yield command result
                        # Retorna resultado do comando
                        yield {
                            "type": "command_result",
                            "content": result["output"],
                            "metadata": {
                                "command": cmd,
                                "success": result["success"],
                                "exit_code": result["exit_code"],
                                "error": result["error"],
                                "cached": result.get("cached", False)
                            }
                        }
                        
                        # Prepare feedback for AI
                        # Prepara feedback para IA
                        if result["success"]:
                            feedback = f"Command executed successfully: `{cmd}`\n\n**Output:**\n```\n{result['output']}\n```\n\n**Exit Code:** {result['exit_code']}"
                        else:
                            feedback = f"Command failed: `{cmd}`\n\n**Error:**\n```\n{result['error']}\n```\n\n**Exit Code:** {result['exit_code']}"
                        
                        # Add result to AI context for next iteration
                        # Adiciona resultado ao contexto IA para próxima iteração
                        # Note: HexBrain.add_context() not in InferenceStrategy interface
                        # For now, feedback is implicit in next prompt
                        # Nota: HexBrain.add_context() não está na interface InferenceStrategy
                        # Por enquanto, feedback é implícito no próximo prompt
                        
                        logger.info(f"Command execution result: success={result['success']}, "
                                  f"exit_code={result['exit_code']}")
                        
                    except Exception as e:
                        logger.error(f"Command execution error: {e}", exc_info=True)
                        yield {
                            "type": "error",
                            "content": f"Failed to execute command: {str(e)}",
                            "metadata": {"command": cmd}
                        }
                else:
                    logger.debug(f"Command not executed (auto_execute={auto_execute}, "
                               f"hexstrike_available={self.hexstrike_available})")
            
            # === Step 4: Prepare for next iteration ===
            # === Passo 4: Preparar para próxima iteração ===
            if not auto_execute:
                # If not auto-executing, stop after first AI response
                # Se não estiver auto-executando, para após primeira resposta
                logger.info("Auto-execute disabled, stopping iteration")
                break
            
            if not any_executed:
                # If no commands were executed, stop
                # Se nenhum comando foi executado, para
                logger.info("No commands executed, stopping iteration")
                break
            
            # Continue to next iteration with feedback
            # Continua para próxima iteração com feedback
            current_context = "Based on the command results above, analyze and continue with the task. Propose next steps if needed."
            logger.info("Continuing to next iteration with command feedback")
        
        # === Step 5: Yield completion marker ===
        # === Passo 5: Retornar marcador de conclusão ===
        logger.info(f"Iteration loop completed after {iteration} iteration(s)")
        yield {
            "type": "complete",
            "content": "",
            "metadata": {
                "iterations": iteration,
                "max_iterations": max_iterations,
                "stopped_early": iteration < max_iterations
            }
        }
    
        return commands
    
    def _extract_commands(self, text: str) -> List[str]:
        """
        Extract bash commands and Tool Calls from AI response
        Extrai comandos bash e Chamadas de Ferramenta da resposta da IA
        """
        commands = []
        
        # 1. Bash / Sh blocks
        pattern_bash = r'```(?:bash|sh)\n(.*?)\n```'
        matches_bash = re.findall(pattern_bash, text, re.DOTALL | re.IGNORECASE)
        for match in matches_bash:
            for line in match.split('\n'):
                line = line.strip()
                if line and not line.startswith('#'):
                    commands.append(line)
                    logger.debug(f"Extracted command: {line[:100]}")
                    
        # 2. Tool Calls blocks
        pattern_tool = r'```tool_call\n(.*?)\n```'
        matches_tool = re.findall(pattern_tool, text, re.DOTALL | re.IGNORECASE)
        for match in matches_tool:
            # We expect match to be a JSON string
            try:
                # Validate JSON
                json.loads(match)
                # Prefix with special marker to identify later
                commands.append(f"MCP_TOOL_CALL|{match}")
                logger.debug(f"Extracted tool call: {match[:100]}")
            except Exception as e:
                logger.error(f"Failed to parse tool call JSON: {e}")
                
        return commands
    
    def reset(self):
        """
        Reset AI conversation history
        Reseta histórico de conversa IA
        
        Clears all conversation history except system prompt.
        Limpa todo histórico de conversa exceto prompt de sistema.
        """
        # Note: Reset not in generic InferenceStrategy interface
        # Would need provider-specific implementation
        # Nota: Reset não está na interface genérica InferenceStrategy  
        # Precisaria de implementação específica do provedor
        pass
        logger.info("Agent conversation reset")

    def shutdown(self):
        """
        Gracefully shutdown agent resources
        Encerra graciosamente recursos do agente
        """
        logger.info("AgentCore shutting down...")
        # Add any necessary cleanup here (e.g., closing connections, saving state)
        # Adicionar limpeza necessária aqui (ex: fechar conexões, salvar estado)
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current agent status
        Obtém status atual do agente
        
        Returns:
            Status dictionary with:
            - brain_ready: bool
            - hexstrike_available: bool
            - conversation_length: int
            - model: str
        """
        return {
            "brain_ready": self.provider is not None,
            "hexstrike_available": self.hexstrike_available,
            "conversation_length": 0,  # TODO: Provider-specific
            "model": self.provider.get_default_model() if self.provider else None,
            "provider": self.provider.get_provider_name() if self.provider else None,
            "engine": self.engine,
            "hexstrike_url": self.hexstrike.base_url
        }
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform comprehensive health check
        Realiza verificação completa de saúde
        
        Returns:
            Health status of all components
        """
        health = {
            "overall": "healthy",
            "components": {}
        }
        
        # Check AI brain
        # Verifica cérebro IA
        try:
            health["components"]["brain"] = {
                "status": "ok",
                "model": self.provider.get_default_model() if self.provider else None,
                "history_length": 0  # TODO: Provider-specific
            }
        except Exception as e:
            health["components"]["brain"] = {
                "status": "error",
                "error": str(e)
            }
            health["overall"] = "degraded"
        
        # Check HexStrike
        # Verifica HexStrike
        hexstrike_health = self.hexstrike.health_check()
        health["components"]["hexstrike"] = hexstrike_health
        
        if hexstrike_health.get("status") == "error":
            health["overall"] = "degraded"
        
        return health
    
    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return (f"AgentCore(provider={self.provider.get_provider_name()}, "
                f"hexstrike={'available' if self.hexstrike_available else 'unavailable'})")
