#!/usr/bin/env python3
"""
Test Script: Dynamic Model Fetching
Script de Teste: Busca Dinâmica de Modelos

Tests all provider strategies to verify dynamic model fetching.
Testa todas as strategies de providers para verificar busca dinâmica de modelos.

Usage: python3 test_dynamic_models.py
"""

import sys
import json
import logging
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from core.providers.provider_factory import ProviderFactory

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

def load_config():
    """Load AI configuration from user home"""
    config_path = Path.home() / ".hexagent-gui" / "ai-config.json"
    if not config_path.exists():
        logger.warning(f"Config file not found: {config_path}")
        return None
    
    try:
        with open(config_path, 'r') as f:
            full_config = json.load(f)
            return full_config.get('ai', {})
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return None

def test_provider(engine, config):
    """Test get_available_models() for a specific provider"""
    print(f"\n{'='*60}")
    print(f"Testing: {engine.upper()}")
    print(f"{'='*60}")
    
    try:
        # Create provider instance
        provider = ProviderFactory.create_provider(engine, config)
        
        # Get models
        models = provider.get_available_models()
        
        # Display results
        if models:
            print(f"✅ SUCCESS: Fetched {len(models)} models")
            print(f"\nModels:")
            for i, model in enumerate(models[:10], 1):  # Show first 10
                print(f"  {i}. {model}")
            if len(models) > 10:
                print(f"  ... and {len(models) - 10} more")
        else:
            print(f"⚠️  WARNING: No models returned")
            
    except Exception as e:
        print(f"❌ FAILED: {e}")

def main():
    """Main test runner"""
    config = load_config()
    
    if not config:
        logger.error("No configuration found. Please configure the app first.")
        return
    
    active_engine = config.get('engine', 'openai')
    print(f"\n🔧 Active Engine from Config: {active_engine}")
    
    # Test configurations for each engine
    test_configs = {
        'openai': {
            'api_key': config.get('api_key', 'sk-test'),
            'base_url': 'https://api.openai.com/v1'
        },
        'lmstudio': {
            'api_key': 'lm-studio',
            'host': config.get('host', 'http://127.0.0.1'),
            'port': config.get('port', 1234)
        },
        'deepseek': {
            'api_key': config.get('api_key', 'sk-test'),
            'base_url': 'https://api.deepseek.com/v1'
        },
        'claude': {
            'api_key': config.get('api_key', 'sk-ant-test')
        },
        'openrouter': {
            'api_key': config.get('api_key', 'sk-or-test'),
            'base_url': 'https://openrouter.ai/api/v1'
        }
    }
    
    # Test each provider
    for engine, test_config in test_configs.items():
        try:
            test_provider(engine, test_config)
        except KeyboardInterrupt:
            print("\n\n⚠️  Test interrupted by user")
            break
    
    print(f"\n{'='*60}")
    print("✅ All tests completed")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
