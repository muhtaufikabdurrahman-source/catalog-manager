import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FAQ_CATEGORIES } from '@shared/constants.json';
import FaqImageUploader from '../components/FaqImageUploader.jsx';
import { bufferToDataUrlPublic } from '../hooks/useLazyThumbnail.js';

async function fileToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function categoryMeta(value) {
  return FAQ_CATEGORIES.find((c) => c.value === value) || FAQ_CATEGORIES[FAQ_CATEGORIES.length - 1];
}

function FaqFormModal({ faq, defaultCategory, onClose, onSaved, onDeleted }) {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [category, setCategory] = useState(faq?.category || defaultCategory || 'umum');
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
        result = await window.api.faq.update(savedFaq.id, { question, answer, category });
      } else {
        result = await window.api.faq.create({ question, answer, category });
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
            <label className="form-label">Kategori</label>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              {FAQ_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
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

// Daftar foto jawaban dengan caption otomatis "Foto 1, Foto 2, ..." dan
// bisa diklik untuk zoom (dipakai di tampilan accordion).
function FaqAnswerImages({ faqId }) {
  const [images, setImages] = useState([]);
  const [zoomIndex, setZoomIndex] = useState(null);

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

  async function openZoom(index) {
    const img = images[index];
    const full = await window.api.faqImages.getFull(img.id);
    setZoomIndex(index);
    if (full) {
      setImages((prev) => prev.map((it, i) => i === index ? { ...it, fullSrc: bufferToDataUrlPublic(full.data, full.mimeType) } : it));
    }
  }

  if (images.length === 0) return null;

  const zoomed = zoomIndex !== null ? images[zoomIndex] : null;

  return (
    <>
      <div className="image-thumb-list" style={{ marginTop: 12 }}>
        {images.map((img, idx) => (
          <div key={img.id} className="faq-thumb-item" style={{ cursor: 'zoom-in' }} onClick={() => openZoom(idx)}>
            {img.thumbSrc && <img src={img.thumbSrc} alt={`Foto ${idx + 1}`} />}
            <span className="faq-image-caption">Foto {idx + 1}</span>
          </div>
        ))}
      </div>

      {zoomed && (
        <div className="zoom-overlay" onClick={() => setZoomIndex(null)}>
          <button className="zoom-close" onClick={() => setZoomIndex(null)}>×</button>
          <div style={{ textAlign: 'center' }}>
            <img
              src={zoomed.fullSrc || zoomed.thumbSrc}
              alt={`Foto ${zoomIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{ color: '#fff', marginTop: 8, fontSize: 14 }}>Foto {zoomIndex + 1} dari {images.length}</div>
          </div>
        </div>
      )}
    </>
  );
}

// Satu kartu kategori di landing page FAQ. Mendukung:
//  - klik kartu (di luar area edit) -> masuk ke daftar pertanyaan kategori
//  - klik icon -> upload/ganti gambar icon kustom (item #2)
//  - klik ikon pensil di deskripsi -> edit deskripsi tersimpan ke DB (item #3)
function CategoryCard({ meta, count, settings, onSelectCategory, onIconChanged, onDescChanged }) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(settings?.desc || meta.desc);
  const [savingDesc, setSavingDesc] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setDescDraft(settings?.desc || meta.desc);
  }, [settings?.desc, meta.desc]);

  async function handleIconFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingIcon(true);
    try {
      const buffer = await fileToBuffer(file);
      const result = await window.api.faqCategory.setIcon(meta.value, buffer, file.type);
      onIconChanged(meta.value, result);
    } finally {
      setUploadingIcon(false);
    }
  }

  async function handleRemoveIcon(e) {
    e.stopPropagation();
    const result = await window.api.faqCategory.removeIcon(meta.value);
    onIconChanged(meta.value, result);
  }

  async function saveDesc() {
    setSavingDesc(true);
    try {
      const result = await window.api.faqCategory.upsertDesc(meta.value, descDraft);
      onDescChanged(meta.value, result);
      setEditingDesc(false);
    } finally {
      setSavingDesc(false);
    }
  }

  const iconSrc = settings?.thumbSrc || null;

  return (
    <div className="faq-landing-card" onClick={() => !editingDesc && onSelectCategory(meta.value)}>
      <div
        className="faq-landing-icon-wrap"
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        title="Klik untuk ganti gambar icon"
      >
        {iconSrc ? (
          <img src={iconSrc} alt={meta.label} className="faq-landing-icon-img" />
        ) : (
          <div className="faq-landing-icon">{meta.icon}</div>
        )}
        <div className="faq-landing-icon-overlay">{uploadingIcon ? '...' : '📷'}</div>
        {iconSrc && (
          <button className="faq-landing-icon-remove" onClick={handleRemoveIcon} title="Kembalikan ke icon default">×</button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleIconFile}
        />
      </div>

      <div className="faq-landing-title">{meta.label}</div>

      {editingDesc ? (
        <div className="faq-landing-desc-edit" onClick={(e) => e.stopPropagation()}>
          <textarea
            className="form-textarea"
            rows={3}
            autoFocus
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
            <button className="btn btn-sm" onClick={() => { setEditingDesc(false); setDescDraft(settings?.desc || meta.desc); }}>Batal</button>
            <button className="btn btn-sm btn-primary" onClick={saveDesc} disabled={savingDesc}>
              {savingDesc ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="faq-landing-desc" onClick={(e) => { e.stopPropagation(); setEditingDesc(true); }} title="Klik untuk edit deskripsi">
          {descDraft} <span className="faq-landing-desc-edit-icon">✎</span>
        </div>
      )}

      <div className="faq-landing-count">{count || 0} pertanyaan</div>
    </div>
  );
}

function CategoryLanding({ counts, categorySettings, onSelectCategory, onIconChanged, onDescChanged }) {
  return (
    <div className="faq-landing-grid">
      {FAQ_CATEGORIES.map((c) => (
        <CategoryCard
          key={c.value}
          meta={c}
          count={counts[c.value]}
          settings={categorySettings[c.value]}
          onSelectCategory={onSelectCategory}
          onIconChanged={onIconChanged}
          onDescChanged={onDescChanged}
        />
      ))}
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(null); // null = landing page
  const [counts, setCounts] = useState({});
  const [categorySettings, setCategorySettings] = useState({});
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);
  const [creating, setCreating] = useState(false);
  const dragIdRef = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCounts = useCallback(async () => {
    const c = await window.api.faq.countByCategory();
    setCounts(c);
  }, []);

  const fetchCategorySettings = useCallback(async () => {
    const all = await window.api.faqCategory.getAllSettings();
    const withThumbs = {};
    for (const c of FAQ_CATEGORIES) {
      const s = all[c.value];
      let thumbSrc = null;
      if (s?.hasIcon) {
        const thumb = await window.api.faqCategory.getIconThumb(c.value);
        if (thumb) thumbSrc = bufferToDataUrlPublic(thumb.data, thumb.mimeType);
      }
      withThumbs[c.value] = { ...s, thumbSrc };
    }
    setCategorySettings(withThumbs);
  }, []);

  function handleIconChanged(category, settings) {
    setCategorySettings((prev) => ({
      ...prev,
      [category]: { ...settings, thumbSrc: null }
    }));
    fetchCategorySettings();
  }

  function handleDescChanged(category, settings) {
    setCategorySettings((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...settings }
    }));
  }

  const fetchFaqs = useCallback(async () => {
    if (!activeCategory) return;
    setLoading(true);
    try {
      const items = await window.api.faq.list({ category: activeCategory, search: debouncedSearch });
      setFaqs(items);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchCategorySettings(); }, [fetchCategorySettings]);
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

  function refreshAfterChange() {
    fetchFaqs();
    fetchCounts();
  }

  // ── Landing page (kategori) ────────────────────────────────────────────
  if (!activeCategory) {
    return (
      <>
        <div className="topbar">
          <div style={{ fontWeight: 600, fontSize: 15 }}>Pertanyaan (FAQ)</div>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Tambah Pertanyaan</button>
        </div>
        <div className="content-scroll">
          <CategoryLanding
            counts={counts}
            categorySettings={categorySettings}
            onSelectCategory={setActiveCategory}
            onIconChanged={handleIconChanged}
            onDescChanged={handleDescChanged}
          />
        </div>

        {creating && (
          <FaqFormModal
            onClose={() => setCreating(false)}
            onSaved={(saved) => { fetchCounts(); }}
            onDeleted={() => { setCreating(false); fetchCounts(); }}
          />
        )}
      </>
    );
  }

  // ── Daftar pertanyaan dalam satu kategori ──────────────────────────────
  const meta = categoryMeta(activeCategory);

  return (
    <>
      <div className="topbar">
        <button className="btn btn-sm" onClick={() => setActiveCategory(null)}>← Kategori</button>
        <div className="search-box" style={{ marginLeft: 12 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, color: 'var(--color-text-muted, #888)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder={`Cari pertanyaan ${meta.label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 'auto', marginRight: 12 }}>
          {meta.icon} {meta.label} · {faqs.length} pertanyaan
        </span>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Tambah Pertanyaan</button>
      </div>

      {loading && <div className="loading-bar" />}

      <div className="content-scroll">
        {faqs.length === 0 && !loading ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">{meta.icon}</div>
            <div>Belum ada pertanyaan di kategori {meta.label}.</div>
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
                    <FaqAnswerImages faqId={faq.id} />
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
          defaultCategory={activeCategory}
          onClose={() => { setCreating(false); setEditingFaq(null); }}
          onSaved={() => { refreshAfterChange(); }}
          onDeleted={() => { setCreating(false); setEditingFaq(null); refreshAfterChange(); }}
        />
      )}
    </>
  );
}
