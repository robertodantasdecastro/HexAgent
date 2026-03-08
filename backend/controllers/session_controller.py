"""
Session Controller - Handles session management endpoints
Controlador de Sessão - Gerencia endpoints de gerenciamento de sessão

Provides endpoints for saving, loading, and managing user sessions.
Uses SessionService for persistence logic.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
"""

from controllers.base_controller import BaseController
from flask import request
from services.session_service import SessionService
import logging

class SessionController(BaseController):
    """
    Controller for session management operations.
    Delegates business logic to SessionService.
    """
    
    def __init__(self, workspace_dir=None):
        """
        Initialize session controller with service injection.
        """
        super().__init__(
            name='session',
            import_name=__name__,
            url_prefix=''
        )
        # Injeção de Dependência da Camada de Serviço
        self.session_service = SessionService(workspace_dir)
    
    def _register_routes(self):
        """Register all session routes"""
        
        # ============================================================================
        # SAVE SESSION
        # ============================================================================
        @self.blueprint.route('/save_session', methods=['POST'])
        def save_session():
            """Save current session state"""
            try:
                self.log_request('POST /save_session')
                
                data = self.get_request_data()
                session_data = data.get('session_data', {})
                session_name = data.get('session_name')
                
                result = self.session_service.save_session(session_data, session_name)
                
                return self.success_response(
                    data={"session_path": result['path']},
                    message=f"Session '{result['name']}' saved successfully"
                )
                
            except Exception as e:
                self.log_error('POST /save_session', e)
                return self.error_response(f"Failed to save session: {str(e)}", 500)
        
        # ============================================================================
        # LOAD SESSION
        # ============================================================================
        @self.blueprint.route('/load_session', methods=['GET'])
        def load_session():
            """Load session from file or list sessions"""
            try:
                self.log_request('GET /load_session')
                
                session_name = request.args.get('session_name')
                
                if not session_name:
                    # List all sessions
                    sessions = self.session_service.list_sessions()
                    return self.success_response(
                        data={"sessions": sessions},
                        message=f"Found {len(sessions)} sessions"
                    )
                
                # Load specific session
                session_data = self.session_service.load_session(session_name)
                
                self.logger.info(f"Session loaded: {session_name}")
                return self.success_response(
                    data={"session_data": session_data},
                    message=f"Session '{session_name}' loaded"
                )
                
            except FileNotFoundError:
                return self.error_response(f"Session '{session_name}' not found", 404)
            except Exception as e:
                self.log_error('GET /load_session', e)
                return self.error_response(f"Failed to load session: {str(e)}", 500)
        
        # ============================================================================
        # MANAGE SESSIONS
        # ============================================================================
        @self.blueprint.route('/sessions', methods=['POST'])
        def manage_sessions():
            """Manage sessions (list, delete, rename)"""
            try:
                self.log_request('POST /sessions')
                
                data = self.get_request_data()
                action = data.get('action')
                
                if not action:
                    return self.error_response("Missing action", 400)

                # Action: LIST
                if action == 'list':
                    sessions = self.session_service.list_sessions()
                    return self.success_response(
                        data={"sessions": sessions},
                        message=f"Found {len(sessions)} sessions"
                    )

                session_name = data.get('session_name')
                if not session_name:
                     return self.error_response("Missing session_name", 400)
                
                # Action: DELETE
                if action == 'delete':
                    if self.session_service.delete_session(session_name):
                        return self.success_response(message=f"Session '{session_name}' deleted")
                    else:
                        return self.error_response(f"Session '{session_name}' not found", 404)
                
                # Action: RENAME
                elif action == 'rename':
                    new_name = data.get('new_name')
                    if not new_name:
                        return self.error_response("New name required", 400)
                        
                    self.session_service.rename_session(session_name, new_name)
                    return self.success_response(message=f"Session renamed to '{new_name}'")
                
                else:
                    return self.error_response(f"Unknown action: {action}", 400)
                    
            except FileNotFoundError:
                return self.error_response(f"Session '{session_name}' not found", 404)
            except FileExistsError as e:
                return self.error_response(str(e), 409)  # 409 Conflict
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('POST /sessions', e)
                return self.error_response("Session operation failed", 500)
