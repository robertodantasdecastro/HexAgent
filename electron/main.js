import { exec, spawn } from 'child_process';
import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function killPort(port) {
    return new Promise((resolve) => {
        if (process.platform === 'win32') {
             resolve();
        } else {
            // Linux/Mac: kill process on port
            // Use full path for lsof to be safe, or just try exec
            exec(`lsof -t -i:${port}`, (err, stdout) => {
                if (stdout) {
                    const pids = stdout.trim().split('\n');
                    console.log(`[Electron] Killing PIDs on port ${port}: ${pids.join(', ')}`);
                    exec(`kill -9 ${pids.join(' ')}`, (kErr) => {
                        if (kErr) console.error('[Electron] Error killing PID:', kErr);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        }
    });
}

let mainWindow;
let pythonProcess;

// Disable GPU Acceleration to prevent crashes on Linux/VMs
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu');

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Create window only if we have the lock
  app.on('ready', async () => {
      // Enable console logging for debugging / Habilitar logs do console para debug
      console.log('[Electron] Starting HexAgentGUI...');
      console.log('[Electron] isPackaged:', app.isPackaged);
      console.log('[Electron] execPath:', process.execPath);
      console.log('[Electron] cwd:', process.cwd());
      
      await startPythonBackend();
      
      // Wait for backend to be ready before creating window
      // Aguarda backend estar pronto antes de criar janela
      console.log('[Electron] Waiting for backend to be ready...');
      await waitForBackend();
      
      createWindow();
  });
}

const waitForBackend = async () => {
    const maxRetries = 30; // 30 attempts * 500ms = 15 seconds max
    let retries = 0;
    
    return new Promise((resolve) => {
        const check = () => {
            const { get } = Promise.resolve().then(() => import('http'));
            
            // Use simple http request to check health
            const http =  import('http'); 
            http.then(h => {
                const req = h.get('http://127.0.0.1:5000/health', (res) => {
                    if (res.statusCode === 200) {
                        console.log('[Electron] Backend is ready!');
                        resolve();
                    } else {
                        retry();
                    }
                });
                
                req.on('error', () => retry());
                req.end();
            });
        };
        
        const retry = () => {
            retries++;
            if (retries >= maxRetries) {
                console.error('[Electron] Backend failed to start in time. Launching anyway.');
                resolve(); // Launch anyway to show UI errors if needed
            } else {
                setTimeout(check, 500);
            }
        };
        
        check();
    });
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple prototype, or use preload
      webSecurity: false // Allow local loading
    },
    titleBarStyle: 'hidden', // Mac/Warp style
    titleBarOverlay: {
        color: '#000000',
        symbolColor: '#00ff00',
        height: 50
    },
    // Vibrancy only works on macOS usually, but we can try transparency
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, '../icon.png')
  });

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
  } else {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
      // Creating a debug build: Always open devtools to see why it is black
      mainWindow.webContents.openDevTools();
  }

  // Handle close event for Graceful Shutdown UI
  mainWindow.on('close', (e) => {
      // If we are not forcing quit, intervene
      // We check a custom flag on different variable? 
      // Actually we can listen to ipc from renderer to set a flag
      if (!global.isQuitting) {
          e.preventDefault();
          // Send event to renderer to show shutdown screen
          mainWindow.webContents.send('app-close-requested');
      }
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

// Global flag
global.isQuitting = false;

// IPC listener to quit
ipcMain.on('app-ready-to-quit', () => {
    global.isQuitting = true;
    app.quit(); // This will trigger window-all-closed -> quit -> will-quit
});

// IPC handler for save file dialog (for chat export)
ipcMain.handle('save-file', async (event, options) => {
    const { dialog } = await import('electron');
    const { content, defaultName, filters } = options;
    
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    });
    
    if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, content, 'utf-8');
        return { success: true, path: result.filePath };
    }
    
    return { success: false };
});

// killPort is defined at the top
// killPort definido no topo

async function startPythonBackend() {
    if (pythonProcess) {
        console.log('[Backend] Process already running (PID: ' + pythonProcess.pid + ')');
        return;
    }

    try {
        await killPort(5000);
    } catch (e) {
        console.error('[Electron] Error cleaning port:', e);
    }

    // Determine app base path / Determinar caminho base do app
    const appPath = app.isPackaged 
        ? path.dirname(process.execPath)  // Packaged: use executable location
        : path.join(__dirname, '..');      // Dev: use project root

    console.log(`[Backend] App path: ${appPath}`);
    
    // Define backend script path / Definir caminho do script backend
    let scriptPath = path.join(appPath, 'backend', 'app.py');
    
    // Check if backend exists / Verificar se backend existe
    if (!fs.existsSync(scriptPath)) {
        // Try alternative locations / Tentar localizações alternativas
        const altPaths = [
            path.join(appPath, 'resources', 'backend', 'app.py'),
            path.join(__dirname, '../backend/app.py'),
            path.join(process.cwd(), 'backend', 'app.py')
        ];
        
        for (const altPath of altPaths) {
            if (fs.existsSync(altPath)) {
                scriptPath = altPath;
                console.log(`[Backend] Found at alternative location: ${scriptPath}`);
                break;
            }
        }
        
        if (!fs.existsSync(scriptPath)) {
            console.error(`[Backend] ERROR: app.py not found (OOP backend)!`);
            console.error(`[Backend] Tried paths:`, [scriptPath, ...altPaths]);
            // Don't crash app, let it run without backend
            return;
        }
    }
    
    // Determine Python command / Determinar comando Python
    let pythonCmd;
    const pythonPaths = [
        // PRIORITY 1: Packaged venv / PRIORIDADE 1: venv empacotado
        path.join(appPath, 'resources', 'venv', 'bin', 'python'),
        path.join(appPath, 'venv', 'bin', 'python'),
        
        // PRIORITY 2: Project venv / PRIORIDADE 2: venv do projeto
        path.join(__dirname, '../venv/bin/python'),
        
        // PRIORITY 3: System Python (LAST RESORT) / PRIORIDADE 3: Python do sistema (ÚLTIMO RECURSO)
        'python3',
        'python'
    ];
    
    for (const pyPath of pythonPaths) {
        if (pyPath.startsWith('/') || pyPath.startsWith('.')) {
            // Absolute or relative path / Caminho absoluto ou relativo
            if (fs.existsSync(pyPath)) {
                pythonCmd = pyPath;
                console.log(`[Backend] ✓ Using Python at: ${pythonCmd}`);
                break;
            }
        } else {
            // System command / Comando do sistema
            pythonCmd = pyPath;
            console.log(`[Backend] ⚠ Using system Python: ${pythonCmd} (may not have dependencies)`);
            break;
        }
    }
    
    if (!pythonCmd) {
        console.error(`[Backend] ERROR: No Python interpreter found!`);
        return;
    }

    console.log(`[Backend] Starting: ${scriptPath}`);
    console.log(`[Backend] Python: ${pythonCmd}`);
    
    try {
        pythonProcess = spawn(pythonCmd, [scriptPath], {
            cwd: path.dirname(scriptPath) // Set working directory / Definir diretório de trabalho
        });

        pythonProcess.stdout.on('data', (data) => {
            console.log(`[Python]: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`[Python API]: ${data}`);
        });

        pythonProcess.on('error', (error) => {
            console.error(`[Backend] Failed to start:`, error);
        });

        pythonProcess.on('close', (code) => {
            console.log(`[Backend] Process exited with code ${code}`);
        });
        
        console.log(`[Backend] ✅ Started successfully`);
    } catch (error) {
        console.error(`[Backend] ERROR starting process:`, error);
    }
}




app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    console.log('[Electron] Shutting down...');
    if (pythonProcess) {
        console.log('[Backend] Stopping Python process...');
        try {
            pythonProcess.kill('SIGTERM'); // Graceful shutdown / Encerramento gracioso
            
            // Force kill after 2 seconds if still running / Forçar encerramento após 2s
            setTimeout(() => {
                if (pythonProcess && !pythonProcess.killed) {
                    console.log('[Backend] Force killing...');
                    pythonProcess.kill('SIGKILL');
                }
            }, 2000);
            
            console.log('[Backend] ✓ Stopped');
        } catch (error) {
            console.error('[Backend] Error stopping:', error);
        }
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
