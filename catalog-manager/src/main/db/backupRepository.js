// src/main/db/backupRepository.js
//
// Backup = copy file SQLite ke lokasi pilihan user.
// Restore = copy file dari lokasi pilihan, tutup koneksi lama, ganti file, reconnect.

const fs = require('fs');
const path = require('path');
const { getDbPath, closeDb, reopenDb } = require('./connection');

async function createBackup(destPath) {
  const src = getDbPath();
  fs.copyFileSync(src, destPath);
  return { success: true, path: destPath };
}

async function restoreBackup(srcPath) {
  // Validasi: pastikan file yang dipilih adalah SQLite valid
  const header = Buffer.alloc(16);
  const fd = fs.openSync(srcPath, 'r');
  fs.readSync(fd, header, 0, 16, 0);
  fs.closeSync(fd);
  if (header.toString('utf8', 0, 6) !== 'SQLite') {
    throw new Error('File yang dipilih bukan database SQLite yang valid.');
  }

  const dest = getDbPath();
  closeDb();
  fs.copyFileSync(srcPath, dest);
  reopenDb();
  return { success: true };
}

module.exports = { createBackup, restoreBackup };
