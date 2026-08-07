const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Service Controls
  start:             ()      => ipcRenderer.invoke('start'),
  stop:              ()      => ipcRenderer.invoke('stop'),
  restart:           ()      => ipcRenderer.invoke('restart'),
  getInfo:           ()      => ipcRenderer.invoke('get-info'),

  // Database APIs
  getDbConfig:       ()      => ipcRenderer.invoke('db:get-config'),
  saveDbConfig:      (cfg)   => ipcRenderer.invoke('db:save-config', cfg),
  testDbConnection:  (cfg)   => ipcRenderer.invoke('db:test-connection', cfg),

  // License APIs
  getLicenseInfo:    ()      => ipcRenderer.invoke('license:get-info'),
  importLicense:     (file)  => ipcRenderer.invoke('license:import', file),
  exportDeviceRequest: ()    => ipcRenderer.invoke('license:export-request'),
  selectLicenseFile: ()      => ipcRenderer.invoke('license:select-file'),

  // Window Controls
  winMinimize:       ()      => ipcRenderer.invoke('win:minimize'),
  winMaximize:       ()      => ipcRenderer.invoke('win:maximize'),
  winClose:          ()      => ipcRenderer.invoke('win:close'),

  // Setup Wizard APIs
  setupGetState:       ()      => ipcRenderer.invoke('setup:get-state'),
  setupSaveDbConfig:   (cfg)   => ipcRenderer.invoke('setup:save-db-config', cfg),
  setupComplete:       ()      => ipcRenderer.invoke('setup:complete'),
  setupReset:          ()      => ipcRenderer.invoke('setup:reset'),

  // Real-time Event Listeners
  onLog:             (cb)    => ipcRenderer.on('log', (_e, d) => cb(d)),
  onStatus:          (cb)    => ipcRenderer.on('status', (_e, d) => cb(d)),
  onTick:            (cb)    => ipcRenderer.on('tick', (_e, d) => cb(d))
});
