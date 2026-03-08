"""
RiskEvaluator - Cognitive Agent for Command Risk Assessment
RiskEvaluator - Agente Cognitivo para Avaliação de Risco de Comandos

Implements IRiskEvaluator interface to assess security risks of shell commands.
Implementa interface IRiskEvaluator para avaliar riscos de segurança de comandos shell.

Features / Recursos:
- Pattern-based risk detection (high/medium/low)
- Blocks destructive commands (rm -rf, dd, mkfs, fork bombs)
- Warns about privileged operations (sudo)
- Provides detailed reasoning for risk assessment

@author: Roberto Dantas de Castro <robertodantasdecastro@gmail.com>
@version: 1.0.0 (Initial Implementation - Q2 2026)
"""

import re
import logging
from typing import List, Dict, Any, Tuple
from ..cognitive_interfaces import (
    IRiskEvaluator,
    RiskAssessment
)

logger = logging.getLogger(__name__)


class RiskEvaluator(IRiskEvaluator):
    """
    Real implementation of IRiskEvaluator.
    Implementação real de IRiskEvaluator.
    
    Evaluates security risks of shell commands before execution.
    Avalia riscos de segurança de comandos shell antes da execução.
    """
    
    # High-risk patterns (destructive, dangerous)
    # Padrões de alto risco (destrutivos, perigosos)
    HIGH_RISK_PATTERNS = [
        (r"rm\s+-rf\s+/", "Recursive delete from root (EXTREMELY DANGEROUS)"),
        (r"dd\s+if=.*of=/dev/sd", "Direct disk write (DATA LOSS RISK)"),
        (r"mkfs\.", "Filesystem formatting (DATA LOSS RISK)"),
        (r":()\s*{\s*:\|:&\s*};:", "Fork bomb (SYSTEM CRASH RISK)"),
        (r">\s*/dev/sd[a-z]", "Direct device write (DATA LOSS RISK)"),
        (r"chmod\s+-R\s+777\s+/", "Recursive 777 on root (MAJOR SECURITY RISK)"),
    ]
    
    # Medium-risk patterns (privileged, potentially unsafe)
    # Padrões de médio risco (privilegiados, potencialmente inseguros)
    MEDIUM_RISK_PATTERNS = [
        (r"sudo\s+rm", "Privileged delete operation"),
        (r"sudo\s+dd", "Privileged disk operation"),
        (r"chmod\s+777", "Insecure permissions (world-writable)"),
        (r"curl.*\|\s*bash", "Remote script execution (unverified)"),
        (r"wget.*\|\s*sh", "Remote script execution (unverified)"),
        (r"sudo\s+apt\s+remove", "Package removal (may break system)"),
        (r"pip\s+install.*--break-system-packages", "System-wide pip install (may conflict)"),
    ]
    
    # Low-risk patterns (requires attention but generally safe)
    # Padrões de baixo risco (requer atenção mas geralmente seguro)
    LOW_RISK_PATTERNS = [
        (r"sudo", "Privileged operation (review command carefully)"),
        (r"git\s+push\s+--force", "Force push (may overwrite remote history)"),
        (r"docker\s+rm", "Docker container removal"),
    ]
    
    def __init__(self):
        """
        Initialize RiskEvaluator.
        Inicializar RiskEvaluator.
        """
        logger.info("RiskEvaluator initialized")
    
    def evaluate_risk(
        self,
        execution_plan: List[Dict[str, Any]]
    ) -> RiskAssessment:
        """
        Evaluate risks in execution plan.
        Avaliar riscos no plano de execução.
        
        Analyzes each command for dangerous patterns and returns
        the highest risk level found.
        Analisa cada comando para padrões perigosos e retorna
        o nível de risco mais alto encontrado.
        
        Args:
            execution_plan: List of planned command executions
                           Each dict should have 'command' key
            
        Returns:
            RiskAssessment with overall risk level and reasoning
        """
        max_risk_level = "low"
        risk_factors = []
        
        # Extract commands from execution plan
        commands = []
        for item in execution_plan:
            if isinstance(item, dict):
                cmd = item.get("command", "")
            elif isinstance(item, str):
                cmd = item
            else:
                continue
            
            if cmd:
                commands.append(cmd)
        
        # Evaluate each command
        for cmd in commands:
            risk_level, risk_reason = self._evaluate_command(cmd)
            
            # Track highest risk
            if self._risk_level_value(risk_level) > self._risk_level_value(max_risk_level):
                max_risk_level = risk_level
            
            # Collect risk factors
            if risk_reason:
                risk_factors.append(f"'{cmd[:50]}...': {risk_reason}")
        
        # Determine execution permission
        should_execute = max_risk_level in ["low", "medium"]
        requires_approval = max_risk_level in ["medium", "high"]
        
        logger.info(
            f"Risk assessment complete: level={max_risk_level}, "
            f"execute={should_execute}, approval={requires_approval}"
        )
        
        return RiskAssessment(
            risk_level=max_risk_level,
            should_execute=should_execute,
            requires_approval=requires_approval,
            risk_factors=risk_factors if risk_factors else ["No significant risks detected"]
        )
    
    def _evaluate_command(self, cmd: str) -> Tuple[str, str]:
        """
        Evaluate risk of a single command.
        Avaliar risco de um único comando.
        
        Args:
            cmd: Shell command string
            
        Returns:
            Tuple of (risk_level, risk_reason)
        """
        # Check high-risk patterns
        for pattern, reason in self.HIGH_RISK_PATTERNS:
            if re.search(pattern, cmd):
                logger.warning(f"HIGH RISK detected: {cmd[:100]} - {reason}")
                return ("high", reason)
        
        # Check medium-risk patterns
        for pattern, reason in self.MEDIUM_RISK_PATTERNS:
            if re.search(pattern, cmd):
                logger.info(f"MEDIUM RISK detected: {cmd[:100]} - {reason}")
                return ("medium", reason)
        
        # Check low-risk patterns
        for pattern, reason in self.LOW_RISK_PATTERNS:
            if re.search(pattern, cmd):
                logger.debug(f"LOW RISK detected: {cmd[:100]} - {reason}")
                return ("low", reason)
        
        # No risks detected
        logger.debug(f"Safe command: {cmd[:100]}")
        return ("low", "")
    
    @staticmethod
    def _risk_level_value(level: str) -> int:
        """
        Convert risk level to numeric value for comparison.
        Converter nível de risco para valor numérico para comparação.
        
        Args:
            level: Risk level string
            
        Returns:
            Numeric value (higher = more risky)
        """
        risk_map = {
            "low": 0,
            "medium": 1,
            "high": 2,
            "critical": 3
        }
        return risk_map.get(level, 0)
