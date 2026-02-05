#!/usr/bin/env python3
"""
Safe URL Replacement Tool
Ferramenta de Substituição Segura de URLs

Replaces hardcoded localhost:5000 URLs with APIClient calls
Substitui URLs hardcoded localhost:5000 por chamadas APIClient
"""

import re
import sys
from pathlib import Path

# Files to process with their URL locations
# Arquivos para processar com suas localizações de URL
FILES_TO_PROCESS = {
    'src/components/ShutdownModal.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/files/temp'\)", 
         'replacement': "const api = APIClient.getInstance(); await api.get('/files/temp')"},
        {'line_pattern': r"await fetch\('http://localhost:5000/shutdown'",
         'replacement': "const api = APIClient.getInstance(); await api.post('/shutdown'"}
    ],
    'src/components/SaveFilesDialog.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/session/files/save'",
         'replacement': "const api = APIClient.getInstance(); await api.post('/session/files/save'"}
    ],
    'src/components/ScriptBlock.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/file/write'",
         'replacement': "const api = APIClient.getInstance(); await api.post('/file/write'"}
    ],
    'src/components/OverwriteConfirmDialog.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/file/diff'",
         'replacement': "const api = APIClient.getInstance(); await api.post('/file/diff'"}
    ],
    'src/components/SmartBlock.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/config/user/ui/block_rules'\)",
         'replacement': "const api = APIClient.getInstance(); await api.get('/config/user/ui/block_rules')"}
    ],
    'src/components/BrainSelector.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/config/user/ai/brains'\)",
         'replacement': "const api = APIClient.getInstance(); await api.get('/config/user/ai/brains')"}
    ],
    'src/components/LoadingScreen.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/execute'",
         'replacement': "const api = APIClient.getInstance(); await api.post('/execute'"}
    ],
    'src/components/WorkflowManagerModal.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000'",
         'replacement': "const api = APIClient.getInstance(); await api.post('"}
    ],
    'src/components/AIConfigModal.jsx': [
        {'line_pattern': r"await fetch\('http://localhost:5000/ai/test'",
         'replacement': "const api = APIClient.getInstance(); await api.post('/ai/test'"}
    ],
}

def add_import_if_missing(content, import_line):
    """Add import if not already present"""
    if import_line not in content:
        # Find last import and add after it
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        
        if last_import_idx >= 0:
            lines.insert(last_import_idx + 1, import_line)
            return '\n'.join(lines)
    return content

def process_file(filepath, replacements):
    """Process a single file with given replacements"""
    path = Path(filepath)
    if not path.exists():
        print(f"⚠️  File not found: {filepath}")
        return False
    
    # Read file
    content = path.read_text()
    original_content = content
    
    # Add APIClient import if needed
    content = add_import_if_missing(content, "import APIClient from '../utils/APIClient';")
    
    # Apply replacements
    changes_made = 0
    for repl in replacements:
        pattern = repl['line_pattern']
        replacement = repl['replacement']
        
        # Use regex to replace
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            changes_made += 1
            content = new_content
    
    # Write back if changes made
    if content != original_content:
        path.write_text(content)
        print(f"✅ {filepath}: {changes_made} URLs replaced")
        return True
    else:
        print(f"ℹ️  {filepath}: No changes needed")
        return False

def main():
    """Main execution"""
    print("🔧 Safe URL Replacement Tool")
    print("=" * 50)
    
    total_files = len(FILES_TO_PROCESS)
    modified_files = 0
    
    for filepath, replacements in FILES_TO_PROCESS.items():
        if process_file(filepath, replacements):
            modified_files += 1
    
    print("=" * 50)
    print(f"✅ Complete: {modified_files}/{total_files} files modified")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
