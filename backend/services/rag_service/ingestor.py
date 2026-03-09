"""
Ingestor — Data Fetcher & Parser for RAG Sources
Ingestor — Coletor e Parser de Dados para Fontes RAG

Supported formats: json, json_gz, csv, xml, stix_json, rss, html, 
                   api_json, github_api, markdown, github_md
"""

import csv
import gzip
import io
import json
import logging
import os
import re
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class Ingestor:
    """
    Fetches and parses data from security sources into normalized RAGDocument dicts.
    Coleta e parseia dados de fontes de segurança em dicionários RAGDocument normalizados.
    """

    def fetch_and_parse(self, source: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Main entry point: fetch data from source and return normalized documents.
        Ponto principal: coleta dados da fonte e retorna documentos normalizados.
        """
        fmt = source.get('format', 'json')
        url = source.get('url', '')
        category = source.get('category', 'news')
        source_id = source.get('id', 'unknown')

        try:
            logger.info(f"[INGESTOR] Fetching {source_id} ({fmt}) from {url[:60]}...")
            raw = self._fetch(url, source)

            parsers = {
                'json':        self._parse_json,
                'json_gz':     self._parse_json_gz,
                'csv':         self._parse_csv,
                'xml':         self._parse_xml,
                'stix_json':   self._parse_stix,
                'rss':         self._parse_rss,
                'html':        self._parse_html_text,
                'api_json':    self._parse_api_json,
                'github_api':  self._parse_github_api,
                'markdown':    self._parse_markdown,
                'github_md':   self._parse_markdown,
            }
            parser = parsers.get(fmt, self._parse_json)
            documents = parser(raw, source)

            # Normalize + tag all docs
            normalized = []
            for doc in documents:
                doc.setdefault('source_id', source_id)
                doc.setdefault('category', category)
                doc.setdefault('created_at', datetime.utcnow().isoformat() + 'Z')
                doc.setdefault('tags', [])
                # Build embedding text from title + content
                doc['embedding_text'] = f"{doc.get('title', '')} {doc.get('content', '')}".strip()
                normalized.append(doc)

            logger.info(f"[INGESTOR] {source_id}: parsed {len(normalized)} documents")
            return normalized

        except Exception as e:
            logger.error(f"[INGESTOR] Failed to fetch/parse {source_id}: {e}", exc_info=True)
            return []

    # ─── HTTP Fetcher ──────────────────────────────────────────────────────────

    def _fetch(self, url: str, source: Dict[str, Any]) -> bytes:
        """HTTP GET with retry and configurable headers."""
        import requests
        headers = {'User-Agent': 'HexAgentGUI/2.1 RAG-Service (Security Research)'}

        # Add API key if configured
        api_key_ref = source.get('api_key_ref', '')
        if api_key_ref:
            from services.rag_service.source_manager import source_manager
            cfg = source_manager.load_config()
            api_key = cfg.get('rag', {}).get('api_keys', {}).get(api_key_ref, '')
            if api_key:
                headers['X-OTX-API-KEY'] = api_key  # OTX
                headers['Authorization'] = f"Bearer {api_key}"  # VT, Shodan

        for attempt in range(3):
            try:
                resp = requests.get(url, headers=headers, timeout=30)
                resp.raise_for_status()
                return resp.content
            except Exception as e:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                else:
                    raise

    # ─── Parsers ──────────────────────────────────────────────────────────────

    def _parse_json(self, raw: bytes, source: Dict) -> List[Dict]:
        data = json.loads(raw)
        if isinstance(data, list):
            return [self._normalize_generic(item, source) for item in data[:500]]
        elif isinstance(data, dict):
            # Check for nested arrays
            for key in ['vulnerabilities', 'items', 'results', 'data', 'entries']:
                if key in data and isinstance(data[key], list):
                    return [self._normalize_generic(item, source) for item in data[key][:500]]
            return [self._normalize_generic(data, source)]
        return []

    def _parse_json_gz(self, raw: bytes, source: Dict) -> List[Dict]:
        decompressed = gzip.decompress(raw)
        return self._parse_json(decompressed, source)

    def _parse_csv(self, raw: bytes, source: Dict) -> List[Dict]:
        text = raw.decode('utf-8', errors='replace')
        reader = csv.DictReader(io.StringIO(text))
        docs = []
        for row in reader:
            doc = {
                'id': row.get('id', row.get('EDB-ID', '')),
                'title': row.get('description', row.get('file', '')),
                'content': json.dumps(dict(row)),
                'tags': [row.get('type', ''), row.get('platform', '')],
                'url': row.get('url', ''),
                'date': row.get('date', ''),
            }
            docs.append(doc)
        return docs[:2000]

    def _parse_xml(self, raw: bytes, source: Dict) -> List[Dict]:
        """Parse generic XML (MITRE CVE CVRF format)."""
        try:
            root = ET.fromstring(raw)
            ns = {'cvrf': 'http://www.icasi.org/CVRF/schema/cvrf/1.1'}
            vulns = root.findall('.//Vulnerability', ns) or root.findall('.//cve')
            docs = []
            for v in vulns[:1000]:
                cve_id = v.findtext('CVE', default='') or v.get('Ordinal', '')
                title = v.findtext('Title', default=cve_id)
                desc_el = v.find('Notes/Note') or v.find('Description')
                content = desc_el.text if desc_el is not None else ''
                docs.append({'id': cve_id, 'title': title, 'content': content})
            return docs
        except Exception as e:
            logger.warning(f"[INGESTOR] XML parse fallback: {e}")
            return [{'id': 'xml_raw', 'title': 'XML Data', 'content': raw.decode('utf-8', errors='replace')[:5000]}]

    def _parse_stix(self, raw: bytes, source: Dict) -> List[Dict]:
        """Parse MITRE ATT&CK STIX JSON."""
        data = json.loads(raw)
        objects = data.get('objects', [])
        docs = []
        for obj in objects:
            if obj.get('type') not in ('attack-pattern', 'course-of-action', 'tool', 'malware', 'intrusion-set'):
                continue
            name = obj.get('name', '')
            desc = obj.get('description', '')
            tactic_refs = [r.get('phase_name', '') for r in obj.get('kill_chain_phases', [])]
            ext_refs = [r.get('url', '') for r in obj.get('external_references', []) if r.get('url')]
            docs.append({
                'id': obj.get('id', ''),
                'title': f"[ATT&CK] {name}",
                'content': desc,
                'tags': tactic_refs + [obj.get('type', '')],
                'url': ext_refs[0] if ext_refs else '',
            })
        return docs[:3000]

    def _parse_rss(self, raw: bytes, source: Dict) -> List[Dict]:
        """Parse RSS/Atom feeds."""
        try:
            import feedparser
            feed = feedparser.parse(raw)
            docs = []
            for entry in feed.entries[:100]:
                docs.append({
                    'id': entry.get('id', entry.get('link', '')),
                    'title': entry.get('title', ''),
                    'content': entry.get('summary', entry.get('description', '')),
                    'url': entry.get('link', ''),
                    'date': entry.get('published', ''),
                    'tags': [t.get('term', '') for t in entry.get('tags', [])],
                })
            return docs
        except ImportError:
            logger.warning("[INGESTOR] feedparser not installed, skipping RSS")
            return []

    def _parse_html_text(self, raw: bytes, source: Dict) -> List[Dict]:
        """Extract readable text from HTML."""
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(raw, 'html.parser')
            for tag in soup(['script', 'style', 'nav', 'footer']):
                tag.decompose()
            text = soup.get_text(separator='\n', strip=True)[:10000]
            return [{'id': source.get('id'), 'title': source.get('name', ''), 'content': text}]
        except ImportError:
            return [{'id': source.get('id'), 'title': source.get('name', ''),
                     'content': raw.decode('utf-8', errors='replace')[:5000]}]

    def _parse_api_json(self, raw: bytes, source: Dict) -> List[Dict]:
        """Generic API JSON parser (OTX, VirusTotal, Shodan)."""
        return self._parse_json(raw, source)

    def _parse_github_api(self, raw: bytes, source: Dict) -> List[Dict]:
        """Parse GitHub API response (list of files/dirs)."""
        data = json.loads(raw)
        if not isinstance(data, list):
            return []
        docs = []
        for item in data[:50]:
            if item.get('type') == 'dir':
                docs.append({
                    'id': item.get('path', ''),
                    'title': item.get('name', ''),
                    'content': f"SecLists category: {item.get('name', '')} — {item.get('path', '')}",
                    'url': item.get('html_url', ''),
                    'tags': ['seclists', item.get('name', '')],
                })
        return docs

    def _parse_markdown(self, raw: bytes, source: Dict) -> List[Dict]:
        """Split markdown content by ## headers into separate documents."""
        text = raw.decode('utf-8', errors='replace')
        sections = re.split(r'\n#{1,3} ', text)
        docs = []
        for i, section in enumerate(sections[:100]):
            if len(section.strip()) < 50:
                continue
            lines = section.strip().split('\n')
            title = lines[0].strip('#').strip()
            content = '\n'.join(lines[1:]).strip()
            docs.append({
                'id': f"{source.get('id')}_section_{i}",
                'title': title,
                'content': content[:2000],
                'tags': [source.get('category', ''), source.get('id', '')],
            })
        return docs

    def _normalize_generic(self, item: Any, source: Dict) -> Dict:
        """Normalize a generic dict/object into RAGDocument format."""
        if not isinstance(item, dict):
            return {'id': str(hash(str(item))), 'title': str(item)[:100], 'content': str(item)}

        # CVE-specific normalization
        if 'cve' in item:
            cve_data = item.get('cve', item)
            cve_id = cve_data.get('id', item.get('id', ''))
            descriptions = cve_data.get('descriptions', [])
            desc = next((d['value'] for d in descriptions if d.get('lang') == 'en'), '')
            metrics = cve_data.get('metrics', {})
            cvss = 0.0
            for key in ['cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2']:
                if key in metrics and metrics[key]:
                    cvss = metrics[key][0].get('cvssData', {}).get('baseScore', 0.0)
                    break
            return {
                'id': cve_id,
                'title': f"[CVE] {cve_id}",
                'content': desc,
                'cvss_score': cvss,
                'tags': ['cve', f"cvss_{int(cvss)}"],
                'url': f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            }

        # Generic fallback
        return {
            'id': str(item.get('id', item.get('cveId', hash(json.dumps(item, default=str))))),
            'title': item.get('name', item.get('title', item.get('description', '')[:100])),
            'content': item.get('description', item.get('summary', json.dumps(item, default=str)[:2000])),
            'url': item.get('url', item.get('link', '')),
            'tags': item.get('tags', []),
        }
