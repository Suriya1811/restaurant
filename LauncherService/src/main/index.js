// index.js — Main Electron process: XAMPP / DB Manager Pro style backend service controller
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const treeKill = require('tree-kill');
const http = require('http');

const DatabaseManager = require('./services/DatabaseManager');
const LicenseManager = require('./services/LicenseManager');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5055;
const HOST = '0.0.0.0';

function resolveBackendPath() {
  const candidates = [
    path.resolve(__dirname, '../../../backend'),           // dev: LauncherService/src/main → resfin/backend
    path.resolve(process.resourcesPath || '', '../../backend')  // packaged
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, 'package.json'))) return p;
  }
  return '';
}

function resolveFrontendDist() {
  const candidates = [
    path.resolve(__dirname, '../../../frontend/dist'),
    path.resolve(process.resourcesPath || '', '../../frontend/dist')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

function getIPv4() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS MANAGER
// ═══════════════════════════════════════════════════════════════════════════

let backendProc = null;
let state = 'stopped'; // stopped | starting | running | stopping

function sendToRenderer(channel, data) {
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send(channel, data);
  }
}

function log(msg, level = 'info') {
  const ts = new Date().toTimeString().slice(0, 8);
  const formatted = `[${ts}] ${msg}`;
  sendToRenderer('log', { message: formatted, level });
}

function pushStatus() {
  const ipv4 = getIPv4();
  const lic = LicenseManager.validateLicense();
  sendToRenderer('status', {
    state,
    pid: backendProc ? backendProc.pid : null,
    port: PORT,
    hostname: os.hostname(),
    ipv4: ipv4 || 'N/A',
    licenseValid: lic.valid,
    licenseReason: lic.reason,
    daysRemaining: lic.daysRemaining || 0,
    urls: {
      localhost: `http://localhost:${PORT}`,
      loopback: `http://127.0.0.1:${PORT}`,
      network: ipv4 ? `http://${ipv4}:${PORT}` : null
    }
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    if (state === 'running' || state === 'starting') {
      return resolve({ ok: true, msg: 'Already running' });
    }

    // 1. License Check BEFORE starting backend
    const lic = LicenseManager.validateLicense();
    if (!lic.valid) {
      const errMsg = `LICENSE ERROR: ${lic.reason}. Startup aborted.`;
      log(errMsg, 'error');
      state = 'stopped';
      pushStatus();
      return reject(new Error(errMsg));
    }
    log(`License verified: ${lic.license.hotelName} (${lic.daysRemaining} days remaining)`, 'success');

    // 2. Resolve Backend Path
    const backendPath = resolveBackendPath();
    if (!backendPath) {
      const err = 'Backend folder not found. Place LauncherService beside the backend folder.';
      log(`ERROR: ${err}`, 'error');
      return reject(new Error(err));
    }

    state = 'starting';
    pushStatus();
    log('Starting backend service...');

    const frontendDist = resolveFrontendDist();
    const env = {
      ...process.env,
      PORT: String(PORT),
      HOST: HOST,
      NODE_ENV: 'production'
    };
    if (frontendDist) env.FRONTEND_BUILD = frontendDist;

    backendProc = spawn('node', ['src/app.js'], {
      cwd: backendPath,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    backendProc.stdout.on('data', (chunk) => {
      chunk.toString().split('\n').filter(l => l.trim()).forEach(line => {
        log(line.trim(), 'info');
      });
    });

    backendProc.stderr.on('data', (chunk) => {
      chunk.toString().split('\n').filter(l => l.trim()).forEach(line => {
        log(line.trim(), 'warn');
      });
    });

    backendProc.on('error', (err) => {
      state = 'stopped';
      backendProc = null;
      pushStatus();
      log(`Process error: ${err.message}`, 'error');
      reject(err);
    });

    backendProc.on('exit', (code, signal) => {
      const was = state;
      state = 'stopped';
      backendProc = null;
      pushStatus();
      if (was !== 'stopping') {
        log(`Backend exited unexpectedly (code=${code}, signal=${signal})`, 'error');
      } else {
        log('Backend stopped.');
      }
    });

    // Wait briefly for crash detection, then mark running
    setTimeout(() => {
      if (backendProc && !backendProc.killed) {
        state = 'running';
        pushStatus();
        log(`Backend running (PID: ${backendProc.pid}) on ${HOST}:${PORT}`, 'success');
        const ipv4 = getIPv4();
        log(`Access URLs:`, 'success');
        log(`  → http://localhost:${PORT}`, 'success');
        log(`  → http://127.0.0.1:${PORT}`, 'success');
        if (ipv4) log(`  → http://${ipv4}:${PORT}  (LAN)`, 'success');
        log('Open any browser and navigate to a URL above.', 'info');
        resolve({ ok: true, pid: backendProc.pid });
      }
    }, 1500);
  });
}

function stopBackend() {
  return new Promise((resolve) => {
    if (!backendProc || state === 'stopped') {
      state = 'stopped';
      pushStatus();
      return resolve({ ok: true });
    }

    const pid = backendProc.pid;
    state = 'stopping';
    pushStatus();
    log(`Stopping backend (PID: ${pid})...`);

    treeKill(pid, 'SIGTERM', (err) => {
      if (err) {
        log('Graceful stop failed, force-killing...', 'warn');
        treeKill(pid, 'SIGKILL', () => {});
      }
      backendProc = null;
      state = 'stopped';
      pushStatus();
      log('Backend stopped.', 'success');
      resolve({ ok: true });
    });

    // Safety timeout
    setTimeout(() => {
      if (state === 'stopping') {
        try { treeKill(pid, 'SIGKILL', () => {}); } catch {}
        backendProc = null;
        state = 'stopped';
        pushStatus();
        resolve({ ok: true });
      }
    }, 8000);
  });
}

async function restartBackend() {
  log('Restarting backend...');
  await stopBackend();
  await new Promise(r => setTimeout(r, 1000));
  return await startBackend();
}

// Health check
function checkHealth() {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`http://127.0.0.1:${PORT}/api/health`, { timeout: 3000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({ ok: res.statusCode === 200, ms: Date.now() - start });
      });
    });
    req.on('error', () => resolve({ ok: false, ms: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, ms: 0 }); });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ELECTRON WINDOW
// ═══════════════════════════════════════════════════════════════════════════

let mainWin = null;

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '../../build/icon.ico');

  mainWin = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0b1120',
    center: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWin.loadFile(path.join(__dirname, '../renderer/index.html'));
  mainWin.on('closed', () => { mainWin = null; stopBackend(); });
}

// ═══════════════════════════════════════════════════════════════════════════
// APP LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

app.whenReady().then(() => {
  createWindow();

  // Push status every 2s
  setInterval(async () => {
    if (!mainWin || mainWin.isDestroyed()) return;
    const health = await checkHealth();
    const db = await DatabaseManager.checkConnection();
    const lic = LicenseManager.validateLicense();

    sendToRenderer('tick', {
      state,
      pid: backendProc ? backendProc.pid : null,
      port: PORT,
      hostname: os.hostname(),
      ipv4: getIPv4() || 'N/A',
      healthOk: health.ok,
      healthMs: health.ms,
      dbOk: db.running,
      dbMessage: db.message,
      dbMs: db.latencyMs || 0,
      licenseValid: lic.valid,
      licenseReason: lic.reason,
      daysRemaining: lic.daysRemaining || 0
    });
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

// ═══════════════════════════════════════════════════════════════════════════
// IPC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

ipcMain.handle('start', () => startBackend());
ipcMain.handle('stop', () => stopBackend());
ipcMain.handle('restart', () => restartBackend());

ipcMain.handle('get-info', () => {
  const lic = LicenseManager.validateLicense();
  return {
    state,
    pid: backendProc ? backendProc.pid : null,
    port: PORT,
    hostname: os.hostname(),
    ipv4: getIPv4() || 'N/A',
    licenseValid: lic.valid,
    licenseReason: lic.reason
  };
});

// Database IPC
ipcMain.handle('db:get-config', () => DatabaseManager.getSafeConfig());
ipcMain.handle('db:save-config', (_e, cfg) => {
  DatabaseManager.saveConfig(cfg);
  log('Database configuration updated and saved securely.', 'success');
  return true;
});
ipcMain.handle('db:test-connection', (_e, cfg) => DatabaseManager.checkConnection(cfg));

// License IPC
ipcMain.handle('license:get-info', () => {
  const val = LicenseManager.validateLicense();
  const fp = LicenseManager.getDeviceFingerprint();
  return { ...val, fingerprint: fp };
});

ipcMain.handle('license:import', (_e, filePath) => {
  const result = LicenseManager.importLicense(filePath);
  if (result.valid) {
    log(`License imported successfully for ${result.license.hotelName}`, 'success');
  } else {
    log(`License import failed: ${result.reason}`, 'error');
  }
  return result;
});

ipcMain.handle('license:export-request', () => {
  const outPath = LicenseManager.exportDeviceRequest();
  log(`Exported device request file: ${outPath}`, 'info');
  return outPath;
});

ipcMain.handle('license:select-file', async () => {
  const result = await dialog.showOpenDialog(mainWin, {
    title: 'Select Enterprise License File',
    filters: [
      { name: 'License File (*.json, *.lic)', extensions: ['json', 'lic'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Setup Wizard IPC Handlers
ipcMain.handle('setup:get-state', () => {
  const config = LicenseManager.loadInstallConfig();
  const dbConfig = DatabaseManager.getSafeConfig();
  const fp = LicenseManager.getDeviceFingerprint();
  const licenseVal = LicenseManager.validateLicense();

  return {
    isInfrastructureSetupComplete: config.isInfrastructureSetupComplete || false,
    currentStep: config.currentStep || 1,
    dbConfig,
    fingerprint: fp,
    licenseVal,
    ipv4: getIPv4() || '127.0.0.1'
  };
});

ipcMain.handle('setup:save-db-config', async (_e, cfg) => {
  const probe = await DatabaseManager.checkConnection(cfg);
  if (probe.running) {
    DatabaseManager.saveConfig(cfg);
    log(`Database provider configured & verified (${cfg.dbType.toUpperCase()})`, 'success');
    return { ok: true, message: probe.message };
  }
  return { ok: false, message: probe.message };
});

ipcMain.handle('setup:complete', () => {
  const cfg = LicenseManager.loadInstallConfig();
  cfg.isInfrastructureSetupComplete = true;
  cfg.setupCompletedAt = new Date().toISOString();
  LicenseManager.saveInstallConfig(cfg);
  log('Infrastructure setup completed successfully!', 'success');
  return { ok: true };
});

ipcMain.handle('setup:reset', () => {
  const resetCfg = LicenseManager.resetSetup();
  log('Installation state reset to infrastructure setup wizard mode.', 'warn');
  return resetCfg;
});

// Window IPC
ipcMain.handle('win:minimize', () => mainWin?.minimize());
ipcMain.handle('win:maximize', () => {
  if (mainWin) mainWin.isMaximized() ? mainWin.unmaximize() : mainWin.maximize();
});
ipcMain.handle('win:close', () => mainWin?.close());

