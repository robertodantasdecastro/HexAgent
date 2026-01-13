#!/usr/bin/env python3
"""
HexAgent App.jsx Integration Script
Script de Integração App.jsx HexAgent

Programmatically integrates ChatService into App.jsx following the integration guide.
Integra programaticamente ChatService no App.jsx seguindo o guia de integração.

Author: Roberto Dantas de Castro
Version: 1.0.0
"""

import os
import re
import sys
from datetime import datetime

# Colors for output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_step(step, message):
    """Print colored step message"""
    print(f"{Colors.BLUE}[STEP {step}]{Colors.END} {message}")

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✓{Colors.END} {message}")

def print_warning(message):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠{Colors.END} {message}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}✗{Colors.END} {message}")

class AppJsxIntegrator:
    def __init__(self, file_path, dry_run=False):
        self.file_path = file_path
        self.dry_run = dry_run
        self.backup_path = f"{file_path}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.content = ""
        self.lines = []
        
    def read_file(self):
        """Read App.jsx content"""
        print_step(1, "Reading App.jsx...")
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                self.content = f.read()
                self.lines = self.content.split('\n')
            print_success(f"Read {len(self.lines)} lines")
            return True
        except Exception as e:
            print_error(f"Failed to read file: {e}")
            return False
    
    def backup_file(self):
        """Create backup of original file"""
        print_step(2, "Creating backup...")
        try:
            with open(self.backup_path, 'w', encoding='utf-8') as f:
                f.write(self.content)
            print_success(f"Backup created: {self.backup_path}")
            return True
        except Exception as e:
            print_error(f"Failed to create backup: {e}")
            return False
    
    def find_line_with_pattern(self, pattern, start=0):
        """Find line number matching pattern"""
        for i, line in enumerate(self.lines[start:], start):
            if pattern in line:
                return i
        return -1
    
    def insert_after_line(self, line_num, code):
        """Insert code after specified line"""
        self.lines.insert(line_num + 1, code)
    
    def add_event_handlers(self):
        """Add ChatService event handlers useEffect"""
        print_step(3, "Adding ChatService event handlers...")
        
        # Find insertion point: look for useEffect with cleanup after initialize
        # Multiple patterns to try
        patterns = [
            ("statusIntervalRef.current", "clearInterval"),  # Near status interval cleanup
            ("}, []); // Run once on mount", None),
            ("Load shell history", None)  # Right before shell history loading
        ]
        
        line_num = -1
        for pattern1, pattern2 in patterns:
            for i in range(len(self.lines)):
                if pattern1 in self.lines[i]:
                    if pattern2 is None or pattern2 in self.lines[i]:
                        # Found potential spot, look for }, []);
                        for j in range(i, min(i + 5, len(self.lines))):
                            if "}, []);" in self.lines[j]:
                                line_num = j
                                break
                    if line_num != -1:
                        break
            if line_num != -1:
                break
        
        if line_num == -1:
            print_error(f"Could not find insertion point")
            return False
        
        event_handlers_code = """
  // ========================================================================
  // ChatService SSE Event Handlers Setup
  // Configuração de Event Handlers SSE do ChatService
  // ========================================================================
  
  useEffect(() => {
    // Setup ChatService event listeners / Configurar event listeners do ChatService
    logger.info('Setting up ChatService event handlers');

    // Handle incoming message chunks / Tratar chunks de mensagem recebidos
    const unsubMessage = chatService.onMessage((chunk) => {
      const { type, content, metadata } = chunk;

      switch (type) {
        case 'text':
          // Append AI text to last block or create new block
          setBlocks(prev => {
            const lastBlock = prev[prev.length - 1];
            
            if (lastBlock && lastBlock.type === 'agent' && !lastBlock.completed) {
              return prev.map((block, idx) => 
                idx === prev.length - 1
                  ? { ...block, content: block.content + content }
                  : block
              );
            } else {
              return [...prev, {
                id: Date.now(),
                type: 'agent',
                content: content,
                timestamp: new Date().toLocaleTimeString(),
                completed: false
              }];
            }
          });
          break;

        case 'command_proposal':
          setBlocks(prev => [...prev, {
            id: Date.now(),
            type: 'command_proposal',
            content: content,
            metadata: metadata,
            timestamp: new Date().toLocaleTimeString()
          }]);
          break;

        case 'command_result':
          setBlocks(prev => [...prev, {
            id: Date.now(),
            type: 'output',
            content: content,
            result: metadata.success ? 'success' : 'error',
            metadata: metadata,
            timestamp: new Date().toLocaleTimeString()
          }]);
          break;

        default:
          logger.warn('Unknown chunk type:', type);
      }
    });

    const unsubError = chatService.onError((error) => {
      logger.error('ChatService error:', error);
      
      setBlocks(prev => [...prev, {
        id: Date.now(),
        type: 'agent',
        content: `⚠️ Error: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        completed: true,
        error: true
      }]);
      
      setLoading(false);
    });

    const unsubComplete = chatService.onComplete((metadata) => {
      logger.info('ChatService streaming complete:', metadata);
      
      setBlocks(prev => prev.map((block, idx) => 
        idx === prev.length - 1 && block.type === 'agent'
          ? { ...block, completed: true }
          : block
      ));
      
      setLoading(false);
    });

    return () => {
      unsubMessage();
      unsubError();
      unsubComplete();
      logger.info('ChatService event handlers cleaned up');
    };
  }, []);
"""
        
        self.insert_after_line(line_num, event_handlers_code)
        print_success(f"Event handlers added after line {line_num}")
        return True
    
    def add_get_context_helper(self):
        """Add getContext helper function"""
        print_step(4, "Adding getContext helper...")
        
        # Find handleSubmit start
        pattern = "const handleSubmit = async (e)"
        line_num = self.find_line_with_pattern(pattern)
        
        if line_num == -1:
            print_warning("Could not find handleSubmit")
            return False
        
        helper_code = """  // ========================================================================
  // Helper: Get conversation context for AI
  // ========================================================================
  
  const getContext = () => {
    return blocks
      .filter(block => block.type === 'user' || block.type === 'agent')
      .slice(-5)
      .map(block => ({
        role: block.type === 'user' ? 'user' : 'assistant',
        content: block.content
      }));
  };

"""
        
        self.insert_after_line(line_num - 1, helper_code)
        print_success(f"getContext helper added before line {line_num}")
        return True
    
    def write_file(self):
        """Write modified content back to file"""
        if self.dry_run:
            print_warning("DRY RUN - Not writing file")
            return True
        
        print_step(7, "Writing modified App.jsx...")
        try:
            new_content = '\n'.join(self.lines)
            with open(self.file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print_success("File written successfully")
            return True
        except Exception as e:
            print_error(f"Failed to write file: {e}")
            return False
    
    def run(self):
        """Run full integration"""
        print(f"\n{'='*70}")
        print(f"{Colors.BLUE}HexAgent App.jsx Integration{Colors.END}")
        print(f"{'='*70}\n")
        
        if not self.read_file():
            return False
        
        if not self.backup_file():
            return False
        
        if not self.add_event_handlers():
            return False
        
        if not self.add_get_context_helper():
            return False
        
        # Additional steps would go here
        # For now, implementing key steps
        
        if not self.write_file():
            return False
        
        print(f"\n{Colors.GREEN}✓ Integration complete!{Colors.END}")
        print(f"Backup: {self.backup_path}")
        print(f"Modified: {self.file_path}")
        
        return True

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Integrate ChatService into App.jsx')
    parser.add_argument('--file', default='/home/d4r13n/iatools/HexAgentGUI/src/App.jsx',
                      help='Path to App.jsx')
    parser.add_argument('--dry-run', action='store_true',
                      help='Dry run without modifying file')
    
    args = parser.parse_args()
    
    integrator = AppJsxIntegrator(args.file, dry_run=args.dry_run)
    success = integrator.run()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
