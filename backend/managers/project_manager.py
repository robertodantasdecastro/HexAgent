"""
ProjectManager - Multi-file project management
Gerenciador de projetos com múltiplos arquivos

This module manages multi-file projects and workspaces, providing
project structure creation, file tree generation, and metadata management.

Este módulo gerencia projetos e workspaces com múltiplos arquivos, fornecendo
criação de estrutura de projeto, geração de árvore de arquivos e gerenciamento de metadados.

Author: Roberto Dantas de Castro
License: MIT
"""

import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional


class ProjectManager:
    """
    Manages multi-file projects and workspaces
    Gerencia projetos e workspaces com múltiplos arquivos
    
    Responsibilities / Responsabilidades:
    - Project structure creation / Criação de estrutura de projeto
    - File tree generation / Geração de árvore de arquivos
    - Project metadata management / Gerenciamento de metadados do projeto
    - Multi-file operations / Operações com múltiplos arquivos
    """
    
    def __init__(self, file_manager):
        """
        Initialize ProjectManager with FileManager dependency
        Inicializar ProjectManager com dependência de FileManager
        
        Args:
            file_manager: FileManager instance for file operations
                         Instância de FileManager para operações de arquivo
        """
        self.file_manager = file_manager
        self.projects_root = file_manager.projects_dir
    
    def create_project(
        self, 
        name: str, 
        files: List[Dict],
        description: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Create a new project with multiple files
        Criar novo projeto com múltiplos arquivos
        
        Args:
            name: Project name / Nome do projeto
            files: List of {path, content} dicts / Lista de dicts {path, content}
            description: Optional project description / Descrição opcional do projeto
        
        Returns:
            Project creation result with file tree
            Resultado da criação do projeto com árvore de arquivos
        """
        project_dir = self.projects_root / name
        
        if project_dir.exists():
            return {
                "success": False,
                "error": "project_exists",
                "message": f"Project '{name}' already exists",
                "path": str(project_dir)
            }
        
        try:
            project_dir.mkdir(parents=True)
            
            # Write all files / Escrever todos os arquivos
            created_files = []
            for file_info in files:
                result = self.file_manager.write_file(
                    content=file_info['content'],
                    filename=file_info.get('filename', file_info['path'].split('/')[-1]),
                    user_path=file_info.get('path'),
                    context=name,
                    make_executable=file_info.get('executable', False)
                )
                created_files.append(result)
            
            # Create project metadata / Criar metadados do projeto
            metadata = {
                "name": name,
                "description": description or f"Project {name}",
                "created": datetime.now().isoformat(),
                "files": [f['path'] for f in created_files if f['success']],
                "file_count": len([f for f in created_files if f['success']])
            }
            
            # Save metadata to .hexagent.json
            # Salvar metadados em .hexagent.json
            metadata_path = project_dir / ".hexagent.json"
            metadata_path.write_text(json.dumps(metadata, indent=2), encoding='utf-8')
            
            return {
                "success": True,
                "project_name": name,
                "project_path": str(project_dir),
                "files": created_files,
                "metadata": metadata,
                "tree": self.get_file_tree(str(project_dir))
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "creation_failed",
                "message": f"Failed to create project: {str(e)}"
            }
    
    def get_file_tree(self, project_path: str, max_depth: int = 5) -> List[Dict]:
        """
        Generate hierarchical file tree structure for UI display
        Gerar estrutura hierárquica de árvore de arquivos para exibição na UI
        
        Args:
            project_path: Path to project directory / Caminho do diretório do projeto
            max_depth: Maximum recursion depth / Profundidade máxima de recursão
        
        Returns:
            List of tree nodes with {name, type, path, children}
            Lista de nós da árvore com {name, type, path, children}
        """
        def build_tree(path: Path, depth: int = 0) -> List[Dict]:
            if depth > max_depth:
                return []
            
            items = []
            
            try:
                for item in sorted(path.iterdir()):
                    # Skip hidden files except .hexagent.json
                    # Pular arquivos ocultos exceto .hexagent.json
                    if item.name.startswith('.') and item.name != '.hexagent.json':
                        continue
                    
                    node = {
                        "name": item.name,
                        "type": "directory" if item.is_dir() else "file",
                        "path": str(item),
                    }
                    
                    if item.is_file():
                        stat = item.stat()
                        node["size"] = stat.st_size
                        node["extension"] = item.suffix[1:] if item.suffix else ""
                        node["modified"] = datetime.fromtimestamp(stat.st_mtime).isoformat()
                    
                    if item.is_dir():
                        node["children"] = build_tree(item, depth + 1)
                        node["child_count"] = len(node["children"])
                    
                    items.append(node)
                    
            except PermissionError:
                pass  # Skip directories we can't read
            
            return items
        
        path = Path(project_path).expanduser()
        
        if not path.exists():
            return []
        
        return build_tree(path)
    
    def get_project_metadata(self, project_name: str) -> Optional[Dict]:
        """
        Load project metadata from .hexagent.json
        Carregar metadados do projeto do .hexagent.json
        
        Args:
            project_name: Name of the project / Nome do projeto
        
        Returns:
            Project metadata or None if not found
            Metadados do projeto ou None se não encontrado
        """
        project_path = self.projects_root / project_name
        metadata_path = project_path / ".hexagent.json"
        
        if not metadata_path.exists():
            return None
        
        try:
            content = metadata_path.read_text(encoding='utf-8')
            return json.loads(content)
        except Exception as e:
            return {
                "error": f"Failed to load metadata: {str(e)}"
            }
    
    def update_project_metadata(
        self, 
        project_name: str, 
        updates: Dict
    ) -> Dict[str, any]:
        """
        Update project metadata
        Atualizar metadados do projeto
        
        Args:
            project_name: Name of the project / Nome do projeto
            updates: Dict with fields to update / Dict com campos para atualizar
        
        Returns:
            Update result / Resultado da atualização
        """
        metadata = self.get_project_metadata(project_name)
        
        if not metadata or "error" in metadata:
            return {
                "success": False,
                "error": "metadata_not_found",
                "message": "Project metadata not found"
            }
        
        try:
            # Merge updates / Mesclar atualizações
            metadata.update(updates)
            metadata["last_modified"] = datetime.now().isoformat()
            
            # Save updated metadata / Salvar metadados atualizados
            metadata_path = self.projects_root / project_name / ".hexagent.json"
            metadata_path.write_text(json.dumps(metadata, indent=2), encoding='utf-8')
            
            return {
                "success": True,
                "metadata": metadata
            }
        except Exception as e:
            return {
                "success": False,
                "error": "update_failed",
                "message": str(e)
            }
    
    def list_projects(self) -> List[Dict]:
        """
        List all projects with basic information
        Listar todos os projetos com informações básicas
        
        Returns:
            List of project information / Lista de informações de projetos
        """
        projects = []
        
        if not self.projects_root.exists():
            return projects
        
        for project_dir in sorted(self.projects_root.iterdir()):
            if not project_dir.is_dir():
                continue
            
            metadata = self.get_project_metadata(project_dir.name)
            
            if metadata and "error" not in metadata:
                projects.append({
                    "name": project_dir.name,
                    "path": str(project_dir),
                    "description": metadata.get("description", ""),
                    "file_count": metadata.get("file_count", 0),
                    "created": metadata.get("created", ""),
                    "last_modified": metadata.get("last_modified", "")
                })
            else:
                # Project without metadata / Projeto sem metadados
                stat = project_dir.stat()
                projects.append({
                    "name": project_dir.name,
                    "path": str(project_dir),
                    "description": "No metadata available",
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat()
                })
        
        return projects
    
    def delete_project(self, project_name: str, create_backup: bool = True) -> Dict[str, any]:
        """
        Delete a project (with optional backup)
        Deletar um projeto (com backup opcional)
        
        Args:
            project_name: Name of project to delete / Nome do projeto para deletar
            create_backup: Create backup archive before deleting / Criar arquivo de backup antes de deletar
        
        Returns:
            Deletion result / Resultado da deleção
        """
        import shutil
        
        project_path = self.projects_root / project_name
        
        if not project_path.exists():
            return {
                "success": False,
                "error": "project_not_found",
                "message": f"Project '{project_name}' not found"
            }
        
        try:
            backup_path = None
            
            if create_backup:
                # Create tar backup / Criar backup tar
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_name = f"{project_name}_backup_{timestamp}"
                backup_path = self.file_manager.backups_dir / backup_name
                
                shutil.make_archive(
                    str(backup_path),
                    'gztar',
                    root_dir=str(project_path.parent),
                    base_dir=project_path.name
                )
                
                backup_path = str(backup_path) + ".tar.gz"
            
            # Delete project directory / Deletar diretório do projeto
            shutil.rmtree(project_path)
            
            return {
                "success": True,
                "project_name": project_name,
                "backup": backup_path
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "deletion_failed",
                "message": str(e)
            }
