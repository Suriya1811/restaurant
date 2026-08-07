// KeyGenerator.js — Generates RSA 2048-bit keypair for enterprise license signing
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_DIR = path.resolve(__dirname, '../../keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.key');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.key');

function ensureKeysExist() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
    return {
      privateKey: fs.readFileSync(PRIVATE_KEY_PATH, 'utf8'),
      publicKey: fs.readFileSync(PUBLIC_KEY_PATH, 'utf8')
    };
  }

  console.log('[KeyGenerator] Generating new RSA 2048-bit keypair...');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, 'utf8');
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, 'utf8');
  console.log('[KeyGenerator] Keys generated successfully in:', KEYS_DIR);

  // Sync public key to LauncherService
  const LAUNCHER_PUB_KEY = path.resolve(__dirname, '../../../LauncherService/src/main/services/public.key');
  try {
    fs.writeFileSync(LAUNCHER_PUB_KEY, publicKey, 'utf8');
    console.log('[KeyGenerator] Synced Public Key to LauncherService:', LAUNCHER_PUB_KEY);
  } catch (e) {
    console.warn('[KeyGenerator] Could not sync public key to LauncherService:', e.message);
  }

  return { privateKey, publicKey };
}

if (require.main === module) {
  ensureKeysExist();
}

module.exports = {
  ensureKeysExist,
  KEYS_DIR,
  PRIVATE_KEY_PATH,
  PUBLIC_KEY_PATH
};
