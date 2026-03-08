"""
File Controller - Handles file operations endpoints
Controlador de Arquivo - Gerencia endpoints de operações de arquivo

Integrates with FileManager for safe, backup-aware file operations.
Integra com FileManager para operações de arquivo seguras e com backup.

@author: Roberto Dantas de Castro
"""

from controllers.base_controller import BaseController
from services.file_service import FileService
from flask import request
import os


class FileController(BaseController):
    """
    Controller for file operations
    Controlador para operações de arquivo
    """
    
    def __init__(self):
        # Initialize FileService / Inicializar FileService
        self.file_service = FileService()
        
        super().__init__(
            name='file',
            import_name=__name__,
            url_prefix='/file'
        )
    
    def _register_routes(self):
        """Register file routes / Registra rotas de arquivo"""
        
        # ============================================================================
        # WRITE - Write content to file
        # Escrever - Escreve conteúdo em arquivo
        # ============================================================================
        
        @self.blueprint.route('/write', methods=['POST'])
        def write_file():
            """
            Write content to file with backup support
            Escreve conteúdo em arquivo com suporte a backup
            """
            try:
                self.log_request('POST /file/write')
                data = self.validate_request(['path', 'content'])
                
                result = self.file_service.write_file(
                    content=data['content'],
                    filename=os.path.basename(data['path']),
                    user_path=data['path'],
                    overwrite=data.get('overwrite', False),
                    create_backup=data.get('create_backup', True),
                    make_executable=data.get('make_executable', False),
                    context=data.get('context')
                )
                
                if result['success']:
                    return self.success_response(data=result, message="File saved successfully")
                else:
                    return self.error_response(result.get('message', 'Write failed'), 400, details=result)
                    
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('/file/write', e)
                return self.error_response("File write failed", 500)
        
        # ============================================================================
        # READ - Read file content
        # Ler - Lê conteúdo do arquivo
        # ============================================================================
        
        @self.blueprint.route('/read', methods=['POST'])
        def read_file():
            """
            Read file content
            Lê conteúdo do arquivo
            """
            try:
                self.log_request('POST /file/read')
                data = self.validate_request(['path'])
                
                result = self.file_service.read_file(data['path'])
                
                if result['success']:
                    return self.success_response(data=result)
                else:
                    return self.error_response(result.get('error', 'Read failed'), 404, details=result)
                    
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.log_error('/file/read', e)
                return self.error_response("File read failed", 500)
        
        # ============================================================================
        # DIFF - Generate file diff
        # Diff - Gerar diff de arquivo
        # ============================================================================
        
        @self.blueprint.route('/diff', methods=['POST'])
        def file_diff():
            """
            Get diff between file versions
            Obtém diferenças entre versões
            """
            try:
                self.log_request('POST /file/diff')
                data = self.validate_request(['path', 'content'])
                
                result = self.file_service.get_diff(data['path'], data['content'])
                
                if result:
                    return self.success_response(data=result)
                else:
                    return self.error_response("File not found for diff", 404)
                    
            except Exception as e:
                self.log_error('/file/diff', e)
                return self.error_response("Diff failed", 500)
        
        # ============================================================================
        # BACKUPS - List file backups
        # Backups - Listar backups de arquivo
        # ============================================================================
        
        @self.blueprint.route('/backups', methods=['GET'])
        def list_backups():
            """
            List available file backups
            Lista backups disponíveis
            """
            try:
                self.log_request('GET /file/backups')
                filename = request.args.get('filename')
                
                backups = self.file_service.list_backups(filename)
                
                return self.success_response(
                    data={"backups": backups, "count": len(backups)}, 
                    message="Backups listed"
                )
            except Exception as e:
                self.log_error('/file/backups', e)
                return self.error_response("Failed to list backups", 500)
        
        # ============================================================================
        # TEMP FILES - List temporary files
        # Arquivos Temporários - Listar arquivos temporários
        # ============================================================================
        
        @self.blueprint.route('/temp', methods=['GET'])  # Fixed URL from /s/temp
        def temp_files():
            """
            List temporary files
            Lista arquivos temporários
            """
            try:
                self.log_request('GET /file/temp')
                
                files = []
                # Use FileManager's temp dir / Usar diretório temp do FileManager
                tmp_dir = self.file_service.tmp_dir
                
                if tmp_dir.exists():
                    files = [f.name for f in tmp_dir.iterdir() if f.is_file()]
                
                return self.success_response(
                    data={"files": files, "count": len(files), "path": str(tmp_dir)}, 
                    message="Temp files listed"
                )
            except Exception as e:
                self.log_error('/file/temp', e)
                return self.error_response("Failed to list temp files", 500)
