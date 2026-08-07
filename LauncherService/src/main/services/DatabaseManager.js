// DatabaseManager.js — Secure multi-database configuration and connection monitoring
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const { execSync } = require('child_process');

const CONFIG_DIR = path.join(os.homedir(), '.yugam-launcher');
const DB_CONFIG_FILE = path.join(CONFIG_DIR, 'db_config.json');

const DB_DEFAULTS = {
  mongodb:  { port: 27017, service: 'MongoDB',  defaultDb: 'restaurant_new' },
  mysql:    { port: 3306,  service: 'MySQL',    defaultDb: 'restaurant_db' },
  postgres: { port: 5432,  service: 'postgresql', defaultDb: 'restaurant_db' },
  mssql:    { port: 1433,  service: 'MSSQLSERVER', defaultDb: 'restaurant_db' }
};

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureDir();
  if (fs.existsSync(DB_CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(DB_CONFIG_FILE, 'utf8');
      return JSON.parse(raw);
    } catch {
      // Fallback
    }
  }
  const defaultConfig = {
    dbType: 'mongodb',
    dbHost: '127.0.0.1',
    dbPort: 27017,
    dbName: 'restaurant_new',
    dbUser: '',
    dbPass: ''
  };
  saveConfig(defaultConfig);
  return defaultConfig;
}

function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function tcpProbe(host, port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve({ reachable: true, latencyMs: latency });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ reachable: false, latencyMs: 0 });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ reachable: false, latencyMs: 0 });
    });

    socket.connect(port, host);
  });
}

function queryWindowsService(serviceName) {
  if (!serviceName) return { exists: false, running: false };
  try {
    const output = execSync(`sc query "${serviceName}"`, { encoding: 'utf8', timeout: 5000 });
    const running = output.includes('RUNNING');
    return { exists: true, running };
  } catch {
    return { exists: false, running: false };
  }
}

async function checkConnection(customConfig) {
  const cfg = customConfig || loadConfig();
  const dbType = cfg.dbType || 'mongodb';
  const host = cfg.dbHost || '127.0.0.1';
  const port = parseInt(cfg.dbPort, 10) || DB_DEFAULTS[dbType]?.port || 27017;

  // 1. TCP socket probe
  const probe = await tcpProbe(host, port);
  if (probe.reachable) {
    return {
      running: true,
      message: `${dbType.toUpperCase()} reachable at ${host}:${port} (${probe.latencyMs}ms)`,
      latencyMs: probe.latencyMs,
      dbType,
      host,
      port
    };
  }

  // 2. Windows Service query
  const svcInfo = DB_DEFAULTS[dbType];
  if (svcInfo && svcInfo.service) {
    const svc = queryWindowsService(svcInfo.service);
    if (svc.running) {
      return {
        running: true,
        message: `${dbType.toUpperCase()} Windows service running (${svcInfo.service})`,
        latencyMs: 0,
        dbType,
        host,
        port
      };
    }
  }

  return {
    running: false,
    message: `${dbType.toUpperCase()} unreachable at ${host}:${port}`,
    latencyMs: 0,
    dbType,
    host,
    port
  };
}

// Sanitized config for rendering without leaking passwords
function getSafeConfig() {
  const cfg = loadConfig();
  return {
    dbType: cfg.dbType,
    dbHost: cfg.dbHost,
    dbPort: cfg.dbPort,
    dbName: cfg.dbName,
    dbUser: cfg.dbUser,
    hasPassword: Boolean(cfg.dbPass)
  };
}

module.exports = {
  loadConfig,
  saveConfig,
  checkConnection,
  getSafeConfig,
  DB_DEFAULTS
};
