// src/main/db/faqImagesRepository.js
//
// Penyimpanan gambar untuk menu "Pertanyaan" (FAQ). Pola identik dengan
// imagesRepository.js milik games: BLOB di SQLite, full (~1600px) + thumb
// (~300px), dikompres pakai Jimp.

const { randomUUID } = require('crypto');
const Jimp = require('jimp');
const { getDb } = require('./connection');

const FULL_MAX_EDGE = 1600;
const THUMB_MAX_EDGE = 300;
const FULL_JPEG_QUALITY = 80;
const THUMB_JPEG_QUALITY = 70;

async function compressImage(buffer) {
  const image = await Jimp.read(Buffer.from(buffer));

  const fullImage = image.clone();
  const fw = fullImage.getWidth();
  const fh = fullImage.getHeight();
  if (fw > FULL_MAX_EDGE || fh > FULL_MAX_EDGE) {
    fullImage.scaleToFit(FULL_MAX_EDGE, FULL_MAX_EDGE);
  }
  fullImage.quality(FULL_JPEG_QUALITY);
  const fullBuffer = await fullImage.getBufferAsync(Jimp.MIME_JPEG);

  const thumbImage = image.clone();
  const tw = thumbImage.getWidth();
  const th = thumbImage.getHeight();
  if (tw > THUMB_MAX_EDGE || th > THUMB_MAX_EDGE) {
    thumbImage.scaleToFit(THUMB_MAX_EDGE, THUMB_MAX_EDGE);
  }
  thumbImage.quality(THUMB_JPEG_QUALITY);
  const thumbBuffer = await thumbImage.getBufferAsync(Jimp.MIME_JPEG);

  const fullRead = await Jimp.read(fullBuffer);

  return {
    fullBuffer,
    thumbBuffer,
    width: fullRead.getWidth(),
    height: fullRead.getHeight()
  };
}

async function addFaqImage(faqId, buffer, originalName) {
  const db = getDb();
  const { fullBuffer, thumbBuffer, width, height } = await compressImage(buffer);

  const id = randomUUID();
  const ts = new Date().toISOString();

  const maxOrderRow = db.prepare(
    `SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM faq_images WHERE faq_id = ?`
  ).get(faqId);
  const sortOrder = maxOrderRow.maxOrder + 1;

  db.prepare(
    `INSERT INTO faq_images (id, faq_id, sort_order, mime_type, original_name, full_data, thumb_data, width, height, byte_size, created_at)
     VALUES (?, ?, ?, 'image/jpeg', ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, faqId, sortOrder, originalName || null, fullBuffer, thumbBuffer, width, height, fullBuffer.length, ts);

  return { id, faqId, sortOrder, width, height, byteSize: fullBuffer.length, createdAt: ts };
}

function listFaqImageMeta(faqId) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT id, faq_id, sort_order, mime_type, original_name, width, height, byte_size, created_at
     FROM faq_images WHERE faq_id = ? ORDER BY sort_order ASC`
  ).all(faqId);
  return rows.map(r => ({
    id: r.id,
    faqId: r.faq_id,
    sortOrder: r.sort_order,
    mimeType: r.mime_type,
    originalName: r.original_name,
    width: r.width,
    height: r.height,
    byteSize: r.byte_size,
    createdAt: r.created_at
  }));
}

function getFaqThumbnail(imageId) {
  const db = getDb();
  const row = db.prepare(`SELECT thumb_data, mime_type FROM faq_images WHERE id = ?`).get(imageId);
  if (!row) return null;
  return { data: row.thumb_data, mimeType: row.mime_type };
}

function getFaqFullImage(imageId) {
  const db = getDb();
  const row = db.prepare(`SELECT full_data, mime_type FROM faq_images WHERE id = ?`).get(imageId);
  if (!row) return null;
  return { data: row.full_data, mimeType: row.mime_type };
}

function deleteFaqImage(imageId) {
  const db = getDb();
  db.prepare(`DELETE FROM faq_images WHERE id = ?`).run(imageId);
}

function reorderFaqImages(faqId, orderedImageIds) {
  const db = getDb();
  const tx = db.transaction(() => {
    orderedImageIds.forEach((imgId, index) => {
      db.prepare(`UPDATE faq_images SET sort_order = ? WHERE id = ? AND faq_id = ?`).run(index, imgId, faqId);
    });
  });
  tx();
}

module.exports = {
  addFaqImage,
  listFaqImageMeta,
  getFaqThumbnail,
  getFaqFullImage,
  deleteFaqImage,
  reorderFaqImages
};
