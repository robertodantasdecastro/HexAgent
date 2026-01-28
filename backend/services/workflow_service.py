"""
Workflow Service - Manages automated security workflows
Serviço de Fluxo de Trabalho - Gerencia fluxos de trabalho de segurança automatizados

Orchestrates AgentCore and HexStrike to perform complex tasks like Reconnaissance and Vulnerability Scanning.
Orquestra AgentCore e HexStrike para realizar tarefas complexas como Reconhecimento e Varredura de Vulnerabilidades.
"""

import json
import os
import logging
from pathlib import Path
from typing import Dict, Any, List

class WorkflowService:
    """
    Service for executing automated workflows
    Serviço para executar fluxos de trabalho automatizados
    """
    
    def __init__(self, agent_core=None):
        self.logger = logging.getLogger(__name__)
        self.core = agent_core
        self.workflow_dir = Path.home() / ".hexagent-gui" / "workflows"
        self._ensure_dir()
        
    def _ensure_dir(self):
        """Ensure workflow directory exists"""
        self.workflow_dir.mkdir(parents=True, exist_ok=True)
        
    def list_workflows(self) -> List[Dict[str, Any]]:
        """
        List available workflow templates
        Listar templates de fluxo de trabalho disponíveis
        """
        workflows = []
        try:
            for file_path in self.workflow_dir.glob("*.json"):
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        # Minimal validation
                        if 'id' in data and 'name' in data:
                            workflows.append({
                                'id': data['id'],
                                'name': data['name'],
                                'description': data.get('description', ''),
                                'icon': data.get('icon', 'Terminal'),
                                'variables': data.get('variables', [])
                            })
                except Exception as e:
                    self.logger.error(f"Error loading workflow {file_path}: {e}")
        except Exception as e:
            self.logger.error(f"Error listing workflows: {e}")
            
        return sorted(workflows, key=lambda x: x['name'])

    def get_workflow(self, workflow_id: str) -> Dict[str, Any]:
        """Get full workflow definition"""
        file_path = self.workflow_dir / f"{workflow_id}.json"
        if not file_path.exists():
            return None
        with open(file_path, 'r') as f:
            return json.load(f)

    def execute_workflow(self, workflow_type: str, target: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Execute a workflow.
        If 'native_api', calls HexStrike API directly.
        If 'prompt', generates text for the Chat.
        """
        workflow = self.get_workflow(workflow_type)
        if not workflow:
            raise ValueError(f"Workflow {workflow_type} not found")
        
        # Check type
        w_type = workflow.get('type', 'prompt')
        
        if w_type == 'native_api':
            return self._execute_native(workflow, params or {})
            
        # Default Prompt logic
        steps = workflow.get('steps', [])
        initial_prompt = ""
        
        # We only look at the first prompt step to start the conversation
        for step in steps:
            if step.get('type') == 'prompt':
                initial_prompt = step.get('content', '').replace('{target}', target)
                break
        
        return {
            "success": True,
            "message": f"Workflow {workflow['name']} initiated",
            "initial_prompt": initial_prompt,
            "workflow": workflow
        }

    def _execute_native(self, workflow: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a native API workflow against HexStrike"""
        import requests
        
        endpoint = workflow.get('endpoint')
        method = workflow.get('method', 'POST')
        
        # Build URL (HexStrike Port 8888)
        url = f"http://127.0.0.1:8888{endpoint}"
        
        try:
            self.logger.info(f"[WORKFLOW] Native Call {method} {url} with {params}")
            
            if method == 'POST':
                response = requests.post(url, json=params, timeout=30)
            elif method == 'GET':
                 # Convert params to query string if needed, or just allow empty
                response = requests.get(url, params=params, timeout=30)
            else:
                return {"success": False, "error": f"Method {method} not supported"}
                
            if response.status_code >= 200 and response.status_code < 300:
                return {
                    "success": True,
                    "type": "native_response",
                    "data": response.json(),
                    "workflow": workflow
                }
            else:
                return {
                    "success": False, 
                    "error": f"API Error {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            self.logger.error(f"[WORKFLOW] Native Execution Failed: {e}")
            return {"success": False, "error": str(e)}

