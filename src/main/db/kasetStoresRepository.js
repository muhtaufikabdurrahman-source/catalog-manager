// src/main/db/kasetStoresRepository.js
//
// CRUD untuk menu "Tempat Beli Kaset" — daftar toko/marketplace.

const { randomUUID } = require('crypto');
const { getDb } = require('./connection');

function nowIso() {
  return new Date().toISOString();
}

function rowToStore(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    city: row.city,
    notes: row.notes,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function listStores() {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM kaset_stores ORDER BY sort_order ASC, created_at ASC`).all();
  return rows.map(rowToStore);
}

function getStoreById(id) {
  const db = getDb();
  return rowToStore(db.prepare(`SELECT * FROM kaset_stores WHERE id = ?`).get(id));
}

function createStore(input) {
  const db = getDb();
  const id = randomUUID();
  const ts = nowIso();
  const maxOrderRow = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM kaset_stores`).get();
  const sortOrder = maxOrderRow.maxOrder + 1;

  db.prepare(
    `INSERT INTO kaset_stores (id, name, url, city, notes, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.name, input.url || null, input.city || null, input.notes || null, sortOrder, ts, ts);

  return getStoreById(id);
}

function updateStore(id, input) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM kaset_stores WHERE id = ?`).get(id);
  if (!existing) throw new Error('Toko tidak ditemukan');
  const ts = nowIso();

  db.prepare(
    `UPDATE kaset_stores SET name = ?, url = ?, city = ?, notes = ?, updated_at = ? WHERE id = ?`
  ).run(
    input.name ?? existing.name,
    input.url !== undefined ? input.url : existing.url,
    input.city !== undefined ? input.city : existing.city,
    input.notes !== undefined ? input.notes : existing.notes,
    ts,
    id
  );

  return getStoreById(id);
}

function deleteStore(id) {
  const db = getDb();
  db.prepare(`DELETE FROM kaset_stores WHERE id = ?`).run(id);
}

function reorderStores(orderedIds) {
  const db = getDb();
  const tx = db.transaction(() => {
    orderedIds.forEach((id, index) => {
      db.prepare(`UPDATE kaset_stores SET sort_order = ? WHERE id = ?`).run(index, id);
    });
  });
  tx();
}

module.exports = {
  listStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore,
  reorderStores
};
