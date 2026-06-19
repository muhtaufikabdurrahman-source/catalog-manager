// src/main/db/connection.js
//
// Membuka (atau membuat) file database SQLite di folder userData milik
// aplikasi (path standar Electron, aman dari hak akses & tidak bergantung
// folder instalasi). Mengatur PRAGMA performa supaya tetap responsif di
// skala puluhan ribu baris + ratusan ribu BLOB foto.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { app } = require('electron');
const { runMigrations } = require('./schema');

let dbInstance = null;

function getDbDirectory() {
  // app.getPath('userData') ada di:
  //   Windows: C:\Users\<user>\AppData\Roaming\Catalog Manager
  const dir = path.join(app.getPath('userData'), 'database');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getDbPath() {
  return path.join(getDbDirectory(), 'catalog.db');
}

function getDb() {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  dbInstance = new Database(dbPath);

  // PRAGMA tuning: WAL membuat tulis/baca konkuren lebih cepat & aman dari
  // korupsi saat crash; cache besar membantu scroll/search instan.
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('synchronous = NORMAL');
  dbInstance.pragma('foreign_keys = ON');
  dbInstance.pragma('cache_size = -64000'); // ~64MB cache halaman
  dbInstance.pragma('temp_store = MEMORY');

  runMigrations(dbInstance);

  return dbInstance;
}

function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

module.exports = { getDb, closeDb, getDbPath, getDbDirectory };
