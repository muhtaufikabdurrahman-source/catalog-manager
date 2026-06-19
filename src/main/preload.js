// src/main/preload.js
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
    bulkUpdatePrice: (params) => invoke('games:bulkUpdatePrice', params),
    toggleBestSeller: (id) => invoke('games:toggleBestSeller', id),
  },
  images: {
    listMeta: (gameId) => invoke('images:listMeta', gameId),
    add: (gameId, fileBuffer, originalName) => invoke('images:add', gameId, fileBuffer, originalName),
    getThumbnail: (imageId) => invoke('images:getThumbnail', imageId),
    getFull: (imageId) => invoke('images:getFull', imageId),
    remove: (imageId) => invoke('images:remove', imageId),
    setCover: (gameId, imageId) => invoke('images:setCover', gameId, imageId),
    reorder: (gameId, orderedIds) => invoke('images:reorder', gameId, orderedIds),
  },
  importExport: {
    exportExcel: () => invoke('export:excel'),
    exportCsv: () => invoke('export:csv'),
    pickImportFile: () => invoke('import:pickFile'),
    importFile: (filePath) => invoke('import:file', filePath),
  },
  backup: {
    backupTo: () => invoke('backup:create'),
    restoreFrom: () => invoke('backup:restore'),
  },
  meta: {
    getDbPath: () => invoke('meta:getDbPath'),
  },
  settings: {
    get: (key) => invoke('settings:get', key),
    set: (key, value) => invoke('settings:set', key, value),
  },
});
