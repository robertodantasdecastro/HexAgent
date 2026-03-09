"""
RAG Service Package — Security Intelligence
Pacote de Serviços RAG para Inteligência de Segurança

Orquestra coleta, vetorização e recuperação de dados de segurança
para augmentação do AgentCore e exportação para fine-tuning.

@author: Roberto Dantas de Castro
"""

from .source_manager import SourceManager
from .vectorizer import RAGVectorizer
from .rag_retriever import RAGRetriever
from .dataset_exporter import DatasetExporter

__all__ = ['SourceManager', 'RAGVectorizer', 'RAGRetriever', 'DatasetExporter']
