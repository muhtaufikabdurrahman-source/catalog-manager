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
    batchRecalcShopee: (params) => invoke('games:batchRecalcShopee', params),
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
  faq: {
    list: () => invoke('faq:list'),
    get: (id) => invoke('faq:get', id),
    create: (input) => invoke('faq:create', input),
    update: (id, input) => invoke('faq:update', id, input),
    remove: (id) => invoke('faq:remove', id),
    reorder: (orderedIds) => invoke('faq:reorder', orderedIds),
  },
  faqImages: {
    listMeta: (faqId) => invoke('faqImages:listMeta', faqId),
    add: (faqId, fileBuffer, originalName) => invoke('faqImages:add', faqId, fileBuffer, originalName),
    getThumbnail: (imageId) => invoke('faqImages:getThumbnail', imageId),
    getFull: (imageId) => invoke('faqImages:getFull', imageId),
    remove: (imageId) => invoke('faqImages:remove', imageId),
    reorder: (faqId, orderedIds) => invoke('faqImages:reorder', faqId, orderedIds),
  },
  kasetStores: {
    list: () => invoke('kasetStores:list'),
    get: (id) => invoke('kasetStores:get', id),
    create: (input) => invoke('kasetStores:create', input),
    update: (id, input) => invoke('kasetStores:update', id, input),
    remove: (id) => invoke('kasetStores:remove', id),
    reorder: (orderedIds) => invoke('kasetStores:reorder', orderedIds),
  },
  sidebar: {
    getOrder: () => invoke('sidebar:getOrder'),
    setOrder: (orderedKeys) => invoke('sidebar:setOrder', orderedKeys),
  },
  settings: {
    get: (key) => invoke('settings:get', key),
    set: (key, value) => invoke('settings:set', key, value),
  },
});
