"""
Dataset Exporter — Export RAG interactions to Local_RAG JSONL format
Dataset Exporter — Exporta interações RAG para formato JSONL do Local_RAG

Collects successful AgentCore interactions and exports them as training pairs
compatible with: rag_pipeline.sh export-training --collection hexstrike
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Red/Blue team category mapping
CATEGORY_KEYWORDS = {
    'recon':           ['nmap', 'scan', 'enum', 'discover', 'ping', 'whois', 'dig'],
    'exploitation':    ['exploit', 'payload', 'inject', 'rce', 'sqli', 'xss', 'overflow'],
    'post_exploitation': ['privesc', 'persistence', 'lateral', 'pivot', 'dump', 'hash'],
    'defense':         ['block', 'patch', 'harden', 'monitor', 'detect', 'mitigate', 'blue'],
    'analysis':        ['analyze', 'investigate', 'forensic', 'log', 'review', 'cve'],
}


class DatasetExporter:
    """
    Collects and exports training pairs for fine-tuning.
    Coleta e exporta pares de treino para fine-tuning.
    """

    def __init__(self):
        self._buffer: List[Dict[str, Any]] = []

    def collect_interaction(self, prompt: str, completion: str,
                             success: bool, commands_executed: List[str] = None):
        """
        Record a chat interaction as a potential training pair.
        Registra uma interação de chat como um par de treino potencial.
        """
        try:
            from services.rag_service.source_manager import source_manager
            cfg = source_manager.load_config()
            export_cfg = cfg.get('rag', {}).get('export', {})
            min_score = export_cfg.get('min_quality_score', 0.7)
            include_failed = export_cfg.get('include_failed', False)
        except Exception:
            min_score = 0.7
            include_failed = False

        if not success and not include_failed:
            return

        quality = self._estimate_quality(prompt, completion, success, commands_executed or [])
        if quality < min_score:
            return

        category = self._classify_category(prompt + ' ' + completion)

        record = {
            'id': f"hex_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{len(self._buffer):04d}",
            'source': 'hexagent',
            'category': category,
            'prompt': prompt,
            'completion': completion,
            'commands': commands_executed or [],
            'quality_score': quality,
            'success': success,
            'tags': self._extract_tags(prompt + ' ' + completion),
            'created_at': datetime.utcnow().isoformat() + 'Z',
        }
        self._buffer.append(record)
        logger.debug(f"[EXPORTER] Collected interaction (quality={quality:.2f}, category={category})")

    def export_jsonl(self, output_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Export buffered interactions to JSONL file (Local_RAG compatible).
        Exporta interações em buffer para arquivo JSONL (compatível com Local_RAG).
        """
        try:
            from services.rag_service.source_manager import source_manager
            cfg = source_manager.load_config()
            export_cfg = cfg.get('rag', {}).get('export', {})
            default_path = os.path.expanduser(export_cfg.get('output_path', '~/.hexagent-gui/rag_data/exports'))
        except Exception:
            default_path = os.path.expanduser('~/.hexagent-gui/rag_data/exports')

        out_dir = output_path or default_path
        os.makedirs(out_dir, exist_ok=True)

        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"hexstrike_{timestamp}.jsonl"
        filepath = os.path.join(out_dir, filename)

        if not self._buffer:
            return {'success': False, 'message': 'No interactions to export', 'count': 0}

        with open(filepath, 'w', encoding='utf-8') as f:
            for record in self._buffer:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')

        count = len(self._buffer)
        self._buffer.clear()

        logger.info(f"[EXPORTER] Exported {count} interactions → {filepath}")
        return {
            'success': True,
            'file': filepath,
            'count': count,
            'message': f"✅ Exported {count} training pairs → {filename}",
            'usage': f"rag_pipeline.sh query --collection hexstrike --session-id {timestamp}"
        }

    def get_buffer_stats(self) -> Dict[str, Any]:
        """Return stats about buffered interactions."""
        if not self._buffer:
            return {'count': 0, 'categories': {}, 'avg_quality': 0}
        cats = {}
        for r in self._buffer:
            c = r.get('category', 'unknown')
            cats[c] = cats.get(c, 0) + 1
        avg = sum(r.get('quality_score', 0) for r in self._buffer) / len(self._buffer)
        return {'count': len(self._buffer), 'categories': cats, 'avg_quality': round(avg, 3)}

    def _estimate_quality(self, prompt: str, completion: str,
                           success: bool, commands: List[str]) -> float:
        """Heuristic quality score 0.0–1.0."""
        score = 0.5
        if success:
            score += 0.2
        if len(completion) > 200:
            score += 0.1
        if commands:
            score += 0.1
        if any(c.startswith('sudo') or '|' in c or '>' in c for c in commands):
            score += 0.05
        if len(prompt) > 50:
            score += 0.05
        return min(score, 1.0)

    def _classify_category(self, text: str) -> str:
        text_lower = text.lower()
        scores = {}
        for cat, keywords in CATEGORY_KEYWORDS.items():
            scores[cat] = sum(1 for kw in keywords if kw in text_lower)
        return max(scores, key=scores.get) if any(scores.values()) else 'general'

    def _extract_tags(self, text: str) -> List[str]:
        tags = []
        tool_keywords = ['nmap', 'metasploit', 'burp', 'sqlmap', 'nikto',
                          'gobuster', 'hydra', 'netcat', 'nc', 'python',
                          'bash', 'curl', 'wget', 'ssh']
        text_lower = text.lower()
        tags.extend(kw for kw in tool_keywords if kw in text_lower)
        return list(set(tags))[:10]


# Singleton
dataset_exporter = DatasetExporter()
