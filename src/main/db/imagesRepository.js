// src/main/db/imagesRepository.js
//
// Menyimpan foto sebagai BLOB langsung di SQLite (bukan path file), sesuai
// requirement: foto tetap ada walau file asli di komputer pengguna dihapus.
// Setiap foto dikompres ke ukuran "full" (long-edge ~1600px) dan dibuat
// thumbnail kecil (~300px) terpisah agar grid view & lazy loading tetap cepat
// walau katalog berisi ratusan ribu foto.

const { randomUUID } = require('crypto');
const sharp = require('sharp');
const { getDb } = require('./connection');

const FULL_MAX_EDGE = 1600;
const THUMB_MAX_EDGE = 300;
const FULL_JPEG_QUALITY = 80;
const THUMB_JPEG_QUALITY = 70;

async function compressImage(buffer) {
  const image = sharp(buffer, { failOn: 'none' });
  const metadata = await image.metadata();

  const fullBuffer = await image
    .clone()
    .rotate() // auto-orient berdasarkan EXIF sebelum strip metadata
    .resize({ width: FULL_MAX_EDGE, height: FULL_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: FULL_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const thumbBuffer = await image
    .clone()
    .rotate()
    .resize({ width: THUMB_MAX_EDGE, height: THUMB_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: THUMB_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const fullMeta = await sharp(fullBuffer).metadata();

  return {
    fullBuffer,
    thumbBuffer,
    width: fullMeta.width,
    height: fullMeta.height,
    originalWidth: metadata.width,
    originalHeight: metadata.height
  };
}

/**
 * Menambahkan satu foto ke sebuah game. buffer adalah Buffer biner mentah
 * dari file yang di-drag & drop / dipilih user.
 */
async function addImage(gameId, buffer, originalName) {
  const db = getDb();
  const { fullBuffer, thumbBuffer, width, height } = await compressImage(buffer);

  const id = randomUUID();
  const ts = new Date().toISOString();

  const maxOrderRow = db.prepare(
    `SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM images WHERE game_id = ?`
  ).get(gameId);
  const sortOrder = maxOrderRow.maxOrder + 1;

  db.prepare(
    `INSERT INTO images (id, game_id, sort_order, mime_type, original_name, full_data, thumb_data, width, height, byte_size, created_at)
     VALUES (?, ?, ?, 'image/jpeg', ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, gameId, sortOrder, originalName || null, fullBuffer, thumbBuffer, width, height, fullBuffer.length, ts);

  // Jika game belum punya cover, jadikan foto pertama ini sebagai cover otomatis.
  const game = db.prepare(`SELECT cover_image_id FROM games WHERE id = ?`).get(gameId);
  if (game && !game.cover_image_id) {
    db.prepare(`UPDATE games SET cover_image_id = ? WHERE id = ?`).run(id, gameId);
  }

  return { id, gameId, sortOrder, width, height, byteSize: fullBuffer.length, createdAt: ts };
}

function listImageMeta(gameId) {
  // Hanya metadata (TANPA blob) supaya daftar foto ringan dimuat; thumbnail
  // diambil terpisah per-id lewat getThumbnail (lazy loading).
  const db = getDb();
  const rows = db.prepare(
    `SELECT id, game_id, sort_order, mime_type, original_name, width, height, byte_size, created_at
     FROM images WHERE game_id = ? ORDER BY sort_order ASC`
  ).all(gameId);
  return rows.map(r => ({
    id: r.id,
    gameId: r.game_id,
    sortOrder: r.sort_order,
    mimeType: r.mime_type,
    originalName: r.original_name,
    width: r.width,
    height: r.height,
    byteSize: r.byte_size,
    createdAt: r.created_at
  }));
}

function getThumbnail(imageId) {
  const db = getDb();
  const row = db.prepare(`SELECT thumb_data, mime_type FROM images WHERE id = ?`).get(imageId);
  if (!row) return null;
  return { data: row.thumb_data, mimeType: row.mime_type };
}

function getFullImage(imageId) {
  const db = getDb();
  const row = db.prepare(`SELECT full_data, mime_type FROM images WHERE id = ?`).get(imageId);
  if (!row) return null;
  return { data: row.full_data, mimeType: row.mime_type };
}

function deleteImage(imageId) {
  const db = getDb();
  const img = db.prepare(`SELECT game_id FROM images WHERE id = ?`).get(imageId);
  if (!img) return;

  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM images WHERE id = ?`).run(imageId);

    // Jika foto yang dihapus adalah cover, pilih cover baru otomatis (foto pertama tersisa).
    const game = db.prepare(`SELECT cover_image_id FROM games WHERE id = ?`).get(img.game_id);
    if (game && game.cover_image_id === imageId) {
      const next = db.prepare(`SELECT id FROM images WHERE game_id = ? ORDER BY sort_order ASC LIMIT 1`).get(img.game_id);
      db.prepare(`UPDATE games SET cover_image_id = ? WHERE id = ?`).run(next ? next.id : null, img.game_id);
    }
  });
  tx();
}

function setCoverImage(gameId, imageId) {
  const db = getDb();
  db.prepare(`UPDATE games SET cover_image_id = ? WHERE id = ?`).run(imageId, gameId);
}

function reorderImages(gameId, orderedImageIds) {
  const db = getDb();
  const tx = db.transaction(() => {
    orderedImageIds.forEach((imgId, index) => {
      db.prepare(`UPDATE images SET sort_order = ? WHERE id = ? AND game_id = ?`).run(index, imgId, gameId);
    });
  });
  tx();
}

module.exports = {
  addImage,
  listImageMeta,
  getThumbnail,
  getFullImage,
  deleteImage,
  setCoverImage,
  reorderImages
};
