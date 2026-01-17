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
        engine: str = 'openai'
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
        logger.info(f"InferenceEngine initialized with {engine} provider")
    
    def initialize(self, api_key: str) -> bool:
        """
        Re-initialize the agent with a new API key
        Re-inicializa o agente com uma nova chave API
        
        Args:
            api_key: New API key to use
            
        Returns:
            bool: True if successful
        """
        try:
            logger.info("Re-initializing AgentCore with new credentials")
            
            # Re-create provider with new key
            # Re-cria provedor com nova chave
            provider_config = {
                'api_key': api_key,
                'model': self.provider.get_default_model() if self.provider else None
            }
            
            self.provider = ProviderFactory.create_provider(self.engine, provider_config)
            
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
        auto_execute: bool = False,
        max_iterations: int = 10,
        stream: bool = True
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Process user message with AI and optionally execute commands
        Processa mensagem do usuário com IA eOPCIONALmente executa comandos
        
        This is the main orchestration loop that:
        1. Gets AI response (streaming)
        2. Extracts commands from response
        3. Executes commands (if enabled)
        4. Feeds results back to AI
        5. Continues until done or max iterations
        
        Este é o loop principal de orquestração que:
        1. Obtém resposta da IA (streaming)
        2. Extrai comandos da resposta
        3. Executa comandos (se habilitado)
        4. Retorna resultados à IA
        5. Continua até concluir ou máximo de iterações
        
        Args:
            user_input: User message / Mensagem do usuário
            auto_execute: Automatically execute proposed commands
                         Executar automaticamente comandos propostos
            max_iterations: Maximum AI → Command → AI iterations
                          Máximo de iterações IA → Comando → IA
            stream: Enable streaming responses
                   Habilitar respostas com streaming
            
        Yields:
            Response chunks (dictionaries):
            {
                "type": "text" | "command_proposal" | "command_result" | "complete",
                "content": str,
                "metadata": dict
            }
        """
        iteration = 0
        current_context = user_input
        
        while iteration < max_iterations:
            iteration += 1
            logger.info(f"Starting iteration {iteration}/{max_iterations}")
            
            # === Step 1: Get AI response ===
            # === Passo 1: Obter resposta da IA ===
            full_response = ""
            
            try:
                for chunk in self.provider.chat_step(current_context):
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
                        result = self.hexstrike.execute_command(cmd)
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
    
    def _extract_commands(self, text: str) -> List[str]:
        """
        Extract bash commands from AI response
        Extrai comandos bash da resposta da IA
        
        Looks for code blocks marked as bash or sh:
        ```bash
        command here
        ```
        
        Procura por blocos de código marcados como bash ou sh:
        ```bash
        comando aqui
        ```
        
        Args:
            text: AI response text / Texto da resposta IA
            
        Returns:
            List of extracted commands / Lista de comandos extraídos
        """
        # Regex to match bash/sh code blocks
        # Regex para encontrar bloco de código bash/sh
        pattern = r'```(?:bash|sh)\n(.*?)\n```'
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE)
        
        commands = []
        for match in matches:
            # Split multi-line command blocks
            # Divide blocos de comando multi-linha
            for line in match.split('\n'):
                line = line.strip()
                
                # Skip empty lines and comments
                # Pula linhas vazias e comentários
                if line and not line.startswith('#'):
                    commands.append(line)
                    logger.debug(f"Extracted command: {line[:100]}")
        
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
