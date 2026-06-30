// src/main/db/sidebarRepository.js
//
// Menyimpan urutan menu sidebar (drag-reorder tab) di app_meta, key
// 'sidebar_order', sebagai JSON array of nav keys.

const { getDb } = require('./connection');

const DEFAULT_ORDER = ['catalog', 'best-seller', 'faq', 'kaset-stores'];

function getSidebarOrder() {
  const db = getDb();
  const row = db.prepare(`SELECT value FROM app_meta WHERE key = 'sidebar_order'`).get();
  if (!row || !row.value) return DEFAULT_ORDER;
  try {
    const parsed = JSON.parse(row.value);
    if (Array.isArray(parsed) && parsed.length) {
      // Pastikan semua key default tetap ada (jaga-jaga ada fitur baru di masa depan)
      const merged = [...parsed];
      for (const key of DEFAULT_ORDER) {
        if (!merged.includes(key)) merged.push(key);
      }
      return merged.filter((k) => DEFAULT_ORDER.includes(k));
    }
  } catch (_) {}
  return DEFAULT_ORDER;
}

function setSidebarOrder(orderedKeys) {
  const db = getDb();
  db.prepare(`INSERT OR REPLACE INTO app_meta (key, value) VALUES ('sidebar_order', ?)`)
    .run(JSON.stringify(orderedKeys));
  return getSidebarOrder();
}

module.exports = { getSidebarOrder, setSidebarOrder, DEFAULT_ORDER };
