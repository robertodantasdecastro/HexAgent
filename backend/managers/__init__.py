"""
Backend Managers Module
Módulo de Gerenciadores do Backend

Provides manager classes for file and project operations.
Fornece classes gerenciadoras para operações de arquivo e projeto.
"""

from .file_manager import FileManager
from .project_manager import ProjectManager

__all__ = ['FileManager', 'ProjectManager']
