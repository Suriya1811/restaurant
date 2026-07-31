'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion:  () => ipcRenderer.invoke('app:version'),
  getUserData: () => ipcRenderer.invoke('app:userData'),
  openLogs:    () => ipcRenderer.invoke('app:openLogs'),
  selectDirectory: () => ipcRenderer.invoke('app:selectDirectory'),

  isElectron: true,

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    requestClose: () => ipcRenderer.invoke('window:requestClose')
  }
});
