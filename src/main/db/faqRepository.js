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
    category: row.category || 'umum',
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    imageCount: row.image_count ?? undefined
  };
}

function listFaqs(options = {}) {
  const db = getDb();
  const { category = null, search = '' } = options;
  const where = [];
  const params = {};

  if (category) {
    where.push('f.category = @category');
    params.category = category;
  }
  if (search && search.trim()) {
    where.push('(f.question LIKE @search OR f.answer LIKE @search)');
    params.search = `%${search.trim()}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(
    `SELECT f.*, (SELECT COUNT(*) FROM faq_images i WHERE i.faq_id = f.id) as image_count
     FROM faq f ${whereSql} ORDER BY f.sort_order ASC, f.created_at ASC`
  ).all(params);
  return rows.map(rowToFaq);
}

function countByCategory() {
  const db = getDb();
  const rows = db.prepare(
    `SELECT category, COUNT(*) as cnt FROM faq GROUP BY category`
  ).all();
  const result = {};
  for (const r of rows) result[r.category] = r.cnt;
  return result;
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
    `INSERT INTO faq (id, question, answer, category, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.question, input.answer || null, input.category || 'umum', sortOrder, ts, ts);

  return getFaqById(id);
}

function updateFaq(id, input) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM faq WHERE id = ?`).get(id);
  if (!existing) throw new Error('Pertanyaan tidak ditemukan');
  const ts = nowIso();

  db.prepare(
    `UPDATE faq SET question = ?, answer = ?, category = ?, updated_at = ? WHERE id = ?`
  ).run(
    input.question ?? existing.question,
    input.answer !== undefined ? input.answer : existing.answer,
    input.category ?? existing.category,
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
  countByCategory,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs
};
