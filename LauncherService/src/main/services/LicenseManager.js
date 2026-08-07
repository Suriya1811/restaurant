// LicenseManager.js — Customer Infrastructure & License Validation Manager
// STRICT SECURITY REQUIREMENT: THIS FILE ONLY VALIDATES LICENSES & MANAGES INFRASTRUCTURE CONFIG. IT NEVER GENERATES LICENSES.
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const CONFIG_DIR = path.join(os.homedir(), '.yugam-launcher');
const LICENSE_FILE = path.join(CONFIG_DIR, 'license.json');
const LAUNCHER_CONFIG_FILE = path.join(CONFIG_DIR, 'launcher_config.json');
const PUBLIC_KEY_PATH = path.join(__dirname, 'public.key');

const APP_PRODUCT_ID = 'RESTOBOARD';
const APP_PRODUCT_VERSION = '1.0.0';

function getMacAddress() {
  try {
    const interfaces = os.networkInterfaces();
    const macs = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.mac && iface.mac !== '00:00:00:00:00:00' && !iface.internal) {
          macs.push(iface.mac.toLowerCase());
        }
      }
    }
    if (macs.length > 0) {
      macs.sort();
      return macs[0];
    }
  } catch (err) {
    console.error('[LicenseManager] MAC address read error:', err.message);
  }
  return '00:00:00:00:00:00';
}

function getMachineGuid() {
  try {
    const raw = execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
      { encoding: 'utf8', timeout: 5000 }
    );
    const match = raw.match(/MachineGuid\s+REG_SZ\s+(.+)/);
    return match ? match[1].trim() : 'UNKNOWN-GUID';
  } catch {
    return 'UNKNOWN-GUID';
  }
}

function generateDeviceId() {
  const guid = getMachineGuid();
  const mac = getMacAddress();
  const computerName = os.hostname();
  const platform = os.platform();
  const cpuModel = os.cpus()[0]?.model || 'UNKNOWN';

  const payload = `${guid}:${mac}:${computerName}:${platform}:${cpuModel}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  return 'DEVICE-' + hash.substring(0, 8).toUpperCase();
}

function generateInstallationId() {
  return 'INST-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

function getDeviceFingerprint() {
  const launcherConfig = loadInstallConfig();

  // Persist deviceId so it remains 100% stable across all restarts on the same machine
  let deviceId = launcherConfig.deviceId;
  if (!deviceId) {
    deviceId = generateDeviceId();
    launcherConfig.deviceId = deviceId;
    saveInstallConfig(launcherConfig);
  }

  let installationId = launcherConfig.installationId;
  if (!installationId) {
    installationId = generateInstallationId();
    launcherConfig.installationId = installationId;
    saveInstallConfig(launcherConfig);
  }

  return {
    deviceId,
    installationId,
    machineGuid: getMachineGuid(),
    macAddress: getMacAddress(),
    computerName: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpuModel: os.cpus()[0]?.model || 'UNKNOWN'
  };
}

function createLicensePayload(license) {
  const sortedModules = Array.isArray(license.enabledModules)
    ? [...license.enabledModules].sort().join(',')
    : '';

  return [
    license.licenseId || '',
    license.productId || 'RESTOBOARD',
    license.productVersion || '1.0.0',
    license.customerId || '',
    license.hotelId || '',
    license.hotelName || '',
    license.customerName || '',
    license.deviceId || '',
    license.machineGuid || '',
    license.macAddress || '',
    license.activationDate || '',
    license.expiryDate || '',
    license.edition || 'Enterprise Edition',
    sortedModules
  ].join('|');
}

function getPublicKey() {
  if (fs.existsSync(PUBLIC_KEY_PATH)) {
    return fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  }
  console.warn('[LicenseManager] Public key missing at:', PUBLIC_KEY_PATH);
  return null;
}

function verifyRsaSignature(license) {
  const publicKey = getPublicKey();
  if (!publicKey || !license || !license.signature) return false;

  try {
    const payload = createLicensePayload(license);
    const verifier = crypto.createVerify('SHA256');
    verifier.update(payload);
    return verifier.verify(publicKey, license.signature, 'base64');
  } catch (err) {
    console.error('[LicenseManager] RSA Verification error:', err.message);
    return false;
  }
}

function loadLicense() {
  if (!fs.existsSync(LICENSE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function loadInstallConfig() {
  if (!fs.existsSync(LAUNCHER_CONFIG_FILE)) {
    return {
      isInfrastructureSetupComplete: false,
      currentStep: 1,
      installationId: generateInstallationId()
    };
  }
  try {
    const cfg = JSON.parse(fs.readFileSync(LAUNCHER_CONFIG_FILE, 'utf8'));
    if (!cfg.installationId) cfg.installationId = generateInstallationId();
    return cfg;
  } catch {
    return {
      isInfrastructureSetupComplete: false,
      currentStep: 1,
      installationId: generateInstallationId()
    };
  }
}

function saveInstallConfig(cfg) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(LAUNCHER_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
}

function validateLicense() {
  const fingerprint = getDeviceFingerprint();
  const license = loadLicense();
  const installConfig = loadInstallConfig();

  if (!license) {
    return {
      valid: false,
      reason: 'No license file found. Please import a valid license file (.json).',
      license: null,
      fingerprint,
      daysRemaining: 0
    };
  }

  // 1. Digital Signature Check (RSA 2048)
  const isValidSignature = verifyRsaSignature(license);
  if (!isValidSignature) {
    return {
      valid: false,
      reason: 'Invalid Digital Signature. License file has been tampered with or corrupted.',
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  // 2. Product Isolation Check
  const licenseProd = (license.productId || 'RESTOBOARD').toUpperCase();
  if (licenseProd !== APP_PRODUCT_ID) {
    return {
      valid: false,
      reason: `Product Isolation Violation: License issued for product (${licenseProd}), but installed application is (${APP_PRODUCT_ID}). Access Denied.`,
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  // 3. Customer Isolation Check if present in installation config
  if (installConfig.customerId && license.customerId && installConfig.customerId !== license.customerId) {
    return {
      valid: false,
      reason: `Customer Isolation Violation: Installation bound to Customer (${installConfig.customerId}), but license belongs to Customer (${license.customerId}). Access Denied.`,
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  // 4. Hardware Binding Check (Device Fingerprint match)
  if (license.deviceId !== fingerprint.deviceId) {
    return {
      valid: false,
      reason: `Device Mismatch: License issued for Fingerprint (${license.deviceId}), current machine is (${fingerprint.deviceId}).`,
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  // Machine GUID check if present in license
  if (license.machineGuid && fingerprint.machineGuid !== 'UNKNOWN-GUID' && license.machineGuid !== fingerprint.machineGuid) {
    return {
      valid: false,
      reason: `Machine GUID Mismatch: License issued for (${license.machineGuid}), current machine is (${fingerprint.machineGuid}).`,
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  // MAC Address check if present in license
  if (license.macAddress && fingerprint.macAddress !== '00:00:00:00:00:00' && license.macAddress !== fingerprint.macAddress) {
    return {
      valid: false,
      reason: `MAC Address Mismatch: License issued for (${license.macAddress}), current network card is (${fingerprint.macAddress}).`,
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  // 5. Status check
  if (license.status === 'REVOKED') {
    return {
      valid: false,
      reason: 'This license has been REVOKED by the developer.',
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  if (license.status === 'DISABLED') {
    return {
      valid: false,
      reason: 'This license has been DISABLED by the developer.',
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  // 6. Expiration Date Check
  const now = new Date();
  const expiry = new Date(license.expiryDate + 'T23:59:59');
  if (now > expiry) {
    return {
      valid: false,
      reason: `License EXPIRED on ${license.expiryDate}. Please contact developer to renew.`,
      license,
      fingerprint,
      daysRemaining: 0
    };
  }

  const msRemaining = expiry.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    valid: true,
    reason: 'Verified Enterprise RSA Digital Signature & Device Binding',
    license,
    fingerprint,
    daysRemaining
  };
}

function importLicense(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const license = JSON.parse(raw);

    const required = ['licenseId', 'deviceId', 'hotelName', 'activationDate', 'expiryDate', 'signature'];
    for (const f of required) {
      if (!license[f]) return { valid: false, reason: `Invalid file format. Missing required field: ${f}` };
    }

    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    fs.writeFileSync(LICENSE_FILE, JSON.stringify(license, null, 2), 'utf8');

    // Bind installation config on valid import if not bound yet
    const valResult = validateLicense();
    if (valResult.valid) {
      const currentCfg = loadInstallConfig();
      if (license.customerId && !currentCfg.customerId) currentCfg.customerId = license.customerId;
      if (license.hotelId && !currentCfg.hotelId) currentCfg.hotelId = license.hotelId;
      currentCfg.boundAt = new Date().toISOString();
      saveInstallConfig(currentCfg);
    }

    return valResult;
  } catch (err) {
    return { valid: false, reason: `Import error: ${err.message}` };
  }
}

function exportDeviceRequest() {
  const fp = getDeviceFingerprint();
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const outPath = path.join(CONFIG_DIR, `device-request-${fp.deviceId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(fp, null, 2), 'utf8');
  return outPath;
}

function resetSetup() {
  const currentCfg = loadInstallConfig();
  currentCfg.isInfrastructureSetupComplete = false;
  currentCfg.currentStep = 1;
  saveInstallConfig(currentCfg);

  // Delete existing license file so manual upload is strictly required
  if (fs.existsSync(LICENSE_FILE)) {
    try {
      fs.unlinkSync(LICENSE_FILE);
    } catch (err) {
      console.warn('[LicenseManager] Could not delete license file on reset:', err.message);
    }
  }
  return currentCfg;
}

module.exports = {
  getDeviceFingerprint,
  generateDeviceId,
  validateLicense,
  importLicense,
  exportDeviceRequest,
  loadLicense,
  loadInstallConfig,
  saveInstallConfig,
  resetSetup,
  APP_PRODUCT_ID,
  APP_PRODUCT_VERSION
};




