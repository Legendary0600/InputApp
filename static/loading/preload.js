const { contextBridge, ipcRenderer, shell } = require('electron');
contextBridge.exposeInMainWorld('CoreSplash', {
    on: (channel, callback, p2) => ipcRenderer.on(channel, callback)
});