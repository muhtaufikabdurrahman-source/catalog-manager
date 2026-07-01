const path = require('path');
const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const { registerIpcHandlers } = require('./ipc');
const { closeDb } = require('./db/connection');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

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

// Simpan & muat posisi/ukuran window terakhir
function loadWindowBounds() {
  try {
    const { getDb } = require('./db/connection');
    const db = getDb();
    const row = db.prepare("SELECT value FROM app_meta WHERE key = 'window_bounds'").get();
    if (row) return JSON.parse(row.value);
  } catch (_) {}
  return null;
}

function saveWindowBounds() {
  if (!mainWindow) return;
  try {
    const { getDb } = require('./db/connection');
    const db = getDb();
    const bounds = mainWindow.getBounds();
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('window_bounds', ?)").run(JSON.stringify(bounds));
  } catch (_) {}
}

// Resize/move event Electron bisa fire puluhan kali per detik saat user
// menyeret window -- menulis ke SQLite di tiap event bikin drag/resize
// terasa tersendat. Debounce 300ms supaya hanya menulis sekali setelah
// user berhenti menggerakkan window.
let saveBoundsTimer = null;
function saveWindowBoundsDebounced() {
  clearTimeout(saveBoundsTimer);
  saveBoundsTimer = setTimeout(saveWindowBounds, 300);
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit', label: 'Keluar' }]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R' },
        ...(isDev ? [{ role: 'toggleDevTools', label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I' }] : []),
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', click: () => setZoom(1) },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => setZoom(getZoom() + ZOOM_STEP) },
        { label: 'Zoom In (+)', accelerator: 'CmdOrCtrl+Plus', visible: false, click: () => setZoom(getZoom() + ZOOM_STEP) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => setZoom(getZoom() - ZOOM_STEP) },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen', accelerator: 'F11' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }]
    },
    {
      label: 'Help',
      submenu: [{ label: 'About Catalog Manager', click: () => {} }]
    }
  ];
  return Menu.buildFromTemplate(template);
}

function createWindow() {
  const saved = loadWindowBounds();

  mainWindow = new BrowserWindow({
    // Pakai ukuran tersimpan, atau default jika belum ada
    width: saved?.width ?? 1400,
    height: saved?.height ?? 900,
    x: saved?.x,
    y: saved?.y,
    // Min size wajar agar UI tidak rusak
    minWidth: 600,
    minHeight: 500,
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

  // Simpan posisi/ukuran saat window dipindah atau di-resize (debounced).
  // Saat ditutup, simpan langsung (non-debounced) supaya tidak hilang.
  mainWindow.on('resize', saveWindowBoundsDebounced);
  mainWindow.on('move', saveWindowBoundsDebounced);
  mainWindow.on('close', () => { clearTimeout(saveBoundsTimer); saveWindowBounds(); });

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
