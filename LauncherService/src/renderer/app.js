// app.js — Renderer logic for DB Manager Pro style service controller
document.addEventListener('DOMContentLoaded', () => {
  const API = window.api;

  // ── Tab Navigation ──────────────────────────────────────────────
  const tabBtns    = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // ── Titlebar Controls ───────────────────────────────────────────
  document.getElementById('tb-min')?.addEventListener('click', () => API.winMinimize());
  document.getElementById('tb-max')?.addEventListener('click', () => API.winMaximize());
  document.getElementById('tb-close')?.addEventListener('click', () => API.winClose());

  // ── Console Log ─────────────────────────────────────────────────
  const consoleBody = document.getElementById('console-body');

  function addLog(msg, level = 'info') {
    if (!consoleBody) return;
    const el = document.createElement('div');
    el.className = `log ${level}`;
    el.textContent = msg;
    consoleBody.appendChild(el);
    consoleBody.scrollTop = consoleBody.scrollHeight;
    while (consoleBody.children.length > 500) consoleBody.removeChild(consoleBody.firstChild);
  }

  if (API.onLog) {
    API.onLog((d) => addLog(d.message, d.level));
  }

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    if (consoleBody) consoleBody.innerHTML = '';
  });

  // ── Action Buttons ──────────────────────────────────────────────
  const btnStart   = document.getElementById('btn-start');
  const btnStop    = document.getElementById('btn-stop');
  const btnRestart = document.getElementById('btn-restart');

  function lockButtons() {
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = true;
    if (btnRestart) btnRestart.disabled = true;
  }
  function unlockButtons() {
    if (btnStart) btnStart.disabled = false;
    if (btnStop) btnStop.disabled = false;
    if (btnRestart) btnRestart.disabled = false;
  }

  btnStart?.addEventListener('click', async () => {
    lockButtons();
    try {
      await API.start();
    } catch (e) {
      alert(e.message || e);
    }
    unlockButtons();
  });

  btnStop?.addEventListener('click', async () => {
    lockButtons();
    try {
      await API.stop();
    } catch (e) {
      alert(e.message || e);
    }
    unlockButtons();
  });

  btnRestart?.addEventListener('click', async () => {
    lockButtons();
    try {
      await API.restart();
    } catch (e) {
      alert(e.message || e);
    }
    unlockButtons();
  });

  // ── Copy Buttons ────────────────────────────────────────────────
  document.querySelectorAll('.copy-btn[data-url]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.url);
      const orig = btn.textContent;
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = orig; }, 1200);
    });
  });

  document.getElementById('copy-ipv4')?.addEventListener('click', () => {
    const url = document.getElementById('url-ipv4')?.textContent;
    if (url && url !== '—') {
      navigator.clipboard.writeText(url);
      const btn = document.getElementById('copy-ipv4');
      btn.textContent = '✓ Copied';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
    }
  });

  // ── Status Updates ──────────────────────────────────────────────
  const dot       = document.getElementById('status-dot');
  const label     = document.getElementById('status-label');
  const sub       = document.getElementById('status-sub');
  const infoState = document.getElementById('info-state');
  const infoPid   = document.getElementById('info-pid');
  const infoPort  = document.getElementById('info-port');
  const infoHealth= document.getElementById('info-health');
  const infoDb    = document.getElementById('info-db');
  const infoHost  = document.getElementById('info-hostname');
  const urlIpv4   = document.getElementById('url-ipv4');

  function stateColor(s) {
    if (s === 'running') return 'var(--green)';
    if (s === 'stopped') return 'var(--red)';
    return 'var(--amber)';
  }

  function updateUI(s) {
    if (!s) return;
    if (dot) dot.className = `status-dot ${s.state}`;

    if (label && sub) {
      if (s.state === 'running') {
        label.textContent = 'Backend Running';
        label.style.color = 'var(--green)';
        sub.textContent = `PID: ${s.pid} · Port: ${s.port}`;
      } else if (s.state === 'starting') {
        label.textContent = 'Starting...';
        label.style.color = 'var(--amber)';
        sub.textContent = 'Initializing backend service';
      } else if (s.state === 'stopping') {
        label.textContent = 'Stopping...';
        label.style.color = 'var(--amber)';
        sub.textContent = 'Shutting down backend service';
      } else {
        label.textContent = 'Backend Stopped';
        label.style.color = 'var(--red)';
        sub.textContent = s.licenseValid === false ? `Blocked: ${s.licenseReason}` : 'Click START to launch the service';
      }
    }

    if (infoState) {
      infoState.textContent = s.state.charAt(0).toUpperCase() + s.state.slice(1);
      infoState.style.color = stateColor(s.state);
    }
    if (infoPid) infoPid.textContent = s.pid || '—';
    if (infoPort) infoPort.textContent = s.port;
    if (infoHost) infoHost.textContent = s.hostname || '—';

    if (infoHealth && s.healthOk !== undefined) {
      infoHealth.textContent = s.healthOk ? `OK (${s.healthMs}ms)` : 'Down';
      infoHealth.style.color = s.healthOk ? 'var(--green)' : 'var(--red)';
    }
    if (infoDb && s.dbOk !== undefined) {
      infoDb.textContent = s.dbOk ? `Connected (${s.dbMs}ms)` : (s.dbMessage || 'Unreachable');
      infoDb.style.color = s.dbOk ? 'var(--green)' : 'var(--red)';
    }

    if (urlIpv4 && s.ipv4 && s.ipv4 !== 'N/A') {
      const ipUrl = `http://${s.ipv4}:${s.port}`;
      urlIpv4.textContent = ipUrl;
      const cpyBtn = document.getElementById('copy-ipv4');
      if (cpyBtn) cpyBtn.dataset.url = ipUrl;
    }

    const urlLocal = document.getElementById('url-local');
    const urlLoop  = document.getElementById('url-loop');
    if (urlLocal) {
      urlLocal.textContent = `http://localhost:${s.port}`;
      const btn = urlLocal.closest('.url-row')?.querySelector('.copy-btn');
      if (btn) btn.dataset.url = `http://localhost:${s.port}`;
    }
    if (urlLoop) {
      urlLoop.textContent = `http://127.0.0.1:${s.port}`;
      const btn = urlLoop.closest('.url-row')?.querySelector('.copy-btn');
      if (btn) btn.dataset.url = `http://127.0.0.1:${s.port}`;
    }
  }

  if (API.onStatus) API.onStatus(updateUI);
  if (API.onTick) API.onTick(updateUI);

  // ── Database Provider Form ──────────────────────────────────────
  async function loadDatabaseConfig() {
    try {
      const cfg = await API.getDbConfig();
      if (cfg) {
        if (document.getElementById('db-type')) document.getElementById('db-type').value = cfg.dbType || 'mongodb';
        if (document.getElementById('db-host')) document.getElementById('db-host').value = cfg.dbHost || '127.0.0.1';
        if (document.getElementById('db-port')) document.getElementById('db-port').value = cfg.dbPort || 27017;
        if (document.getElementById('db-name')) document.getElementById('db-name').value = cfg.dbName || 'restaurant_new';
        if (document.getElementById('db-user')) document.getElementById('db-user').value = cfg.dbUser || '';
      }
    } catch (e) {
      console.error('Failed loading DB config:', e);
    }
  }

  document.getElementById('form-database')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dbType = document.getElementById('db-type').value;
    const dbHost = document.getElementById('db-host').value;
    const dbPort = parseInt(document.getElementById('db-port').value, 10);
    const dbName = document.getElementById('db-name').value;
    const dbUser = document.getElementById('db-user').value;
    const dbPass = document.getElementById('db-pass').value;

    try {
      await API.saveDbConfig({ dbType, dbHost, dbPort, dbName, dbUser, dbPass });
      alert('Database provider configuration saved securely.');
    } catch (err) {
      alert(`Save Error: ${err.message}`);
    }
  });

  document.getElementById('btn-test-db')?.addEventListener('click', async () => {
    const resultBox = document.getElementById('db-test-result');
    if (resultBox) resultBox.textContent = 'Testing connection to database provider...';

    const dbType = document.getElementById('db-type').value;
    const dbHost = document.getElementById('db-host').value;
    const dbPort = parseInt(document.getElementById('db-port').value, 10);
    const dbName = document.getElementById('db-name').value;
    const dbUser = document.getElementById('db-user').value;
    const dbPass = document.getElementById('db-pass').value;

    try {
      const res = await API.testDbConnection({ dbType, dbHost, dbPort, dbName, dbUser, dbPass });
      if (resultBox) {
        if (res.running) {
          resultBox.style.color = 'var(--green)';
          resultBox.textContent = `✓ ${res.message}`;
        } else {
          resultBox.style.color = 'var(--red)';
          resultBox.textContent = `✕ ${res.message}`;
        }
      }
    } catch (err) {
      if (resultBox) {
        resultBox.style.color = 'var(--red)';
        resultBox.textContent = `Error: ${err.message}`;
      }
    }
  });

  // ── License Manager ─────────────────────────────────────────────
  let cachedFingerprint = null;

  async function loadLicenseInfo() {
    try {
      const info = await API.getLicenseInfo();
      if (!info) return;

      if (info.fingerprint) {
        cachedFingerprint = info.fingerprint;
        if (document.getElementById('lic-device-id')) document.getElementById('lic-device-id').textContent = info.fingerprint.deviceId || '—';
        if (document.getElementById('lic-guid')) document.getElementById('lic-guid').textContent = info.fingerprint.machineGuid || '—';
        if (document.getElementById('lic-mac')) document.getElementById('lic-mac').textContent = info.fingerprint.macAddress || '—';
        if (document.getElementById('lic-hostname')) document.getElementById('lic-hostname').textContent = info.fingerprint.computerName || '—';
      }

      if (info.license) {
        if (document.getElementById('lic-product')) document.getElementById('lic-product').textContent = info.license.productId || 'RESTOBOARD';
        if (document.getElementById('lic-hotel')) document.getElementById('lic-hotel').textContent = info.license.hotelName || '—';
        if (document.getElementById('lic-cust-hotel')) document.getElementById('lic-cust-hotel').textContent = `${info.license.customerId || 'N/A'} / ${info.license.hotelId || 'N/A'}`;
        if (document.getElementById('lic-id')) document.getElementById('lic-id').textContent = info.license.licenseId || '—';
        if (document.getElementById('lic-expiry')) document.getElementById('lic-expiry').textContent = info.license.expiryDate || '—';
      }

      const daysEl = document.getElementById('lic-days');
      if (daysEl) {
        daysEl.textContent = `${info.daysRemaining || 0} Days`;
        daysEl.style.color = (info.daysRemaining > 7) ? 'var(--green)' : 'var(--red)';
      }

      const sigDesc = document.getElementById('lic-sig-desc');
      if (sigDesc) {
        if (info.valid) {
          sigDesc.textContent = `✓ ${info.reason}`;
          sigDesc.style.color = 'var(--green)';
        } else {
          sigDesc.textContent = `✕ ${info.reason}`;
          sigDesc.style.color = 'var(--red)';
        }
      }
    } catch (e) {
      console.error('Failed loading license info:', e);
    }
  }

  function handleCopy(buttonId, textToCopy, successLabel = '✓ Copied') {
    const btn = document.getElementById(buttonId);
    if (!btn || !textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    const orig = btn.textContent;
    btn.textContent = successLabel;
    setTimeout(() => { btn.textContent = orig; }, 1500);
  }

  document.getElementById('btn-copy-device-id')?.addEventListener('click', () => {
    const text = document.getElementById('lic-device-id')?.textContent;
    handleCopy('btn-copy-device-id', text);
  });

  document.getElementById('btn-copy-guid')?.addEventListener('click', () => {
    const text = document.getElementById('lic-guid')?.textContent;
    handleCopy('btn-copy-guid', text);
  });

  document.getElementById('btn-copy-mac')?.addEventListener('click', () => {
    const text = document.getElementById('lic-mac')?.textContent;
    handleCopy('btn-copy-mac', text);
  });

  document.getElementById('btn-copy-hostname')?.addEventListener('click', () => {
    const text = document.getElementById('lic-hostname')?.textContent;
    handleCopy('btn-copy-hostname', text);
  });

  document.getElementById('btn-copy-all-device-info')?.addEventListener('click', () => {
    if (!cachedFingerprint) {
      alert('Device fingerprint details not yet loaded.');
      return;
    }
    const payload = JSON.stringify(cachedFingerprint, null, 2);
    handleCopy('btn-copy-all-device-info', payload, '✓ All Device Details Copied!');
  });

  document.getElementById('btn-import-license')?.addEventListener('click', async () => {
    const file = await API.selectLicenseFile();
    if (file) {
      const res = await API.importLicense(file);
      if (res.valid) {
        alert('Enterprise license imported and verified successfully!');
        loadLicenseInfo();
      } else {
        alert(`License Import Failed: ${res.reason}`);
      }
    }
  });

  document.getElementById('btn-export-request')?.addEventListener('click', async () => {
    try {
      const outPath = await API.exportDeviceRequest();
      alert(`Device Request File Exported:\n${outPath}`);
    } catch (e) {
      alert(`Export Error: ${e.message}`);
    }
  });

  // ── Setup Wizard Navigation ─────────────────────────────────────
  let currentWizStep = 1;

  const STEP_TITLES = {
    1: { title: 'Step 1: Database Configuration', desc: 'Configure and test your local database provider before proceeding.' },
    2: { title: 'Step 2: Backend Configuration', desc: 'Configure backend networking for multi-device LAN access.' },
    3: { title: 'Step 3: Device Fingerprint Generation', desc: 'Unique identity generated for this server machine.' },
    4: { title: 'Step 4: License Import & Validation', desc: 'Import your signed enterprise license file (.json).' },
    5: { title: 'Step 5: Launcher Configuration Persistence', desc: 'Saves infrastructure settings and license metadata.' },
    6: { title: 'Step 6: Backend Startup', desc: 'Launching backend service and checking API health.' }
  };

  function setWizStep(step) {
    currentWizStep = step;

    // Update stepper bubbles
    document.querySelectorAll('.step-bubble').forEach(b => {
      const s = parseInt(b.dataset.step, 10);
      b.classList.remove('active', 'done');
      if (s < step) b.classList.add('done');
      else if (s === step) b.classList.add('active');
    });

    document.querySelectorAll('.step-line').forEach((l, idx) => {
      l.classList.toggle('active', idx < step - 1);
    });

    // Update titles
    const meta = STEP_TITLES[step];
    if (meta) {
      if (document.getElementById('wiz-step-title')) document.getElementById('wiz-step-title').textContent = meta.title;
      if (document.getElementById('wiz-step-desc')) document.getElementById('wiz-step-desc').textContent = meta.desc;
      if (document.getElementById('wiz-step-count')) document.getElementById('wiz-step-count').textContent = `Step ${step} of 6`;
    }

    // Toggle panes
    document.querySelectorAll('.wiz-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById(`wiz-pane-${step}`);
    if (pane) pane.classList.add('active');
  }

  async function checkSetupState() {
    try {
      const state = await API.setupGetState();
      if (!state) return;

      if (!state.isInfrastructureSetupComplete) {
        // Show Setup Wizard Overlay
        const wizView = document.getElementById('wizard-view');
        if (wizView) wizView.style.display = 'flex';

        // Pre-fill DB config
        if (state.dbConfig) {
          if (document.getElementById('wiz-db-type')) document.getElementById('wiz-db-type').value = state.dbConfig.dbType || 'mongodb';
          if (document.getElementById('wiz-db-host')) document.getElementById('wiz-db-host').value = state.dbConfig.dbHost || '127.0.0.1';
          if (document.getElementById('wiz-db-port')) document.getElementById('wiz-db-port').value = state.dbConfig.dbPort || 27017;
          if (document.getElementById('wiz-db-name')) document.getElementById('wiz-db-name').value = state.dbConfig.dbName || 'restaurant_new';
          if (document.getElementById('wiz-db-user')) document.getElementById('wiz-db-user').value = state.dbConfig.dbUser || '';
        }

        // Network IPv4
        if (document.getElementById('wiz-net-ipv4')) document.getElementById('wiz-net-ipv4').textContent = state.ipv4 || '127.0.0.1';

        // Fingerprint
        if (state.fingerprint) {
          if (document.getElementById('wiz-fp-install-id')) document.getElementById('wiz-fp-install-id').textContent = state.fingerprint.installationId || '—';
          if (document.getElementById('wiz-fp-device-id')) document.getElementById('wiz-fp-device-id').textContent = state.fingerprint.deviceId || '—';
          if (document.getElementById('wiz-fp-guid')) document.getElementById('wiz-fp-guid').textContent = state.fingerprint.machineGuid || '—';
          if (document.getElementById('wiz-fp-mac')) document.getElementById('wiz-fp-mac').textContent = state.fingerprint.macAddress || '—';
        }

        // License status in Wizard
        updateWizLicenseStatus(state.licenseVal);

        setWizStep(state.currentStep || 1);
      } else {
        // Setup is already complete! Hide wizard and show main dashboard
        const wizView = document.getElementById('wizard-view');
        if (wizView) wizView.style.display = 'none';
      }
    } catch (e) {
      console.error('Failed checking setup state:', e);
    }
  }

  function updateWizLicenseStatus(val) {
    const titleEl = document.getElementById('wiz-lic-status-title');
    const descEl = document.getElementById('wiz-lic-status-desc');
    const nextBtn = document.getElementById('btn-wiz-4-next');

    if (!val || !val.license) {
      if (titleEl) { titleEl.textContent = '✕ No License File Loaded'; titleEl.style.color = 'var(--red)'; }
      if (descEl) descEl.textContent = 'Please select and import a valid enterprise signed license file (.json).';
      if (nextBtn) nextBtn.disabled = true;
    } else if (val.valid) {
      if (titleEl) { titleEl.textContent = `✓ License Verified: ${val.license.hotelName || 'Enterprise POS'}`; titleEl.style.color = 'var(--green)'; }
      if (descEl) descEl.textContent = `Valid Product: ${val.license.productId} | Expires: ${val.license.expiryDate} (${val.daysRemaining} days remaining)`;
      if (nextBtn) nextBtn.disabled = false;
    } else {
      if (titleEl) { titleEl.textContent = '✕ License Validation Failed'; titleEl.style.color = 'var(--red)'; }
      if (descEl) descEl.textContent = val.reason;
      if (nextBtn) nextBtn.disabled = true;
    }
  }

  // ── Step 1 DB Handlers ──────────────────────────────────────────
  document.getElementById('btn-wiz-test-db')?.addEventListener('click', async () => {
    const resBox = document.getElementById('wiz-db-result');
    if (resBox) resBox.textContent = 'Testing database provider connection...';

    const cfg = {
      dbType: document.getElementById('wiz-db-type').value,
      dbHost: document.getElementById('wiz-db-host').value,
      dbPort: parseInt(document.getElementById('wiz-db-port').value, 10),
      dbName: document.getElementById('wiz-db-name').value,
      dbUser: document.getElementById('wiz-db-user').value,
      dbPass: document.getElementById('wiz-db-pass').value
    };

    try {
      const res = await API.setupSaveDbConfig(cfg);
      if (res.ok) {
        if (resBox) { resBox.style.color = 'var(--green)'; resBox.textContent = `✓ ${res.message}`; }
        document.getElementById('btn-wiz-1-next').disabled = false;
      } else {
        if (resBox) { resBox.style.color = 'var(--red)'; resBox.textContent = `✕ ${res.message}`; }
        document.getElementById('btn-wiz-1-next').disabled = true;
      }
    } catch (err) {
      if (resBox) { resBox.style.color = 'var(--red)'; resBox.textContent = `Error: ${err.message}`; }
      document.getElementById('btn-wiz-1-next').disabled = true;
    }
  });

  document.getElementById('btn-wiz-1-next')?.addEventListener('click', () => setWizStep(2));

  // ── Step 2 Network Handlers ─────────────────────────────────────
  document.getElementById('btn-wiz-2-back')?.addEventListener('click', () => setWizStep(1));
  document.getElementById('btn-wiz-2-next')?.addEventListener('click', () => setWizStep(3));

  // ── Step 3 Fingerprint Handlers ─────────────────────────────────
  document.getElementById('btn-wiz-3-back')?.addEventListener('click', () => setWizStep(2));
  document.getElementById('btn-wiz-3-next')?.addEventListener('click', () => setWizStep(4));
  document.getElementById('btn-wiz-export-request')?.addEventListener('click', async () => {
    try {
      const outPath = await API.exportDeviceRequest();
      alert(`Device Request File Exported:\n${outPath}`);
    } catch (e) {
      alert(`Export error: ${e.message}`);
    }
  });

  // ── Step 4 License Handlers ─────────────────────────────────────
  document.getElementById('btn-wiz-4-back')?.addEventListener('click', () => setWizStep(3));
  document.getElementById('btn-wiz-import-lic')?.addEventListener('click', async () => {
    const file = await API.selectLicenseFile();
    if (file) {
      const res = await API.importLicense(file);
      updateWizLicenseStatus(res);
      if (res.valid) {
        alert('Enterprise License verified successfully!');
      } else {
        alert(`License Validation Failed: ${res.reason}`);
      }
    }
  });

  document.getElementById('btn-wiz-4-next')?.addEventListener('click', () => setWizStep(5));

  // ── Step 5 Infrastructure Persistence Handlers ─────────────────
  document.getElementById('btn-wiz-5-back')?.addEventListener('click', () => setWizStep(4));
  document.getElementById('btn-wiz-5-next')?.addEventListener('click', async () => {
    setWizStep(6);
    // Auto launch backend in step 6
    const statusEl = document.getElementById('wiz-launch-status');
    const subEl = document.getElementById('wiz-launch-sub');
    const finishBtn = document.getElementById('btn-wiz-finish');

    if (statusEl) statusEl.textContent = 'Starting Backend Service...';
    try {
      await API.start();
      if (statusEl) statusEl.textContent = '✓ Backend Service Running & Verified';
      if (subEl) subEl.textContent = 'Health probe succeeded. Ready to enter dashboard.';
      if (finishBtn) finishBtn.disabled = false;
    } catch (e) {
      if (statusEl) { statusEl.textContent = '✕ Startup Error'; statusEl.style.color = 'var(--red)'; }
      if (subEl) subEl.textContent = e.message || e;
      if (finishBtn) finishBtn.disabled = true;
    }
  });

  // ── Step 6 Complete Setup Handler ───────────────────────────────
  document.getElementById('btn-wiz-finish')?.addEventListener('click', async () => {
    await API.setupComplete();
    const wizView = document.getElementById('wizard-view');
    if (wizView) wizView.style.display = 'none';
    loadLicenseInfo();
  });

  // ── Initial Data Fetch ──────────────────────────────────────────
  if (API.getInfo) {
    API.getInfo().then(info => {
      if (info) updateUI(info);
    });
  }
  loadDatabaseConfig();
  loadLicenseInfo();
  checkSetupState();
});


