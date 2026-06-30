// src/main/ipc.js

const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const gamesRepo = require('./db/gamesRepository');
const imagesRepo = require('./db/imagesRepository');
const exportRepo = require('./db/exportRepository');
const backupRepo = require('./db/backupRepository');
const faqRepo = require('./db/faqRepository');
const faqImagesRepo = require('./db/faqImagesRepository');
const kasetStoresRepo = require('./db/kasetStoresRepository');
const sidebarRepo = require('./db/sidebarRepository');
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
  ipcMain.handle('games:batchRecalcShopee', async (_e, params) => gamesRepo.batchRecalcShopee(params));
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

  // ---- FAQ (Pertanyaan) ----
  ipcMain.handle('faq:list', async (_e, options) => faqRepo.listFaqs(options));
  ipcMain.handle('faq:countByCategory', async () => faqRepo.countByCategory());
  ipcMain.handle('faq:get', async (_e, id) => faqRepo.getFaqById(id));
  ipcMain.handle('faq:create', async (_e, input) => faqRepo.createFaq(input));
  ipcMain.handle('faq:update', async (_e, id, input) => faqRepo.updateFaq(id, input));
  ipcMain.handle('faq:remove', async (_e, id) => { faqRepo.deleteFaq(id); return { success: true }; });
  ipcMain.handle('faq:reorder', async (_e, orderedIds) => { faqRepo.reorderFaqs(orderedIds); return { success: true }; });

  ipcMain.handle('faqImages:listMeta', async (_e, faqId) => faqImagesRepo.listFaqImageMeta(faqId));
  ipcMain.handle('faqImages:add', async (_e, faqId, fileBuffer, originalName) => {
    const buf = Buffer.from(fileBuffer);
    return faqImagesRepo.addFaqImage(faqId, buf, originalName);
  });
  ipcMain.handle('faqImages:getThumbnail', async (_e, imageId) => faqImagesRepo.getFaqThumbnail(imageId));
  ipcMain.handle('faqImages:getFull', async (_e, imageId) => faqImagesRepo.getFaqFullImage(imageId));
  ipcMain.handle('faqImages:remove', async (_e, imageId) => { faqImagesRepo.deleteFaqImage(imageId); return { success: true }; });
  ipcMain.handle('faqImages:reorder', async (_e, faqId, orderedIds) => { faqImagesRepo.reorderFaqImages(faqId, orderedIds); return { success: true }; });

  // ---- Tempat Beli Kaset ----
  ipcMain.handle('kasetStores:list', async () => kasetStoresRepo.listStores());
  ipcMain.handle('kasetStores:get', async (_e, id) => kasetStoresRepo.getStoreById(id));
  ipcMain.handle('kasetStores:create', async (_e, input) => kasetStoresRepo.createStore(input));
  ipcMain.handle('kasetStores:update', async (_e, id, input) => kasetStoresRepo.updateStore(id, input));
  ipcMain.handle('kasetStores:remove', async (_e, id) => { kasetStoresRepo.deleteStore(id); return { success: true }; });
  ipcMain.handle('kasetStores:reorder', async (_e, orderedIds) => { kasetStoresRepo.reorderStores(orderedIds); return { success: true }; });

  // ---- Urutan menu sidebar ----
  ipcMain.handle('sidebar:getOrder', async () => sidebarRepo.getSidebarOrder());
  ipcMain.handle('sidebar:setOrder', async (_e, orderedKeys) => sidebarRepo.setSidebarOrder(orderedKeys));

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
