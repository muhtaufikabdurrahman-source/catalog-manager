// src/main/db/gamesRepository.js
//
// Lapisan akses data untuk tabel `games`. Semua perubahan harga otomatis
// dicatat ke `price_history`. Hapus bersifat soft-delete (is_deleted=1) agar
// undo masih memungkinkan; pembersihan permanen dilakukan terpisah jika perlu.

const { randomUUID } = require('crypto');
const { getDb } = require('./connection');

const PRICE_FIELDS = ['buy_price', 'sell_price_offline', 'sell_price_shopee'];

function nowIso() {
  return new Date().toISOString();
}

function parseRegion(region) {
  if (!region) return [];
  try {
    const parsed = JSON.parse(region);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  return [region];
}

function rowToGame(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    platform: row.platform,
    platformCustom: row.platform_custom,
    region: parseRegion(row.region),
    condition: row.condition,
    buyPrice: row.buy_price,
    sellPriceOffline: row.sell_price_offline,
    sellPriceShopee: row.sell_price_shopee,
    notes: row.notes,
    coverImageId: row.cover_image_id,
    isBestSeller: row.is_best_seller === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    imageCount: row.image_count ?? undefined
  };
}

/**
 * Mencatat riwayat perubahan harga untuk satu field, hanya jika nilainya
 * benar-benar berubah.
 */
function recordPriceHistory(db, gameId, field, oldValue, newValue, timestamp) {
  if (oldValue === newValue) return;
  db.prepare(
    `INSERT INTO price_history (id, game_id, field, old_value, new_value, changed_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(randomUUID(), gameId, field, oldValue, newValue, timestamp);
}

function createGame(input) {
  const db = getDb();
  const id = randomUUID();
  const ts = nowIso();

  db.prepare(
    `INSERT INTO games
      (id, name, platform, platform_custom, region, condition,
       buy_price, sell_price_offline, sell_price_shopee, notes,
       cover_image_id, is_deleted, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?)`
  ).run(
    id,
    input.name,
    input.platform,
    input.platformCustom || null,
    JSON.stringify(Array.isArray(input.region) ? input.region : [input.region]),
    input.condition,
    input.buyPrice || 0,
    input.sellPriceOffline || 0,
    input.sellPriceShopee || 0,
    input.notes || null,
    ts,
    ts
  );

  // Catat harga awal sebagai entri pertama riwayat (old_value = null).
  for (const field of PRICE_FIELDS) {
    const key = field === 'buy_price' ? 'buyPrice' : field === 'sell_price_offline' ? 'sellPriceOffline' : 'sellPriceShopee';
    if (input[key]) {
      recordPriceHistory(db, id, field, null, input[key], ts);
    }
  }

  return getGameById(id);
}

function getGameById(id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM games WHERE id = ? AND is_deleted = 0`).get(id);
  return rowToGame(row);
}

function updateGame(id, input) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM games WHERE id = ?`).get(id);
  if (!existing) throw new Error('Game tidak ditemukan');

  const ts = nowIso();

  const fieldMap = {
    buy_price: input.buyPrice,
    sell_price_offline: input.sellPriceOffline,
    sell_price_shopee: input.sellPriceShopee
  };

  const tx = db.transaction(() => {
    for (const field of PRICE_FIELDS) {
      const newVal = fieldMap[field];
      if (newVal !== undefined && newVal !== existing[field]) {
        recordPriceHistory(db, id, field, existing[field], newVal, ts);
      }
    }

    db.prepare(
      `UPDATE games SET
        name = ?, platform = ?, platform_custom = ?, region = ?, condition = ?,
        buy_price = ?, sell_price_offline = ?, sell_price_shopee = ?, notes = ?,
        cover_image_id = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      input.name ?? existing.name,
      input.platform ?? existing.platform,
      input.platformCustom !== undefined ? input.platformCustom : existing.platform_custom,
      (input.region !== undefined ? JSON.stringify(Array.isArray(input.region) ? input.region : [input.region]) : existing.region),
      input.condition ?? existing.condition,
      input.buyPrice ?? existing.buy_price,
      input.sellPriceOffline ?? existing.sell_price_offline,
      input.sellPriceShopee ?? existing.sell_price_shopee,
      input.notes !== undefined ? input.notes : existing.notes,
      input.coverImageId !== undefined ? input.coverImageId : existing.cover_image_id,
      ts,
      id
    );
  });
  tx();

  return getGameById(id);
}

function softDeleteGame(id) {
  const db = getDb();
  const ts = nowIso();
  db.prepare(`UPDATE games SET is_deleted = 1, updated_at = ? WHERE id = ?`).run(ts, id);
}

function restoreGame(id) {
  const db = getDb();
  const ts = nowIso();
  db.prepare(`UPDATE games SET is_deleted = 0, updated_at = ? WHERE id = ?`).run(ts, id);
}

function duplicateGame(id) {
  const db = getDb();
  const original = db.prepare(`SELECT * FROM games WHERE id = ?`).get(id);
  if (!original) throw new Error('Game tidak ditemukan');

  const newId = randomUUID();
  const ts = nowIso();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO games
        (id, name, platform, platform_custom, region, condition,
         buy_price, sell_price_offline, sell_price_shopee, notes,
         cover_image_id, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?, ?)`
    ).run(
      newId,
      `${original.name} (Copy)`,
      original.platform,
      original.platform_custom,
      original.region,
      original.condition,
      0,  // buy_price dikosongkan
      0,  // sell_price_offline dikosongkan
      0,  // sell_price_shopee dikosongkan
      original.notes,
      ts,
      ts
    );

    // Duplikasi juga foto-fotonya supaya item baru identik secara visual.
    const images = db.prepare(`SELECT * FROM images WHERE game_id = ?`).all(id);
    let newCoverId = null;
    for (const img of images) {
      const newImgId = randomUUID();
      db.prepare(
        `INSERT INTO images (id, game_id, sort_order, mime_type, original_name, full_data, thumb_data, width, height, byte_size, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(newImgId, newId, img.sort_order, img.mime_type, img.original_name, img.full_data, img.thumb_data, img.width, img.height, img.byte_size, ts);
      if (img.id === original.cover_image_id) newCoverId = newImgId;
    }
    if (newCoverId) {
      db.prepare(`UPDATE games SET cover_image_id = ? WHERE id = ?`).run(newCoverId, newId);
    }
  });
  tx();

  return getGameById(newId);
}

/**
 * Query utama katalog dengan dukungan search realtime (FTS5), filter, dan sort.
 * Dirancang agar tetap cepat pada 50.000+ baris karena memakai indeks & FTS.
 */
function listGames(options = {}) {
  const db = getDb();
  const {
    search = '',
    platform = null,
    region = null,
    condition = null,
    minPrice = null,
    maxPrice = null,
    priceField = 'sell_price_offline',
    isBestSeller = null,
    sortBy = 'updated_at',
    sortDir = 'desc',
    limit = 100,
    offset = 0
  } = options;

  const validSortFields = new Set([
    'name', 'platform', 'region', 'buy_price',
    'sell_price_offline', 'sell_price_shopee', 'created_at', 'updated_at'
  ]);
  const safeSortBy = validSortFields.has(sortBy) ? sortBy : 'updated_at';
  const safeSortDir = sortDir === 'asc' ? 'ASC' : 'DESC';

  const where = ['g.is_deleted = 0'];
  const params = {};

  if (platform) {
    where.push('g.platform = @platform');
    params.platform = platform;
  }
  if (region) {
    // region stored as JSON array string; match if it contains the region value
    where.push("(g.region = @regionExact OR g.region LIKE @regionLike)");
    params.regionExact = JSON.stringify([region]);
    params.regionLike = '%"' + region + '"%';
  }
  if (condition) {
    where.push('g.condition = @condition');
    params.condition = condition;
  }
  if (minPrice !== null) {
    where.push(`g.${priceField} >= @minPrice`);
    params.minPrice = minPrice;
  }
  if (maxPrice !== null) {
    where.push(`g.${priceField} <= @maxPrice`);
    params.maxPrice = maxPrice;
  }
  if (isBestSeller !== null) {
    where.push('g.is_best_seller = @isBestSeller');
    params.isBestSeller = isBestSeller ? 1 : 0;
  }

  let fromClause = 'games g';
  if (search && search.trim()) {
    // FTS5 prefix search untuk realtime-search yang responsif sambil mengetik.
    const ftsQuery = search.trim().split(/\s+/).map(t => `${t.replace(/"/g, '')}*`).join(' ');
    fromClause = `games_fts f JOIN games g ON g.rowid = f.rowid`;
    where.push('games_fts MATCH @ftsQuery');
    params.ftsQuery = ftsQuery;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as cnt FROM ${fromClause} ${whereSql}`;
  const total = db.prepare(countSql).get(params).cnt;

  const dataSql = `
    SELECT g.*, (SELECT COUNT(*) FROM images i WHERE i.game_id = g.id) as image_count
    FROM ${fromClause}
    ${whereSql}
    ORDER BY g.${safeSortBy} ${safeSortDir}
    LIMIT @limit OFFSET @offset
  `;
  const rows = db.prepare(dataSql).all({ ...params, limit, offset });

  return {
    items: rows.map(rowToGame),
    total
  };
}

function getPriceHistory(gameId) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM price_history WHERE game_id = ? ORDER BY changed_at DESC`
  ).all(gameId);
  return rows.map(r => ({
    id: r.id,
    field: r.field,
    oldValue: r.old_value,
    newValue: r.new_value,
    changedAt: r.changed_at
  }));
}

function bulkDelete(ids) {
  const db = getDb();
  const ts = nowIso();
  const tx = db.transaction((idList) => {
    const stmt = db.prepare(`UPDATE games SET is_deleted = 1, updated_at = ? WHERE id = ?`);
    for (const id of idList) stmt.run(ts, id);
  });
  tx(ids);
}

function bulkUpdatePrice({ ids, field, mode, value }) {
  // mode: 'set' (samakan nilai), 'increase_percent', 'decrease_percent', 'increase_amount', 'decrease_amount'
  const db = getDb();
  const ts = nowIso();
  if (!PRICE_FIELDS.includes(field)) throw new Error('Field harga tidak valid');

  const tx = db.transaction((idList) => {
    const getStmt = db.prepare(`SELECT id, ${field} as current FROM games WHERE id = ?`);
    const updateStmt = db.prepare(`UPDATE games SET ${field} = ?, updated_at = ? WHERE id = ?`);

    for (const id of idList) {
      const row = getStmt.get(id);
      if (!row) continue;
      let newValue = row.current;
      switch (mode) {
        case 'set': newValue = value; break;
        case 'increase_percent': newValue = row.current * (1 + value / 100); break;
        case 'decrease_percent': newValue = row.current * (1 - value / 100); break;
        case 'increase_amount': newValue = row.current + value; break;
        case 'decrease_amount': newValue = row.current - value; break;
        default: throw new Error('Mode bulk update tidak dikenal');
      }
      newValue = Math.max(0, Math.round(newValue));
      recordPriceHistory(db, id, field, row.current, newValue, ts);
      updateStmt.run(newValue, ts, id);
    }
  });
  tx(ids);
}

function toggleBestSeller(id) {
  const db = getDb();
  const row = db.prepare(`SELECT is_best_seller FROM games WHERE id = ?`).get(id);
  if (!row) throw new Error('Game tidak ditemukan');
  const next = row.is_best_seller === 1 ? 0 : 1;
  db.prepare(`UPDATE games SET is_best_seller = ?, updated_at = ? WHERE id = ?`).run(next, nowIso(), id);
  return { isBestSeller: next === 1 };
}

module.exports = {
  createGame,
  getGameById,
  updateGame,
  softDeleteGame,
  restoreGame,
  duplicateGame,
  listGames,
  getPriceHistory,
  bulkDelete,
  bulkUpdatePrice,
  toggleBestSeller
};
