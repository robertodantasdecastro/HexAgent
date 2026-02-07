"""
Pytest configuration for HexAgentGUI tests
Configuração do pytest para testes do HexAgentGUI

Sets up Python path to enable imports from backend/.
Configura path do Python para habilitar imports de backend/.
"""

import sys
import os

# Add project root to Python path
# Adicionar raiz do projeto ao path do Python
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

print(f"✅ pytest configured with project root: {project_root}")
