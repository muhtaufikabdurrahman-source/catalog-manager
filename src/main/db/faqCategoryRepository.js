// src/main/db/faqCategoryRepository.js
//
// Override untuk kategori FAQ yang labelnya didefinisikan statis di
// src/shared/constants.json (FAQ_CATEGORIES). Tabel ini menyimpan:
//  - desc: deskripsi kategori versi pengguna (menggantikan teks default)
//  - icon_mime/icon_data/icon_thumb: gambar icon kategori (menggantikan
//    emoji default) yang di-upload lewat UI landing page FAQ.
//
// Polanya sama seperti imagesRepository.js: gambar dikompres dengan Jimp
// jadi versi penuh (dipakai sebagai icon, max 256px) dan thumbnail kecil
// (dipakai di kartu landing, max 96px) supaya tidak membengkakkan database.

const Jimp = require('jimp');
const { getDb } = require('./connection');

const ICON_MAX_EDGE = 256;
const ICON_THUMB_MAX_EDGE = 96;

function nowIso() {
  return new Date().toISOString();
}

function rowToSettings(row) {
  if (!row) return null;
  return {
    category: row.category,
    desc: row.desc,
    hasIcon: !!row.icon_data,
    updatedAt: row.updated_at
  };
}

/** Ambil semua override (desc + flag hasIcon) untuk seluruh kategori. */
function getAllSettings() {
  const db = getDb();
  const rows = db.prepare(`SELECT category, desc, icon_data, updated_at FROM faq_category_settings`).all();
  const result = {};
  for (const r of rows) result[r.category] = rowToSettings(r);
  return result;
}

function ensureRow(db, category) {
  const existing = db.prepare(`SELECT category FROM faq_category_settings WHERE category = ?`).get(category);
  if (!existing) {
    db.prepare(
      `INSERT INTO faq_category_settings (category, desc, updated_at) VALUES (?, NULL, ?)`
    ).run(category, nowIso());
  }
}

/** Simpan/ubah deskripsi kustom untuk satu kategori (item #3, editable UI). */
function upsertDesc(category, desc) {
  const db = getDb();
  ensureRow(db, category);
  db.prepare(
    `UPDATE faq_category_settings SET desc = ?, updated_at = ? WHERE category = ?`
  ).run(desc && desc.trim() ? desc.trim() : null, nowIso(), category);
  return rowToSettings(db.prepare(`SELECT * FROM faq_category_settings WHERE category = ?`).get(category));
}

/** Upload gambar icon kustom untuk satu kategori (item #2). */
async function setIcon(category, buffer, mimeType) {
  const db = getDb();
  ensureRow(db, category);

  const image = await Jimp.read(Buffer.from(buffer));

  const full = image.clone();
  if (full.getWidth() > ICON_MAX_EDGE || full.getHeight() > ICON_MAX_EDGE) {
    full.scaleToFit(ICON_MAX_EDGE, ICON_MAX_EDGE);
  }
  const fullBuffer = await full.quality(85).getBufferAsync(Jimp.MIME_PNG);

  const thumb = image.clone();
  if (thumb.getWidth() > ICON_THUMB_MAX_EDGE || thumb.getHeight() > ICON_THUMB_MAX_EDGE) {
    thumb.scaleToFit(ICON_THUMB_MAX_EDGE, ICON_THUMB_MAX_EDGE);
  }
  const thumbBuffer = await thumb.quality(80).getBufferAsync(Jimp.MIME_PNG);

  db.prepare(
    `UPDATE faq_category_settings SET icon_mime = 'image/png', icon_data = ?, icon_thumb = ?, updated_at = ? WHERE category = ?`
  ).run(fullBuffer, thumbBuffer, nowIso(), category);

  return rowToSettings(db.prepare(`SELECT * FROM faq_category_settings WHERE category = ?`).get(category));
}

/** Hapus icon kustom, kembali memakai emoji default dari constants.json. */
function removeIcon(category) {
  const db = getDb();
  ensureRow(db, category);
  db.prepare(
    `UPDATE faq_category_settings SET icon_mime = NULL, icon_data = NULL, icon_thumb = NULL, updated_at = ? WHERE category = ?`
  ).run(nowIso(), category);
  return rowToSettings(db.prepare(`SELECT * FROM faq_category_settings WHERE category = ?`).get(category));
}

function getIconThumb(category) {
  const db = getDb();
  const row = db.prepare(`SELECT icon_thumb, icon_mime FROM faq_category_settings WHERE category = ?`).get(category);
  if (!row || !row.icon_thumb) return null;
  return { data: row.icon_thumb, mimeType: row.icon_mime };
}

function getIconFull(category) {
  const db = getDb();
  const row = db.prepare(`SELECT icon_data, icon_mime FROM faq_category_settings WHERE category = ?`).get(category);
  if (!row || !row.icon_data) return null;
  return { data: row.icon_data, mimeType: row.icon_mime };
}

module.exports = {
  getAllSettings,
  upsertDesc,
  setIcon,
  removeIcon,
  getIconThumb,
  getIconFull
};
