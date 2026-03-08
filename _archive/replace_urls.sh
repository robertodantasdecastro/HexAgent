#!/bin/bash
# Automated URL replacement script
# Script de substituição automática de URLs

set -e  # Exit on error

BACKUP_DIR="/home/d4r13n/iatools/HexAgentGUI/.backup/urls_$(date +%s)"
mkdir -p "$BACKUP_DIR"

echo "🔧 Backing up files..."
# Backup files we'll modify
cp src/components/SessionModal.jsx "$BACKUP_DIR/"
cp src/components/ServiceManagerModal.jsx "$BACKUP_DIR/"
cp src/components/ShutdownModal.jsx "$BACKUP_DIR/"
cp src/components/ScriptBlock.jsx "$BACKUP_DIR/"
cp src/components/WorkflowManagerModal.jsx "$BACKUP_DIR/"
cp src/components/SaveFilesDialog.jsx "$BACKUP_DIR/"
cp src/components/AIConfigModal.jsx "$BACKUP_DIR/"
cp src/components/OverwriteConfirmDialog.jsx "$BACKUP_DIR/"
cp src/components/SmartBlock.jsx "$BACKUP_DIR/"
cp src/components/BrainSelector.jsx "$BACKUP_DIR/"
cp src/components/LoadingScreen.jsx "$BACKUP_DIR/"

echo "✅ Backup created at: $BACKUP_DIR"

echo "🔄 Replacing hardcoded URLs with APIClient..."

# SessionModal - Already done partially, fix delete
sed -i "s|await fetch('http://localhost:5000/sessions'|const api = APIClient.getInstance(); await api.post('/sessions'|g" src/components/SessionModal.jsx

# ServiceManagerModal
sed -i "s|await fetch('http://localhost:5000/init_status')|const api = APIClient.getInstance(); await api.get('/init_status')|g" src/components/ServiceManagerModal.jsx
sed -i "s|await fetch('http://localhost:5000/services/control'|const api = APIClient.getInstance(); await api.post('/services/control'|g" src/components/ServiceManagerModal.jsx

# ShutdownModal  
sed -i "s|await fetch('http://localhost:5000/files/temp')|const api = APIClient.getInstance(); await api.get('/files/temp')|g" src/components/ShutdownModal.jsx
sed -i "s|await fetch('http://localhost:5000/shutdown'|const api = APIClient.getInstance(); await api.post('/shutdown'|g" src/components/ShutdownModal.jsx

# ScriptBlock
sed -i "s|await fetch('http://localhost:5000/file/write'|const api = APIClient.getInstance(); await api.post('/file/write'|g" src/components/ScriptBlock.jsx

# WorkflowManagerModal
sed -i "s|await fetch('http://localhost:5000'|const api = APIClient.getInstance(); await api.post('|g" src/components/WorkflowManagerModal.jsx

# SaveFilesDialog
sed -i "s|await fetch('http://localhost:5000/session/files/save'|const api = APIClient.getInstance(); await api.post('/session/files/save'|g" src/components/SaveFilesDialog.jsx

# AIConfigModal
sed -i "s|await fetch('http://localhost:5000/ai/test'|const api = APIClient.getInstance(); await api.post('/ai/test'|g" src/components/AIConfigModal.jsx

# OverwriteConfirmDialog
sed -i "s|await fetch('http://localhost:5000/file/diff'|const api = APIClient.getInstance(); await api.post('/file/diff'|g" src/components/OverwriteConfirmDialog.jsx

# SmartBlock
sed -i "s|await fetch('http://localhost:5000/config/user/ui/block_rules')|const api = APIClient.getInstance(); await api.get('/config/user/ui/block_rules')|g" src/components/SmartBlock.jsx

# BrainSelector
sed -i "s|await fetch('http://localhost:5000/config/user/ai/brains')|const api = APIClient.getInstance(); await api.get('/config/user/ai/brains')|g" src/components/BrainSelector.jsx

# LoadingScreen
sed -i "s|await fetch('http://localhost:5000/execute'|const api = APIClient.getInstance(); await api.post('/execute'|g" src/components/LoadingScreen.jsx

echo "✅ URL replacements done!"
echo "⚠️  Note: You still need to add 'import APIClient from ../utils/APIClient' to each file"
echo "📁 Backup location: $BACKUP_DIR"
