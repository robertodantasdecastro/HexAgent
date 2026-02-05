/**
 * AI Configuration Constants
 * Constantes de Configuração de IA
 * 
 * Centralizes engine definitions and default values.
 * Centraliza definições de motores e valores padrão.
 */

export const ENGINE_DESCRIPTIONS = {
    'openai': { 
      name: 'OpenAI (GPT)', 
      description: 'Industry standard for reasoning and coding (GPT-4/3.5). Requires API Key.',
      requires_api_key: true,
      is_local: false
    },
    'deepseek': { 
      name: 'DeepSeek', 
      description: 'Strong reasoning capabilities, cost-effective. Requires API Key.',
      requires_api_key: true,
      is_local: false
    },
    'claude': { 
      name: 'Anthropic Claude', 
      description: 'Excellent for large context and coding. Requires API Key.',
      requires_api_key: true,
      is_local: false
    },
    'lmstudio': { 
      name: 'LM Studio (Local)', 
      description: 'Run models locally (Llama 3, Mistral, etc). No API cost. Privacy focused.',
      requires_api_key: false,
      is_local: true
    },
    '5ire': { 
      name: '5ire (Local/Cloud)', 
      description: 'Specialized for blockchain/web3 tasks.',
      requires_api_key: false, // Can be both, defaulting to local config style
      is_local: true
    },
    'openrouter': { 
      name: 'OpenRouter', 
      description: 'Aggregator for multiple models (Llama, Mistral, Goliath, etc).',
      requires_api_key: true,
      is_local: false
    }
};

export const DEFAULT_AI_CONFIG = {
    engine: 'openai',
    model: 'gpt-4o',
    max_iterations: 10,
    temperature: 0.7,
    max_tokens: 4000,
    auto_execute: false,
    api_key: '',
    host: 'http://localhost',
    port: 1234,
    timeout: 60,
    system_prompt: ''
};
