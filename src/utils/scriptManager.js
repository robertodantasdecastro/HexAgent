/**
 * Script Manager Utility
 * Manages script file operations: save, execute, debug
 * 
 * Gerenciador de Scripts
 * Gerencia operações com arquivos de script: salvar, executar, depurar
 */

export class ScriptManager {
  /**
   * Save script to file system
   */  
  static async saveScript(path, content, makeExecutable = false) {
    try {
      const response = await fetch('http://localhost:5000/script/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path, 
          content, 
          make_executable: makeExecutable 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save script: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[ScriptManager] Save failed:', error);
      throw error;
    }
  }
  
  /**
   * Execute script and capture output
   */
  static async executeScript(path, args = [], workingDir = null) {
    try {
      const response = await fetch('http://localhost:5000/script/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path, 
          args,
          working_dir: workingDir
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to execute script: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[ScriptManager] Execute failed:', error);
      throw error;
    }
  }
  
  /**
   * Execute script in debug mode (with verbose output)
   */
  static async debugScript(path, args = []) {
    try {
      const response = await fetch('http://localhost:5000/script/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, args })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to debug script: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('[ScriptManager] Debug failed:', error);
      throw error;
    }
  }
  
  /**
   * Suggest appropriate save path based on context
   */
  static suggestPath(filename, context = {}) {
    // If context has a mentioned path, use it
    if (context.mentionedPath) {
      return context.mentionedPath;
    }
    
    // If there's a project root, save there
    if (context.projectRoot) {
      return `${context.projectRoot}/${filename}`;
    }
    
    // Default to ~/scripts
    return `~/scripts/${filename}`;
  }
  
  /**
   * Get file extension from filename
   */
  static getExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }
  
  /**
   * Determine if file needs execute permission (shebang present)
   */
  static needsExecutePermission(content) {
    return content.trim().startsWith('#!');
  }
}
