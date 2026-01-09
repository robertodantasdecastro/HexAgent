"""
Session Controller - Handles session management endpoints
Controlador de Sessão - Gerencia endpoints de gerenciamento de sessão

Provides endpoints for saving, loading, and managing user sessions.
Fornece endpoints para salvar, carregar e gerenciar sessões de usuário.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
"""

from core.base_controller import BaseController
from flask import request
import os
import json
from pathlib import Path
from datetime import datetime


class SessionController(BaseController):
    """
    Controller for session management operations
    Controlador para operações de gerenciamento de sessão
    
    Handles:
    - Session saving / Salvamento de sessão
    - Session loading / Carregamento de sessão
    - Session listing / Listagem de sessões
    """
    
    def __init__(self, workspace_dir=None):
        """
        Initialize session controller
        Inicializa controlador de sessão
        
        Args:
            workspace_dir: Directory for session storage / Diretório para armazenamento de sessões
        """
        self.workspace_dir = workspace_dir or Path.home() / '.hexagent-gui'
        self.sessions_dir = self.workspace_dir / 'sessions'
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
        super().__init__(
            name='session',
            import_name=__name__,
            url_prefix=''  # Root level endpoints
        )
    
    def _register_routes(self):
        """Register all session routes / Registra todas as rotas de sessão"""
        
        # ============================================================================
        # SAVE SESSION - Save current session state
        # Salvar Sessão - Salva estado atual da sessão
        # ============================================================================
        
        @self.blueprint.route('/save_session', methods=['POST'])
        def save_session():
            """
            Save current session to file
            Salva sessão atual em arquivo
            
            Expects:
                - session_data: Session state to save / Estado da sessão para salvar
                - session_name: Optional custom name / Nome personalizado opcional
                
            Returns:
                Session file path / Caminho do arquivo de sessão
            """
            try:
                self.log_request('POST /save_session')
                
                # Get session data
                # Obtém dados da sessão
                data = self.get_request_data()
                session_data = data.get('session_data', {})
                session_name = data.get('session_name', None)
                
                # Generate session filename
                # Gera nome do arquivo de sessão
                if not session_name:
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    session_name = f"session_{timestamp}"
                
                # Save to file
                # Salva em arquivo
                session_file = self.sessions_dir / f"{session_name}.json"
                with open(session_file, 'w') as f:
                    json.dump(session_data, f, indent=2)
                
                self.logger.info(f"Session saved: {session_file}")
                
                return self.success_response(
                    data={"session_path": str(session_file)},
                    message=f"Session '{session_name}' saved successfully"
                )
                
            except Exception as e:
                self.log_error('POST /save_session', e)
                return self.error_response("Failed to save session", 500)
        
        # ============================================================================
        # LOAD SESSION - Load saved session
        # Carregar Sessão - Carrega sessão salva
        # ============================================================================
        
        @self.blueprint.route('/load_session', methods=['GET'])
        def load_session():
            """
            Load session from file
            Carrega sessão de arquivo
            
            Query params:
                - session_name: Name of session to load / Nome da sessão para carregar
                
            Returns:
                Session data / Dados da sessão
            """
            try:
                self.log_request('GET /load_session')
                
                # Get session name from query params
                # Obtém nome da sessão dos parâmetros de query
                session_name = request.args.get('session_name', '')
                
                if not session_name:
                    # Return list of available sessions
                    # Retorna lista de sessões disponíveis
                    sessions = []
                    for f in self.sessions_dir.glob('*.json'):
                        sessions.append({
                            "name": f.stem,
                            "path": str(f),
                            "modified": f.stat().st_mtime
                        })
                    
                    return self.success_response(
                        data={"sessions": sessions},
                        message=f"Found {len(sessions)} sessions"
                    )
                
                # Load specific session
                # Carrega sessão específica
                session_file = self.sessions_dir / f"{session_name}.json"
                
                if not session_file.exists():
                    return self.error_response(
                        f"Session '{session_name}' not found",
                        404
                    )
                
                with open(session_file, 'r') as f:
                    session_data = json.load(f)
                
                self.logger.info(f"Session loaded: {session_file}")
                
                return self.success_response(
                    data={"session_data": session_data},
                    message=f"Session '{session_name}' loaded"
                )
                
            except json.JSONDecodeError as e:
                self.log_error('GET /load_session', e)
                return self.error_response("Invalid session file format", 400)
            except Exception as e:
                self.log_error('GET /load_session', e)
                return self.error_response("Failed to load session", 500)
        
        # ============================================================================
        # SESSIONS - Manage sessions (list, delete)
        # Sessões - Gerencia sessões (listar, deletar)
        # ============================================================================
        
        @self.blueprint.route('/sessions', methods=['POST'])
        def manage_sessions():
            """
            Manage sessions (delete, rename, etc.)
            Gerencia sessões (deletar, renomear, etc.)
            
            Expects:
                - action: Action to perform (delete, rename) / Ação a executar
                - session_name: Target session / Sessão alvo
                
            Returns:
                Operation result / Resultado da operação
            """
            try:
                self.log_request('POST /sessions')
                
                # Get request data
                # Obtém dados da requisição
                data =self.validate_request(['action', 'session_name'])
                action = data.get('action')
                session_name = data.get('session_name')
                
                session_file = self.sessions_dir / f"{session_name}.json"
                
                if action == 'delete':
                    # Delete session
                    # Deleta sessão
                    if not session_file.exists():
                        return self.error_response(
                            f"Session '{session_name}' not found",
                            404
                        )
                    
                    session_file.unlink()
                    self.logger.info(f"Session deleted: {session_file}")
                    
                    return self.success_response(
                        message=f"Session '{session_name}' deleted"
                    )
                
                elif action == 'rename':
                    # Rename session
                    # Renomeia sessão
                    new_name = data.get('new_name')
                    if not new_name:
                        return self.error_response("New name required for rename", 400)
                    
                    if not session_file.exists():
                        return self.error_response(
                            f"Session '{session_name}' not found",
                            404
                        )
                    
                    new_file = self.sessions_dir / f"{new_name}.json"
                    session_file.rename(new_file)
                    
                    self.logger.info(f"Session renamed: {session_name} -> {new_name}")
                    
                    return self.success_response(
                        message=f"Session renamed to '{new_name}'"
                    )
                
                else:
                    return self.error_response(
                        f"Unknown action: {action}",
                        400
                    )
                    
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /sessions', e)
                return self.error_response("Session operation failed", 500)
