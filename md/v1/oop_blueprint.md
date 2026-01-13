# OOP Backend Refactoring - Architecture Blueprint

## Executive Summary

**Current State:**  
Monolithic `server.py` with 1885 lines, 40 endpoints, 46 functions

**Target State:**  
Modular OOP architecture with Flask Blueprints, 7 domain controllers, clean separation of concerns

**Estimated Effort:** 9 hours  
**Risk Level:** Medium (comprehensive testing required)

---

## 1. Current Architecture Analysis

### Endpoint Inventory (40 routes)

#### Config Domain (11 endpoints) ⚙️
```
GET  /config
POST /config
GET  /config/user/<config_type>
POST /config/user/<config_type>
GET  /config/user/ui/<filename>
POST /config/validate
GET  /config/backup/list
POST /config/merge
POST /config/restore/<timestamp>
GET  /config/tree
```

#### Chat/AI Domain (2 endpoints) 🤖
```
POST /chat
POST /complete
```

#### File Operations (5 endpoints) 📁
```
POST /file/write
POST /file/read
POST /file/diff
GET  /file/backups
GET  /files/temp
```

#### Session Management (3 endpoints) 💾
```
GET  /load_session
POST /save_session
POST /sessions
```

#### Project Management (4 endpoints) 📦
```
POST /project/create
GET  /project/list
GET  /project/<name>/tree
DELETE /project/<name>
```

#### Service Control (4 endpoints) 🔌
```
GET  /status
POST /start_service
POST /stop_service
POST /service
```

#### Script/Execution (4 endpoints) ⚡
```
POST /script/save
POST /script/execute
POST /script/debug
POST /execute
```

#### History (2 endpoints) 📜
```
GET  /history/shell
GET  /history/system
```

#### Core/System (5 endpoints) 🔧
```
GET  /health
GET  /init_status
POST /init
POST /shutdown
POST /cleanup
POST /export/chat
```

### Technical Debt Identified

1. **Duplication**
   - 2 `/shutdown` endpoints (lines 921 + 1365)
   - 2 `/files/temp` endpoints (lines 800 + 1834)
   - Redundant config loading logic

2. **Poor Separation**
   - Business logic in route handlers
   - No service layer
   - Direct database/file access

3. **Missing Patterns**
   - No input validation decorator
   - Inconsistent error responses
   - No request/response logging

4. **Hardcoded Values**
   - Paths scattered throughout
   - Config defaults duplicated
   - Port numbers inline

---

## 2. Target OOP Architecture

### Directory Structure

```
backend/
├── app.py                    # New Flask app factory
├── server.py.backup          # Original (backup)
├── core/
│   ├── __init__.py
│   ├── base_controller.py    # BaseController class
│   ├── response.py           # StandardResponse formatter
│   ├── errors.py             # Custom exceptions
│   └── validators.py         # Input validation decorators
├── controllers/
│   ├── __init__.py
│   ├── config_controller.py  # ConfigController
│   ├── chat_controller.py    # ChatController
│   ├── file_controller.py    # FileController
│   ├── session_controller.py # SessionController
│   ├── project_controller.py # ProjectController
│   ├── service_controller.py # ServiceController
│   ├── script_controller.py  # ScriptController
│   ├── history_controller.py # HistoryController
│   └── system_controller.py  # SystemController
├── services/
│   ├── __init__.py
│   ├── config_service.py     # Config business logic
│   ├── ai_service.py         # AI/Chat logic
│   ├── file_service.py       # File operations
│   └── session_service.py    # Session management
├── models/
│   ├── __init__.py
│   ├── config.py             # Config data models
│   └── session.py            # Session data models
├── utils/
│   ├── __init__.py
│   ├── logger.py             # Logging utility
│   └── constants.py          # App constants
└── libs/                     # Existing libs (unchanged)
```

---

## 3. Core Classes Design

### BaseController (Abstract)

```python
from abc import ABC, abstractmethod
from flask import Blueprint, request, jsonify
from typing import Dict, Any, Tuple

class BaseController(ABC):
    """
    Abstract base controller for all domain controllers
    Controlador base abstrato para todos os controladores de domínio
    """
    
    def __init__(self, name: str, import_name: str, url_prefix: str = None):
        """
        Initialize controller with Blueprint
        Inicializa controlador com Blueprint
        
        Args:
            name: Blueprint name
            import_name: Import name (__name__)
            url_prefix: URL prefix for routes (e.g., '/api/config')
        """
        self.blueprint = Blueprint(name, import_name, url_prefix=url_prefix)
        self.logger = self._setup_logger()
        self._register_routes()
    
    @abstractmethod
    def _register_routes(self):
        """Register all routes for this controller"""
        pass
    
    def _setup_logger(self):
        """Setup controller-specific logger"""
        import logging
        return logging.getLogger(self.__class__.__name__)
    
    def success_response(self, data: Any = None, message: str = None, code: int = 200):
        """Standard success response"""
        return jsonify({
            "success": True,
            "data": data,
            "message": message
        }), code
    
    def error_response(self, error: str, code: int = 400, details: Any = None):
        """Standard error response"""
        return jsonify({
            "success": False,
            "error": error,
            "details": details
        }), code
    
    def validate_request(self, required_fields: list):
        """Validate required fields in request"""
        data = request.get_json() or {}
        missing = [f for f in required_fields if f not in data]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")
        return data
```

### ConfigController Example

```python
from core.base_controller import BaseController
from services.config_service import ConfigService
from flask import request

class ConfigController(BaseController):
    """
    Handles all configuration-related endpoints
    Gerencia todos os endpoints relacionados à configuração
    """
    
    def __init__(self):
        super().__init__(
            name='config',
            import_name=__name__,
            url_prefix='/config'
        )
        self.service = ConfigService()
    
    def _register_routes(self):
        """Register configuration routes"""
        
        @self.blueprint.route('/', methods=['GET'])
        def get_config():
            """Get full configuration"""
            try:
                config = self.service.load_config()
                return self.success_response(data=config)
            except Exception as e:
                self.logger.error(f"Config load error: {e}")
                return self.error_response(str(e), 500)
        
        @self.blueprint.route('/', methods=['POST'])
        def save_config():
            """Save configuration"""
            try:
                data = self.validate_request(['config'])
                self.service.save_config(data['config'])
                return self.success_response(message="Config saved")
            except ValueError as e:
                return self.error_response(str(e), 400)
            except Exception as e:
                self.logger.error(f"Config save error: {e}")
                return self.error_response(str(e), 500)
        
        @self.blueprint.route('/system', methods=['GET'])
        def get_system_config():
            """Get system configuration"""
            try:
                config = self.service.load_system_config()
                return self.success_response(data=config)
            except Exception as e:
                return self.error_response(str(e), 500)
        
        @self.blueprint.route('/ai', methods=['GET'])
        def get_ai_config():
            """Get AI configuration"""
            try:
                config = self.service.load_ai_config()
                return self.success_response(data=config)
            except Exception as e:
                return self.error_response(str(e), 500)
        
        # ... more config routes
```

---

## 4. Service Layer Design

### ConfigService Example

```python
import json
import os
from typing import Dict, Any

class ConfigService:
    """
    Business logic for configuration management
    Lógica de negócio para gerenciamento de configuração
    """
    
    def __init__(self, config_dir: str = None):
        self.config_dir = config_dir or os.path.join(
            os.path.expanduser('~'), '.hexagent-gui'
        )
        self.system_config_file = os.path.join(self.config_dir, 'system-config.json')
        self.ai_config_file = os.path.join(self.config_dir, 'ai-config.json')
    
    def load_config(self) -> Dict[str, Any]:
        """Load full configuration"""
        system = self.load_system_config()
        ai = self.load_ai_config()
        return {**system, **ai}
    
    def load_system_config(self) -> Dict[str, Any]:
        """Load system configuration"""
        defaults = {
            "system": {"theme": "dark", "debug_mode": False},
            "services": {"flask_port": 5000},
            "ui": {},
            "terminal": {}
        }
        return self._load_config_file(self.system_config_file, defaults)
    
    def load_ai_config(self) -> Dict[str, Any]:
        """Load AI configuration"""
        defaults = {
            "ai": {
                "model": "openai/gpt-4-turbo",
                "api_key": "",
                "temperature": 0.7
            }
        }
        return self._load_config_file(self.ai_config_file, defaults)
    
    def save_config(self, config: Dict[str, Any]):
        """Save configuration (split into system/ai)"""
        # Extract system parts
        system_config = {
            k: v for k, v in config.items() 
            if k in ['system', 'services', 'ui', 'terminal']
        }
        # Extract AI parts
        ai_config = {k: v for k, v in config.items() if k in ['ai']}
        
        self._save_config_file(self.system_config_file, system_config)
        self._save_config_file(self.ai_config_file, ai_config)
    
    def _load_config_file(self, filepath: str, defaults: Dict) -> Dict:
        """Load config file with fallback to defaults"""
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                saved = json.load(f)
                # Merge with defaults
                for key in defaults:
                    if key in saved:
                        defaults[key].update(saved[key])
        return defaults
    
    def _save_config_file(self, filepath: str, config: Dict):
        """Save config to file"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(config, f, indent=2)
```

---

## 5. Flask App Factory

### app.py (New Entry Point)

```python
from flask import Flask
from flask_cors import CORS
from controllers.config_controller import ConfigController
from controllers.chat_controller import ChatController
from controllers.file_controller import FileController
from controllers.session_controller import SessionController
from controllers.project_controller import ProjectController
from controllers.service_controller import ServiceController
from controllers.script_controller import ScriptController
from controllers.history_controller import HistoryController
from controllers.system_controller import SystemController

def create_app():
    """
    Flask application factory
    Fábrica de aplicação Flask
    """
    app = Flask(__name__)
    CORS(app)
    
    # Configure app
    app.config['JSON_SORT_KEYS'] = False
    
    # Register blueprints
    controllers = [
        ConfigController(),
        ChatController(),
        FileController(),
        SessionController(),
        ProjectController(),
        ServiceController(),
        ScriptController(),
        HistoryController(),
        SystemController()
    ]
    
    for controller in controllers:
        app.register_blueprint(controller.blueprint)
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Endpoint not found"}, 404
    
    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Internal server error"}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='127.0.0.1', port=5000, debug=True)
```

---

##6. Migration Strategy

### Phase 1: Preparation
1. Backup `server.py` → `server.py.backup`
2. Create directory structure
3. Implement core classes (BaseController, Response)

### Phase 2: Controller Migration (Iterative)
For each domain:
1. Create controller class
2. Create service class
3. Extract routes from server.py
4. Refactor to use service layer
5. Test endpoints individually

### Phase 3: Integration
1. Create app.py factory
2. Register all blueprints
3. Update startup script
4. Full integration test

### Phase 4: Cleanup
1. Remove old server.py
2. Update documentation
3. Final testing

---

## 7. Benefits

### Code Quality
✅ Single Responsibility Principle  
✅ Dependency Injection  
✅ Testable components  
✅ Consistent error handling

### Maintainability
✅ Easy to locate endpoint logic  
✅ Clear domain boundaries  
✅ Reusable service layer  
✅ Scalable structure

### Performance
✅ Lazy blueprint loading  
✅ Better import optimization  
✅ Easier to cache/optimize

---

## 8. Next Steps

1. **Get user approval** for this blueprint
2. **Create core infrastructure** (BaseController, etc.)
3. **Start with ConfigController** (most complex)
4. **Iterate through remaining controllers**
5. **Test and deploy**

**Estimated Timeline:**
- Core setup: 1h
- Controller migration: 5h (7 controllers)
- Integration: 1.5h
- Testing: 1.5h
- **Total: 9h**
