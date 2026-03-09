"""
RAG Vectorizer — ChromaDB Local Vector Store
RAG Vectorizer — Vector Store Local ChromaDB

Manages all RAG collections with local sentence-transformer embeddings.
Gerencia todas as coleções RAG com embeddings locais via sentence-transformers.
"""

import logging
import os
import threading
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

COLLECTIONS = ['cves', 'exploits', 'techniques', 'payloads', 'news', 'memory']


class RAGVectorizer:
    """
    ChromaDB-based vector store for RAG collections.
    Vector store baseado em ChromaDB para coleções RAG.
    """

    _instance = None
    _lock = threading.Lock()
    _client = None
    _embedding_fn = None

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._ready = False
        self._db_path = self._resolve_db_path()

    def _resolve_db_path(self) -> str:
        """Resolve ChromaDB path from rag-config.json."""
        try:
            from services.rag_service.source_manager import source_manager
            cfg = source_manager.load_config()
            storage = cfg.get('rag', {}).get('storage', {})
            storage_type = storage.get('type', 'local')
            if storage_type == 'local':
                base = os.path.expanduser(storage.get('local_path', '~/.hexagent-gui/rag_data'))
            elif storage_type == 'external':
                base = storage.get('external_path', '') or os.path.expanduser('~/.hexagent-gui/rag_data')
            else:
                base = os.path.expanduser('~/.hexagent-gui/rag_data')
            return os.path.join(base, 'chroma_db')
        except Exception:
            return os.path.expanduser('~/.hexagent-gui/rag_data/chroma_db')

    def _init_client(self):
        """Lazy-init ChromaDB client and embedding function."""
        if self._client is not None:
            return True
        try:
            import chromadb
            from chromadb.utils import embedding_functions
            os.makedirs(self._db_path, exist_ok=True)
            self._client = chromadb.PersistentClient(path=self._db_path)

            # Use local sentence-transformers (no API key needed)
            try:
                from services.rag_service.source_manager import source_manager
                cfg = source_manager.load_config()
                model_name = cfg.get('rag', {}).get('embedding', {}).get(
                    'model', 'sentence-transformers/all-MiniLM-L6-v2')
            except Exception:
                model_name = 'sentence-transformers/all-MiniLM-L6-v2'

            self._embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name=model_name
            )
            self._ready = True
            logger.info(f"[VECTORIZER] ChromaDB initialized at {self._db_path}")
            return True
        except ImportError:
            logger.warning("[VECTORIZER] chromadb not installed. Run install.sh to install RAG deps.")
            return False
        except Exception as e:
            logger.error(f"[VECTORIZER] Init failed: {e}", exc_info=True)
            return False

    def _get_collection(self, name: str):
        """Get or create a ChromaDB collection by category name."""
        col_name = self._category_to_collection(name)
        return self._client.get_or_create_collection(
            name=col_name,
            embedding_function=self._embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

    @staticmethod
    def _category_to_collection(category: str) -> str:
        """Map source category to ChromaDB collection name."""
        mapping = {
            'cve':         'cves',
            'exploit':     'exploits',
            'technique':   'techniques',
            'payload':     'payloads',
            'news':        'news',
            'threat_intel':'news',  # threat intel goes to news for simplicity
            'memory':      'memory',
        }
        return mapping.get(category, 'news')

    def upsert_documents(self, category: str, documents: List[Dict[str, Any]]) -> int:
        """
        Upsert a batch of documents into the appropriate collection.
        Faz upsert de um lote de documentos na coleção apropriada.
        """
        if not documents:
            return 0

        if not self._init_client():
            logger.warning("[VECTORIZER] Skip upsert — not ready")
            return 0

        try:
            collection = self._get_collection(category)
            ids, texts, metadatas = [], [], []

            for doc in documents:
                doc_id = str(doc.get('id', ''))[:100]
                if not doc_id:
                    import hashlib
                    doc_id = hashlib.md5(doc.get('embedding_text', str(doc)).encode()).hexdigest()

                text = doc.get('embedding_text', doc.get('content', ''))[:4000]
                if not text.strip():
                    continue

                meta = {
                    'source_id':  str(doc.get('source_id', '')),
                    'category':   str(doc.get('category', category)),
                    'title':      str(doc.get('title', ''))[:200],
                    'url':        str(doc.get('url', '')),
                    'created_at': str(doc.get('created_at', '')),
                    'tags':       ','.join(str(t) for t in doc.get('tags', [])),
                }
                if 'cvss_score' in doc:
                    meta['cvss_score'] = str(doc['cvss_score'])

                ids.append(doc_id)
                texts.append(text)
                metadatas.append(meta)

            if not ids:
                return 0

            # Batch upsert in chunks of 100
            BATCH_SIZE = 100
            total = 0
            for i in range(0, len(ids), BATCH_SIZE):
                collection.upsert(
                    ids=ids[i:i+BATCH_SIZE],
                    documents=texts[i:i+BATCH_SIZE],
                    metadatas=metadatas[i:i+BATCH_SIZE]
                )
                total += min(BATCH_SIZE, len(ids) - i)

            logger.info(f"[VECTORIZER] Upserted {total} docs into collection '{self._category_to_collection(category)}'")
            return total

        except Exception as e:
            logger.error(f"[VECTORIZER] Upsert failed: {e}", exc_info=True)
            return 0

    def query(self, collection_name: str, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Semantic query on a collection.
        Query semântica em uma coleção.
        """
        if not self._init_client():
            return []
        try:
            collection = self._get_collection(collection_name)
            results = collection.query(query_texts=[query_text], n_results=top_k)
            docs = []
            for i, doc_text in enumerate(results.get('documents', [[]])[0]):
                meta = results.get('metadatas', [[]])[0][i] if results.get('metadatas') else {}
                dist = results.get('distances', [[]])[0][i] if results.get('distances') else 1.0
                docs.append({
                    'text': doc_text,
                    'metadata': meta,
                    'relevance_score': round(1 - dist, 3),
                })
            return docs
        except Exception as e:
            logger.warning(f"[VECTORIZER] Query failed ({collection_name}): {e}")
            return []

    def get_all_stats(self) -> Dict[str, Any]:
        """Return stats for all collections."""
        if not self._init_client():
            return {}
        stats = {}
        for cat in COLLECTIONS:
            try:
                col = self._get_collection(cat)
                stats[cat] = {'doc_count': col.count()}
            except Exception:
                stats[cat] = {'doc_count': 0}
        return stats

    def migrate_storage(self, new_path: str) -> bool:
        """Move ChromaDB to a new path."""
        import shutil
        try:
            new_db = os.path.join(new_path, 'chroma_db')
            os.makedirs(new_path, exist_ok=True)
            if os.path.exists(self._db_path):
                shutil.copytree(self._db_path, new_db, dirs_exist_ok=True)
            self._db_path = new_db
            self._client = None  # Force re-init
            self._ready = False
            logger.info(f"[VECTORIZER] Migrated storage to {new_db}")
            return True
        except Exception as e:
            logger.error(f"[VECTORIZER] Migration failed: {e}")
            return False


# Singleton
rag_vectorizer = RAGVectorizer()
