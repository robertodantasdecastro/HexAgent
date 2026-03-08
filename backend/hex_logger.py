"""
HexAgent Logger - Structured logging for debug mode
Logs organized by category, date, and function
"""
import json
import os
from pathlib import Path
from datetime import datetime


class HexAgentLogger:
    """
    Enhanced logging system activated when debug_mode is enabled
    Organizes logs by category (terminal, inference, system, sessions) and date
    """
    
    def __init__(self, base_dir='~/.hexagent-gui/logs'):
        self.base_dir = Path(base_dir).expanduser()
        self.enabled = False
    
    def enable(self):
        """Enable logging and ensure directories exist"""
        self.enabled = True
        self._ensure_directories()
        self.log_system_event('logger_enabled', {'status': 'Logging system activated'})
    
    def disable(self):
        """Disable logging"""
        if self.enabled:
            self.log_system_event('logger_disabled', {'status': 'Logging system deactivated'})
        self.enabled = False
    
    def _ensure_directories(self):
        """Create category directories if they don't exist"""
        categories = ['terminal', 'inference', 'system', 'sessions']
        for cat in categories:
            (self.base_dir / cat).mkdir(parents=True, exist_ok=True)
    
    def _write_log(self, category, filename, data):
        """Write log data to JSON file"""
        if not self.enabled:
            return
        
        timestamp = datetime.now()
        date_str = timestamp.strftime('%Y-%m-%d')
        
        # Create date subdirectory
        date_dir = self.base_dir / category / date_str
        date_dir.mkdir(parents=True, exist_ok=True)
        
        # Write log file
        log_file = date_dir / filename
        with open(log_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def log_command(self, command, output, exit_code, cwd=None):
        """Log terminal command execution"""
        timestamp = datetime.now()
        
        log_data = {
            'timestamp': timestamp.isoformat(),
            'category': 'terminal',
            'event': 'command_execution',
            'data': {
                'command': command,
                'output': output[:1000] if len(output) > 1000 else output,  # Truncate long outputs
                'exit_code': exit_code,
                'cwd': cwd or os.getcwd()
            }
        }
        
        filename = f"cmd_{timestamp.strftime('%H-%M-%S-%f')}.json"
        self._write_log('terminal', filename, log_data)
    
    def log_ai_request(self, prompt, model, temperature, max_tokens=None):
        """Log AI inference request"""
        timestamp = datetime.now()
        
        log_data = {
            'timestamp': timestamp.isoformat(),
            'category': 'inference',
            'event': 'ai_request',
            'data': {
                'prompt_length': len(prompt),
                'prompt_preview': prompt[:200] + '...' if len(prompt) > 200 else prompt,
                'model': model,
                'temperature': temperature,
                'max_tokens': max_tokens
            }
        }
        
        filename = f"request_{timestamp.strftime('%H-%M-%S-%f')}.json"
        self._write_log('inference', filename, log_data)
    
    def log_ai_response(self, response_text, tokens_used, model):
        """Log AI inference response"""
        timestamp = datetime.now()
        
        log_data = {
            'timestamp': timestamp.isoformat(),
            'category': 'inference',
            'event': 'ai_response',
            'data': {
                'response_length': len(response_text),
                'tokens_used': tokens_used,
                'model': model
            }
        }
        
        filename = f"response_{timestamp.strftime('%H-%M-%S-%f')}.json"
        self._write_log('inference', filename, log_data)
    
    def log_system_event(self, event_type, data):
        """Log system-level events (startup, config changes, errors)"""
        timestamp = datetime.now()
        
        log_data = {
            'timestamp': timestamp.isoformat(),
            'category': 'system',
            'event': event_type,
            'data': data
        }
        
        filename = f"{event_type}_{timestamp.strftime('%H-%M-%S-%f')}.json"
        self._write_log('system', filename, log_data)
    
    def log_session(self, session_id, blocks, metadata=None):
        """Log full conversation session"""
        timestamp = datetime.now()
        
        log_data = {
            'timestamp': timestamp.isoformat(),
            'category': 'sessions',
            'session_id': session_id,
            'blocks_count': len(blocks),
            'blocks': blocks,
            'metadata': metadata or {}
        }
        
        filename = f"session_{session_id}_{timestamp.strftime('%Y%m%d')}.json"
        self._write_log('sessions', filename, log_data)
