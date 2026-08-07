// server.js — Developer Web GUI for Enterprise License Management
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { ensureKeysExist } = require('../core/KeyGenerator');
const { generateLicense, renewLicense, exportLicenseFile, parseDeviceRequest } = require('../core/LicenseGenerator');
const Database = require('../core/Database');

const PORT = process.env.LICENSE_GUI_PORT || 8090;

ensureKeysExist();

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Yugam Enterprise License Manager</title>
  <style>
    :root {
      --bg: #0F172A;
      --card: #1E293B;
      --accent: #f97316;
      --accent-hover: #ea580c;
      --text: #F8FAFC;
      --muted: #94A3B8;
      --border: rgba(255,255,255,0.1);
      --success: #22c55e;
      --danger: #ef4444;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 2rem; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    header h1 { font-size: 1.5rem; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 0.5rem; }
    .badge { background: var(--accent); color: #fff; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 9999px; text-transform: uppercase; font-weight: 800; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .card { background: var(--card); border-radius: 12px; padding: 1.5rem; border: 1px solid var(--border); box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .card h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent); }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.8rem; font-weight: 700; color: var(--muted); margin-bottom: 0.3rem; text-transform: uppercase; }
    input, select { width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: #0F172A; color: #fff; font-size: 0.9rem; outline: none; }
    input:focus, select:focus { border-color: var(--accent); }
    button { background: var(--accent); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; width: 100%; }
    button:hover { background: var(--accent-hover); }
    .license-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 480px; overflow-y: auto; }
    .lic-item { background: #0F172A; padding: 1rem; border-radius: 8px; border: 1px solid var(--border); font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; }
    .lic-info h3 { font-size: 0.95rem; font-weight: 800; color: #fff; }
    .lic-info p { color: var(--muted); font-size: 0.8rem; margin-top: 0.2rem; }
    .lic-actions { display: flex; flex-direction: column; gap: 0.4rem; }
    .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.75rem; border-radius: 6px; width: auto; }
    .btn-danger { background: var(--danger); }
    .btn-danger:hover { background: #dc2626; }
    .btn-amber { background: var(--amber); }
    .btn-amber:hover { background: #d97706; }
    .status-active { color: var(--success); font-weight: 800; }
    .status-revoked { color: var(--danger); font-weight: 800; }
    .status-disabled { color: var(--amber); font-weight: 800; }
    .alert { padding: 1rem; border-radius: 8px; background: rgba(34, 197, 94, 0.15); border: 1px solid var(--success); color: var(--success); margin-bottom: 1rem; display: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🛡️ Yugam POS <span class="badge">Developer Tool</span></h1>
      <p style="color: var(--muted); font-size: 0.85rem; font-weight: 600;">Offline Enterprise License Generator &amp; Signing Authority</p>
    </header>

    <div id="alert-box" class="alert"></div>

    <div class="grid">
      <!-- Issue License Card -->
      <div class="card">
        <h2>🔑 Issue New Enterprise License</h2>
        <form id="issue-form">
          <div class="form-group">
            <label>Product *</label>
            <select id="productId" required>
              <option value="RESTOBOARD" selected>RESTOBOARD — RestoBoard POS & Management ERP</option>
            </select>
          </div>
          <div class="form-group">
            <label>Hotel / Restaurant Name *</label>
            <input type="text" id="hotelName" required placeholder="e.g. Grand Palace Resort">
          </div>
          <div class="form-group">
            <label>Customer Name *</label>
            <input type="text" id="customerName" required placeholder="e.g. John Doe">
          </div>
          <div class="form-group">
            <label>Device Fingerprint / Device ID *</label>
            <input type="text" id="deviceId" required placeholder="e.g. DEVICE-A1B2C3D4">
          </div>
          <div class="form-group">
            <label>Machine GUID (Optional)</label>
            <input type="text" id="machineGuid" placeholder="From customer device request">
          </div>
          <div class="form-group">
            <label>MAC Address (Optional)</label>
            <input type="text" id="macAddress" placeholder="e.g. 00:1A:2B:3C:4D:5E">
          </div>
          <div class="form-group">
            <label>Duration</label>
            <select id="durationDays">
              <option value="30">30 Days (Trial)</option>
              <option value="90">90 Days (Quarterly)</option>
              <option value="365" selected>365 Days (1 Year Enterprise)</option>
              <option value="730">730 Days (2 Years)</option>
              <option value="3650">3650 Days (10 Years / Perpetual)</option>
            </select>
          </div>
          <button type="submit">Generate & Sign License File</button>
        </form>
      </div>

      <!-- History Card -->
      <div class="card">
        <h2>📜 Issued License History</h2>
        <div id="license-list" class="license-list">
          <p style="color: var(--muted); font-size: 0.85rem;">Loading history...</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function loadLicenses() {
      const res = await fetch('/api/licenses');
      const data = await res.json();
      const listEl = document.getElementById('license-list');
      if (!data || data.length === 0) {
        listEl.innerHTML = '<p style="color: var(--muted); font-size: 0.85rem;">No licenses generated yet.</p>';
        return;
      }
      listEl.innerHTML = data.map(l => \`
        <div class="lic-item">
          <div class="lic-info">
            <h3>\${l.hotelName} <span class="badge" style="background:#3b82f6;">\${l.productId || 'RESTOBOARD'}</span></h3>
            <p>ID: \${l.licenseId} | Customer: \${l.customerName}</p>
            <p>CUST ID: \${l.customerId} | HOTEL ID: \${l.hotelId}</p>
            <p>Device: \${l.deviceId} | Expires: \${l.expiryDate}</p>
            <p class="status-\${(l.status || 'ACTIVE').toLowerCase()}">Status: \${l.status}</p>
          </div>
          <div class="lic-actions">
            <button class="btn-sm" onclick="downloadLic('\${l.licenseId}')">Download</button>
            <button class="btn-sm btn-amber" onclick="renewLic('\${l.licenseId}')">Renew (+1 Yr)</button>
            \${l.status === 'ACTIVE' ? \`<button class="btn-sm btn-danger" onclick="revokeLic('\${l.licenseId}')">Revoke</button>\` : ''}
          </div>
        </div>
      \`).join('');
    }

    document.getElementById('issue-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        productId: document.getElementById('productId').value,
        hotelName: document.getElementById('hotelName').value,
        customerName: document.getElementById('customerName').value,
        deviceId: document.getElementById('deviceId').value,
        machineGuid: document.getElementById('machineGuid').value,
        macAddress: document.getElementById('macAddress').value,
        durationDays: document.getElementById('durationDays').value
      };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (result.ok) {
        showAlert('✓ Signed License generated successfully for ' + result.license.hotelName);
        document.getElementById('issue-form').reset();
        loadLicenses();
      } else {
        alert('Error: ' + result.error);
      }
    });

    async function downloadLic(id) {
      window.location.href = '/api/download?id=' + id;
    }

    async function renewLic(id) {
      const days = prompt('Enter additional days to extend (default 365):', '365');
      if (!days) return;
      const res = await fetch('/api/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: id, durationDays: days })
      });
      const result = await res.json();
      if (result.ok) {
        showAlert('✓ License extended to ' + result.license.expiryDate);
        loadLicenses();
      } else {
        alert('Renewal error: ' + result.error);
      }
    }

    async function revokeLic(id) {
      if (!confirm('Are you sure you want to revoke license ' + id + '?')) return;
      await fetch('/api/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseId: id })
      });
      loadLicenses();
    }

    function showAlert(msg) {
      const box = document.getElementById('alert-box');
      box.textContent = msg;
      box.style.display = 'block';
      setTimeout(() => { box.style.display = 'none'; }, 4000);
    }

    loadLicenses();
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(HTML_PAGE);
  }

  if (parsedUrl.pathname === '/api/licenses' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(Database.getLicenses()));
  }

  if (parsedUrl.pathname === '/api/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const lic = generateLicense(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, license: lic }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (parsedUrl.pathname === '/api/renew' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { licenseId, durationDays } = JSON.parse(body);
        const lic = renewLicense(licenseId, parseInt(durationDays || 365, 10));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true, license: lic }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  if (parsedUrl.pathname === '/api/download' && req.method === 'GET') {
    const id = parsedUrl.query.id;
    const lics = Database.getLicenses();
    const lic = lics.find(l => l.licenseId === id);
    if (!lic) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('License not found');
    }
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="license-${lic.deviceId}.json"`
    });
    return res.end(JSON.stringify(lic, null, 2));
  }

  if (parsedUrl.pathname === '/api/revoke' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { licenseId } = JSON.parse(body);
        Database.revokeLicense(licenseId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n============================================================`);
    console.log(`  INFO: License Manager Web GUI is ALREADY running.`);
    console.log(`  Access Developer Dashboard in your browser:`);
    console.log(`  👉 http://localhost:${PORT}`);
    console.log(`============================================================\n`);
  } else {
    console.error('Server error:', err.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`  LICENSE MANAGER WEB GUI STARTED`);
  console.log(`  Developer Dashboard: http://localhost:${PORT}`);
  console.log(`============================================================\n`);
});


