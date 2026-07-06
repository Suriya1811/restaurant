'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, minimal API to the renderer (React app)
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion:  () => ipcRenderer.invoke('app:version'),
  getUserData: () => ipcRenderer.invoke('app:userData'),
  openLogs:    () => ipcRenderer.invoke('app:openLogs'),
  selectDirectory: () => ipcRenderer.invoke('app:selectDirectory'),
});
