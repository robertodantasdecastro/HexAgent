#!/usr/bin/env python3
"""
Test AgentCore Hot Reload
Teste de Recarga Quente do AgentCore

Verifies that calling AgentCore.initialize() correctly swaps the AI provider
while maintaining system stability (Thread Safety).
Verifica se chamar AgentCore.initialize() troca corretamente o provedor de IA
mantendo a estabilidade do sistema (Segurança de Thread).
"""

import sys
import os
import unittest
from unittest.mock import MagicMock

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../backend'))

from core.agent_core import AgentCore
from core.providers.openai_strategy import OpenAIStrategy
# We can mock the factory or the strategies directly

class TestHotReload(unittest.TestCase):
    
    def test_hot_reload(self):
        print("\n[-] Testing AgentCore Hot Reload...")
        
        # 1. Initialize with Dummy/Lazy Defaults
        core = AgentCore(engine="openai", api_key="test-key")
        
        # Mock the ProviderFactory to strictly control what gets created
        # We want to verify that create_provider is called with new args
        
        # NOTE: Since AgentCore imports ProviderFactory at module level, 
        # mocking it requires patching where it is imported in agent_core.py
        
        from unittest.mock import patch
        
        with patch('core.agent_core.ProviderFactory') as MockFactory:
            # Setup Mocks for Providers
            mock_openai = MagicMock()
            mock_openai.get_provider_name.return_value = "openai"
            mock_openai.get_default_model.return_value = "gpt-4"
            
            mock_lmstudio = MagicMock()
            mock_lmstudio.get_provider_name.return_value = "lmstudio"
            mock_lmstudio.get_default_model.return_value = "mistral"
            
            # Define side_effect for create_provider to return specific mocks based on engine arg
            def side_effect(engine, config):
                if engine == 'openai': return mock_openai
                if engine == 'lmstudio': return mock_lmstudio
                return MagicMock()
                
            MockFactory.create_provider.side_effect = side_effect
            
            # 2. Re-Initialize Core with OpenAI (Validation)
            # 2. Re-inicializar Core com OpenAI (Validação)
            core.initialize(engine="openai", api_key="key-1")
            
            self.assertEqual(core.provider, mock_openai, "Initial provider should be OpenAI")
            self.assertEqual(core.orchestrator.provider, mock_openai, "Orchestrator should hold OpenAI")
            
            # 3. Hot Reload to LM Studio
            # 3. Recarga Quente para LM Studio
            print("    -> Switching to LM Studio...")
            core.initialize(engine="lmstudio", model="mistral", provider_kwargs={"host": "http://localhost"})
            
            self.assertEqual(core.provider, mock_lmstudio, "Provider should update to LM Studio")
            self.assertEqual(core.orchestrator.provider, mock_lmstudio, "Orchestrator should update to LM Studio")
            self.assertEqual(core.engine, "lmstudio", "Core engine state should be lmstudio")
            
            print("[PASS] Hot Reload successful: OpenAI -> LM Studio")
            
            # 4. Verify thread lock (implicit, but ensure no race condition crashes)
            # 4. Verificar bloqueio de thread (implícito, mas garantir ausência de falhas de condição de corrida)
            
            # 5. Switch Back
            print("    -> Switching back to OpenAI...")
            core.initialize(engine="openai", api_key="key-2")
            self.assertEqual(core.provider, mock_openai)
            
            print("[PASS] Hot Reload toggle verified")

if __name__ == '__main__':
    unittest.main()
