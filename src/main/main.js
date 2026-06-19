// src/main/main.js
//
// Entry point proses utama Electron. Membuat window aplikasi, memuat UI
// React (dev server saat development, file statis hasil build saat
// production), dan mendaftarkan semua IPC handler dari ./ipc.

const path = require('path');
const { app, BrowserWindow } = require('electron');
const { registerIpcHandlers } = require('./ipc');
const { closeDb } = require('./db/connection');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

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
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  closeDb();
});
