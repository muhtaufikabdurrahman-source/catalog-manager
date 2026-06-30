import React, { useCallback, useEffect, useRef, useState } from 'react';
import FaqImageUploader from '../components/FaqImageUploader.jsx';
import { bufferToDataUrlPublic } from '../hooks/useLazyThumbnail.js';

function FaqAnswerImages({ faqId }) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    window.api.faqImages.listMeta(faqId).then((meta) => setCount(meta.length)).catch(() => setCount(0));
  }, [faqId]);
  if (!count) return null;
  return <span className="form-hint" style={{ marginTop: 4 }}>📷 {count} gambar terlampir</span>;
}

function FaqFormModal({ faq, onClose, onSaved, onDeleted }) {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [savedFaq, setSavedFaq] = useState(faq || null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!question.trim()) {
      alert('Pertanyaan tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      let result;
      if (savedFaq?.id) {
        result = await window.api.faq.update(savedFaq.id, { question, answer });
      } else {
        result = await window.api.faq.create({ question, answer });
      }
      setSavedFaq(result);
      onSaved(result);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!savedFaq?.id) { onClose(); return; }
    if (!confirm('Hapus pertanyaan ini? Gambar yang terlampir juga akan terhapus.')) return;
    await window.api.faq.remove(savedFaq.id);
    onDeleted(savedFaq.id);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{savedFaq?.id ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}</div>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Pertanyaan</label>
            <input
              className="form-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Misalnya: Apakah kaset bisa COD?"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Jawaban</label>
            <textarea
              className="form-textarea"
              rows={5}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Tulis jawaban di sini..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gambar Jawaban (opsional)</label>
            {savedFaq?.id ? (
              <FaqImageUploader faqId={savedFaq.id} />
            ) : (
              <div className="form-hint">Simpan pertanyaan terlebih dahulu untuk bisa melampirkan gambar.</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          {savedFaq?.id && (
            <button className="btn btn-danger" onClick={handleDelete} style={{ marginRight: 'auto' }}>
              Hapus
            </button>
          )}
          <button className="btn" onClick={onClose}>Tutup</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);
  const [creating, setCreating] = useState(false);
  const dragIdRef = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const items = await window.api.faq.list();
      setFaqs(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  function handleDragStart(id) { dragIdRef.current = id; }
  function handleDragOver(e, id) {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  }
  function handleDrop(targetId) {
    const sourceId = dragIdRef.current;
    dragIdRef.current = null;
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    setFaqs((prev) => {
      const next = [...prev];
      const sourceIdx = next.findIndex((f) => f.id === sourceId);
      const targetIdx = next.findIndex((f) => f.id === targetId);
      const [moved] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, moved);
      window.api.faq.reorder(next.map((f) => f.id)).catch(() => {});
      return next;
    });
  }

  return (
    <>
      <div className="topbar">
        <div style={{ fontWeight: 600, fontSize: 15 }}>Pertanyaan (FAQ)</div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Tambah Pertanyaan</button>
      </div>

      {loading && <div className="loading-bar" />}

      <div className="content-scroll">
        {faqs.length === 0 && !loading ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">❓</div>
            <div>Belum ada pertanyaan.</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-faint)' }}>
              Tambah pertanyaan yang sering ditanyakan pembeli beserta jawabannya.
            </div>
          </div>
        ) : (
          <div className="accordion-list">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                draggable
                onDragStart={() => handleDragStart(faq.id)}
                onDragOver={(e) => handleDragOver(e, faq.id)}
                onDrop={() => handleDrop(faq.id)}
                onDragEnd={() => setDragOverId(null)}
                className={`accordion-item ${dragOverId === faq.id ? 'accordion-item-drag-over' : ''}`}
              >
                <div
                  className="accordion-header"
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                >
                  <span className="accordion-drag-handle" aria-hidden="true">⋮⋮</span>
                  <span className="accordion-title">{faq.question}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {faq.imageCount > 0 && <span className="form-hint">📷 {faq.imageCount}</span>}
                    <button
                      className="btn btn-sm"
                      onClick={(e) => { e.stopPropagation(); setEditingFaq(faq); }}
                    >
                      Edit
                    </button>
                    <span className={`accordion-caret ${expandedId === faq.id ? 'open' : ''}`}>⌄</span>
                  </div>
                </div>
                {expandedId === faq.id && (
                  <div className="accordion-body">
                    <div style={{ whiteSpace: 'pre-wrap' }}>{faq.answer || <em style={{ color: 'var(--color-text-faint)' }}>Belum ada jawaban.</em>}</div>
                    <FaqAnswerThumbs faqId={faq.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editingFaq) && (
        <FaqFormModal
          faq={editingFaq}
          onClose={() => { setCreating(false); setEditingFaq(null); }}
          onSaved={() => { fetchFaqs(); }}
          onDeleted={() => { setCreating(false); setEditingFaq(null); fetchFaqs(); }}
        />
      )}
    </>
  );
}

function FaqAnswerThumbs({ faqId }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    let active = true;
    window.api.faqImages.listMeta(faqId).then(async (meta) => {
      const withThumbs = await Promise.all(
        meta.map(async (img) => {
          const thumb = await window.api.faqImages.getThumbnail(img.id);
          return { ...img, thumbSrc: thumb ? bufferToDataUrlPublic(thumb.data, thumb.mimeType) : null };
        })
      );
      if (active) setImages(withThumbs);
    });
    return () => { active = false; };
  }, [faqId]);

  if (images.length === 0) return null;

  return (
    <div className="image-thumb-list" style={{ marginTop: 12 }}>
      {images.map((img) => (
        <div key={img.id} className="image-thumb-item">
          {img.thumbSrc && <img src={img.thumbSrc} alt={img.originalName || ''} />}
        </div>
      ))}
    </div>
  );
}
