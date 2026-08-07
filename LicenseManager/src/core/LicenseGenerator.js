// LicenseGenerator.js — Core cryptographic license generator for developer LicenseManager
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ensureKeysExist } = require('./KeyGenerator');
const Database = require('./Database');

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

function generateLicense(options = {}) {
  const { privateKey } = ensureKeysExist();

  const {
    productId = 'RESTOBOARD',
    productVersion = '1.0.0',
    customerId: inputCustomerId,
    hotelId: inputHotelId,
    hotelName = 'Enterprise Hotel',
    customerName = 'Valued Customer',
    deviceId,
    machineGuid = '',
    macAddress = '',
    durationDays = 365,
    expiryDate: customExpiryDate,
    enabledModules = ['pos', 'billing', 'inventory', 'reports', 'kitchen', 'multi_device'],
    edition = 'Enterprise Edition'
  } = options;

  if (!deviceId) {
    throw new Error('Device Fingerprint / Device ID is strictly required to issue a license.');
  }

  const cleanDeviceId = deviceId.trim().toUpperCase();
  const cleanGuid = machineGuid.trim();
  const cleanMac = macAddress.trim();

  const customerId = inputCustomerId || `CUST-${crypto.createHash('sha256').update(customerName + cleanDeviceId).digest('hex').slice(0, 8).toUpperCase()}`;
  const hotelId = inputHotelId || `HOTEL-${crypto.createHash('sha256').update(hotelName + cleanDeviceId).digest('hex').slice(0, 8).toUpperCase()}`;

  const now = new Date();
  const activationDate = now.toISOString().slice(0, 10);

  let expiryDate = customExpiryDate;
  if (!expiryDate) {
    const exp = new Date(now);
    exp.setDate(exp.getDate() + parseInt(durationDays, 10));
    expiryDate = exp.toISOString().slice(0, 10);
  }

  const prodPrefix = productId.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const licenseId = `LIC-${prodPrefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const licenseData = {
    licenseId,
    productId: productId.trim().toUpperCase(),
    productVersion: productVersion.trim(),
    customerId,
    hotelId,
    hotelName: hotelName.trim(),
    customerName: customerName.trim(),
    deviceId: cleanDeviceId,
    machineGuid: cleanGuid,
    macAddress: cleanMac,
    edition,
    activationDate,
    issuedDate: activationDate,
    expiryDate,
    enabledModules,
    status: 'ACTIVE',
    issuedAt: now.toISOString(),
    signature: ''
  };

  const payload = createLicensePayload(licenseData);
  const signer = crypto.createSign('SHA256');
  signer.update(payload);
  licenseData.signature = signer.sign(privateKey, 'base64');

  Database.saveLicense(licenseData);
  Database.saveCustomer({
    customerId,
    customerName: licenseData.customerName,
    email: options.email || '',
    phone: options.phone || '',
    lastLicenseId: licenseId
  });
  Database.saveHotel({
    hotelId,
    customerId,
    hotelName: licenseData.hotelName,
    deviceId: cleanDeviceId,
    lastLicenseId: licenseId
  });

  return licenseData;
}

function renewLicense(licenseId, additionalDays = 365) {
  const { privateKey } = ensureKeysExist();
  const licenses = Database.getLicenses();
  const existing = licenses.find(l => l.licenseId === licenseId);

  if (!existing) {
    throw new Error(`License ID '${licenseId}' not found.`);
  }

  const currentExpiry = new Date(existing.expiryDate);
  const now = new Date();
  const baseDate = currentExpiry > now ? currentExpiry : now;
  baseDate.setDate(baseDate.getDate() + parseInt(additionalDays, 10));

  existing.expiryDate = baseDate.toISOString().slice(0, 10);
  existing.status = 'ACTIVE';
  existing.renewedAt = new Date().toISOString();

  const payload = createLicensePayload(existing);
  const signer = crypto.createSign('SHA256');
  signer.update(payload);
  existing.signature = signer.sign(privateKey, 'base64');

  Database.saveLicense(existing);
  return existing;
}

function exportLicenseFile(license, outputPath) {
  const content = JSON.stringify(license, null, 2);
  fs.writeFileSync(outputPath, content, 'utf8');
  return outputPath;
}

function parseDeviceRequest(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return {
      deviceId: data.deviceId || data.id,
      machineGuid: data.machineGuid || '',
      macAddress: data.macAddress || '',
      computerName: data.computerName || '',
      platform: data.platform || '',
      arch: data.arch || ''
    };
  } catch (err) {
    throw new Error(`Failed to parse device request file: ${err.message}`);
  }
}

module.exports = {
  generateLicense,
  renewLicense,
  exportLicenseFile,
  parseDeviceRequest,
  createLicensePayload
};

