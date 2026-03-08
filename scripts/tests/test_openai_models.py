#!/usr/bin/env python3
"""
Test Script: OpenAI Models List
Script de Teste: Lista de Modelos OpenAI

Tests OpenAI API to see what models are returned and filters them appropriately.
Testa API OpenAI para ver quais modelos são retornados e filtrá-los adequadamente.

Usage: python3 test_openai_models.py
"""

import os
import json
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

def load_config():
    """Load API configuration from user home directory"""
    config_path = Path.home() / ".hexagent-gui" / "ai-config.json"
    if not config_path.exists():
        logger.error(f"Config file not found at {config_path}")
        return None
    
    try:
        with open(config_path, 'r') as f:
            full_config = json.load(f)
            return full_config.get('ai', {})
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return None

def test_openai_models_raw():
    """Test raw OpenAI models list (unfiltered)"""
    config = load_config()
    if not config:
        return
    
    api_key = config.get('api_key')
    if not api_key:
        logger.error("API Key not found in config")
        return
    
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        
        logger.info("\n" + "="*60)
        logger.info("RAW MODELS LIST (Unfiltered)")
        logger.info("="*60)
        
        response = client.models.list()
        all_models = [model.id for model in response.data]
        
        logger.info(f"\nTotal models returned by API: {len(all_models)}")
        logger.info("\nAll models:")
        for i, model in enumerate(sorted(all_models), 1):
            print(f"  {i:3}. {model}")
        
        return all_models
        
    except Exception as e:
        logger.error(f"Failed to fetch OpenAI models: {e}")
        return []

def filter_models_smart(models):
    """
    Filter models to show only relevant/current ones
    Filtrar modelos para mostrar apenas relevantes/atuais
    
    Filtering Strategy:
    - Include: gpt-5, gpt-4.1, gpt-4o, gpt-4, gpt-3.5-turbo
    - Exclude: old versions, deprecated, audio-only, realtime-only, embeddings, etc.
    """
    if not models:
        return []
    
    # Patterns to INCLUDE (priority order)
    include_patterns = [
        'gpt-5',           # GPT-5 series (newest)
        'gpt-4.1',         # GPT-4.1 series
        'gpt-4o',          # GPT-4o series (multimodal)
        'gpt-4-turbo',     # GPT-4 turbo
        'gpt-4',           # Standard GPT-4
        'gpt-3.5-turbo'    # GPT-3.5 turbo (economical)
    ]
    
    # Patterns to EXCLUDE
    exclude_patterns = [
        'realtime',        # Real-time audio models (specialized)
        'audio',           # Audio-only models
        'preview',         # Preview/beta versions
        'vision',          # Vision-only (deprecated)
        'instruct',        # Instruct variants (mostly deprecated)
        'embedding',       # Embedding models
        'tts',             # Text-to-speech
        'whisper',         # Speech-to-text
        'dall-e',          # Image generation
        'babbage',         # Old completion models
        'davinci',         # Old completion models
        'curie',           # Old completion models
        'ada',             # Old completion models
        '-0',              # Specific date snapshots (e.g., gpt-4-0314)
        '-1',              # Specific date snapshots
        '-2',              # Specific date snapshots
        '-3',              # Specific date snapshots (except gpt-3.5)
    ]
    
    filtered = []
    
    for model in models:
        model_lower = model.lower()
        
        # Check if should be excluded
        should_exclude = any(pattern in model_lower for pattern in exclude_patterns)
        if should_exclude:
            continue
        
        # Check if matches include patterns
        should_include = any(pattern in model_lower for pattern in include_patterns)
        if should_include:
            filtered.append(model)
    
    return sorted(filtered, reverse=True)  # Newest first

def test_filtered_models():
    """Test filtered models list"""
    all_models = test_openai_models_raw()
    
    if not all_models:
        return
    
    logger.info("\n" + "="*60)
    logger.info("FILTERED MODELS LIST (Recommended)")
    logger.info("="*60)
    
    filtered = filter_models_smart(all_models)
    
    logger.info(f"\nTotal filtered models: {len(filtered)}")
    logger.info("\nRecommended models for HexAgentGUI:")
    for i, model in enumerate(filtered, 1):
        print(f"  {i:2}. {model}")
    
    # Show what was excluded
    excluded = set(all_models) - set(filtered)
    logger.info(f"\n(Excluded {len(excluded)} models: old versions, specialized, deprecated)")

if __name__ == "__main__":
    try:
        test_filtered_models()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        logger.error(f"Error: {e}")
        import traceback
        traceback.print_exc()
