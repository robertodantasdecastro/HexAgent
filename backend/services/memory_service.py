"""
Memory Service - Long Term Knowledge (RAG)
Serviço de Memória - Conhecimento de Longo Prazo (RAG)

Manages persistent memory (Knowledge Graph Lite) using JSON storage.
Gerencia memória persistente (Knowledge Graph Lite) usando armazenamento JSON.

@author: HexAgent Dev
"""
import json
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class MemoryService:
    """
    Singleton Service for Memory Management.
    Serviço Singleton para Gerenciamento de Memória.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemoryService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.memory_path = os.path.expanduser('~/.hexagent-gui/memory.json')
        self.memories: List[Dict] = []
        self._load_memory()
        self._initialized = True

    def _load_memory(self):
        """Load memories from disk."""
        try:
            if os.path.exists(self.memory_path):
                with open(self.memory_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.memories = data.get('memories', [])
        except Exception as e:
            logger.error(f"Failed to load memory: {e}")
            self.memories = []

    def _save_memory(self):
        """Save memories to disk."""
        try:
            os.makedirs(os.path.dirname(self.memory_path), exist_ok=True)
            with open(self.memory_path, 'w', encoding='utf-8') as f:
                json.dump({"memories": self.memories, "updated_at": datetime.now().isoformat()}, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save memory: {e}")

    def add_memory(self, content: str, source: str = "user", tags: List[str] = None):
        """
        Add a new memory fragment.
        Adicionar um novo fragmento de memória.
        """
        memory = {
            "id": len(self.memories) + 1,
            "content": content,
            "source": source,
            "tags": tags or [],
            "created_at": datetime.now().isoformat()
        }
        self.memories.append(memory)
        self._save_memory()
        logger.info(f"Memory added: {content[:30]}...")

    def retrieve_context(self, query: str, limit: int = 5) -> str:
        """
        Retrieve relevant context based on keyword matching (dumb RAG).
        Recuperar contexto relevante baseado em correspondência de palavras-chave (RAG simples).
        """
        if not query:
            return ""
            
        keywords = set(query.lower().split())
        scored_memories = []
        
        for mem in self.memories:
            content = mem['content'].lower()
            # Simple score: count intersection
            score = sum(1 for k in keywords if k in content)
            if score > 0:
                scored_memories.append((score, mem))
        
        # Sort by score descending
        scored_memories.sort(key=lambda x: x[0], reverse=True)
        
        top_memories = [m[1]['content'] for m in scored_memories[:limit]]
        
        if top_memories:
            return "\n".join([f"- {m}" for m in top_memories])
        return ""

    def get_all_memories(self) -> List[Dict]:
        return self.memories
