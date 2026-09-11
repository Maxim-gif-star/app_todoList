const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("noctis", {
  isElectron: true,
  toggleFullscreen: () => ipcRenderer.invoke("toggle-fullscreen"),
  isFullscreen: () => ipcRenderer.invoke("window-is-fullscreen"),
});
