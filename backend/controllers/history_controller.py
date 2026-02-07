"""
History Controller - Handles command history endpoints
Controlador de Histórico - Gerencia endpoints de histórico de comandos

Persistent storage for shell commands and system events.
Armazenamento persistente para comandos shell e eventos do sistema.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 3.0.0 (Persistent History Implementation)
"""

from core.base_controller import BaseController
from flask import request
import json
import os
from pathlib import Path
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class HistoryController(BaseController):
    """
    Controller for history operations
    Controlador para operações de histórico
    
    Manages persistent storage of:
    - Shell command history
    - System event history
    
    Gerencia armazenamento persistente de:
    - Histórico de comandos shell
    - Histórico de eventos do sistema
    """
    
    # History configuration / Configuração de histórico
    MAX_HISTORY_ENTRIES = 1000  # Maximum entries per file / Máximo de entradas por arquivo
    
    def __init__(self):
        super().__init__(name='history', import_name=__name__, url_prefix='/history')
        
        # Initialize history storage directory / Inicializar diretório de armazenamento
        self.history_dir = Path.home() / '.hexagent-gui' / 'history'
        self.history_dir.mkdir(parents=True, exist_ok=True)
        
        self.shell_history_file = self.history_dir / 'shell.json'
        self.system_history_file = self.history_dir / 'system.json'
        
        logger.info(f"HistoryController initialized, storage: {self.history_dir}")
    
    def _load_history(self, file_path: Path) -> list:
        """
        Load history from JSON file
        Carrega histórico de arquivo JSON
        
        Args / Argumentos:
            file_path (Path): Path to history file / Caminho para arquivo de histórico
        
        Returns / Retorna:
            list: History entries / Entradas de histórico
        """
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    history = data.get('history', [])
                    logger.debug(f"Loaded {len(history)} entries from {file_path.name}")
                    return history
            else:
                logger.debug(f"History file not found: {file_path.name}, returning empty")
                return []
        except Exception as e:
            logger.error(f"Error loading history from {file_path.name}: {e}")
            return []
    
    def _save_history(self, file_path: Path, history: list):
        """
        Save history to JSON file
        Salva histórico em arquivo JSON
        
        Args / Argumentos:
            file_path (Path): Path to history file / Caminho para arquivo de histórico
            history (list): History entries to save / Entradas de histórico para salvar
        """
        try:
            # Limit to MAX_HISTORY_ENTRIES / Limitar a MAX_HISTORY_ENTRIES
            if len(history) > self.MAX_HISTORY_ENTRIES:
                history = history[-self.MAX_HISTORY_ENTRIES:]
                logger.debug(f"Trimmed history to {self.MAX_HISTORY_ENTRIES} entries")
            
            data = {
                'history': history,
                'last_updated': datetime.now().isoformat(),
                'count': len(history)
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.debug(f"Saved {len(history)} entries to {file_path.name}")
            
        except Exception as e:
            logger.error(f"Error saving history to {file_path.name}: {e}")
    
    def _register_routes(self):
        """Register history routes / Registra rotas de histórico"""
        
        @self.blueprint.route('/shell', methods=['GET'])
        def get_shell_history():
            """
            Get shell command history
            Obtém histórico de comandos shell
            
            Returns / Retorna:
                JSON: {data: [...], count: int}
            """
            try:
                history = self._load_history(self.shell_history_file)
                
                # Return last 100 entries by default / Retornar últimas 100 entradas por padrão
                limit = request.args.get('limit', 100, type=int)
                history = history[-limit:] if limit > 0 else history
                
                return self.success_response(
                    data=history,
                    count=len(history),
                    message="Shell history loaded",
                    message_pt="Histórico shell carregado"
                )
                
            except Exception as e:
                self.log_error('GET /history/shell', e)
                return self.error_response(
                    "Failed to get shell history",
                    message_pt="Falha ao obter histórico shell",
                    status_code=500
                )
        
        @self.blueprint.route('/shell', methods=['POST'])
        def add_shell_entry():
            """
            Add entry to shell history
            Adiciona entrada ao histórico shell
            
            Expects JSON body / Espera corpo JSON:
                {
                    "command": str,
                    "cwd": str,
                    "exit_code": int,
                    "timestamp": str (optional, auto-generated)
                }
            """
            try:
                data = request.get_json()
                
                if not data or 'command' not in data:
                    return self.error_response(
                        "Missing 'command' in request body",
                        message_pt="Faltando 'command' no corpo da requisição",
                        status_code=400
                    )
                
                # Build history entry / Construir entrada de histórico
                entry = {
                    'timestamp': data.get('timestamp', datetime.now().isoformat()),
                    'command': data['command'],
                    'cwd': data.get('cwd', ''),
                    'exit_code': data.get('exit_code', 0)
                }
                
                # Load existing history / Carregar histórico existente
                history = self._load_history(self.shell_history_file)
                
                # Append new entry / Anexar nova entrada
                history.append(entry)
                
                # Save updated history / Salvar histórico atualizado
                self._save_history(self.shell_history_file, history)
                
                return self.success_response(
                    data=entry,
                    message="Shell command added to history",
                    message_pt="Comando shell adicionado ao histórico"
                )
                
            except Exception as e:
                self.log_error('POST /history/shell', e)
                return self.error_response(
                    "Failed to add shell entry",
                    message_pt="Falha ao adicionar entrada shell",
                    status_code=500
                )
        
        @self.blueprint.route('/system', methods=['GET'])
        def get_system_history():
            """
            Get system events history
            Obtém histórico de eventos do sistema
            
            Returns / Retorna:
                JSON: {data: [...], count: int}
            """
            try:
                history = self._load_history(self.system_history_file)
                
                # Return last 100 entries by default / Retornar últimas 100 entradas por padrão
                limit = request.args.get('limit', 100, type=int)
                history = history[-limit:] if limit > 0 else history
                
                return self.success_response(
                    data=history,
                    count=len(history),
                    message="System history loaded",
                    message_pt="Histórico do sistema carregado"
                )
                
            except Exception as e:
                self.log_error('GET /history/system', e)
                return self.error_response(
                    "Failed to get system history",
                    message_pt="Falha ao obter histórico do sistema",
                    status_code=500
                )
        
        @self.blueprint.route('/system', methods=['POST'])
        def add_system_entry():
            """
            Add entry to system history
            Adiciona entrada ao histórico do sistema
            
            Expects JSON body / Espera corpo JSON:
                {
                    "event_type": str,
                    "message": str,
                    "level": str (info|warning|error),
                    "metadata": dict (optional),
                    "timestamp": str (optional, auto-generated)
                }
            """
            try:
                data = request.get_json()
                
                if not data or 'event_type' not in data or 'message' not in data:
                    return self.error_response(
                        "Missing 'event_type' or 'message' in request body",
                        message_pt="Faltando 'event_type' ou 'message' no corpo da requisição",
                        status_code=400
                    )
                
                # Build history entry / Construir entrada de histórico
                entry = {
                    'timestamp': data.get('timestamp', datetime.now().isoformat()),
                    'event_type': data['event_type'],
                    'message': data['message'],
                    'level': data.get('level', 'info'),
                    'metadata': data.get('metadata', {})
                }
                
                # Load existing history / Carregar histórico existente
                history = self._load_history(self.system_history_file)
                
                # Append new entry / Anexar nova entrada
                history.append(entry)
                
                # Save updated history / Salvar histórico atualizado
                self._save_history(self.system_history_file, history)
                
                return self.success_response(
                    data=entry,
                    message="System event added to history",
                    message_pt="Evento do sistema adicionado ao histórico"
                )
                
            except Exception as e:
                self.log_error('POST /history/system', e)
                return self.error_response(
                    "Failed to add system entry",
                    message_pt="Falha ao adicionar entrada do sistema",
                    status_code=500
                )
        
        @self.blueprint.route('/clear/<history_type>', methods=['DELETE'])
        def clear_history(history_type: str):
            """
            Clear history (shell or system)
            Limpar histórico (shell ou sistema)
            
            Args / Argumentos:
                history_type (str): 'shell' or 'system' / 'shell' ou 'system'
            """
            try:
                if history_type == 'shell':
                    file_path = self.shell_history_file
                elif history_type == 'system':
                    file_path = self.system_history_file
                else:
                    return self.error_response(
                        f"Invalid history type: {history_type}",
                        message_pt=f"Tipo de histórico inválido: {history_type}",
                        status_code=400
                    )
                
                # Clear by saving empty history / Limpar salvando histórico vazio
                self._save_history(file_path, [])
                
                return self.success_response(
                    message=f"{history_type.capitalize()} history cleared",
                    message_pt=f"Histórico {history_type} limpo"
                )
                
            except Exception as e:
                self.log_error(f'DELETE /history/clear/{history_type}', e)
                return self.error_response(
                    "Failed to clear history",
                    message_pt="Falha ao limpar histórico",
                    status_code=500
                )
