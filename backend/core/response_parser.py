"""
ResponseParser - AI Response Parsing Utilities
Utilitários de Análise de Respostas de IA

Extracts structured data from AI responses, particularly bash code blocks
from markdown fenced code blocks.

Extrai dados estruturados de respostas de IA, particularmente blocos de
código bash de blocos de código markdown.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 2.0.0 (AgentCore Integration)
"""

import re
from typing import List, Dict, Any


class ResponseParser:
    """
    Utility class for parsing AI responses
    Classe utilitária para analisar respostas de IA
    
    Provides static methods to extract structured content from AI-generated text.
    Fornece métodos estáticos para extrair conteúdo estruturado de texto gerado por IA.
    """
    
    @staticmethod
    def extract_bash_blocks(response: str) -> List[str]:
        """
        Extract bash code blocks from markdown fenced code blocks
        Extrai blocos de código bash de blocos de código markdown cercados
        
        Searches for ```bash\n...\n``` or ```\n...\n``` patterns and extracts
        the code content.
        
        Procura por padrões ```bash\n...\n``` ou ```\n...\n``` e extrai o
        conteúdo do código.
        
        Args / Argumentos:
            response (str): AI response text containing markdown code blocks
                          Texto de resposta da IA contendo blocos de código markdown
        
        Returns / Retorna:
            List[str]: List of extracted bash code blocks
                      Lista de blocos de código bash extraídos
        
        Example / Exemplo:
            >>> response = "Here's the solution:\n```bash\nls -la\n```"
            >>> ResponseParser.extract_bash_blocks(response)
            ['ls -la']
        """
        # Regex pattern to match markdown fenced code blocks
        # Padrão regex para corresponder blocos de código markdown cercados
        # Matches: ```bash\ncode\n```
        # Corresponde: ```bash\ncode\n```
        pattern = r'```(?:bash|sh|zsh)\n(.*?)\n```'
        
        # Use re.DOTALL to match across multiple lines
        # Usa re.DOTALL para corresponder em múltiplas linhas
        code_blocks = re.findall(pattern, response, re.DOTALL)
        
        return code_blocks
    
    @staticmethod
    def extract_commands_from_block(code_block: str) -> List[str]:
        """
        Extract individual commands from a bash code block
        Extrai comandos individuais de um bloco de código bash
        
        Splits a code block into individual commands, filtering out:
        - Empty lines / Linhas vazias
        - Comment-only lines (starting with #) / Linhas só de comentários
        
        Args / Argumentos:
            code_block (str): Bash code block content
                            Conteúdo do bloco de código bash
        
        Returns / Retorna:
            List[str]: List of individual commands
                      Lista de comandos individuais
        
        Example / Exemplo:
            >>> block = "# List files\nls -la\n# Change dir\ncd /tmp"
            >>> ResponseParser.extract_commands_from_block(block)
            ['ls -la', 'cd /tmp']
        """
        commands = []
        
        for line in code_block.split('\n'):
            # Strip whitespace / Remover espaços em branco
            line = line.strip()
            
            # Skip empty lines and comments / Pular linhas vazias e comentários
            if line and not line.startswith('#'):
                commands.append(line)
        
        return commands
    
    @staticmethod
    def detect_completion_phrases(response: str) -> bool:
        """
        Detect if AI response indicates task completion
        Detecta se a resposta da IA indica conclusão da tarefa
        
        Checks for common completion phrases in multiple languages.
        Verifica frases comuns de conclusão em múltiplos idiomas.
        
        Args / Argumentos:
            response (str): AI response text / Texto de resposta da IA
        
        Returns / Retorna:
            bool: True if completion detected / True se conclusão detectada
        
        Completion phrases / Frases de conclusão:
            - English: completed, done, finished, task complete
            - Portuguese: concluída, concluído, finalizado, pronto, tarefa completa
        """
        completion_phrases = [
            'tarefa concluída',
            'tarefa completa',
            'completed',
            'finalizado',
            'pronto',
            'done',
            'finished',
            'task complete',
            'task is complete',
            'all done'
        ]
        
        # Check if any completion phrase is in response (case-insensitive)
        # Verifica se alguma frase de conclusão está na resposta (insensível a maiúsculas)
        response_lower = response.lower()
        return any(phrase in response_lower for phrase in completion_phrases)
    
    @staticmethod
    def parse_full_response(response: str) -> Dict[str, Any]:
        """
        Parse full AI response into structured data
        Analisa resposta completa da IA em dados estruturados
        
        Extracts all relevant information from AI response:
        - Text content / Conteúdo de texto
        - Code blocks / Blocos de código
        - Individual commands / Comandos individuais
        - Completion status / Status de conclusão
        
        Args / Argumentos:
            response (str): Complete AI response / Resposta completa da IA
        
        Returns / Retorna:
            Dict[str, Any]: Structured response data / Dados de resposta estruturados
            {
                'text': str,              # Full response text
                'code_blocks': List[str], # Extracted code blocks
                'commands': List[str],    # All extracted commands
                'completed': bool         # Task completion status
            }
        """
        code_blocks = ResponseParser.extract_bash_blocks(response)
        
        # Extract all commands from all code blocks
        # Extrair todos os comandos de todos os blocos de código
        all_commands = []
        for block in code_blocks:
            commands = ResponseParser.extract_commands_from_block(block)
            all_commands.extend(commands)
        
        completed = ResponseParser.detect_completion_phrases(response)
        
        return {
            'text': response,
            'code_blocks': code_blocks,
            'commands': all_commands,
            'completed': completed,
            'has_commands': len(all_commands) > 0
        }
