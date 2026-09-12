const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

app.setName("todoApp");
app.setPath("userData", path.join(app.getPath("appData"), "noctis"));

/** @type {BrowserWindow | null} */
let win = null;

function createWindow() {
  win = new BrowserWindow({
    title: "todoApp",
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#000000",
    frame: false,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => {
    win?.maximize();
    win?.show();
  });

  win.webContents.setVisualZoomLevelLimits(1, 1);
  win.webContents.on("context-menu", (event) => {
    event.preventDefault();
  });

  const isDev = process.env.ELECTRON_DEV === "1" && !app.isPackaged;
  if (isDev) {
    win.loadURL("http://127.0.0.1:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.on("closed", () => {
    win = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });
  app.whenReady().then(createWindow);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("toggle-fullscreen", (event) => {
  const w = BrowserWindow.fromWebContents(event.sender);
  if (!w) return false;
  w.setFullScreen(!w.isFullScreen());
  return w.isFullScreen();
});

ipcMain.handle("window-is-fullscreen", (event) => {
  const w = BrowserWindow.fromWebContents(event.sender);
  return w?.isFullScreen() ?? false;
});
