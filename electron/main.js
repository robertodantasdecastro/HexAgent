import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
// import isDev from 'electron-is-dev'; // Removed
// import isDev from 'electron-is-dev'; // Removed causing crash
// Actually let's use app.isPackaged or process.env.NODE_ENV

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let pythonProcess;

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
        height: 40
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

  mainWindow.on('closed', () => (mainWindow = null));
}

function startPythonBackend() {

    let scriptPath;
    let pythonCmd;

    if (app.isPackaged) {
        // In production, resources are unpacked to resources/backend and resources/venv
        scriptPath = path.join(process.resourcesPath, 'backend', 'server.py');
        // Try bundled venv first, but fallback to system python if needed
        const bundledPython = path.join(process.resourcesPath, 'venv', 'bin', 'python');
        if (fs.existsSync(bundledPython)) {
             pythonCmd = bundledPython;
        } else {
             pythonCmd = 'python3'; // Fallback
        }
    } else {
        // In dev
        scriptPath = path.join(__dirname, '../backend/server.py');
        pythonCmd = path.join(__dirname, '../venv/bin/python');
    }

    console.log(`Starting Python Backend: ${scriptPath} using ${pythonCmd}`);
    
    // Check if python exists (helpful for debugging ENOTDIR or ENOENT)
    if (!fs.existsSync(pythonCmd)) {
        console.error(`Python binary not found at: ${pythonCmd}`);
        // Fallback to system python if venv fails (though venv is preferred)
        pythonCmd = 'python3';
    }
    
    pythonProcess = spawn(pythonCmd, [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python]: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python API]: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

app.on('ready', () => {
    startPythonBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
