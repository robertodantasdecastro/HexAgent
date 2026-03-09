"""
RAG Controller — REST API for RAG Security Intelligence
RAG Controller — API REST para Inteligência de Segurança RAG

Endpoints:
  GET  /rag/config              → Load rag-config.json
  PUT  /rag/config              → Save configuration
  GET  /rag/stats               → Collection + source metrics
  GET  /rag/sources             → All sources with live status
  POST /rag/sync                → Sync ALL enabled sources (stream progress)
  POST /rag/sync/<source_id>    → Sync individual source (stream progress)
  POST /rag/search              → Web search (DuckDuckGo/Brave)
  POST /rag/export              → Export JSONL for Local_RAG
  POST /rag/migrate             → Migrate storage to new path
"""

import json
import logging
import os
import threading
from typing import Any, Dict

from flask import Response, stream_with_context
from controllers.base_controller import BaseController

logger = logging.getLogger(__name__)


class RAGController(BaseController):
    def __init__(self):
        super().__init__(
            name='rag',
            import_name=__name__,
            url_prefix='/rag'
        )

    def _register_routes(self):
        bp = self.blueprint

        # ── Config ────────────────────────────────────────────────────────────

        @bp.route('/config', methods=['GET'])
        def get_config():
            """Load rag-config.json"""
            try:
                from services.rag_service.source_manager import source_manager
                cfg = source_manager.load_config()
                return self.success_response(cfg)
            except Exception as e:
                return self.error_response(str(e), 500)

        @bp.route('/config', methods=['PUT'])
        def save_config():
            """Save rag-config.json (merge intelligent)"""
            try:
                data = self.get_request_data()
                if not data:
                    return self.error_response("No config data provided", 400)
                from services.rag_service.source_manager import source_manager
                success = source_manager.save_config(data)
                if success:
                    return self.success_response(message="RAG config saved")
                return self.error_response("Failed to save config", 500)
            except Exception as e:
                return self.error_response(str(e), 500)

        # ── Stats & Sources ───────────────────────────────────────────────────

        @bp.route('/stats', methods=['GET'])
        def get_stats():
            """Return collection + source metrics"""
            try:
                from services.rag_service.source_manager import source_manager
                stats = source_manager.get_stats()
                return self.success_response(stats)
            except Exception as e:
                return self.error_response(str(e), 500)

        @bp.route('/sources', methods=['GET'])
        def get_sources():
            """Return all sources with live status"""
            try:
                from services.rag_service.source_manager import source_manager
                sources = source_manager.get_sources()
                return self.success_response({'sources': sources, 'count': len(sources)})
            except Exception as e:
                return self.error_response(str(e), 500)

        # ── Sync Individual ────────────────────────────────────────────────────

        @bp.route('/sync/<source_id>', methods=['POST'])
        def sync_source(source_id: str):
            """
            Stream-sync a single source via SSE.
            Each line is a JSON event: {"type":"progress|log|done|error","data":{...}}
            """
            from services.rag_service.source_manager import source_manager

            def generate():
                try:
                    for event in source_manager.sync_source(source_id):
                        yield f"data: {json.dumps(event)}\n\n"
                except Exception as e:
                    err = {"type": "error", "data": {"message": str(e)}}
                    yield f"data: {json.dumps(err)}\n\n"

            return Response(
                stream_with_context(generate()),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no',
                }
            )

        # ── Sync All (Unify) ───────────────────────────────────────────────────

        @bp.route('/sync', methods=['POST'])
        def sync_all():
            """
            Unify ALL enabled sources into the RAG vector store.
            Streams SSE events with overall + per-source progress.
            """
            from services.rag_service.source_manager import source_manager

            def generate():
                try:
                    for event in source_manager.sync_all():
                        yield f"data: {json.dumps(event)}\n\n"
                except Exception as e:
                    err = {"type": "error", "data": {"message": str(e)}}
                    yield f"data: {json.dumps(err)}\n\n"

            return Response(
                stream_with_context(generate()),
                mimetype='text/event-stream',
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no',
                }
            )

        # ── Web Search ─────────────────────────────────────────────────────────

        @bp.route('/search', methods=['POST'])
        def web_search():
            """Controlled web search via DuckDuckGo or Brave API"""
            try:
                data = self.get_request_data()
                query = data.get('query', '')
                if not query:
                    return self.error_response("Query is required", 400)

                try:
                    from duckduckgo_search import DDGS
                    with DDGS() as ddgs:
                        results = list(ddgs.text(query, max_results=10))
                    return self.success_response({'results': results, 'engine': 'duckduckgo'})
                except ImportError:
                    return self.error_response(
                        "Web search not available. Run install.sh to install RAG dependencies.", 503)
            except Exception as e:
                return self.error_response(str(e), 500)

        # ── Export (Local_RAG) ─────────────────────────────────────────────────

        @bp.route('/export', methods=['POST'])
        def export_dataset():
            """Export buffered interactions to JSONL for Local_RAG fine-tuning"""
            try:
                data = self.get_request_data() or {}
                output_path = data.get('output_path')

                from services.rag_service.dataset_exporter import dataset_exporter
                result = dataset_exporter.export_jsonl(output_path)

                if result.get('success'):
                    return self.success_response(result, message=result.get('message'))
                return self.error_response(result.get('message', 'Export failed'), 400)
            except Exception as e:
                return self.error_response(str(e), 500)

        # ── Migrate Storage ────────────────────────────────────────────────────

        @bp.route('/migrate', methods=['POST'])
        def migrate_storage():
            """Migrate RAG data to a new storage path"""
            try:
                data = self.get_request_data()
                new_path = data.get('new_path', '')
                if not new_path:
                    return self.error_response("new_path is required", 400)

                new_path = os.path.expanduser(new_path)

                from services.rag_service.vectorizer import rag_vectorizer
                from services.rag_service.source_manager import source_manager

                success = rag_vectorizer.migrate_storage(new_path)
                if success:
                    # Update rag-config.json storage path
                    cfg = source_manager.load_config()
                    storage = cfg.get('rag', {}).get('storage', {})
                    storage_type = storage.get('type', 'local')
                    if storage_type == 'local':
                        storage['local_path'] = new_path
                    elif storage_type == 'external':
                        storage['external_path'] = new_path
                    source_manager.save_config(cfg)
                    return self.success_response(message=f"Storage migrated to {new_path}")
                return self.error_response("Migration failed", 500)
            except Exception as e:
                return self.error_response(str(e), 500)

        # ── Export Stats ───────────────────────────────────────────────────────

        @bp.route('/export/stats', methods=['GET'])
        def export_stats():
            """Buffer stats for export preview"""
            try:
                from services.rag_service.dataset_exporter import dataset_exporter
                return self.success_response(dataset_exporter.get_buffer_stats())
            except Exception as e:
                return self.error_response(str(e), 500)
