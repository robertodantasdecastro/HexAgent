"""
RAG Retriever — Context Augmentation for AgentCore
RAG Retriever — Augmentação de Contexto para AgentCore

Queries the vector store to inject relevant security context
into AgentCore before each chat interaction.
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class RAGRetriever:
    """
    Retrieves relevant context from ChromaDB for AgentCore augmentation.
    Recupera contexto relevante do ChromaDB para augmentação do AgentCore.
    """

    def get_context(self, query: str, top_k: int = 5,
                    max_tokens: int = 2000) -> Optional[str]:
        """
        Query all priority collections and return formatted context block.
        Consulta todas as coleções prioritárias e retorna bloco de contexto formatado.

        Returns None if RAG is disabled or no relevant context found.
        """
        try:
            from services.rag_service.source_manager import source_manager
            from services.rag_service.vectorizer import rag_vectorizer

            cfg = source_manager.load_config()
            rag_cfg = cfg.get('rag', {})

            if not rag_cfg.get('enabled', False):
                return None

            aug = rag_cfg.get('augmentation', {})
            if not aug.get('enabled', True):
                return None

            collections_priority = aug.get('collections_priority',
                                           ['cves', 'techniques', 'exploits', 'news'])

            all_results = []
            token_count = 0

            for collection_name in collections_priority:
                if token_count >= max_tokens:
                    break
                results = rag_vectorizer.query(collection_name, query, top_k=top_k)
                for r in results:
                    if r.get('relevance_score', 0) < 0.3:
                        continue
                    snippet = self._format_snippet(r, collection_name)
                    snippet_tokens = len(snippet.split())
                    if token_count + snippet_tokens > max_tokens:
                        break
                    all_results.append(snippet)
                    token_count += snippet_tokens

            if not all_results:
                return None

            context = "\n---\n".join(all_results)
            logger.info(f"[RAG] Injecting context: {len(all_results)} snippets, ~{token_count} tokens")
            return context

        except Exception as e:
            logger.warning(f"[RAG] Retriever unavailable: {e}")
            return None

    def _format_snippet(self, result: Dict[str, Any], collection: str) -> str:
        """Format a single retrieval result as readable context."""
        meta = result.get('metadata', {})
        title = meta.get('title', '')
        source = meta.get('source_id', collection)
        url = meta.get('url', '')
        text = result.get('text', '')[:500]

        lines = [f"[{collection.upper()}] {title}" if title else f"[{collection.upper()}]"]
        if text:
            lines.append(text)
        if url:
            lines.append(f"Ref: {url}")
        return '\n'.join(lines)


# Singleton
rag_retriever = RAGRetriever()
