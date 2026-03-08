"""
Session Service - file-based session persistence
Serviço de Sessão - persistência de sessão baseada em arquivo

Encapsulates all logic related to saving, loading, and managing session files.
Encapsula toda a lógica relacionada a salvar, carregar e gerenciar arquivos de sessão.

@author: HexAgent Dev
"""
import json
import logging
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)

class SessionService:
    """
    Service for managing user sessions.
    Serviço para gerenciar sessões de usuário.
    """
    
    def __init__(self, workspace_dir: Optional[Path] = None):
        """
        Initialize session service.
        Inicializar serviço de sessão.
        
        Args:
            workspace_dir: Root directory for storage. Defaults to ~/.hexagent-gui
        """
        self.workspace_dir = workspace_dir or Path.home() / '.hexagent-gui'
        self.sessions_dir = self.workspace_dir / 'sessions'
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
    def save_session(self, session_data: Dict[str, Any], name: Optional[str] = None) -> Dict[str, Any]:
        """
        Save session data to a JSON file.
        Salvar dados da sessão em um arquivo JSON.
        
        Args:
            session_data: The session state/content to save.
            name: Optional name. If None, timestamp is used.
            
        Returns:
            Dict containing 'success', 'path', 'name'.
        """
        try:
            if not name:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                name = f"session_{timestamp}"
            
            # Ensure safe filename
            safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).strip()
            if not safe_name:
                raise ValueError("Invalid session name")
                
            file_path = self.sessions_dir / f"{safe_name}.json"
            
            # Add metadata if not present
            if 'metadata' not in session_data:
                session_data['metadata'] = {}
            
            session_data['metadata']['last_modified'] = datetime.now().isoformat()
            session_data['metadata']['name'] = safe_name
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(session_data, f, indent=2, ensure_ascii=False)
                
            logger.info(f"Session saved: {file_path}")
            
            return {
                "success": True,
                "name": safe_name,
                "path": str(file_path)
            }
            
        except Exception as e:
            logger.error(f"Failed to save session: {e}")
            raise

    def load_session(self, name: str) -> Dict[str, Any]:
        """
        Load a specific session by name.
        Carregar uma sessão específica pelo nome.
        """
        try:
            file_path = self.sessions_dir / f"{name}.json"
            
            if not file_path.exists():
                raise FileNotFoundError(f"Session '{name}' not found")
                
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            return data
            
        except Exception as e:
            logger.error(f"Failed to load session '{name}': {e}")
            raise

    def list_sessions(self) -> List[Dict[str, Any]]:
        """
        List all available sessions.
        Listar todas as sessões disponíveis.
        """
        sessions = []
        try:
            if not self.sessions_dir.exists():
                return []
                
            for f in self.sessions_dir.glob('*.json'):
                try:
                    stat = f.stat()
                    sessions.append({
                        "name": f.stem,
                        "path": str(f),
                        "modified": stat.st_mtime,
                        "size": stat.st_size
                    })
                except OSError:
                    continue
                    
            # Sort by modification time (newest first)
            return sorted(sessions, key=lambda x: x['modified'], reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to list sessions: {e}")
            return []

    def delete_session(self, name: str) -> bool:
        """
        Delete a session file.
        Deletar um arquivo de sessão.
        """
        file_path = self.sessions_dir / f"{name}.json"
        if not file_path.exists():
            return False
            
        try:
            file_path.unlink()
            logger.info(f"Session deleted: {name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete session '{name}': {e}")
            raise

    def rename_session(self, old_name: str, new_name: str) -> bool:
        """
        Rename a session.
        Renomear uma sessão.
        """
        old_path = self.sessions_dir / f"{old_name}.json"
        
        # Ensure safe new name
        safe_new_name = "".join(c for c in new_name if c.isalnum() or c in (' ', '_', '-')).strip()
        if not safe_new_name:
            raise ValueError("Invalid new session name")
            
        new_path = self.sessions_dir / f"{safe_new_name}.json"
        
        if not old_path.exists():
            raise FileNotFoundError(f"Session '{old_name}' not found")
            
        if new_path.exists():
            raise FileExistsError(f"Session '{safe_new_name}' already exists")
            
        try:
            old_path.rename(new_path)
            logger.info(f"Session renamed: {old_name} -> {safe_new_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to rename session: {e}")
            raise
