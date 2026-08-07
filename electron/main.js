'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');

// ─── Environment ─────────────────────────────────────────────────────────────
const isDev = !app.isPackaged;

// ─── Paths ────────────────────────────────────────────────────────────────────
const RESOURCES = isDev
  ? path.join(__dirname, '..')          // project root in dev
  : process.resourcesPath;             // electron-builder extraResources in prod

const APP_DATA = app.getPath('userData');
const MONGO_DATA = path.join(APP_DATA, 'mongodb', 'data');
const MONGO_LOG_DIR = path.join(APP_DATA, 'mongodb', 'logs');
const MONGO_LOG = path.join(MONGO_LOG_DIR, 'mongod.log');
const UPLOADS_DIR = path.join(APP_DATA, 'uploads');

// ─── Process handles ─────────────────────────────────────────────────────────
let mainWindow = null;
let mongoProcess = null;
let backendProcess = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function isPortOpen(port) {
  return new Promise(resolve => {
    const s = net.createConnection({ port, host: '127.0.0.1' });
    s.once('connect', () => { s.destroy(); resolve(true); });
    s.once('error', () => { s.destroy(); resolve(false); });
  });
}

function waitForPort(port, tries = 60, delay = 1000) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const attempt = async () => {
      if (await isPortOpen(port)) return resolve();
      if (++n >= tries) return reject(new Error(`Port ${port} never opened after ${tries}s`));
      setTimeout(attempt, delay);
    };
    attempt();
  });
}

function logToFile(label, data) {
  const logPath = path.join(APP_DATA, 'app.log');
  const line = `[${new Date().toISOString()}] [${label}] ${data}\n`;
  fs.appendFileSync(logPath, line);
  if (isDev) console.log(line.trim());
}

// ─── MongoDB ─────────────────────────────────────────────────────────────────
async function startMongoDB() {
  ensureDir(MONGO_DATA);
  ensureDir(MONGO_LOG_DIR);

  // Already running? (e.g. system MongoDB service)
  if (await isPortOpen(27017)) {
    logToFile('MONGO', 'Already running on 27017');
    return;
  }

  // Locate mongod binary
  const candidates = [
    path.join(RESOURCES, 'resources', 'mongod', 'mongod.exe'), // dev
    path.join(RESOURCES, 'mongod', 'mongod.exe'),           // prod
    'mongod',                                                // system PATH
  ];
  let mongodBin = null;
  for (const c of candidates) {
    if (c === 'mongod' || fs.existsSync(c)) { mongodBin = c; break; }
  }

  if (!mongodBin) {
    throw new Error(
      'MongoDB binary not found at candidates:\n' + candidates.join('\n')
    );
  }

  logToFile('MONGO', `Starting: ${mongodBin}`);

  mongoProcess = spawn(
    mongodBin,
    ['--dbpath', MONGO_DATA, '--logpath', MONGO_LOG, '--port', '27017',
      '--bind_ip', '127.0.0.1', '--logappend'],
    { windowsHide: true, detached: false }
  );

  mongoProcess.on('error', err => logToFile('MONGO_ERR', err.message));
  mongoProcess.stderr.on('data', d => logToFile('MONGO_ERR', d.toString()));

  await waitForPort(27017, 60, 1000);
  logToFile('MONGO', 'Ready');
}

// ─── Express Backend ──────────────────────────────────────────────────────────
async function startBackend() {
  const backendEntry = isDev
    ? path.join(RESOURCES, 'backend', 'src', 'app.js')
    : path.join(RESOURCES, 'backend', 'dist', 'index.js');

  const backendCwd = isDev
    ? path.join(RESOURCES, 'backend')
    : path.join(RESOURCES, 'backend', 'dist');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5055',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_new',
    JWT_SECRET: process.env.JWT_SECRET || 'pos_jwt_secret_electron_2025',
    UPLOADS_DIR: UPLOADS_DIR,
    FRONTEND_BUILD: path.join(RESOURCES, 'frontend', 'dist'),
    ELECTRON_APP: 'true',
  };

  ensureDir(UPLOADS_DIR);

  // Use ELECTRON_RUN_AS_NODE so the Electron binary behaves like standard Node.js
  const nodeBin = isDev ? 'node' : process.execPath;
  if (!isDev) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  logToFile('BACKEND', `Starting: ${nodeBin} ${backendEntry}`);

  backendProcess = spawn(nodeBin, [backendEntry], {
    env,
    cwd: backendCwd,
    windowsHide: true,
    detached: false,
  });

  backendProcess.stdout.on('data', d => logToFile('BACKEND', d.toString().trim()));
  backendProcess.stderr.on('data', d => logToFile('BACKEND_ERR', d.toString().trim()));
  backendProcess.on('error', e => logToFile('BACKEND_ERR', e.message));
  backendProcess.on('exit', (code, sig) => {
    logToFile('BACKEND', `Exited code=${code} signal=${sig}`);
  });

  await waitForPort(5055, 60, 1000);
  logToFile('BACKEND', 'Ready on port 5055');
}


// ─── BrowserWindow ───────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = path.join(
    isDev ? path.join(__dirname, '..', 'resources') : RESOURCES,
    'icon.ico'
  );

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    frame: false,
    fullscreen: true,
    autoHideMenuBar: true,
    menuBarVisible: false,
    resizable: true,
    center: true,
    backgroundColor: '#ffffff',
    title: 'Yugam Software',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Hide the menu bar completely
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  // Always load via the Express server (avoids file:// React Router issues)
  mainWindow.loadURL('http://localhost:5055');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // Re-enter fullscreen when restored from minimize so taskbar never shows
  mainWindow.on('restore', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(true);
    }
  });

  if (isDev) mainWindow.webContents.openDevTools();
}

// ─── Splash / Loading window ──────────────────────────────────────────────────
function createSplash() {
  const splash = new BrowserWindow({
    width: 500, height: 300,
    frame: false, transparent: true,
    alwaysOnTop: true, skipTaskbar: true,
    webPreferences: { nodeIntegration: false },
  });
  const splashFile = path.join(__dirname, 'splash.html');
  if (fs.existsSync(splashFile)) splash.loadFile(splashFile);
  return splash;
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  ensureDir(APP_DATA);

  const splash = createSplash();

  try {
    await startMongoDB();
    await startBackend();

    createWindow();
    splash.close();
  } catch (err) {
    logToFile('FATAL', err.message);
    splash.close();
    dialog.showErrorBox(
      'Startup Failed',
      `The application failed to start:\n\n${err.message}\n\nCheck log: ${path.join(APP_DATA, 'app.log')}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  cleanup();
  app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});

// ─── Cleanup ──────────────────────────────────────────────────────────────────
function cleanup() {
  try { if (backendProcess) { backendProcess.kill('SIGTERM'); backendProcess = null; } } catch (_) { }
  try { if (mongoProcess) { mongoProcess.kill('SIGTERM'); mongoProcess = null; } } catch (_) { }
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

// ─── IPC ─────────────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:userData', () => APP_DATA);
ipcMain.handle('app:openLogs', () => shell.openPath(path.join(APP_DATA, 'app.log')));
ipcMain.handle('app:selectDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (canceled) {
    return null;
  }
  return filePaths[0];
});

// ─── Window Control IPC Handlers ──────────────────────────────────────────────
ipcMain.handle('window:minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
    return true;
  }
  return false;
});

ipcMain.handle('window:toggleMaximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false);
      mainWindow.setSize(1280, 800);
      mainWindow.center();
    } else {
      mainWindow.setFullScreen(true);
    }
    return mainWindow.isFullScreen();
  }
  return false;
});

ipcMain.handle('window:isMaximized', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow.isFullScreen();
  }
  return false;
});

ipcMain.handle('window:requestClose', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['YES', 'NO'],
      defaultId: 1,
      cancelId: 1,
      title: 'Exit Application',
      message: 'Exit Application',
      detail: 'Are you sure you want to close the tool?',
      noLink: true
    });
    if (response === 0) {
      cleanup();
      app.quit();
      return true;
    }
    return false;
  }
  return false;
});
