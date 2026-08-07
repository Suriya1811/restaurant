// index.js — Developer CLI tool for Enterprise License Management
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { ensureKeysExist } = require('../core/KeyGenerator');
const { generateLicense, renewLicense, exportLicenseFile, parseDeviceRequest } = require('../core/LicenseGenerator');
const Database = require('../core/Database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
  console.log('\n============================================================');
  console.log('  YUGAM POS — ENTERPRISE LICENSE GENERATOR (DEVELOPER TOOL)');
  console.log('============================================================\n');

  ensureKeysExist();

  console.log('1. Issue New Enterprise License (Manual Input)');
  console.log('2. Issue License from Device Request File (.json)');
  console.log('3. Renew Existing License');
  console.log('4. Revoke / Disable License');
  console.log('5. List Registered Products, Customers & Issued Licenses');
  console.log('6. Launch Developer Web GUI');
  console.log('7. Exit');

  const choice = await question('\nSelect option (1-7): ');

  switch (choice.trim()) {
    case '1': {
      const productId = await question('Product ID (default RESTOBOARD): ') || 'RESTOBOARD';
      const hotelName = await question('Hotel / Restaurant Name: ') || 'Grand Enterprise POS';
      const customerName = await question('Customer Name: ') || 'Restaurant Manager';
      const deviceId = await question('Device Fingerprint (e.g. DEVICE-A1B2C3D4): ');
      const machineGuid = await question('Machine GUID (optional): ');
      const macAddress = await question('MAC Address (optional): ');
      const durationDays = await question('License Duration in Days (default 365): ') || '365';

      try {
        const lic = generateLicense({
          productId: productId.toUpperCase(),
          hotelName,
          customerName,
          deviceId,
          machineGuid,
          macAddress,
          durationDays: parseInt(durationDays, 10)
        });

        const defaultOut = path.join(process.cwd(), `license-${lic.licenseId}.json`);
        exportLicenseFile(lic, defaultOut);

        console.log('\n[SUCCESS] License issued successfully!');
        console.log('------------------------------------------------------------');
        console.log('License ID   :', lic.licenseId);
        console.log('Product ID   :', lic.productId);
        console.log('Customer ID  :', lic.customerId);
        console.log('Hotel ID     :', lic.hotelId);
        console.log('Hotel Name   :', lic.hotelName);
        console.log('Device ID    :', lic.deviceId);
        console.log('Expiry Date  :', lic.expiryDate);
        console.log('Saved File   :', defaultOut);
        console.log('------------------------------------------------------------\n');
      } catch (err) {
        console.error('\n[ERROR]', err.message);
      }
      break;
    }

    case '2': {
      const reqPath = await question('Path to device-request-XXXX.json file: ');
      if (!fs.existsSync(reqPath.trim())) {
        console.error('\n[ERROR] File does not exist.');
        break;
      }
      try {
        const devReq = parseDeviceRequest(reqPath.trim());
        console.log(`\nDevice Request Loaded: ${devReq.deviceId} (${devReq.computerName})`);
        const productId = await question('Product ID (default RESTOBOARD): ') || 'RESTOBOARD';
        const hotelName = await question(`Hotel Name for (${devReq.deviceId}): `) || 'Enterprise Hotel';
        const customerName = await question('Customer Name: ') || 'Hotel Admin';
        const durationDays = await question('Duration in Days (default 365): ') || '365';

        const lic = generateLicense({
          productId: productId.toUpperCase(),
          hotelName,
          customerName,
          deviceId: devReq.deviceId,
          machineGuid: devReq.machineGuid,
          macAddress: devReq.macAddress,
          durationDays: parseInt(durationDays, 10)
        });

        const defaultOut = path.join(process.cwd(), `license-${lic.deviceId}.json`);
        exportLicenseFile(lic, defaultOut);

        console.log('\n[SUCCESS] License issued from Device Request!');
        console.log('Saved File:', defaultOut);
      } catch (err) {
        console.error('\n[ERROR]', err.message);
      }
      break;
    }

    case '3': {
      const licId = await question('Enter License ID to renew: ');
      const days = await question('Additional days (default 365): ') || '365';
      try {
        const renewed = renewLicense(licId.trim(), parseInt(days, 10));
        console.log(`\n[SUCCESS] License ${renewed.licenseId} extended to ${renewed.expiryDate}`);
      } catch (err) {
        console.error('\n[ERROR]', err.message);
      }
      break;
    }

    case '4': {
      const licId = await question('Enter License ID to revoke/disable: ');
      const action = await question('Action (1 = Revoke, 2 = Disable): ');
      if (action.trim() === '2') {
        const ok = Database.disableLicense(licId.trim());
        console.log(ok ? `\n[SUCCESS] License ${licId} disabled.` : '\n[ERROR] License ID not found.');
      } else {
        const ok = Database.revokeLicense(licId.trim());
        console.log(ok ? `\n[SUCCESS] License ${licId} revoked.` : '\n[ERROR] License ID not found.');
      }
      break;
    }

    case '5': {
      const lics = Database.getLicenses();
      const custs = Database.getCustomers();
      const prods = Database.getProducts();

      console.log('\n--- REGISTERED PRODUCTS ---');
      prods.forEach(p => console.log(`• [${p.productId}] ${p.productName} (v${p.defaultVersion})`));

      console.log('\n--- REGISTERED CUSTOMERS ---');
      custs.forEach(c => console.log(`• [${c.customerId}] ${c.customerName}`));

      console.log('\n--- ISSUED LICENSES HISTORY ---');
      if (lics.length === 0) {
        console.log('No licenses found in local database.');
      } else {
        lics.forEach(l => {
          console.log(`[${l.status}] ID: ${l.licenseId} | Prod: ${l.productId} | Hotel: ${l.hotelName} | Device: ${l.deviceId} | Expires: ${l.expiryDate}`);
        });
      }
      console.log('-------------------------------\n');
      break;
    }

    case '6': {
      console.log('\nStarting Developer Web GUI on http://localhost:8090 ...');
      require('../gui/server');
      return;
    }

    case '7':
    default:
      console.log('Exiting LicenseManager.');
      rl.close();
      return;
  }

  rl.close();
}

if (require.main === module) {
  main();
}

