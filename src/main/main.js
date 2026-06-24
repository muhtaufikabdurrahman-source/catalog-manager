// src/main/main.js
//
// Entry point proses utama Electron. Membuat window aplikasi, memuat UI
// React (dev server saat development, file statis hasil build saat
// production), dan mendaftarkan semua IPC handler dari ./ipc.

const path = require('path');
const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const { registerIpcHandlers } = require('./ipc');
const { closeDb } = require('./db/connection');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

// Zoom step dan batas
const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;

function getZoom() {
  if (!mainWindow) return 1;
  return mainWindow.webContents.getZoomFactor();
}

function setZoom(factor) {
  if (!mainWindow) return;
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor));
  mainWindow.webContents.setZoomFactor(clamped);
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit', label: 'Keluar' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R' },
        ...(isDev ? [{ role: 'toggleDevTools', label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I' }] : []),
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: () => setZoom(1)
        },
        {
          label: 'Zoom In',
          // Daftarkan dua accelerator: Ctrl+= (tombol fisik +/=) dan Ctrl+Shift+= (Ctrl++)
          accelerator: 'CmdOrCtrl+=',
          click: () => setZoom(getZoom() + ZOOM_STEP)
        },
        {
          label: 'Zoom In (+)',
          accelerator: 'CmdOrCtrl+Plus',
          visible: false,
          click: () => setZoom(getZoom() + ZOOM_STEP)
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => setZoom(getZoom() - ZOOM_STEP)
        },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen', accelerator: 'F11' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Catalog Manager',
          click: () => {}
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f7f8fa',
    title: 'Catalog Manager',
    icon: path.join(__dirname, '..', '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  Menu.setApplicationMenu(buildMenu());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDb();
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  closeDb();
});
