#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
HexAgentGUI - Backend Server / Servidor Backend
================================================

Autonomous AI-Powered Cybersecurity Agent
Agente de IA Autônomo Especializado em Cibersegurança

This Flask backend implements the AgentCore that combines:
- HexSecGPT: AI brain for cybersecurity expertise
- HexStrike: Command execution engine
- Autonomous iterative loop with feedback (up to 10 iterations)

Este backend Flask implementa o AgentCore que combina:
- HexSecGPT: Cérebro de IA para expertise em cibersegurança  
- HexStrike: Motor de execução de comandos
- Loop iterativo autônomo com feedback (até 10 iterações)

Author / Autor: Roberto Dantas de Castro
Email: robertodantasdecastro@gmail.com
GitHub: https://github.com/robertodantasdecastro/HexAgent
License / Licença: MIT
"""

import sys
import os
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import time
import subprocess
import signal
import atexit
import threading

# Add parent directories to sys.path to find HexAgent and its dependencies
# Add path logic
if getattr(sys, 'frozen', False):
    base_dir = os.path.dirname(sys.executable)
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))

# Add bundled libs to path
libs_path = os.path.join(base_dir, 'libs')
if os.path.exists(libs_path):
    sys.path.insert(0, libs_path)
    print(f"Added {libs_path} to sys.path")
    
    # CRITICAL: Add to PYTHONPATH so subprocesses (HexStrike) can find them too
    # CRITICO: Adicionar ao PYTHONPATH para que subprocessos (HexStrike) encontrem também
    current_pythonpath = os.environ.get("PYTHONPATH", "")
    os.environ["PYTHONPATH"] = f"{libs_path}{os.pathsep}{current_pythonpath}"
    print(f"Updated PYTHONPATH: {os.environ['PYTHONPATH']}")

# Logic for finding dependencies
# Dev: iatools/HexAgentGUI/backend -> iatools/
# Prod: app/resources/backend -> app/resources/
# In Prod after extraResources:
# resources/
#   backend/
#   HexAgent/
#   HexSecGPT-main/
#   hexstrike-ai/

# We want to add 'resources' (parent of backend) to sys.path in PROD
# We want to add 'iatools' (parent of HexAgentGUI) to sys.path in DEV

parent_dir = os.path.dirname(base_dir) # resources OR HexAgentGUI
grandparent_dir = os.path.dirname(parent_dir) # app OR iatools

# Try to find HexAgent
hexagent_path_dev = os.path.join(grandparent_dir, "HexAgent")
hexagent_path_prod = os.path.join(parent_dir, "HexAgent")

if os.path.exists(hexagent_path_prod):
    # Production / Unpacked resources
    sys.path.insert(0, parent_dir)
    # Also need to make sure HexSecGPT and hexstrike-ai are importable
    # They are in parent_dir, so adding parent_dir to sys.path should allow 'import HexAgent'
    # BUT HexAgent codebase might expect 'HexSecGPT-main' to be in path or accessible.
    sys.path.append(os.path.join(parent_dir, "HexSecGPT-main"))
    sys.path.append(os.path.join(parent_dir, "hexstrike-ai"))
    print(f"Prod Mode: Added {parent_dir} to sys.path")
elif os.path.exists(hexagent_path_dev):
    # Dev Mode
    sys.path.insert(0, grandparent_dir)
    sys.path.append(os.path.join(grandparent_dir, "HexSecGPT-main"))
    sys.path.append(os.path.join(grandparent_dir, "hexstrike-ai"))
    print(f"Dev Mode: Added {grandparent_dir} to sys.path")

try:
    from HexAgent.core import AgentCore
    from HexAgent.config import Config
    from HexAgent.key_manager import KeyManager
    from dotenv import load_dotenv
except ImportError as e:
    print(f"Critical Error: Failed to import HexAgent modules. {e}")
    # Don't exit, allow debugging endpoints if possible, or just fail hard.
    # sys.exit(1)

app = Flask(__name__)
CORS(app) # Enable CORS for Electron

# Cleanup Handler / Handler de Limpeza
# Cleanup Handler / Handler de Limpeza
cleaned_up = False
def cleanup_handler(*args):
    global cleaned_up
    if cleaned_up:
        return
    cleaned_up = True
    
    print("\n[HexAgentBackend] Shutting down... / Desligando...")
    try:
        # Check if core is initialized and has shutdown
        if 'core' in globals() and hasattr(core, 'shutdown'):
            core.shutdown()
    except Exception as e:
        print(f"Error during cleanup: {e}")
    
    # Only exit explicitly if called by signal (args present)
    if args:
        sys.exit(0)

# Register handlers
signal.signal(signal.SIGINT, cleanup_handler)
signal.signal(signal.SIGTERM, cleanup_handler)
atexit.register(cleanup_handler)

def setup_workspace():
    """Confirms default workspace exists and sets it as CWD"""
    try:
        home = os.path.expanduser("~")
        work_dir = os.path.join(home, ".hexagent-gui")
        if not os.path.exists(work_dir):
            os.makedirs(work_dir)
            print(f"[Workspace] Created default directory: {work_dir}")
        
        # Create subdirectories / Criar subdiretórios
        # log is handled by server logic usually, but we define explicit path here if used
        for folder in ['log', 'config', 'adjusts', 'agents', 'sessions']:
            os.makedirs(os.path.join(work_dir, folder), exist_ok=True)

        # Change to workspace so relative paths in user commands work there
        os.chdir(work_dir)
        print(f"[Workspace] Working directory set to: {os.getcwd()}")
        
        # Ensure default config exists in user dir
        config_dest = os.path.join(work_dir, 'config', 'config.json')
        if not os.path.exists(config_dest):
            default_config = os.path.join(base_dir, 'config.json')
            if os.path.exists(default_config):
                try:
                    with open(default_config, 'r') as src, open(config_dest, 'w') as dst:
                         dst.write(src.read())
                    print(f"[Workspace] Copied default config to {config_dest}")
                except Exception as ex:
                    print(f"[Workspace] Failed to copy config: {ex}")
        return work_dir
    except Exception as e:
        print(f"[Workspace] Error setting up workspace: {e}")
        return os.getcwd()

# Setup workspace immediately
WORKSPACE_DIR = setup_workspace()

# Global Agent Core / Núcleo Global do Agente
core = AgentCore()

# Configuration Management / Gerenciamento de Configuração
def load_config():
    """
    Load configuration from config.json
    Carrega configuração do config.json
    Priority: User Config (~/.hexagent-gui/config/config.json) > Default (base_dir/config.json)
    """
    user_config = os.path.join(WORKSPACE_DIR, 'config', 'config.json')
    sys_config = os.path.join(base_dir, 'config.json')
    
    config_path = user_config if os.path.exists(user_config) else sys_config
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[Config] Failed to load config.json: {e}")
        # Return default config / Retorna config padrão
        return {
            "ai": {
                "language": "auto", 
                "model": "openai/gpt-4-turbo", 
                "temperature": 0.7, 
                "max_iterations": 10, 
                "unlimited_iterations": False,
                "web_search_enabled": False,
                "api_key": ""
            },
            "services": {
                "flask_port": 5000, 
                "hexstrike_port": 8888,
                "backend_host": "127.0.0.1"
            },
            "system": {
                "theme": "dark"
            }
        }

def save_config(config):
    """
    Save configuration to config.json
    Salva configuração no config.json (Always in User Dir)
    """
    config_path = os.path.join(WORKSPACE_DIR, 'config', 'config.json')
    try:
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"[Config] Failed to save config.json: {e}")
        return False

def detect_language(text):
    """
    Auto-detect language from user input (Portuguese or English)
    Auto-detecta idioma da entrada do usuário (Português ou Inglês)
    """
    text_lower = text.lower()
    
    # Portuguese keywords / Palavras-chave em português
    pt_keywords = [
        'o que', 'como', 'por favor', 'obrigado', 'obrigada',
        'sim', 'não', 'porque', 'quando', 'onde', 'quem',
        'faça', 'faça', 'mostre', 'liste', 'abra', 'feche',
        'instale', 'configure', 'para', 'pela', 'pelo', 'está'
    ]
    
    # Count Portuguese keyword matches / Conta matches de palavras PT
    pt_count = sum(1 for keyword in pt_keywords if keyword in text_lower)
    
    # If 2+ Portuguese keywords found, assume Portuguese
    # Se 2+ palavras PT encontradas, assume Português
    return 'pt' if pt_count >= 2 else 'en'

# Load configuration on startup / Carrega configuração na inicialização
config = load_config()
print(f"[Config] Loaded: {config}")

@app.route('/init_status', methods=['GET'])
def init_status():
    """
    Returns detailed initialization status for loading screen
    Retorna status detalhado de inicialização para tela de carregamento
    """
    try:
        # Check HexStrike connection / Verifica conexão HexStrike
        hexstrike_ready = False
        if core.body:
            try:
                health = core.get_hexstrike_health()
                hexstrike_ready = health.get('alive', False) or health.get('status') == 'ok'
            except:
                pass
        
        return jsonify({
            'backend': {
                'ready': True,
                'status': 'success',
                'port': config.get('services', {}).get('flask_port', 5000)
            },
            'brain': {
                'ready': core.brain is not None,
                'status': 'success' if core.brain is not None else 'error',
                'message': 'HexSecGPT initialized' if core.brain else 'Brain not initialized'
            },
            'hexstrike': {
                'ready': hexstrike_ready,
                'status': 'success' if hexstrike_ready else 'pending',
                'port': config.get('services', {}).get('hexstrike_port', 8888),
                'message': 'Connected' if hexstrike_ready else 'Offline (click Power button to start)'
            },
            'config': {
                'ready': config is not None,
                'status': 'success' if config else 'error',
                'message': 'Configuration loaded' if config else 'Config not loaded'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "agent": "HexAgentGUI"})

@app.route('/init', methods=['POST'])
def init_agent():
    # Load env/key similar to HexAgentApp.on_mount
    # We look for .HexSec in HexSecGPT-main or env
    
    # Try to find key
    # Try to find key from Config FIRST (User override)
    config_key = config.get('ai', {}).get('api_key')
    if config_key and config_key.strip():
        api_key = config_key.strip()
        print("[Auth] Using API Key from configuration")
    else:
        # Fallback to env file
        env_path = Config.ENV_FILE
        if not os.path.exists(env_path):
            # Fallback to HexSecGPT-main/.HexSec
            potential_path = os.path.join(parent_dir, "HexSecGPT-main", ".HexSec")
            if os.path.exists(potential_path):
                env_path = potential_path
                
        load_dotenv(dotenv_path=env_path)
        api_key = os.getenv(Config.API_KEY_NAME)
    
    if not api_key:
        return jsonify({"success": False, "error": "API Key not found. Please configure it in Settings."}), 400
        
    if core.initialize(api_key):
        # Auto-start HexStrike logic / Lógica de auto-início HexStrike
        # The core.initialize already attempts this, but let's double check and enforce
        started = False
        if core.body:
             try:
                 health = core.body.check_health()
                 if health.get('alive') or health.get('status') == 'ok':
                     started = True
                 else:
                     print("[HexAgentGUI] HexStrike not alive, forcing start...")
                     if core._start_hexstrike_server():
                         time.sleep(3) # Wait for startup
                         health = core.body.check_health()
                         if health.get('alive') or health.get('status') == 'ok':
                             started = True
             except Exception as e:
                 print(f"[HexAgentGUI] Error accessing HexStrike body: {e}")
                 # Try blind start
                 core._start_hexstrike_server()
                 time.sleep(3) 
                 started = True # Optimistic

        message = "Neural Link Established."
        if not started:
             message += " WARNING: HexStrike Server might be offline. Check 'Power' button."

        return jsonify({"success": True, "message": message})
    else:
        return jsonify({"success": False, "error": "Failed to initialize Agent Core"}), 500

@app.route('/config', methods=['GET', 'POST'])
def config_endpoint():
    """
    Get or update configuration / Obter ou atualizar configuração
    GET: Returns current config
    POST: Updates config with request body
    """
    global config
    
    if request.method == 'GET':
        return jsonify(config)
    
    elif request.method == 'POST':
        try:
            new_config = request.json
            # Merge with existing config / Mescla com config existente
            config.update(new_config)
            
            # Save to file / Salva no arquivo
            if save_config(config):
                return jsonify({"success": True, "config": config})
            else:
                return jsonify({"success": False, "error": "Failed to save config"}), 500
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 400

@app.route('/chat', methods=['POST'])
def chat():
    """
    Agentic chat with automatic command execution, language auto-detection,  and optional web search.
    Chat agêntico com execução automática, auto-detecção de idioma e busca web opcional.
    
    Expects json: { "message": "user input", "language": "auto" (optional), "web_search": false (optional) }
    """
    data = request.json
    user_input = data.get('message', '')
    language = data.get('language', config['ai'].get('language', 'auto'))
    web_search_enabled = data.get('web_search', config['ai'].get('web_search_enabled', False))
    auto_execute = data.get('auto_execute', True) # Default to True if not specified
    
    if not user_input:
        return jsonify({"error": "Empty message"}), 400

    # Auto-detect language if set to 'auto' / Auto-detecta idioma se 'auto'
    if language == 'auto':
        language = detect_language(user_input)
        print(f"[Chat] Auto-detected language: {language}")

    # Prepend language instruction / Prepara instrução de idioma
    if language and language != 'en':
        language_map = {'pt': 'português', 'es': 'español', 'fr': 'français', 'de': 'deutsch'}
        lang_name = language_map.get(language, language)
        user_input = f"Please respond in {lang_name}. {user_input}"
    
    # Add web search context if enabled
    if web_search_enabled:
        try:
            import requests
            from bs4 import BeautifulSoup
            
            # Simple DuckDuckGo HTML search
            search_url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(user_input)}"
            headers = {'User-Agent': 'Mozilla/5.0'}
            search_response = requests.get(search_url, headers=headers, timeout=5)
            
            if search_response.status_code == 200:
                soup = BeautifulSoup(search_response.text, 'html.parser')
                results = soup.find_all('a', class_='result__a', limit=3)
                
                if results:
                    search_context = "\n\n[Web Search Results]:\n"
                    for i, result in enumerate(results, 1):
                        title = result.get_text(strip=True)
                        search_context += f"{i}. {title}\n"
                    
                    user_input = search_context + "\n" + user_input
        except Exception as e:
            # If web search fails, continue without it
            print(f"[Web Search] Failed: {e}")

    def generate():
        import re
        
        # Autonomous Agentic Loop with iterative feedback / Loop autônomo com feedback iterativo
        # Allow request override or config default
        req_limit = data.get('max_iterations')
        max_limit = req_limit if req_limit is not None else config['ai'].get('max_iterations', 10)
        unlimited = config['ai'].get('unlimited_iterations', False)
        
        # If unlimited, set a safe high limit or just use logic
        actual_limit = 1000 if unlimited else max_limit
        
        iteration = 0
        conversation_history = user_input
        
        while iteration < actual_limit:
            iteration += 1
            
            # Yield iteration marker
            if iteration > 1:
                display_limit = "∞" if unlimited else max_limit
                yield json.dumps({"chunk": f"\n\n{'='*60}\n🔄 Iteração {iteration}/{display_limit}\n{'='*60}\n\n"}) + "\n"
            
            # Step 1: Get AI response for current state
            full_response = ""
            for chunk in core.chat_step(conversation_history):
                full_response += chunk
                yield json.dumps({"chunk": chunk}) + "\n"
            
            # Step 2: Parse bash code blocks from the response
            code_blocks = re.findall(r'```(?:bash)?\n(.*?)\n```', full_response, re.DOTALL)
            
            # If no commands found, AI decided task is complete or gave final answer
            if not code_blocks:
                # Check if AI explicitly says task is complete
                if any(phrase in full_response.lower() for phrase in ['tarefa concluída', 'completed', 'finalizado', 'pronto', 'done']):
                    yield json.dumps({"chunk": "\n✅ Tarefa completada pelo agente!\n"}) + "\n"
                break
            
            # CHECK AUTO-EXECUTE: If False, yield proposal and stop
            if not auto_execute:
                 for cmd_block in code_blocks:
                     # Send proposal to frontend
                     yield json.dumps({"proposal": cmd_block}) + "\n"
                 # Stop the loop here, waiting for user action on frontend
                 break

            # Step 3: Execute commands and collect results
            execution_summary = ""
            
            if core.body:
                yield json.dumps({"chunk": "\n\n"}) + "\n"
                for cmd_block in code_blocks:
                    commands = [line.strip() for line in cmd_block.split('\n') 
                               if line.strip() and not line.strip().startswith('#')]
                    
                    for cmd in commands:
                        yield json.dumps({"chunk": f"🔧 Executando: {cmd}\n"}) + "\n"
                        result = core.execute_tool(cmd)
                        yield json.dumps({"chunk": f"{result}\n\n"}) + "\n"
                        
                        # Add to execution summary for AI feedback
                        execution_summary += f"\nComando: {cmd}\nResultado: {result}\n"
            else:
                yield json.dumps({"chunk": "\n⚠️ HexStrike offline - comandos não executados\n"}) + "\n"
                break
            
            # Step 4: Prepare feedback for next iteration
            # Ask AI to analyze results and decide next step
            conversation_history = f"""{user_input}

[Histórico de Execução - Iteração {iteration}]:
{execution_summary}

Analise os resultados acima. Se a tarefa original ainda não está completa, sugira o PRÓXIMO comando necessário. Se a tarefa está completa, responda 'Tarefa concluída' e resuma o que foi feito."""
        
        # Loop ended
        if iteration >= actual_limit:
            yield json.dumps({"chunk": f"\n⚠️ Limite de {actual_limit} iterações atingido.\n"}) + "\n"
            yield json.dumps({"limit_reached": True, "iterations": actual_limit}) + "\n"
    
    return Response(generate(), mimetype='application/json')

@app.route('/complete', methods=['POST'])
def autocomplete():
    """
    Provide shell autocompletion suggestions.
    Fornece sugestões de autocompletar do shell.
    Expects: { "prefix": "ls -" } (full input line or partial)
    """
    data = request.json
    # We take the last word for completion
    full_input = data.get('prefix', '')
    if not full_input:
        return jsonify({"suggestions": []})
        
    try:
        # extract last token
        last_token = full_input.split(" ")[-1]
        
        # Use compgen
        # -c for commands, -f for files
        cmd = f'bash -c "compgen -c {last_token} && compgen -f {last_token}"'
        output = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode('utf-8')
        
        # Filter duplicates
        suggestions = sorted(list(set([line for line in output.split('\n') if line.strip()])))
        
        return jsonify({"suggestions": suggestions[:20]})
    except Exception:
        # If compgen fails or empty, return empty
        return jsonify({"suggestions": []})

@app.route('/shutdown', methods=['POST'])
def shutdown_server():
    """Graceful shutdown triggered by UI / Encerramento gracioso via interface"""
    print("[API] Shutdown requested")
    def kill():
        cleanup_handler("api") # Pass arg to force exit
    
    # Schedule kill to allow response to return
    t = threading.Thread(target=lambda: (time.sleep(1), kill()))
    t.start()
    return jsonify({"status": "shutting_down"})

@app.route('/execute', methods=['POST'])
def execute_command():
    """
    Execute a tool/command.
    Expects: { "command": "ls -la" }
    """
    data = request.json
    cmd = data.get('command')
    if not cmd:
        return jsonify({"error": "No command provided"}), 400
        
    result = core.execute_tool(cmd)
    return jsonify({"result": result})

@app.route('/status', methods=['GET'])
def status():
    """
    Return system status - checks if Brain is initialized.
    Returns: {"status": "ok", "alive": True} if Brain is ready
    """
    # Check if Brain is initialized first
    if not core.brain:
        return jsonify({"status": "offline", "alive": False, "message": "Brain not initialized"})
    
    # Brain is initialized
    return jsonify({"status": "ok", "alive": True, "message": "Brain online"})

@app.route('/start_service', methods=['POST'])
def start_service():
    if core._start_hexstrike_server():
        return jsonify({"success": True, "message": "Service starting..."})
    return jsonify({"success": False, "error": "Failed to start service"}), 500

@app.route('/stop_service', methods=['POST'])
def stop_service():
    core.shutdown()
    return jsonify({"success": True, "message": "Service stopped"})

@app.route('/service', methods=['POST'])
def service_control():
    """
    Control services (hexstrike, brain) / Controlar serviços
    { "service": "hexstrike", "action": "start"|"stop" }
    """
    data = request.json
    service = data.get('service')
    action = data.get('action')
    
    if service == 'hexstrike':
        try:
            if action == 'start':
                # Force start check
                if core._start_hexstrike_server():
                    return jsonify({"success": True, "message": "HexStrike starting..."})
                else:
                    return jsonify({"success": False, "message": "Failed to trigger start"}), 500
            elif action == 'stop':
                # Try to kill port 8888 or use internal method if available
                # AgentCore might not have public stop method for body only.
                # using fuser/kill for linux
                subprocess.run("fuser -k 8888/tcp", shell=True)
                return jsonify({"success": True, "message": "HexStrike stopped"})
        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    elif service == 'brain':
        try:
            if action == 'stop':
                core.shutdown() # This might kill everything? NO, core.shutdown usually clears brain/body.
                return jsonify({"success": True, "message": "Brain disconnected"})
            elif action == 'start':
                # We need API key. Core might have it cached?
                # init_agent() endpoint handles this better.
                # We tell frontend to call /init
                return jsonify({"success": True, "action": "call_init", "message": "Please call /init"})
        except Exception as e:
             return jsonify({"success": False, "message": str(e)}), 500
             
    return jsonify({"success": False, "message": "Unknown service"})

@app.route('/sessions', methods=['POST'])
def session_control():
    """
    Manage sessions / Gerenciar sessões
    { "action": "save"|"load"|"list"|"delete", "name": "foo", "data": [...] }
    """
    data = request.json
    action = data.get('action')
    name = data.get('name', 'default')
    
    sessions_dir = os.path.join(WORKSPACE_DIR, 'sessions')
    if not os.path.exists(sessions_dir):
        os.makedirs(sessions_dir)
        
    safe_name = "".join([c for c in name if c.isalnum() or c in ('-','_')])
    file_path = os.path.join(sessions_dir, f"{safe_name}.json")
    
    try:
        if action == 'save':
            session_data = data.get('data', [])
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(session_data, f, indent=2, ensure_ascii=False)
            return jsonify({"success": True, "message": f"Session '{safe_name}' saved"})
            
        elif action == 'load':
            if not os.path.exists(file_path):
                 return jsonify({"success": False, "message": "Session not found"}), 404
            with open(file_path, 'r', encoding='utf-8') as f:
                content = json.load(f)
            return jsonify({"success": True, "data": content})
            
        elif action == 'delete':
             if os.path.exists(file_path):
                 os.remove(file_path)
                 return jsonify({"success": True, "message": f"Session '{safe_name}' deleted"})
             return jsonify({"success": False, "message": "Session not found"}), 404

        elif action == 'list':
             # List files
             try:
                 files = [f.replace('.json', '') for f in os.listdir(sessions_dir) if f.endswith('.json')]
                 return jsonify({"success": True, "sessions": sorted(files)})
             except Exception:
                 return jsonify({"success": True, "sessions": []})
                 
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
        
    return jsonify({"success": False, "message": "Invalid action"}), 400

if __name__ == '__main__':
    # Run slightly different port to avoid conflict
    app.run(host='127.0.0.1', port=5000, debug=True, use_reloader=False)
