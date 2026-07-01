// src/main/db/exportRepository.js
//
// Export Excel/CSV dan Import (upsert: jika nama+platform sudah ada → update).
// Foto tidak diikutkan karena disimpan sebagai BLOB terpisah.

const ExcelJS = require('exceljs');
const { randomUUID } = require('crypto');
const { getDb } = require('./connection');
const { recordPriceHistoryPublic } = require('./gamesRepository');

function nowIso() { return new Date().toISOString(); }

function parseRegionStr(val) {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    if (Array.isArray(p)) return p;
  } catch (_) {}
  return [val];
}

// ---------- EXPORT ----------

async function exportExcel(filePath) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM games WHERE is_deleted = 0 ORDER BY name ASC`
  ).all();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'CatalogManager';
  const ws = wb.addWorksheet('Katalog Game');

  ws.columns = [
    { header: 'ID (jangan diubah/dihapus)', key: 'id',       width: 10 },
    { header: 'Nama Game',       key: 'name',               width: 35 },
    { header: 'Platform',        key: 'platform',            width: 12 },
    { header: 'Platform Custom', key: 'platform_custom',     width: 16 },
    { header: 'Region',          key: 'region',              width: 22 },
    { header: 'Kondisi',         key: 'condition',           width: 10 },
    { header: 'Harga Beli',      key: 'buy_price',           width: 14 },
    { header: 'Jual Offline',    key: 'sell_price_offline',  width: 14 },
    { header: 'Setting Shopee',  key: 'sell_price_shopee',   width: 14 },
    { header: 'Best Seller',     key: 'is_best_seller',      width: 12 },
    { header: 'Catatan',         key: 'notes',               width: 30 },
    { header: 'Dibuat',          key: 'created_at',          width: 22 },
    { header: 'Diupdate',        key: 'updated_at',          width: 22 },
  ];

  // Style header row
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEFF' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFBBC4E8' } } };
  });

  // Kolom ID disembunyikan (bukan dihapus) supaya tidak mengganggu user saat
  // edit manual, tapi tetap ikut ter-export sebagai kunci pencocokan saat import.
  ws.getColumn('id').hidden = true;

  for (const row of rows) {
    ws.addRow({
      id: row.id,
      name: row.name,
      platform: row.platform === '__custom__' ? row.platform_custom : row.platform,
      platform_custom: row.platform_custom || '',
      region: parseRegionStr(row.region).join(', '),
      condition: row.condition,
      buy_price: row.buy_price,
      sell_price_offline: row.sell_price_offline,
      sell_price_shopee: row.sell_price_shopee,
      is_best_seller: row.is_best_seller === 1 ? 'Ya' : 'Tidak',
      notes: row.notes || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  // Format kolom harga sebagai angka Rp
  ['buy_price', 'sell_price_offline', 'sell_price_shopee'].forEach((key) => {
    const col = ws.getColumn(key);
    col.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.numFmt = '#,##0';
      }
    });
  });

  await wb.xlsx.writeFile(filePath);
  return { count: rows.length };
}

async function exportCsv(filePath) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM games WHERE is_deleted = 0 ORDER BY name ASC`
  ).all();

  const headers = [
    'ID (jangan diubah/dihapus)',
    'Nama Game', 'Platform', 'Platform Custom', 'Region', 'Kondisi',
    'Harga Beli', 'Jual Offline', 'Setting Shopee', 'Best Seller', 'Catatan',
    'Dibuat', 'Diupdate'
  ];

  function escCsv(val) {
    const s = String(val === null || val === undefined ? '' : val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }

  const lines = [headers.map(escCsv).join(',')];
  for (const row of rows) {
    lines.push([
      row.id,
      row.name,
      row.platform === '__custom__' ? row.platform_custom : row.platform,
      row.platform_custom || '',
      parseRegionStr(row.region).join('; '),
      row.condition,
      row.buy_price,
      row.sell_price_offline,
      row.sell_price_shopee,
      row.is_best_seller === 1 ? 'Ya' : 'Tidak',
      row.notes || '',
      row.created_at,
      row.updated_at,
    ].map(escCsv).join(','));
  }

  const fs = require('fs');
  // BOM UTF-8 agar Excel bisa buka langsung
  fs.writeFileSync(filePath, '\uFEFF' + lines.join('\r\n'), 'utf8');
  return { count: rows.length };
}

// ---------- IMPORT (upsert) ----------
// Kolom wajib: Nama Game, Platform, Region, Kondisi
// Match key: nama (case-insensitive trim) + platform
// Jika sudah ada → update; jika belum → insert baru.

async function importFile(filePath) {
  const db = getDb();
  const ext = filePath.split('.').pop().toLowerCase();

  let dataRows = [];

  if (ext === 'xlsx' || ext === 'xls') {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.worksheets[0];

    let headers = [];
    ws.eachRow((row, rowNumber) => {
      const vals = row.values.slice(1); // exceljs row.values[0] selalu null
      if (rowNumber === 1) {
        headers = vals.map((v) => String(v || '').trim().toLowerCase());
      } else {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] !== undefined ? vals[i] : ''; });
        dataRows.push(obj);
      }
    });
  } else if (ext === 'csv') {
    const fs = require('fs');
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1); // strip BOM

    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return { inserted: 0, updated: 0, skipped: 0, errors: [] };

    function parseCsvLine(line) {
      const result = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
          else inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
          result.push(cur); cur = '';
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result;
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCsvLine(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] !== undefined ? vals[idx] : ''; });
      dataRows.push(obj);
    }
  } else {
    throw new Error('Format file tidak didukung. Gunakan .xlsx atau .csv');
  }

  // Normalisasi header alias (mendukung header export kita sendiri)
  const headerMap = {
    'id (jangan diubah/dihapus)': 'id', 'id': 'id',
    'nama game': 'name', 'name': 'name',
    'platform': 'platform',
    'platform custom': 'platform_custom',
    'region': 'region',
    'kondisi': 'condition', 'condition': 'condition',
    'harga beli': 'buy_price',
    'jual offline': 'sell_price_offline',
    'setting shopee': 'sell_price_shopee',
    'best seller': 'is_best_seller',
    'catatan': 'notes', 'notes': 'notes',
  };

  function normalizeRow(raw) {
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      const mapped = headerMap[k.trim().toLowerCase()];
      if (mapped) out[mapped] = typeof v === 'object' && v !== null ? String(v) : v;
    }
    return out;
  }

  const VALID_PLATFORMS = ['PS1','PS2','PS3','PS4','PS5','PSP','PSVita','NDS','3DS','Switch 1','Switch 2'];
  const VALID_CONDITIONS = ['Loose','CIB','CIB+','Sealed'];

  let inserted = 0, updated = 0, skipped = 0;
  const errors = [];
  const ts = nowIso();

  const tx = db.transaction(() => {
    for (let i = 0; i < dataRows.length; i++) {
      const raw = normalizeRow(dataRows[i]);
      const rowNum = i + 2;

      const name = String(raw.name || '').trim();
      if (!name) { skipped++; continue; }

      // Platform: jika tidak ada di list standar, jadikan custom
      let platform = String(raw.platform || '').trim();
      let platformCustom = String(raw.platform_custom || '').trim();
      if (!VALID_PLATFORMS.includes(platform)) {
        platformCustom = platform || platformCustom;
        platform = '__custom__';
      }
      if (!platform) { errors.push(`Baris ${rowNum}: Platform kosong`); skipped++; continue; }

      const regionRaw = String(raw.region || '').trim();
      const regions = regionRaw
        ? regionRaw.split(/[,;]+/).map((r) => r.trim()).filter(Boolean)
        : [];
      if (regions.length === 0) { errors.push(`Baris ${rowNum}: Region kosong`); skipped++; continue; }

      let condition = String(raw.condition || '').trim();
      if (!VALID_CONDITIONS.includes(condition)) condition = 'Loose';

      const parsePrice = (v) => {
        const n = parseFloat(String(v || '0').replace(/[^0-9.-]/g, ''));
        return isNaN(n) ? 0 : Math.max(0, Math.round(n));
      };
      const buyPrice = parsePrice(raw.buy_price);
      const sellOffline = parsePrice(raw.sell_price_offline);
      const sellShopee = parsePrice(raw.sell_price_shopee);
      const isBestSeller = /^(ya|yes|1|true)$/i.test(String(raw.is_best_seller || '')) ? 1 : 0;
      const notes = String(raw.notes || '').trim() || null;

      // Cari existing: utamakan match by ID (stabil walau nama/platform diubah
      // di Excel). Kalau tidak ada kolom ID (file lama) atau ID tidak ketemu,
      // fallback ke match nama (case-insensitive) + platform seperti sebelumnya.
      const idRaw = raw.id !== undefined && raw.id !== null ? String(raw.id).trim() : '';
      let existing = null;
      if (idRaw) {
        existing = db.prepare(
          `SELECT * FROM games WHERE id = ? AND is_deleted = 0`
        ).get(idRaw);
      }
      if (!existing) {
        existing = db.prepare(
          `SELECT * FROM games WHERE LOWER(TRIM(name)) = LOWER(?) AND platform = ? AND is_deleted = 0`
        ).get(name, platform);
      }

      if (existing) {
        // Update
        const PRICE_FIELDS = ['buy_price', 'sell_price_offline', 'sell_price_shopee'];
        const newVals = { buy_price: buyPrice, sell_price_offline: sellOffline, sell_price_shopee: sellShopee };
        for (const f of PRICE_FIELDS) {
          if (existing[f] !== newVals[f]) {
            db.prepare(
              `INSERT INTO price_history (id, game_id, field, old_value, new_value, changed_at)
               VALUES (?, ?, ?, ?, ?, ?)`
            ).run(randomUUID(), existing.id, f, existing[f], newVals[f], ts);
          }
        }
        db.prepare(
          `UPDATE games SET
            name = ?, platform = ?, platform_custom = ?, region = ?, condition = ?,
            buy_price = ?, sell_price_offline = ?, sell_price_shopee = ?,
            is_best_seller = ?, notes = ?, updated_at = ?
           WHERE id = ?`
        ).run(
          name,
          platform,
          platformCustom || null,
          JSON.stringify(regions),
          condition,
          buyPrice, sellOffline, sellShopee,
          isBestSeller, notes, ts,
          existing.id
        );
        updated++;
      } else {
        // Insert baru
        const id = randomUUID();
        db.prepare(
          `INSERT INTO games
            (id, name, platform, platform_custom, region, condition,
             buy_price, sell_price_offline, sell_price_shopee,
             is_best_seller, notes, is_deleted, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
        ).run(
          id, name, platform, platformCustom || null,
          JSON.stringify(regions), condition,
          buyPrice, sellOffline, sellShopee,
          isBestSeller, notes, ts, ts
        );
        inserted++;
      }
    }
  });

  tx();
  return { inserted, updated, skipped, errors };
}

module.exports = { exportExcel, exportCsv, importFile };
