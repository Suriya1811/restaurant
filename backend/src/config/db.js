const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

let retryCount = 0;
const MAX_RETRIES = 10;

function getLauncherDbConfig() {
  try {
    const configPath = path.join(os.homedir(), '.yugam-launcher', 'db_config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (err) {
    console.warn('[DB Config] Could not read launcher db_config.json:', err.message);
  }
  return null;
}

function resolveMongoUri() {
  // 1. Direct env variable
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  // 2. Launcher database configuration
  const launcherCfg = getLauncherDbConfig();
  if (launcherCfg) {
    const host = launcherCfg.dbHost || '127.0.0.1';
    const port = launcherCfg.dbPort || 27017;
    const dbName = launcherCfg.dbName || 'restaurant_new';
    const user = launcherCfg.dbUser ? encodeURIComponent(launcherCfg.dbUser) : '';
    const pass = launcherCfg.dbPass ? encodeURIComponent(launcherCfg.dbPass) : '';

    if (user && pass) {
      return `mongodb://${user}:${pass}@${host}:${port}/${dbName}?authSource=admin`;
    }
    return `mongodb://${host}:${port}/${dbName}`;
  }

  // 3. Standard fallback
  return 'mongodb://127.0.0.1:27017/restaurant_new';
}

const connectDB = async () => {
    try {
        const mongoUri = resolveMongoUri();
        console.log(`Connecting to Database Engine (URI: ${mongoUri.replace(/:([^@]+)@/, ':****@')})...`);

        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS:          45000,
            connectTimeoutMS:         15000,
        });

        console.log(`Database Connected: ${conn.connection.host}`);
        retryCount = 0; // reset on success
        
        // Auto-sanitize any null opening_balances in DB
        const { sanitizeAllBalances } = require('../utils/balanceUtils');
        sanitizeAllBalances().catch(err => console.error('Sanitization failed:', err.message));

        return conn;

    } catch (error) {
        retryCount++;
        console.error(`Database Connection Error (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);

        if (retryCount < MAX_RETRIES) {
            const delay = Math.min(retryCount * 2000, 10000); // backoff up to 10s
            console.log(`Retrying in ${delay / 1000}s…`);
            setTimeout(connectDB, delay);
        } else {
            console.error('Max Database retries reached. Giving up.');
            if (process.env.NODE_ENV !== 'production' && process.env.ELECTRON_APP !== 'true') {
                process.exit(1);
            }
        }
    }
};

module.exports = connectDB;

