// Database.js — Local JSON database for managing developer customer records, products, hotels & license history
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'license-db.json');

const DEFAULT_PRODUCTS = [
  { productId: 'RESTOBOARD', productName: 'RestoBoard POS & Management ERP', defaultVersion: '1.0.0' }
];

function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      products: DEFAULT_PRODUCTS,
      customers: [],
      hotels: [],
      devices: [],
      licenses: [],
      revocations: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
  } else {
    // Ensure products array exists
    try {
      const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (!existing.products || existing.products.length === 0) {
        existing.products = DEFAULT_PRODUCTS;
        fs.writeFileSync(DB_FILE, JSON.stringify(existing, null, 2), 'utf8');
      }
    } catch (e) {
      // Ignore
    }
  }
}

function readDb() {
  initDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('[Database] Read error:', err.message);
    return { products: DEFAULT_PRODUCTS, customers: [], hotels: [], devices: [], licenses: [], revocations: [] };
  }
}

function writeDb(data) {
  initDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getProducts() {
  const db = readDb();
  return db.products || DEFAULT_PRODUCTS;
}

function saveProduct(product) {
  const db = readDb();
  if (!db.products) db.products = [...DEFAULT_PRODUCTS];
  const index = db.products.findIndex(p => p.productId === product.productId);
  if (index >= 0) {
    db.products[index] = { ...db.products[index], ...product, updatedAt: new Date().toISOString() };
  } else {
    db.products.push({ ...product, createdAt: new Date().toISOString() });
  }
  writeDb(db);
  return product;
}

function getCustomers() {
  return readDb().customers || [];
}

function saveCustomer(customer) {
  const db = readDb();
  if (!db.customers) db.customers = [];
  const index = db.customers.findIndex(c => c.customerId === customer.customerId);
  if (index >= 0) {
    db.customers[index] = { ...db.customers[index], ...customer, updatedAt: new Date().toISOString() };
  } else {
    db.customers.push({ ...customer, createdAt: new Date().toISOString() });
  }
  writeDb(db);
  return customer;
}

function getHotels() {
  return readDb().hotels || [];
}

function saveHotel(hotel) {
  const db = readDb();
  if (!db.hotels) db.hotels = [];
  const index = db.hotels.findIndex(h => h.hotelId === hotel.hotelId);
  if (index >= 0) {
    db.hotels[index] = { ...db.hotels[index], ...hotel, updatedAt: new Date().toISOString() };
  } else {
    db.hotels.push({ ...hotel, createdAt: new Date().toISOString() });
  }
  writeDb(db);
  return hotel;
}

function getLicenses() {
  return readDb().licenses || [];
}

function saveLicense(license) {
  const db = readDb();
  if (!db.licenses) db.licenses = [];
  const index = db.licenses.findIndex(l => l.licenseId === license.licenseId);
  if (index >= 0) {
    db.licenses[index] = { ...db.licenses[index], ...license, updatedAt: new Date().toISOString() };
  } else {
    db.licenses.push({ ...license, createdAt: new Date().toISOString() });
  }
  writeDb(db);
  return license;
}

function revokeLicense(licenseId, reason = 'Revoked by Developer') {
  const db = readDb();
  if (!db.licenses) db.licenses = [];
  const lic = db.licenses.find(l => l.licenseId === licenseId);
  if (lic) {
    lic.status = 'REVOKED';
    lic.revokedAt = new Date().toISOString();
    lic.revokeReason = reason;
    if (!db.revocations) db.revocations = [];
    if (!db.revocations.includes(licenseId)) {
      db.revocations.push(licenseId);
    }
    writeDb(db);
    return true;
  }
  return false;
}

function disableLicense(licenseId, reason = 'Disabled by Developer') {
  const db = readDb();
  if (!db.licenses) db.licenses = [];
  const lic = db.licenses.find(l => l.licenseId === licenseId);
  if (lic) {
    lic.status = 'DISABLED';
    lic.disabledAt = new Date().toISOString();
    lic.disableReason = reason;
    writeDb(db);
    return true;
  }
  return false;
}

module.exports = {
  readDb,
  writeDb,
  getProducts,
  saveProduct,
  getCustomers,
  saveCustomer,
  getHotels,
  saveHotel,
  getLicenses,
  saveLicense,
  revokeLicense,
  disableLicense
};

