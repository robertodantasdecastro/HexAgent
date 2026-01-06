"""
FileManager - Centralized file operations manager
Gerenciador de operações de arquivos centralizado

This module provides a unified interface for all file operations in HexAgentGUI,
with intelligent path resolution, safety checks, and backup mechanisms.

Este módulo fornece uma interface unificada para todas as operações de arquivo
no HexAgentGUI, com resolução inteligente de caminhos, verificações de segurança
e mecanismos de backup.

Author: Roberto Dantas de Castro
License: MIT
"""

import os
import shutil
import difflib
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, List, Tuple


class FileManager:
    """
    Manages all file operations with workspace awareness and safety checks
    Gerencia todas as operações de arquivo com consciência de workspace e verificações de segurança
    
    Responsibilities / Responsabilidades:
    - File creation and writing / Criação e escrita de arquivos
    - Path resolution and validation / Resolução e validação de caminhos
    - Permission management / Gerenciamento de permissões
    - File backup and versioning / Backup e versionamento de arquivos
    - Diff generation for overwrites / Geração de diff para sobrescritas
    """
    
    def __init__(self, workspace_root: str = "~/.hexagent-gui"):
        """
        Initialize FileManager with workspace configuration
        Inicializar FileManager com configuração de workspace
        
        Args:
            workspace_root: Root directory for all HexAgent files
                           Diretório raiz para todos os arquivos do HexAgent
        """
        self.workspace_root = Path(workspace_root).expanduser()
        self.tmp_dir = self.workspace_root / "tmp" / "files"
        self.downloads_dir = self.workspace_root / "downloads"
        self.projects_dir = self.workspace_root / "projects"
        self.backups_dir = self.workspace_root / "backups"
        
        # Ensure directories exist / Garantir que diretórios existam
        self._ensure_directories()
    
    def _ensure_directories(self) -> None:
        """
        Create necessary directories if they don't exist
        Criar diretórios necessários se não existirem
        """
        for directory in [self.tmp_dir, self.downloads_dir, self.projects_dir, self.backups_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def resolve_path(
        self, 
        user_path: Optional[str], 
        filename: str, 
        is_temp: bool = False,
        context: Optional[str] = None
    ) -> Path:
        """
        Resolve target path based on user input with intelligent defaults
        Resolver caminho de destino baseado na entrada do usuário com padrões inteligentes
        
        Args:
            user_path: User-specified path (can be relative or absolute)
                      Caminho especificado pelo usuário (pode ser relativo ou absoluto)
            filename: Filename to save / Nome do arquivo para salvar
            is_temp: Whether this is a temporary file / Se é um arquivo temporário
            context: Optional context (e.g., project name) / Contexto opcional (ex: nome do projeto)
        
        Returns:
            Resolved absolute Path object / Objeto Path absoluto resolvido
        """
        if user_path:
            # User specified a path / Usuário especificou caminho
            path = Path(user_path).expanduser()
            
            if path.is_absolute():
                # Absolute path - resolve to file or directory
                # Caminho absoluto - resolver para arquivo ou diretório
                if path.suffix:  # Has extension, likely a file
                    return path
                else:  # Directory
                    return path / filename
            else:
                # Relative path - resolve from downloads or context
                # Caminho relativo - resolver de downloads ou contexto
                if context:
                    base = self.projects_dir / context
                else:
                    base = self.downloads_dir
                
                # Check if path includes filename
                if path.suffix:
                    return base / path
                else:
                    return base / path / filename
        else:
            # No path specified - use intelligent defaults
            # Sem caminho especificado - usar padrões inteligentes
            if is_temp:
                return self.tmp_dir / filename
            elif context:
                return self.projects_dir / context / filename
            else:
                return self.downloads_dir / filename
    
    def write_file(
        self, 
        content: str, 
        filename: str, 
        user_path: Optional[str] = None,
        overwrite: bool = False,
        create_backup: bool = True,
        is_temp: bool = False,
        make_executable: bool = False,
        context: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Write content to file with comprehensive safety checks
        Escrever conteúdo em arquivo com verificações de segurança abrangentes
        
        Args:
            content: File content to write / Conteúdo do arquivo para escrever
            filename: Name of the file / Nome do arquivo
            user_path: Optional user-specified path / Caminho opcional especificado pelo usuário
            overwrite: Allow overwriting existing files / Permitir sobrescrever arquivos existentes
            create_backup: Create backup before overwriting / Criar backup antes de sobrescrever
            is_temp: Mark as temporary file / Marcar como arquivo temporário
            make_executable: Set execute permissions / Definir permissões de execução
            context: Optional context (project name) / Contexto opcional (nome do projeto)
        
        Returns:
            Dict with operation result and metadata
            Dict com resultado da operação e metadados
        """
        try:
            target_path = self.resolve_path(user_path, filename, is_temp, context)
            
            # Check if file exists / Verificar se arquivo existe
            if target_path.exists() and not overwrite:
                return {
                    "success": False,
                    "error": "file_exists",
                    "path": str(target_path),
                    "message": f"File already exists: {target_path}. Use overwrite=True to replace."
                }
            
            # Create backup if overwriting existing file
            # Criar backup se sobrescrevendo arquivo existente
            backup_path = None
            if target_path.exists() and create_backup:
                backup_path = self._create_backup(target_path)
            
            # Ensure parent directory exists / Garantir que diretório pai existe
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file / Escrever arquivo
            target_path.write_text(content, encoding='utf-8')
            
            # Set execute permission if requested
            # Definir permissão de execução se solicitado
            if make_executable:
                os.chmod(target_path, 0o755)
            
            return {
                "success": True,
                "path": str(target_path),
                "size": len(content),
                "backup": str(backup_path) if backup_path else None,
                "is_temp": is_temp,
                "executable": make_executable
            }
            
        except PermissionError as e:
            return {
                "success": False,
                "error": "permission_denied",
                "message": f"Permission denied: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": "write_failed",
                "message": f"Write failed: {str(e)}"
            }
    
    def _create_backup(self, file_path: Path) -> Path:
        """
        Create timestamped backup of file in backups directory
        Criar backup com timestamp do arquivo no diretório de backups
        
        Args:
            file_path: Path to file to backup / Caminho do arquivo para backup
        
        Returns:
            Path to created backup / Caminho do backup criado
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"{file_path.stem}.backup_{timestamp}{file_path.suffix}"
        
        # Organize backups by date / Organizar backups por data
        date_dir = self.backups_dir / datetime.now().strftime("%Y-%m-%d")
        date_dir.mkdir(parents=True, exist_ok=True)
        
        backup_path = date_dir / backup_filename
        shutil.copy2(file_path, backup_path)
        
        return backup_path
    
    def get_diff(self, file_path: str, new_content: str) -> Optional[Dict[str, any]]:
        """
        Generate unified diff between existing file and new content
        Gerar diff unificado entre arquivo existente e novo conteúdo
        
        Args:
            file_path: Path to existing file / Caminho do arquivo existente
            new_content: New content to compare / Novo conteúdo para comparar
        
        Returns:
            Dict with diff information or None if file doesn't exist
            Dict com informações de diff ou None se arquivo não existe
        """
        path = Path(file_path).expanduser()
        
        if not path.exists():
            return None
        
        try:
            old_content = path.read_text(encoding='utf-8')
            old_lines = old_content.splitlines(keepends=True)
            new_lines = new_content.splitlines(keepends=True)
            
            # Generate unified diff / Gerar diff unificado
            diff_lines = list(difflib.unified_diff(
                old_lines, 
                new_lines,
                fromfile=f"{path.name} (existing)",
                tofile=f"{path.name} (new)",
                lineterm=''
            ))
            
            # Count changes / Contar mudanças
            additions = sum(1 for line in diff_lines if line.startswith('+') and not line.startswith('+++'))
            deletions = sum(1 for line in diff_lines if line.startswith('-') and not line.startswith('---'))
            
            return {
                "has_changes": len(diff_lines) > 0,
                "diff": '\n'.join(diff_lines),
                "additions": additions,
                "deletions": deletions,
                "old_size": len(old_content),
                "new_size": len(new_content)
            }
            
        except Exception as e:
            return {
                "error": f"Failed to generate diff: {str(e)}"
            }
    
    def read_file(self, file_path: str) -> Optional[Dict[str, any]]:
        """
        Read file content with metadata
        Ler conteúdo do arquivo com metadados
        
        Args:
            file_path: Path to file / Caminho do arquivo
        
        Returns:
            Dict with content and metadata / Dict com conteúdo e metadados
        """
        path = Path(file_path).expanduser()
        
        if not path.exists():
            return {
                "success": False,
                "error": "file_not_found",
                "path": str(path)
            }
        
        try:
            content = path.read_text(encoding='utf-8')
            stat = path.stat()
            
            return {
                "success": True,
                "path": str(path),
                "content": content,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "is_executable": os.access(path, os.X_OK)
            }
        except Exception as e:
            return {
                "success": False,
                "error": "read_failed",
                "message": str(e)
            }
    
    def delete_file(self, file_path: str, create_backup: bool = True) -> Dict[str, any]:
        """
        Delete file with optional backup
        Deletar arquivo com backup opcional
        
        Args:
            file_path: Path to file to delete / Caminho do arquivo para deletar
            create_backup: Create backup before deleting / Criar backup antes de deletar
        
        Returns:
            Operation result / Resultado da operação
        """
        path = Path(file_path).expanduser()
        
        if not path.exists():
            return {
                "success": False,
                "error": "file_not_found",
                "path": str(path)
            }
        
        try:
            backup_path = None
            if create_backup:
                backup_path = self._create_backup(path)
            
            path.unlink()
            
            return {
                "success": True,
                "path": str(path),
                "backup": str(backup_path) if backup_path else None
            }
        except Exception as e:
            return {
                "success": False,
                "error": "delete_failed",
                "message": str(e)
            }
    
    def list_backups(self, filename: Optional[str] = None) -> List[Dict]:
        """
        List available backups, optionally filtered by filename
        Listar backups disponíveis, opcionalmente filtrados por nome de arquivo
        
        Args:
            filename: Optional filename to filter / Nome de arquivo opcional para filtrar
        
        Returns:
            List of backup information / Lista de informações de backup
        """
        backups = []
        
        for date_dir in sorted(self.backups_dir.iterdir(), reverse=True):
            if not date_dir.is_dir():
                continue
            
            for backup_file in sorted(date_dir.iterdir(), reverse=True):
                if filename and not backup_file.name.startswith(filename.split('.')[0]):
                    continue
                
                stat = backup_file.stat()
                backups.append({
                    "filename": backup_file.name,
                    "path": str(backup_file),
                    "date": date_dir.name,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        return backups
