import os
import json
import logging
import requests
import openai
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

def test_deepseek_connection():
    config = load_config()
    if not config:
        return

    api_key = config.get('api_key')
    if not api_key:
        logger.error("API Key not found in config")
        return

    model = config.get('model', 'deepseek-chat')
    
    # Force Base URL with /v1
    base_url = "https://api.deepseek.com/v1"
    
    logger.info(f"Testing DeepSeek Connection...")
    logger.info(f"URL: {base_url}")
    logger.info(f"Model: {model}")
    logger.info(f"API Key: {api_key[:4]}...{api_key[-4:]}")

    client = openai.OpenAI(
        api_key=api_key,
        base_url=base_url
    )

    try:
        # 1. Test Simple Chat Completion
        logger.info("\n[1] Testing Chat Completion...")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Hello, are you online? Reply with 'Yes'."}
            ],
            stream=False
        )
        content = response.choices[0].message.content
        logger.info(f"✅ Success! Response: {content}")

    except openai.AuthenticationError:
        logger.error("❌ Authentication Error: Invalid API Key")
    except openai.APIConnectionError as e:
        logger.error(f"❌ Connection Error: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected Error: {e}")

    try:
        # 2. Test Streaming
        logger.info("\n[2] Testing Streaming...")
        stream = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "user", "content": "Count to 3."}
            ],
            stream=True
        )
        print("Stream Content: ", end="", flush=True)
        for chunk in stream:
            if chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end="", flush=True)
        print("\n✅ Streaming complete.")

    except Exception as e:
        logger.error(f"\n❌ Streaming Error: {e}")

if __name__ == "__main__":
    test_deepseek_connection()
