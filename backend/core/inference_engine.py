"""
InferenceEngine - Iterative AI Inference with Command Execution
Motor de Inferência - Inferência Iterativa de IA com Execução de Comandos

Manages the core autonomous agentic loop that combines AI reasoning with
command execution feedback for task completion.

Gerencia o loop agêntico autônomo central que combina raciocínio de IA com
feedback de execução de comandos para conclusão de tarefas.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (AgentCore Integration)
"""

import logging
import json
from typing import Generator, Dict, Any, Optional
from .response_parser import ResponseParser
from .command_executor import CommandExecutor


class InferenceEngine:
    """
    Iterative AI inference engine with command execution feedback
    Motor de inferência iterativa de IA com feedback de execução de comandos
    
    Implements the autonomous agentic loop:
    1. Send prompt to AI
    2. Parse response for commands
    3. Execute commands (if auto_execute=True)
    4. Build feedback with execution results
    5. Repeat until task complete or max iterations reached
    
    Implementa o loop agêntico autônomo:
    1. Enviar prompt para IA
    2. Analisar resposta para comandos
    3. Executar comandos (se auto_execute=True)
    4. Construir feedback com resultados de execução
    5. Repetir até tarefa completa ou máximo de iterações atingido
    """
    
    def __init__(self, brain, executor: CommandExecutor):
        """
        Initialize InferenceEngine
        Inicializa InferenceEngine
        
        Args / Argumentos:
            brain: HexBrain instance for AI

 inference
                  Instância HexBrain para inferência de IA
            executor (CommandExecutor): Command executor instance
                                       Instância do executor de comandos
        """
        self.brain = brain
        self.executor = executor
        self.parser = ResponseParser()
        self.logger = logging.getLogger(__name__)
    
    def process_request(self, 
                       prompt: str,
                       max_iterations: int = 10,
                       auto_execute: bool = True,
                       unlimited: bool = False) -> Generator[Dict[str, Any], None, None]:
        """
        Process AI request with iterative feedback loop
        Processa requisição de IA com loop iterativo de feedback
        
        This is the main entry point for the inference engine. It yields
        chunks for SSE streaming to the frontend.
        
        Este é o ponto de entrada principal para o motor de inferência. Ele
        produz chunks para streaming SSE para o frontend.
        
        Args / Argumentos:
            prompt (str): User's initial prompt / Prompt inicial do usuário
            max_iterations (int): Maximum number of iterations
                                Número máximo de iterações
            auto_execute (bool): Whether to auto-execute proposed commands
                               Se deve auto-executar comandos propostos
            unlimited (bool): If True, run indefinitely (use with caution)
                            Se True, executa indefinidamente (usar com cautela)
        
        Yields / Produz:
            Dict[str, Any]: SSE chunks for frontend / Chunks SSE para frontend
            Types of chunks / Tipos de chunks:
            - {"chunk": str} - Text output / Saída de texto
            - {"proposal": str} - Command proposal / Proposta de comando
            - {"type": "shell_output", ...} - Shell execution result
            - {"limit_reached": bool} - Iteration limit reached
        """
        # Set actual limit / Definir limite real
        # If unlimited, use high number (1000) as safety
        # Se ilimitado, usar número alto (1000) como segurança
        actual_limit = 1000 if unlimited else max_iterations
        
        iteration = 0
        conversation_history = prompt
        
        self.logger.info(f"Starting inference: max_iterations={actual_limit}, auto_execute={auto_execute}")
        
        while iteration < actual_limit:
            iteration += 1
            
            # Yield iteration marker for iterations > 1
            # Produzir marcador de iteração para iterações > 1
            if iteration > 1:
                display_limit = "∞" if unlimited else max_iterations
                yield {
                    "chunk": f"\n\n{'='*60}\n🔄 Iteração {iteration}/{display_limit}\n{'='*60}\n\n"
                }
            
            # Step 1: Get AI response / Passo 1: Obter resposta da IA
            full_response = ""
            try:
                for chunk in self.brain.chat_step(conversation_history):
                    full_response += chunk
                    yield {"chunk": chunk}
            except Exception as e:
                self.logger.error(f"AI inference error: {e}")
                yield {"chunk": f"\n❌ Erro na inferência: {str(e)}\n"}
                break
            
            # Step 2: Parse response / Passo 2: Analisar resposta
            parsed = self.parser.parse_full_response(full_response)
            
            # Check if task is complete / Verificar se tarefa está completa
            if parsed['completed']:
                yield {"chunk": "\n✅ Tarefa concluída pelo agente!\n"}
                break
            
            # If no commands found, AI gave final answer / Se nenhum comando encontrado, IA deu resposta final
            if not parsed['has_commands']:
                self.logger.info("No commands found in response, ending loop")
                break
            
            # Step 3: Handle commands based on auto_execute
            # Passo 3: Tratar comandos baseado em auto_execute
            if not auto_execute:
                # Send proposals and stop / Enviar propostas e parar
                self.logger.info(f"auto_execute=False, sending {len(parsed['commands'])} proposals")
                for cmd in parsed['commands']:
                    yield {"proposal": cmd}
                # Stop loop here, waiting for user action
                # Parar loop aqui, aguardando ação do usuário
                break
            
            # Step 4: Execute commands (auto_execute=True)
            # Passo 4: Executar comandos (auto_execute=True)
            if not self.executor.is_available():
                yield {"chunk": "\n⚠️ HexStrike offline - comandos não executados\n"}
                break
            
            execution_summary = ""
            for cmd in parsed['commands']:
                # Execute command / Executar comando
                result = self.executor.execute_command(cmd)
                
                # Send as shell output block / Enviar como bloco de saída shell
                sse_chunk = self.executor.format_for_sse(
                    cmd, result, iteration, actual_limit if not unlimited else 0
                )
                yield sse_chunk
                
                # Build execution summary for AI feedback
                # Construir resumo de execução para feedback da IA
                status = "✅ Sucesso" if result['success'] else "❌ Falhou"
                execution_summary += f"\nComando: {cmd}\n"
                execution_summary += f"Status: {status}\n"
                execution_summary += f"Resultado: {result['stdout'][:500]}\n"
                
                if not result['success']:
                    execution_summary += f"Erro: {result['error']}\n"
            
            # Step 5: Prepare feedback for next iteration
            # Passo 5: Preparar feedback para próxima iteração
            conversation_history = f"""{prompt}

[Histórico de Execução - Iteração {iteration}]:
{execution_summary}

Analise os resultados acima. Se a tarefa original ainda não está completa, sugira o PRÓXIMO comando necessário. Se a tarefa está completa, responda 'Tarefa concluída' e resuma o que foi feito."""
        
        # Loop ended - check if limit reached
        # Loop terminou - verificar se limite atingido
        if iteration >= actual_limit:
            self.logger.warning(f"Iteration limit reached: {actual_limit}")
            yield {"chunk": f"\n⚠️ Limite de {actual_limit} iterações atingido.\n"}
            yield {"limit_reached": True, "iterations": actual_limit}
    
    def process_single_inference(self, prompt: str) -> Dict[str, Any]:
        """
        Process a single AI inference without iteration loop
        Processa uma única inferência de IA sem loop de iteração
        
        Useful for simple Q&A without command execution.
        Útil para perguntas e respostas simples sem execução de comandos.
        
        Args / Argumentos:
            prompt (str): User prompt / Prompt do usuário
        
        Returns / Retorna:
            Dict[str, Any]: AI response data / Dados de resposta da IA
        """
        try:
            full_response = ""
            for chunk in self.brain.chat_step(prompt):
                full_response += chunk
            
            parsed = self.parser.parse_full_response(full_response)
            
            return {
                'success': True,
                'response': full_response,
                'parsed': parsed
            }
        except Exception as e:
            self.logger.error(f"Single inference error: {e}")
            return {
                'success': False,
                'error': str(e)
            }
