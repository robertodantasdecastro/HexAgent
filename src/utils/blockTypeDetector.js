import { BlockType } from '../constants/BlockTypes';

/**
 * Detect block type from content
 * @param {string} content - The content to analyze
 * @param {object} context - Additional context (metadata, previous blocks, etc)
 * @returns {object} - { type: BlockType, language: string|null, confidence: number }
 */
export function detectBlockType(content, context = {}) {
  if (!content || typeof content !== 'string') {
    return { type: BlockType.TEXT, language: null, confidence: 0 };
  }

  const trimmed = content.trim();
  
  // 1. Thinking blocks (highest priority for UX)
  if (isThinkingBlock(trimmed)) {
    return { type: BlockType.THINKING, language: null, confidence: 0.95 };
  }
  
  // 2. Error messages
  if (isErrorBlock(trimmed)) {
    return { type: BlockType.ERROR, language: null, confidence: 0.9 };
  }
  
  // 3. Log/Tool output
  if (isLogBlock(trimmed)) {
    return { type: BlockType.LOG, language: 'log', confidence: 0.85 };
  }
  
  // 4. Shell commands
  const shellDetection = detectShellCommand(trimmed);
  if (shellDetection.isShell) {
    return { 
      type: BlockType.SHELL, 
      language: 'bash', 
      confidence: shellDetection.confidence 
    };
  }
  
  // 5. Code files
  const codeDetection = detectCodeLanguage(trimmed);
  if (codeDetection.language) {
    return { 
      type: BlockType.CODE, 
      language: codeDetection.language, 
      confidence: codeDetection.confidence 
    };
  }
  
  // 6. README/Documentation
  if (isReadmeBlock(trimmed)) {
    return { type: BlockType.README, language: 'markdown', confidence: 0.8 };
  }
  
  // 7. Default: Natural language text
  return { type: BlockType.TEXT, language: null, confidence: 0.5 };
}

/**
 * Check if content is a thinking/processing block
 */
function isThinkingBlock(content) {
  const thinkingPatterns = [
    /^executando:/i,
    /^pensando:/i,
    /^analyzing:/i,
    /^processing:/i,
    /^thinking:/i,
    /^⚙️/,
    /^\[thinking\]/i,
    /^\[processing\]/i
  ];
  
  return thinkingPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if content is an error message
 */
function isErrorBlock(content) {
  const errorPatterns = [
    /^error:/i,
    /^exception:/i,
    /^traceback/i,
    /^fatal:/i,
    /^\[error\]/i,
    /❌/,
    /⚠️.*error/i
  ];
  
  return errorPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if content is log output
 */
function isLogBlock(content) {
  const logIndicators = [
    /starting nmap/i,
    /scan report/i,
    /\[info\]/i,
    /\[warn\]/i,
    /\[debug\]/i,
    /nmap done:/i,
    /host is up/i,
    /port.*open/i,
    /^\d{4}-\d{2}-\d{2}/,  // Timestamp
    /\d+\.\d+\.\d+\.\d+/   // IP addresses
  ];
  
  const lines = content.split('\n');
  const matchCount = lines.filter(line => 
    logIndicators.some(pattern => pattern.test(line))
  ).length;
  
  // If >30% of lines match log patterns
  return matchCount / lines.length > 0.3;
}

/**
 * Detect if content is a shell command
 */
function detectShellCommand(content) {
  const shellCommands = [
    'nmap', 'ls', 'grep', 'find', 'cat', 'head', 'tail',
    'sudo', 'chmod', 'chown', 'mkdir', 'rm', 'cp', 'mv',
    'wget', 'curl', 'ssh', 'scp', 'rsync', 'tar', 'gzip',
    'ps', 'kill', 'top', 'htop', 'df', 'du', 'free',
    'netstat', 'ifconfig', 'ip', 'ping', 'traceroute',
    'git', 'docker', 'npm', 'yarn', 'pip', 'apt', 'yum'
  ];
  
  const firstWord = content.split(/\s+/)[0].toLowerCase();
  
  // Check if starts with common command
  if (shellCommands.includes(firstWord)) {
    return { isShell: true, confidence: 0.9 };
  }
  
  // Check for command with flags
  if (/^[a-z-]+\s+-[a-zA-Z]/.test(content)) {
    return { isShell: true, confidence: 0.85 };
  }
  
  // Check for pipeline or redirection
  if (/[\|>]/.test(content) && content.split('\n').length <= 3) {
    return { isShell: true, confidence: 0.8 };
  }
  
  return { isShell: false, confidence: 0 };
}

/**
 * Detect programming language
 */
function detectCodeLanguage(content) {
  const languagePatterns = {
    python: {
      patterns: [
        /^import\s+\w+/m,
        /^from\s+\w+\s+import/m,
        /^def\s+\w+\s*\(/m,
        /^class\s+\w+/m,
        /if\s+__name__\s*==\s*['"]__main__['"]/
      ],
      weight: 1
    },
    javascript: {
      patterns: [
        /^(const|let|var)\s+\w+\s*=/m,
        /^function\s+\w+\s*\(/m,
        /^(import|export)\s+(default\s+)?\w+/m,
        /=>\s*{/,
        /console\.(log|error|warn)/
      ],
      weight: 1
    },
    bash: {
      patterns: [
        /^#!\/bin\/(bash|sh)/,
        /^function\s+\w+\s*\(\)/m,
        /^alias\s+\w+=/m,
        /\$\{?\w+\}?/,
        /^if\s+\[/m
      ],
      weight: 1
    },
    json: {
      patterns: [
        /^\s*\{[\s\S]*\}\s*$/,
        /"[\w-]+":\s*[{\["]/,
      ],
      weight: 0.9
    },
    markdown: {
      patterns: [
        /^#{1,6}\s+.+$/m,
        /^\*\*[^*]+\*\*$/m,
        /^\[.+\]\(.+\)$/m,
        /^```[\w]*$/m
      ],
      weight: 0.8
    }
  };
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const [lang, {patterns, weight}] of Object.entries(languagePatterns)) {
    const matchCount = patterns.filter(p => p.test(content)).length;
    const score = (matchCount / patterns.length) * weight;
    
    if (score > highestScore && score > 0.3) {
      highestScore = score;
      bestMatch = lang;
    }
  }
  
  return {
    language: bestMatch,
    confidence: highestScore
  };
}

/**
 * Check if content is README/documentation
 */
function isReadmeBlock(content) {
  const readmeIndicators = [
    /^# .+/m,           // H1 header
    /^## .+/m,          // H2 header
    /^### .+/m,         // H3 header
    /installation/i,
    /usage/i,
    /getting started/i,
    /prerequisites/i,
    /requirements/i
  ];
  
  const hasHeaders = /^#{1,3}\s+/m.test(content);
  const hasMultipleSections = (content.match(/^##/gm) || []).length >= 2;
  const hasReadmeKeywords = readmeIndicators.some(p => p.test(content));
  
  return hasHeaders && (hasMultipleSections || hasReadmeKeywords);
}

/**
 * Get human-readable block type name
 */
export function getBlockTypeName(blockType) {
  const names = {
    [BlockType.TEXT]: 'Text',
    [BlockType.CODE]: 'Code',
    [BlockType.SHELL]: 'Shell',
    [BlockType.THINKING]: 'AI Thinking',
    [BlockType.README]: 'Documentation',
    [BlockType.LOG]: 'Log Output',
    [BlockType.ERROR]: 'Error'
  };
  
  return names[blockType] || 'Unknown';
}

export default {
  BlockType,
  detectBlockType,
  getBlockTypeName
};
