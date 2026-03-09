"""
Source Manager — Gerenciador de Fontes de Dados RAG
Source Manager — RAG Data Source Manager

Responsável por:
- Sincronização individual por fonte (POST /rag/sync/{source_id})
- Unificação de todas as fontes (POST /rag/sync/all)
- Métricas por fonte (last_sync, doc_count, status)
- Scheduler de sync automático

@author: Roberto Dantas de Castro
"""

import json
import logging
import os
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Generator

from services.system_config_service import SystemConfigService

logger = logging.getLogger(__name__)

# Status constants / Constantes de status
STATUS_IDLE    = "idle"
STATUS_RUNNING = "running"
STATUS_OK      = "ok"
STATUS_ERROR   = "error"
STATUS_NEVER   = "never"


class SourceManager:
    """
    Manages all RAG data sources: sync, status, metrics.
    Gerencia todas as fontes RAG: sync, status, métricas.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.config_path = os.path.expanduser("~/.hexagent-gui/rag-config.json")
        self._config: Dict[str, Any] = {}
        self._sync_status: Dict[str, str] = {}   # source_id → STATUS_*
        self._sync_progress: Dict[str, int] = {} # source_id → 0–100
        self._initialized = True
        logger.info("[RAG] SourceManager initialized")

    # ─── Config ────────────────────────────────────────────────────────────────

    def load_config(self) -> Dict[str, Any]:
        """Load rag-config.json from user config dir."""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    self._config = json.load(f)
            else:
                # Deploy template if missing
                template = os.path.join(
                    os.path.dirname(__file__),
                    "../../../config_templates/rag-config.json"
                )
                if os.path.exists(template):
                    with open(template, 'r') as f:
                        self._config = json.load(f)
                    self.save_config(self._config)
                    logger.info("[RAG] Deployed rag-config.json from template")
        except Exception as e:
            logger.error(f"[RAG] Failed to load config: {e}")
        return self._config

    def save_config(self, config: Dict[str, Any]) -> bool:
        """Save rag-config.json preserving user values."""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self._config = config
            return True
        except Exception as e:
            logger.error(f"[RAG] Failed to save config: {e}")
            return False

    def get_sources(self) -> List[Dict[str, Any]]:
        """Get all sources with live status overlay."""
        cfg = self.load_config()
        sources = cfg.get('rag', {}).get('sources', [])
        for src in sources:
            sid = src.get('id', '')
            src['_status'] = self._sync_status.get(sid, STATUS_IDLE if src.get('last_sync') is None else STATUS_OK)
            src['_progress'] = self._sync_progress.get(sid, 0)
        return sources

    def get_source_by_id(self, source_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a single source config by ID."""
        for src in self.get_sources():
            if src.get('id') == source_id:
                return src
        return None

    # ─── Sync Individual ───────────────────────────────────────────────────────

    def sync_source(self, source_id: str) -> Generator[Dict[str, Any], None, None]:
        """
        Stream-sync a single source.
        Sincroniza uma fonte individual com progresso via Generator (SSE-friendly).

        Yields: {"type": "progress"|"log"|"done"|"error", "data": {...}}
        """
        source = self.get_source_by_id(source_id)
        if not source:
            yield {"type": "error", "data": {"message": f"Source '{source_id}' not found"}}
            return

        if not source.get('enabled', False):
            yield {"type": "error", "data": {"message": f"Source '{source_id}' is disabled"}}
            return

        self._sync_status[source_id] = STATUS_RUNNING
        self._sync_progress[source_id] = 0
        start_time = time.time()

        try:
            yield {"type": "log", "data": {"message": f"Starting sync: {source['name']}"}}

            # Import lazily to avoid startup cost
            from services.rag_service.ingestor import Ingestor
            from services.rag_service.vectorizer import RAGVectorizer

            ingestor = Ingestor()
            vectorizer = RAGVectorizer()

            yield {"type": "progress", "data": {"source_id": source_id, "percent": 10,
                                                  "step": "Fetching data..."}}
            self._sync_progress[source_id] = 10

            # Fetch + parse data
            documents = list(ingestor.fetch_and_parse(source))
            doc_count = len(documents)

            yield {"type": "progress", "data": {"source_id": source_id, "percent": 50,
                                                  "step": f"Parsed {doc_count} documents. Vectorizing..."}}
            self._sync_progress[source_id] = 50

            # Vectorize into ChromaDB
            collection_name = source.get('category', 'news')
            vectorizer.upsert_documents(collection_name, documents)

            self._sync_progress[source_id] = 90

            # Update last_sync and doc_count in config
            self._update_source_stats(source_id, doc_count)

            elapsed = round(time.time() - start_time, 1)
            self._sync_status[source_id] = STATUS_OK
            self._sync_progress[source_id] = 100

            yield {"type": "done", "data": {
                "source_id": source_id,
                "doc_count": doc_count,
                "elapsed_seconds": elapsed,
                "message": f"✅ {source['name']}: {doc_count} documents indexed in {elapsed}s"
            }}
            logger.info(f"[RAG] Sync complete: {source_id} ({doc_count} docs, {elapsed}s)")

        except Exception as e:
            self._sync_status[source_id] = STATUS_ERROR
            self._sync_progress[source_id] = 0
            logger.error(f"[RAG] Sync error for {source_id}: {e}", exc_info=True)
            yield {"type": "error", "data": {"source_id": source_id, "message": str(e)}}

    # ─── Sync All (Unification) ─────────────────────────────────────────────────

    def sync_all(self) -> Generator[Dict[str, Any], None, None]:
        """
        Unify ALL enabled sources into the RAG vector store.
        Unifica TODAS as fontes habilitadas no vector store RAG.

        Processes sources in priority order: cve → exploit → technique → payload → news
        Yields progress events per source.
        """
        sources = [s for s in self.get_sources() if s.get('enabled', False)]
        priority_order = ['cve', 'exploit', 'technique', 'payload', 'threat_intel', 'news']
        sources.sort(key=lambda s: priority_order.index(s.get('category', 'news'))
                                   if s.get('category') in priority_order else 99)

        total = len(sources)
        yield {"type": "log", "data": {"message": f"🔄 Unifying {total} sources into RAG..."}}

        success_count = 0
        error_count = 0

        for idx, source in enumerate(sources):
            source_id = source['id']
            yield {"type": "progress", "data": {
                "overall_percent": int((idx / total) * 100),
                "current_source": source['name'],
                "source_index": idx + 1,
                "total_sources": total
            }}

            # Stream individual sync results
            for event in self.sync_source(source_id):
                yield {**event, "data": {**event.get('data', {}),
                                          "overall_index": idx + 1,
                                          "overall_total": total}}
                if event['type'] == 'done':
                    success_count += 1
                elif event['type'] == 'error':
                    error_count += 1

        yield {"type": "done", "data": {
            "message": f"✅ Unification complete: {success_count} sources OK, {error_count} errors",
            "success_count": success_count,
            "error_count": error_count,
            "total": total,
            "overall_percent": 100
        }}

    # ─── Stats ─────────────────────────────────────────────────────────────────

    def get_stats(self) -> Dict[str, Any]:
        """Return aggregate stats for all collections and sources."""
        try:
            from services.rag_service.vectorizer import RAGVectorizer
            vectorizer = RAGVectorizer()
            collection_stats = vectorizer.get_all_stats()
        except Exception as e:
            logger.warning(f"[RAG] Stats unavailable (vectorizer not ready): {e}")
            collection_stats = {}

        sources = self.get_sources()
        total_docs = sum(s.get('doc_count', 0) for s in sources)

        return {
            "total_sources": len(sources),
            "enabled_sources": sum(1 for s in sources if s.get('enabled')),
            "total_documents": total_docs,
            "collections": collection_stats,
            "sources_by_status": {
                "ok":      sum(1 for s in sources if self._sync_status.get(s['id']) == STATUS_OK),
                "running": sum(1 for s in sources if self._sync_status.get(s['id']) == STATUS_RUNNING),
                "error":   sum(1 for s in sources if self._sync_status.get(s['id']) == STATUS_ERROR),
                "idle":    sum(1 for s in sources if self._sync_status.get(s['id'], STATUS_IDLE) == STATUS_IDLE),
            }
        }

    # ─── Internal ───────────────────────────────────────────────────────────────

    def _update_source_stats(self, source_id: str, doc_count: int):
        """Persist last_sync + doc_count back into rag-config.json."""
        cfg = self.load_config()
        sources = cfg.get('rag', {}).get('sources', [])
        for src in sources:
            if src.get('id') == source_id:
                src['last_sync'] = datetime.utcnow().isoformat() + 'Z'
                src['doc_count'] = src.get('doc_count', 0) + doc_count
        self.save_config(cfg)


# Singleton instance
source_manager = SourceManager()
