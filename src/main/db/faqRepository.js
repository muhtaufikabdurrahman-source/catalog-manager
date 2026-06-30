// src/main/db/faqRepository.js
//
// CRUD untuk menu "Pertanyaan" (FAQ). Gambar disimpan terpisah di tabel
// faq_images (pola sama seperti images untuk games), supaya satu pertanyaan
// bisa punya lebih dari satu gambar.

const { randomUUID } = require('crypto');
const { getDb } = require('./connection');

function nowIso() {
  return new Date().toISOString();
}

function rowToFaq(row) {
  if (!row) return null;
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    imageCount: row.image_count ?? undefined
  };
}

function listFaqs() {
  const db = getDb();
  const rows = db.prepare(
    `SELECT f.*, (SELECT COUNT(*) FROM faq_images i WHERE i.faq_id = f.id) as image_count
     FROM faq f ORDER BY f.sort_order ASC, f.created_at ASC`
  ).all();
  return rows.map(rowToFaq);
}

function getFaqById(id) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM faq WHERE id = ?`).get(id);
  return rowToFaq(row);
}

function createFaq(input) {
  const db = getDb();
  const id = randomUUID();
  const ts = nowIso();
  const maxOrderRow = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM faq`).get();
  const sortOrder = maxOrderRow.maxOrder + 1;

  db.prepare(
    `INSERT INTO faq (id, question, answer, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, input.question, input.answer || null, sortOrder, ts, ts);

  return getFaqById(id);
}

function updateFaq(id, input) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM faq WHERE id = ?`).get(id);
  if (!existing) throw new Error('Pertanyaan tidak ditemukan');
  const ts = nowIso();

  db.prepare(
    `UPDATE faq SET question = ?, answer = ?, updated_at = ? WHERE id = ?`
  ).run(
    input.question ?? existing.question,
    input.answer !== undefined ? input.answer : existing.answer,
    ts,
    id
  );

  return getFaqById(id);
}

function deleteFaq(id) {
  const db = getDb();
  db.prepare(`DELETE FROM faq WHERE id = ?`).run(id);
}

function reorderFaqs(orderedIds) {
  const db = getDb();
  const tx = db.transaction(() => {
    orderedIds.forEach((id, index) => {
      db.prepare(`UPDATE faq SET sort_order = ? WHERE id = ?`).run(index, id);
    });
  });
  tx();
}

module.exports = {
  listFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs
};
