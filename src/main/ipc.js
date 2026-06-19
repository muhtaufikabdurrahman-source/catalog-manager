// src/main/ipc.js
//
// Mendaftarkan semua handler ipcMain.handle yang dipanggil dari renderer
// lewat preload.js. File ini sengaja jadi satu titik pusat supaya mudah
// dilacak channel mana yang sudah/​belum diimplementasikan.
//
// Catatan milestone: import/export, backup/restore, best seller, dan
// undo/redo akan diisi penuh pada milestone berikutnya. Untuk sekarang
// channel-nya didaftarkan dengan respons "belum tersedia" yang rapi agar
// UI tidak crash saat tombol terkait diklik lebih awal.

const { ipcMain } = require('electron');
const gamesRepo = require('./db/gamesRepository');
const imagesRepo = require('./db/imagesRepository');
const { getDbPath } = require('./db/connection');

function notImplemented(featureName) {
  return async () => ({
    error: true,
    message: `Fitur "${featureName}" akan tersedia pada update berikutnya.`
  });
}

function registerIpcHandlers() {
  // ---- Games CRUD ----
  ipcMain.handle('games:list', async (_e, options) => gamesRepo.listGames(options));
  ipcMain.handle('games:get', async (_e, id) => gamesRepo.getGameById(id));
  ipcMain.handle('games:create', async (_e, input) => gamesRepo.createGame(input));
  ipcMain.handle('games:update', async (_e, id, input) => gamesRepo.updateGame(id, input));
  ipcMain.handle('games:remove', async (_e, id) => {
    gamesRepo.softDeleteGame(id);
    return { success: true };
  });
  ipcMain.handle('games:restore', async (_e, id) => {
    gamesRepo.restoreGame(id);
    return { success: true };
  });
  ipcMain.handle('games:duplicate', async (_e, id) => gamesRepo.duplicateGame(id));
  ipcMain.handle('games:priceHistory', async (_e, id) => gamesRepo.getPriceHistory(id));
  ipcMain.handle('games:bulkDelete', async (_e, ids) => {
    gamesRepo.bulkDelete(ids);
    return { success: true };
  });
  ipcMain.handle('games:bulkUpdatePrice', async (_e, params) => {
    gamesRepo.bulkUpdatePrice(params);
    return { success: true };
  });

  // ---- Images ----
  ipcMain.handle('images:listMeta', async (_e, gameId) => imagesRepo.listImageMeta(gameId));
  ipcMain.handle('images:add', async (_e, gameId, fileBuffer, originalName) => {
    // fileBuffer datang sebagai ArrayBuffer/Uint8Array lewat structured clone IPC.
    const buf = Buffer.from(fileBuffer);
    return imagesRepo.addImage(gameId, buf, originalName);
  });
  ipcMain.handle('images:getThumbnail', async (_e, imageId) => imagesRepo.getThumbnail(imageId));
  ipcMain.handle('images:getFull', async (_e, imageId) => imagesRepo.getFullImage(imageId));
  ipcMain.handle('images:remove', async (_e, imageId) => {
    imagesRepo.deleteImage(imageId);
    return { success: true };
  });
  ipcMain.handle('images:setCover', async (_e, gameId, imageId) => {
    imagesRepo.setCoverImage(gameId, imageId);
    return { success: true };
  });
  ipcMain.handle('images:reorder', async (_e, gameId, orderedIds) => {
    imagesRepo.reorderImages(gameId, orderedIds);
    return { success: true };
  });

  // ---- Import / Export (stub, milestone berikutnya) ----
  ipcMain.handle('export:excel', notImplemented('Export Excel'));
  ipcMain.handle('export:csv', notImplemented('Export CSV'));
  ipcMain.handle('export:pdf', notImplemented('Export PDF'));
  ipcMain.handle('import:file', notImplemented('Import File'));
  ipcMain.handle('import:pickFile', notImplemented('Pilih File Import'));

  // ---- Backup / Restore (stub) ----
  ipcMain.handle('backup:create', notImplemented('Backup Database'));
  ipcMain.handle('backup:restore', notImplemented('Restore Database'));

  // ---- Best Seller (stub) ----
  ipcMain.handle('bestSeller:list', notImplemented('Best Seller'));
  ipcMain.handle('bestSeller:create', notImplemented('Best Seller'));
  ipcMain.handle('bestSeller:update', notImplemented('Best Seller'));
  ipcMain.handle('bestSeller:remove', notImplemented('Best Seller'));

  // ---- Undo / Redo (stub) ----
  ipcMain.handle('undo:undo', notImplemented('Undo'));
  ipcMain.handle('undo:redo', notImplemented('Redo'));
  ipcMain.handle('undo:canUndo', async () => false);
  ipcMain.handle('undo:canRedo', async () => false);

  // ---- Meta ----
  ipcMain.handle('meta:getDbPath', async () => getDbPath());

  // ---- App Settings ----
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
