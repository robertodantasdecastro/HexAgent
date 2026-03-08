"""
Unit Tests for PersonaProcessor
Testes Unitários para PersonaProcessor

Tests profile-based prompt adaptation functionality.
Testa funcionalidade de adaptação de prompts baseada em perfil.

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0 (Initial Tests - Q2 2026)
"""

import pytest
import json
import tempfile
import os
from backend.core.agents.persona_processor import PersonaProcessor


class TestPersonaProcessor:
    """Test suite for PersonaProcessor agent"""
    
    def test_init_with_existing_profile(self):
        """Test initialization with valid profile file"""
        # Create temporary profile
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as f:
            json.dump({"experience_level": "beginner", "language": "pt"}, f)
            profile_path = f.name
        
        try:
            processor = PersonaProcessor(profile_path=profile_path)
            
            assert processor.profile["experience_level"] == "beginner"
            assert processor.profile["language"] == "pt"
        finally:
            os.unlink(profile_path)
    
    def test_init_with_missing_profile(self):
        """Test initialization with non-existent profile (should use defaults)"""
        processor = PersonaProcessor(profile_path="/nonexistent/profile.json")
        
        assert processor.profile["experience_level"] == "advanced"
        assert processor.profile["language"] == "en"
    
    def test_process_pre_context_beginner(self):
        """Test prompt adaptation for beginner users"""
        processor = PersonaProcessor()
        processor.profile = {"experience_level": "beginner"}
        
        result = processor.process_pre_context("List all files", "")
        
        assert "beginner" in result.modified_input.lower()
        assert result.persona_metadata["experience_level"] == "beginner"
        assert "beginner_mode" in result.persona_metadata["adaptations_applied"]
        assert "beginner_guidance" in result.context_enhancements
    
    def test_process_pre_context_intermediate(self):
        """Test prompt adaptation for intermediate users"""
        processor = PersonaProcessor()
        processor.profile = {"experience_level": "intermediate"}
        
        result = processor.process_pre_context("List all files", "")
        
        assert "balance" in result.modified_input.lower() or "efficiency" in result.modified_input.lower()
        assert result.persona_metadata["experience_level"] == "intermediate"
        assert "intermediate_mode" in result.persona_metadata["adaptations_applied"]
    
    def test_process_pre_context_advanced(self):
        """Test prompt adaptation for advanced users (no changes expected)"""
        processor = PersonaProcessor()
        processor.profile = {"experience_level": "advanced"}
        
        original_input = "List all files"
        result = processor.process_pre_context(original_input, "")
        
        # Advanced mode should not modify input
        assert result.modified_input == original_input
        assert result.persona_metadata["experience_level"] == "advanced"
        assert "advanced_mode_no_changes" in result.persona_metadata["adaptations_applied"]
    
    def test_process_post_context_language_injection(self):
        """Test language preference injection into system message"""
        processor = PersonaProcessor()
        processor.profile = {"language": "pt-BR"}
        
        history = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello"}
        ]
        
        result = processor.process_post_context(history)
        
        # Check language was injected
        assert "pt-BR" in result[0]["content"]
        assert "preferred language" in result[0]["content"].lower()
    
    def test_process_post_context_no_system_message(self):
        """Test handling of history without system message"""
        processor = PersonaProcessor()
        processor.profile = {"language": "en"}
        
        history = [
            {"role": "user", "content": "Hello"}
        ]
        
        # Should not crash, just return unchanged
        result = processor.process_post_context(history)
        assert len(result) == 1
        assert result[0]["content"] == "Hello"
    
    def test_process_post_context_empty_history(self):
        """Test handling of empty history"""
        processor = PersonaProcessor()
        
        result = processor.process_post_context([])
        assert result == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
