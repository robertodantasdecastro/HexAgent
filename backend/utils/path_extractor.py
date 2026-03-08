"""
Path Extraction Utility
Utilidade de Extração de Caminho

This module provides utilities to extract file paths and project context
from user prompts for intelligent file management.

Este módulo fornece utilidades para extrair caminhos de arquivo e contexto
de projeto de prompts do usuário para gerenciamento inteligente de arquivos.

Author: Roberto Dantas de Castro
License: MIT
"""

import re
from typing import Optional, Dict, Tuple


class PathExtractor:
    """
    Extract file paths and project context from user prompts
    Extrair caminhos de arquivo e contexto de projeto de prompts do usuário
    """
    
    # Patterns for path extraction / Padrões para extração de caminho
    PATH_PATTERNS = [
        # "save to ./path/file.py"
        r'save\s+(?:to|in|at)\s+([^\s]+)',
        # "create in ~/directory/"
        r'create\s+(?:in|at)\s+([^\s]+)',
        # "write to /absolute/path"
        r'write\s+(?:to|in)\s+([^\s]+)',
        # "put in ./folder/"
        r'put\s+(?:in|at)\s+([^\s]+)',
        # "add to project_name"
        r'add\s+to\s+(?:project\s+)?([a-zA-Z0-9_-]+)',
    ]
    
    PROJECT_PATTERNS = [
        # "for project myapp"
        r'for\s+project\s+([a-zA-Z0-9_-]+)',
        # "in project myapp"
        r'in\s+project\s+([a-zA-Z0-9_-]+)',
        # "to project myapp"
        r'to\s+project\s+([a-zA-Z0-9_-]+)',
        # "project: myapp"
        r'project:\s*([a-zA-Z0-9_-]+)',
    ]
    
    @staticmethod
    def extract_path(prompt: str) -> Optional[str]:
        """
        Extract file path from user prompt
        Extrair caminho de arquivo do prompt do usuário
        
        Args:
            prompt: User input text / Texto de entrada do usuário
        
        Returns:
            Extracted path or None / Caminho extraído ou None
        
        Examples:
            "save to ./src/main.py" → "./src/main.py"
            "create in ~/scripts/" → "~/scripts/"
            "write the code" → None
        """
        prompt_lower = prompt.lower()
        
        for pattern in PathExtractor.PATH_PATTERNS:
            match = re.search(pattern, prompt_lower, re.IGNORECASE)
            if match:
                path = match.group(1).strip()
                # Remove trailing quotes if present
                # Remover aspas finais se presentes
                path = path.strip('"\'')
                return path
        
        return None
    
    @staticmethod
    def extract_project(prompt: str) -> Optional[str]:
        """
        Extract project name from user prompt
        Extrair nome do projeto do prompt do usuário
        
        Args:
            prompt: User input text / Texto de entrada do usuário
        
        Returns:
            Project name or None / Nome do projeto ou None
        
        Examples:
            "for project myapp" → "myapp"
            "add to my-project" → "my-project"
        """
        prompt_lower = prompt.lower()
        
        for pattern in PathExtractor.PROJECT_PATTERNS:
            match = re.search(pattern, prompt_lower, re.IGNORECASE)
            if match:
                project = match.group(1).strip()
                return project
        
        return None
    
    @staticmethod
    def extract_filename(prompt: str, code_content: str = "") -> Optional[str]:
        """
        Extract or suggest filename from prompt or code content
        Extrair ou sugerir nome de arquivo do prompt ou conteúdo do código
        
        Args:
            prompt: User prompt / Prompt do usuário
            code_content: Generated code / Código gerado
        
        Returns:
            Suggested filename / Nome de arquivo sugerido
        """
        # Try to extract filename from path
        # Tentar extrair nome de arquivo do caminho
        path = PathExtractor.extract_path(prompt)
        if path:
            # If path ends with a filename, extract it
            # Se caminho termina com nome de arquivo, extrair
            if '/' in path and not path.endswith('/'):
                return path.split('/')[-1]
        
        # Try to detect from code content
        # Tentar detectar do conteúdo do código
        if code_content:
            # Python files
            if 'def ' in code_content or 'class ' in code_content or 'import ' in code_content:
                return 'script.py'
            # Shell scripts
            if code_content.strip().startswith('#!'):
                return 'script.sh'
            # JavaScript
            if 'function ' in code_content or 'const ' in code_content or 'let ' in code_content:
                return 'script.js'
        
        # Default fallback
        return None
    
    @staticmethod
    def analyze_prompt(prompt: str, code_content: str = "") -> Dict[str, Optional[str]]:
        """
        Comprehensive prompt analysis for file management
        Análise abrangente de prompt para gerenciamento de arquivos
        
        Args:
            prompt: User prompt / Prompt do usuário
            code_content: Generated code / Código gerado
        
        Returns:
            Dict with path, project, and filename suggestions
            Dict com sugestões de path, project e filename
        """
        return {
            'path': PathExtractor.extract_path(prompt),
            'project': PathExtractor.extract_project(prompt),
            'filename': PathExtractor.extract_filename(prompt, code_content),
            'is_temp': 'temp' in prompt.lower() or 'temporary' in prompt.lower(),
            'make_executable': ('script' in prompt.lower() or 
                              (code_content and code_content.strip().startswith('#!')))
        }


# Convenience functions / Funções de conveniência

def extract_file_info(prompt: str, code: str = "") -> Tuple[Optional[str], Optional[str], Dict]:
    """
    Extract all file information from prompt
    Extrair todas as informações de arquivo do prompt
    
    Returns:
        Tuple of (path, filename, metadata)
    """
    analysis = PathExtractor.analyze_prompt(prompt, code)
    
    path = analysis['path']
    filename = analysis['filename']
    
    metadata = {
        'project': analysis['project'],
        'is_temp': analysis['is_temp'],
        'make_executable': analysis['make_executable']
    }
    
    return path, filename, metadata
