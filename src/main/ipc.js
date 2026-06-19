// src/main/ipc.js

const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const gamesRepo = require('./db/gamesRepository');
const imagesRepo = require('./db/imagesRepository');
const exportRepo = require('./db/exportRepository');
const backupRepo = require('./db/backupRepository');
const { getDbPath } = require('./db/connection');

function registerIpcHandlers() {
  // ---- Games CRUD ----
  ipcMain.handle('games:list', async (_e, options) => gamesRepo.listGames(options));
  ipcMain.handle('games:get', async (_e, id) => gamesRepo.getGameById(id));
  ipcMain.handle('games:create', async (_e, input) => gamesRepo.createGame(input));
  ipcMain.handle('games:update', async (_e, id, input) => gamesRepo.updateGame(id, input));
  ipcMain.handle('games:remove', async (_e, id) => { gamesRepo.softDeleteGame(id); return { success: true }; });
  ipcMain.handle('games:restore', async (_e, id) => { gamesRepo.restoreGame(id); return { success: true }; });
  ipcMain.handle('games:duplicate', async (_e, id) => gamesRepo.duplicateGame(id));
  ipcMain.handle('games:priceHistory', async (_e, id) => gamesRepo.getPriceHistory(id));
  ipcMain.handle('games:bulkDelete', async (_e, ids) => { gamesRepo.bulkDelete(ids); return { success: true }; });
  ipcMain.handle('games:bulkUpdatePrice', async (_e, params) => { gamesRepo.bulkUpdatePrice(params); return { success: true }; });
  ipcMain.handle('games:toggleBestSeller', async (_e, id) => gamesRepo.toggleBestSeller(id));

  // ---- Images ----
  ipcMain.handle('images:listMeta', async (_e, gameId) => imagesRepo.listImageMeta(gameId));
  ipcMain.handle('images:add', async (_e, gameId, fileBuffer, originalName) => {
    const buf = Buffer.from(fileBuffer);
    return imagesRepo.addImage(gameId, buf, originalName);
  });
  ipcMain.handle('images:getThumbnail', async (_e, imageId) => imagesRepo.getThumbnail(imageId));
  ipcMain.handle('images:getFull', async (_e, imageId) => imagesRepo.getFullImage(imageId));
  ipcMain.handle('images:remove', async (_e, imageId) => { imagesRepo.deleteImage(imageId); return { success: true }; });
  ipcMain.handle('images:setCover', async (_e, gameId, imageId) => { imagesRepo.setCoverImage(gameId, imageId); return { success: true }; });
  ipcMain.handle('images:reorder', async (_e, gameId, orderedIds) => { imagesRepo.reorderImages(gameId, orderedIds); return { success: true }; });

  // ---- Export ----
  ipcMain.handle('export:excel', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Export Excel',
      defaultPath: `katalog-${new Date().toISOString().slice(0,10)}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    });
    if (canceled || !filePath) return { canceled: true };
    const result = await exportRepo.exportExcel(filePath);
    return { ...result, filePath };
  });

  ipcMain.handle('export:csv', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Export CSV',
      defaultPath: `katalog-${new Date().toISOString().slice(0,10)}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (canceled || !filePath) return { canceled: true };
    const result = await exportRepo.exportCsv(filePath);
    return { ...result, filePath };
  });

  // ---- Import ----
  ipcMain.handle('import:pickFile', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Pilih File Import',
      filters: [{ name: 'Excel / CSV', extensions: ['xlsx', 'xls', 'csv'] }],
      properties: ['openFile']
    });
    if (canceled || !filePaths.length) return { canceled: true };
    return { filePath: filePaths[0] };
  });

  ipcMain.handle('import:file', async (_e, filePath) => {
    return exportRepo.importFile(filePath);
  });

  // ---- Backup / Restore ----
  ipcMain.handle('backup:create', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Simpan Backup Database',
      defaultPath: `catalog-backup-${new Date().toISOString().slice(0,10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });
    if (canceled || !filePath) return { canceled: true };
    return backupRepo.createBackup(filePath);
  });

  ipcMain.handle('backup:restore', async (event) => {
    const win = require('electron').BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Pilih File Backup untuk Restore',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile']
    });
    if (canceled || !filePaths.length) return { canceled: true };
    return backupRepo.restoreBackup(filePaths[0]);
  });

  // ---- Meta ----
  ipcMain.handle('meta:getDbPath', async () => getDbPath());

  // ---- Settings ----
  ipcMain.handle('settings:get', async (_e, key) => {
    const { getDb } = require('./db/connection');
    const db = getDb();
    const row = db.prepare('SELECT value FROM app_meta WHERE key = ?').get(key);
    return row ? row.value : null;
  });
  ipcMain.handle('settings:set', async (_e, key, value) => {
    const { getDb } = require('./db/connection');
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)').run(key, String(value));
    return { success: true };
  });
}

module.exports = { registerIpcHandlers };
