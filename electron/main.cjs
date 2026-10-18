'use strict';
const { app, BrowserWindow, Menu, session, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

app.setName('ARSES');
// A stable, independent profile keeps the library across app updates.
app.setPath('userData', path.join(app.getPath('appData'), 'ARSES'));
let mainWindow;
const hasLock = app.requestSingleInstanceLock();
if (!hasLock) app.quit();

function createWindow() {
  const entry = path.join(__dirname, '..', 'renderer', 'dist', 'index.html');
  if (!fs.existsSync(entry)) {
    dialog.showErrorBox('ARSES', 'Renderer not found. Run npm run prepare:renderer, then npm start.');
    app.quit();
    return;
  }
  mainWindow = new BrowserWindow({
    width: 1440, height: 940, minWidth: 860, minHeight: 620,
    title: 'ARSES', backgroundColor: '#121311', show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: !app.isPackaged
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.webContents.on('will-redirect', event => event.preventDefault());
  mainWindow.webContents.on('will-attach-webview', event => event.preventDefault());
  mainWindow.webContents.on('page-title-updated', event => event.preventDefault());
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadFile(entry).catch(() => {
    dialog.showErrorBox('ARSES', 'The application could not load its local interface.');
    app.quit();
  });
}

if (hasLock) {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    // This catalog needs no outbound connections, credentials or external services.
    session.defaultSession.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] },
      (_details, callback) => callback({ cancel: true })
    );
    session.defaultSession.on('will-download', event => event.preventDefault());
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'ARSES', submenu: [
        { label: 'About ARSES', click: () => dialog.showMessageBox(mainWindow, {
          type: 'info', title: 'ARSES', message: `ARSES ${app.getVersion()}`,
          detail: 'Desktop game catalog and personal library.\nNo game downloads, installation, online fixes or live server access.\nThis unsigned source package requires a separate Windows build.'
        }) },
        { type: 'separator' }, { role: 'quit' }
      ]},
      { label: 'Edit', submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]},
      { label: 'View', submenu: [
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' }, { role: 'togglefullscreen' }
      ]}
    ]));
    createWindow();
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
