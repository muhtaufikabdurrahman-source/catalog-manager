// src/main/preload.js
//
// Jembatan aman antara proses renderer (React, tidak punya akses Node) dan
// proses main (akses database & filesystem). Hanya fungsi-fungsi spesifik
// yang diexpose lewat contextBridge -- renderer TIDAK punya akses langsung
// ke ipcRenderer mentah, apalagi ke Node API.

const { contextBridge, ipcRenderer } = require('electron');

function invoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld('api', {
  games: {
    list: (options) => invoke('games:list', options),
    get: (id) => invoke('games:get', id),
    create: (input) => invoke('games:create', input),
    update: (id, input) => invoke('games:update', id, input),
    remove: (id) => invoke('games:remove', id),
    restore: (id) => invoke('games:restore', id),
    duplicate: (id) => invoke('games:duplicate', id),
    priceHistory: (id) => invoke('games:priceHistory', id),
    bulkDelete: (ids) => invoke('games:bulkDelete', ids),
    bulkUpdatePrice: (params) => invoke('games:bulkUpdatePrice', params)
  },
  images: {
    listMeta: (gameId) => invoke('images:listMeta', gameId),
    add: (gameId, fileBuffer, originalName) => invoke('images:add', gameId, fileBuffer, originalName),
    getThumbnail: (imageId) => invoke('images:getThumbnail', imageId),
    getFull: (imageId) => invoke('images:getFull', imageId),
    remove: (imageId) => invoke('images:remove', imageId),
    setCover: (gameId, imageId) => invoke('images:setCover', gameId, imageId),
    reorder: (gameId, orderedIds) => invoke('images:reorder', gameId, orderedIds)
  },
  importExport: {
    exportExcel: () => invoke('export:excel'),
    exportCsv: () => invoke('export:csv'),
    exportPdf: () => invoke('export:pdf'),
    importFile: (filePath) => invoke('import:file', filePath),
    pickImportFile: () => invoke('import:pickFile')
  },
  backup: {
    backupTo: () => invoke('backup:create'),
    restoreFrom: () => invoke('backup:restore')
  },
  bestSeller: {
    list: () => invoke('bestSeller:list'),
    create: (input) => invoke('bestSeller:create', input),
    update: (id, input) => invoke('bestSeller:update', id, input),
    remove: (id) => invoke('bestSeller:remove', id)
  },
  undo: {
    undo: () => invoke('undo:undo'),
    redo: () => invoke('undo:redo'),
    canUndo: () => invoke('undo:canUndo'),
    canRedo: () => invoke('undo:canRedo')
  },
  meta: {
    getDbPath: () => invoke('meta:getDbPath')
  }
});
