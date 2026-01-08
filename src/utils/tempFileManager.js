/**
 * TempFileManager
 * Tracks files created/modified by AI during session
 * 
 * Gerenciador de Arquivos Temporários
 * Rastreia arquivos criados/modificados pela IA durante a sessão
 */

class TempFileManager {
  constructor() {
    this.trackedFiles = new Map();
    this.sessionId = Date.now();
    this.config = this.getDefaultConfig(); // Use default initially / Usar padrão inicialmente
    this.initialized = false;
  }
  
  /**
   * Initialize manager (call after app mount) / Inicializar manager (chamar após montagem do app)
   * Deve ser chamado pelo App.jsx no useEffect
   */
  async init() {
    if (this.initialized) return;
    await this.loadConfig();
    this.initialized = true;
  }
  
  async loadConfig() {
    try {
      const response = await fetch('http://localhost:5000/config/user/ui/temp_files', {
        signal: AbortSignal.timeout(5000) // 5 second timeout / Timeout de 5 segundos
      });
      if (response.ok) {
        this.config = await response.json();
        console.log('[TempFileManager] ✅ Config loaded from backend');
      } else {
        console.warn('[TempFileManager] ⚠️  Backend returned error, using defaults');
        // Keep default config / Manter config padrão
      }
    } catch (error) {
      // CRITICAL: Never throw - always use fallback / CRÍTICO: Nunca lançar exceção - sempre usar fallback
      console.warn('[TempFileManager] ⚠️  Using default config (backend unavailable):', error.message);
      // Config já está com defaults do constructor
    }
  }
  
  getDefaultConfig() {
    return {
      temp_directory: '~/.hexagent-gui/temp',
      session_tracking: true,
      prompt_on_exit: true,
      default_save_location: '~/Documents/HexAgent'
    };
  }
  
  /**
   * Track a file created or modified by AI
   */
  trackFile(filepath, content, metadata = {}) {
    if (!this.config?.session_tracking) return;
    
    const fileInfo = {
      path: filepath,
      content,
      created: Date.now(),
      saved: false,
      size: new Blob([content]).size,
      type: this.detectFileType(filepath),
      metadata
    };
    
    this.trackedFiles.set(filepath, fileInfo);
    console.log('[TempFileManager] Tracking file:', filepath);
    
    // Notify backend
    this.syncToBackend();
  }
  
  /**
   * Mark file as saved permanently
   */
  markAsSaved(filepath) {
    const file = this.trackedFiles.get(filepath);
    if (file) {
      file.saved = true;
      file.savedAt = Date.now();
      this.syncToBackend();
    }
  }
  
  /**
   * Get all unsaved files
   */
  getUnsavedFiles() {
    return Array.from(this.trackedFiles.values())
      .filter(f => !f.saved);
  }
  
  /**
   * Get all tracked files
   */
  getAllFiles() {
    return Array.from(this.trackedFiles.values());
  }
  
  /**
   * Detect file type from extension
   */
  detectFileType(filepath) {
    const ext = filepath.split('.').pop().toLowerCase();
    
    const types = {
      code: ['py', 'js', 'jsx', 'sh', 'c', 'cpp', 'java', 'go', 'rs'],
      config: ['json', 'yaml', 'yml', 'toml', 'ini', 'conf'],
      log: ['log', 'txt'],
      readme: ['md', 'rst'],
      data: ['csv', 'xml', 'sql']
    };
    
    for (const [type, extensions] of Object.entries(types)) {
      if (extensions.includes(ext)) return type;
    }
    
    return 'unknown';
  }
  
  /**
   * Sync tracked files to backend
   */
  async syncToBackend() {
    try {
      await fetch('http://localhost:5000/session/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: this.sessionId,
          files: Array.from(this.trackedFiles.values())
        })
      });
    } catch (error) {
      console.warn('[TempFileManager] Failed to sync to backend:', error);
    }
  }
  
  /**
   * Prompt user to save files before exit
   */
  async promptSaveOnExit() {
    if (!this.config?.prompt_on_exit) return true;
    
    const unsaved = this.getUnsavedFiles();
    
    if (unsaved.length === 0) {
      console.log('[TempFileManager] No unsaved files');
      return true;
    }
    
    console.log(`[TempFileManager] ${unsaved.length} unsaved files`);
    
    // Show dialog (will be handled by SaveFilesDialog component)
    return new Promise((resolve) => {
      window.showSaveFilesDialog?.(unsaved, resolve);
    });
  }
  
  /**
   * Clear session data
   */
  clearSession() {
    this.trackedFiles.clear();
    this.sessionId = Date.now();
  }
  
  /**
   * Get session statistics
   */
  getStats() {
    const files = this.getAllFiles();
    return {
      total: files.length,
      saved: files.filter(f => f.saved).length,
      unsaved: files.filter(f => !f.saved).length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      byType: files.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Export singleton instance
export const tempFileManager = new TempFileManager();

export default tempFileManager;
