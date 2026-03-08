"""
PersonaProcessor - Cognitive Agent for Profile-Based Context Adaptation
PersonaProcessor - Agente Cognitivo para Adaptação de Contexto Baseada em Perfil

Implements IPersonaProcessor interface to adapt prompts based on user profile.
Implementa interface IPersonaProcessor para adaptar prompts baseado em perfil do usuário.

Features / Recursos:
- Loads user profile from ~/.hexagent-gui/profile.json
- Adapts prompts based on experience level (beginner/intermediate/advanced)
- Injects language preferences into context
- Enriches context with relevant profile metadata

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0 (Initial Implementation - Q2 2026)
"""

import os
import json
import logging
from typing import Dict, List, Any
from ..cognitive_interfaces import (
    IPersonaProcessor,
    ProcessedContext
)

logger = logging.getLogger(__name__)


class PersonaProcessor(IPersonaProcessor):
    """
    Real implementation of IPersonaProcessor.
    Implementação real de IPersonaProcessor.
    
    Adapts AI prompts based on user profile configuration.
    Adapta prompts de IA baseado em configuração de perfil do usuário.
    """
    
    def __init__(self, profile_path: str = "~/.hexagent-gui/profile.json"):
        """
        Initialize PersonaProcessor with profile path.
        Inicializar PersonaProcessor com caminho do perfil.
        
        Args:
            profile_path: Path to user profile JSON file
        """
        self.profile_path = os.path.expanduser(profile_path)
        self.profile = self._load_profile()
        
        logger.info(f"PersonaProcessor initialized with profile: {self.profile_path}")
        logger.debug(f"Profile loaded: experience={self.profile.get('experience_level', 'unknown')}")
    
    def process_pre_context(
        self,
        user_input: str,
        profile_context: str
    ) -> ProcessedContext:
        """
        Process user input before context building.
        Processar entrada do usuário antes de construir contexto.
        
        Adapts prompt based on user's experience level:
        - beginner: Adds detailed explanations request
        - intermediate: Balanced detail
        - advanced: Concise, assumes knowledge
        
        Args:
            user_input: Raw user input
            profile_context: Additional profile context (from memory)
            
        Returns:
            ProcessedContext with adapted input
        """
        experience = self.profile.get("experience_level", "advanced")
        
        # Base metadata
        persona_metadata = {
            "experience_level": experience,
            "adaptations_applied": []
        }
        
        context_enhancements = []
        modified_input = user_input
        
        # Adapt based on experience level
        if experience == "beginner":
            enhancement = "[System: User is a beginner. Explain steps clearly with detailed reasoning.]"
            modified_input = f"{user_input}\n\n{enhancement}"
            context_enhancements.append("beginner_guidance")
            persona_metadata["adaptations_applied"].append("beginner_mode")
            
            logger.debug(f"Applied beginner adaptation to input")
        
        elif experience == "intermediate":
            enhancement = "[System: Balance detail with efficiency. Provide context where helpful.]"
            modified_input = f"{user_input}\n\n{enhancement}"
            context_enhancements.append("balanced_mode")
            persona_metadata["adaptations_applied"].append("intermediate_mode")
            
            logger.debug(f"Applied intermediate adaptation to input")
        
        else:  # advanced
            # No modification for advanced users (assume knowledge)
            persona_metadata["adaptations_applied"].append("advanced_mode_no_changes")
            logger.debug(f"Advanced user - no input adaptation")
        
        return ProcessedContext(
            modified_input=modified_input,
            persona_metadata=persona_metadata,
            context_enhancements=context_enhancements
        )
    
    def process_post_context(
        self,
        history: List[Dict[str, str]]
    ) -> List[Dict[str, str]]:
        """
        Enrich context after building with language preferences.
        Enriquecer contexto após construção com preferências de idioma.
        
        Injects user's preferred language into system message.
        Injeta idioma preferido do usuário na mensagem de sistema.
        
        Args:
            history: Chat history with initial context
            
        Returns:
            Enhanced history with language preference
        """
        preferred_lang = self.profile.get("language", "en")
        
        # Find and enhance system message
        if history and len(history) > 0:
            for msg in history:
                if msg.get("role") == "system":
                    # Inject language preference
                    lang_hint = f"\n\nUser's preferred language: {preferred_lang}"
                    if lang_hint not in msg["content"]:
                        msg["content"] += lang_hint
                        logger.debug(f"Injected language preference: {preferred_lang}")
                    break
        
        return history
    
    def _load_profile(self) -> Dict[str, Any]:
        """
        Load user profile from JSON file.
        Carregar perfil do usuário de arquivo JSON.
        
        Returns:
            Profile dict or empty dict if file not found
        """
        if os.path.exists(self.profile_path):
            try:
                with open(self.profile_path, "r") as f:
                    profile = json.load(f)
                    logger.info(f"Profile loaded successfully from {self.profile_path}")
                    return profile
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse profile JSON: {e}")
                return {}
            except Exception as e:
                logger.error(f"Error loading profile: {e}")
                return {}
        else:
            logger.warning(f"Profile not found at {self.profile_path}, using defaults")
            return {
                "experience_level": "advanced",
                "language": "en"
            }
