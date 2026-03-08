"""
Stream Tag Detector - XML-like Tag Detection in Streaming Text
Detector de Tags em Stream - Detecção de Tags estilo XML em Texto Streaming

Handles robust detection of XML-like tags in streaming text,
dealing with split tags across chunks and partial buffering.

Lida com detecção robusta de tags estilo XML em texto streaming,
lidando com tags divididas entre chunks e buffering parcial.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0 (Extracted from orchestrator)
"""

from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class TagDetector:
    """
    Detects and processes XML-like tags in streaming text
    Detecta e processa tags estilo XML em texto streaming
    
    Handles edge cases:
    - Tags split across multiple chunks
    - Partial tags at chunk boundaries
    - Multiple tags in single chunk
    
    Lida com casos extremos:
    - Tags divididas em múltiplos chunks
    - Tags parciais nas bordas de chunks
    - Múltiplas tags em um único chunk
    """
    
    def __init__(self, tags: List[str], buffer_size_limit: int = 12):
        """
        Initialize tag detector
        Inicializa detector de tags
        
        Args / Argumentos:
            tags (List[str]): List of tags to detect / Lista de tags para detectar
            buffer_size_limit (int): Max size to check for partial tags / Tamanho máx para verificar tags parciais
        """
        self.tags = tags
        self.buffer_size_limit = buffer_size_limit
        self.buffer = ""
        
        logger.debug(f"TagDetector initialized with tags: {tags}")
    
    def _find_first_tag(self, text: str) -> Tuple[int, Optional[str]]:
        """
        Find the earliest occurrence of any tag in text
        Encontra a primeira ocorrência de qualquer tag no texto
        
        Args / Argumentos:
            text (str): Text to search / Texto para buscar
        
        Returns / Retorna:
            Tuple[int, Optional[str]]: (position, tag) or (-1, None) if not found
                                       (posição, tag) ou (-1, None) se não encontrado
        """
        earliest_pos = -1
        found_tag = None
        
        for tag in self.tags:
            pos = text.find(tag)
            if pos != -1:
                if earliest_pos == -1 or pos < earliest_pos:
                    earliest_pos = pos
                    found_tag = tag
        
        return earliest_pos, found_tag
    
    def _check_partial_tag_at_end(self, text: str) -> Tuple[bool, int]:
        """
        Check if text ends with a partial tag
        Verifica se texto termina com uma tag parcial
        
        Args / Argumentos:
            text (str): Text to check / Texto para verificar
        
        Returns / Retorna:
            Tuple[bool, int]: (has_partial, cutoff_index)
                             (tem_parcial, índice_de_corte)
        """
        # Only check last N characters for efficiency
        # Verificar apenas últimos N caracteres para eficiência
        check_segment = text[-self.buffer_size_limit:]
        
        for potential_tag in self.tags:
            # Check all possible prefixes (1..len-1) of the tag
            # Verificar todos os prefixos possíveis (1..len-1) da tag
            for i in range(1, len(potential_tag)):
                prefix = potential_tag[:i]
                if check_segment.endswith(prefix):
                    # Found partial tag at the end
                    # Encontrou tag parcial no final
                    cutoff_index = len(text) - i
                    logger.debug(f"Partial tag detected: '{prefix}' from '{potential_tag}'")
                    return True, cutoff_index
        
        return False, len(text)
    
    def process_chunk(self, chunk: str, current_state: str) -> Tuple[str, str, str]:
        """
        Process new chunk and detect tag transitions
        Processa novo chunk e detecta transições de tags
        
        Args / Argumentos:
            chunk (str): New text chunk / Novo chunk de texto
            current_state (str): Current block state / Estado atual do bloco
        
        Returns / Retorna:
            Tuple[str, str, str]: (new_state, content_to_yield, buffer_remainder)
                                 (novo_estado, conteúdo_a_emitir, resto_do_buffer)
        """
        # Append chunk to internal buffer / Anexar chunk ao buffer interno
        self.buffer += chunk
        
        content_to_yield = ""
        new_state = current_state
        
        # Process buffer until no complete tags are found
        # Processar buffer até que nenhuma tag completa seja encontrada
        while True:
            pos, tag = self._find_first_tag(self.buffer)
            
            if pos == -1:
                # No complete tags found
                # Nenhuma tag completa encontrada
                
                # Check for partial tags at the end
                # Verificar tags parciais no final
                has_partial, cutoff_index = self._check_partial_tag_at_end(self.buffer)
                
                if has_partial:
                    # Yield everything up to partial tag start
                    # Emitir tudo até o início da tag parcial
                    content_to_yield += self.buffer[:cutoff_index]
                    self.buffer = self.buffer[cutoff_index:]
                    break
                else:
                    # Safe to yield everything
                    # Seguro para emitir tudo
                    content_to_yield += self.buffer
                    self.buffer = ""
                    break
            else:
                # Found a complete tag!
                # Encontrou uma tag completa!
                
                # 1. Yield content before tag
                # 1. Emitir conteúdo antes da tag
                content_to_yield += self.buffer[:pos]
                
                # 2. Handle state change based on tag
                # 2. Lidar com mudança de estado baseado na tag
                new_state = self._get_state_for_tag(tag, current_state)
                
                # 3. Remove tag from buffer
                # 3. Remover tag do buffer
                self.buffer = self.buffer[pos + len(tag):]
                
                # Log transition / Registrar transição
                if new_state != current_state:
                    logger.debug(f"State transition: '{current_state}' -> '{new_state}' via tag '{tag}'")
                    current_state = new_state
                
                # Continue loop to find next tag
                # Continuar loop para encontrar próxima tag
        
        return new_state, content_to_yield, self.buffer
    
    def _get_state_for_tag(self, tag: str, current_state: str) -> str:
        """
        Determine new state based on detected tag
        Determina novo estado baseado na tag detectada
        
        Args / Argumentos:
            tag (str): Detected tag / Tag detectada
            current_state (str): Current state / Estado atual
        
        Returns / Retorna:
            str: New state / Novo estado
        """
        # Default mapping: opening/closing tags
        # Mapeamento padrão: tags de abertura/fechamento
        
        if tag in ["<think>", "<thinking>"]:
            return "thinking"
        elif tag in ["</think>", "</thinking>"]:
            return "text"
        
        # Unknown tag, keep current state
        # Tag desconhecida, manter estado atual
        logger.warning(f"Unknown tag '{tag}', keeping state '{current_state}'")
        return current_state
    
    def reset(self):
        """
        Reset internal buffer
        Reseta buffer interno
        """
        self.buffer = ""
        logger.debug("TagDetector buffer reset")
    
    def get_buffer_size(self) -> int:
        """
        Get current buffer size
        Obtém tamanho atual do buffer
        
        Returns / Retorna:
            int: Buffer size in characters / Tamanho do buffer em caracteres
        """
        return len(self.buffer)
    
    def __repr__(self) -> str:
        """String representation / Representação em string"""
        return f"TagDetector(tags={self.tags}, buffer_size={len(self.buffer)})"
