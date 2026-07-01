import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DAYS_OF_WEEK, STORE_LINK_LABELS } from '@shared/constants.json';

// Platform standar yang selalu ditampilkan sebagai baris terpisah di form,
// supaya user tinggal isi link yang relevan tanpa perlu pilih dropdown dulu.
const STANDARD_LINK_LABELS = STORE_LINK_LABELS.filter((l) => l !== 'Lainnya');

// Menggabungkan link utama lama (url/urlLabel) + link tambahan lama (links[])
// jadi satu peta {label: url} untuk platform standar, dan sisanya (label yang
// bukan platform standar) masuk ke daftar "link lainnya" yang custom.
function buildInitialLinks(store) {
  const map = {};
  STANDARD_LINK_LABELS.forEach((label) => { map[label] = ''; });
  const custom = [];

  const existingEntries = [];
  if (store?.url) existingEntries.push({ label: store.urlLabel || 'Lainnya', url: store.url });
  if (store?.links?.length) existingEntries.push(...store.links);

  existingEntries.forEach((entry) => {
    if (!entry?.url) return;
    if (STANDARD_LINK_LABELS.includes(entry.label)) {
      map[entry.label] = entry.url;
    } else {
      custom.push({ label: entry.label || 'Lainnya', url: entry.url });
    }
  });

  return { map, custom };
}

function dayLabel(value) {
  const found = DAYS_OF_WEEK.find((dw) => dw.value === value);
  return found ? found.label : value;
}

// Kalau hari kerja lebih banyak daripada hari libur, lebih ringkas
// menyebut hari liburnya saja (mis. "Minggu Libur", "Senin, Minggu Libur")
// daripada menuliskan semua hari kerja satu-satu.
function formatOperatingDays(days) {
  if (!days || days.length === 0) return '';
  if (days.length === 7) return 'Setiap Hari';

  const allValues = DAYS_OF_WEEK.map((d) => d.value);
  const offValues = allValues.filter((v) => !days.includes(v));

  if (offValues.length > 0 && days.length >= offValues.length) {
    return `${offValues.map(dayLabel).join(', ')} Libur`;
  }

  return days.map(dayLabel).join(', ');
}

function StoreFormModal({ store, onClose, onSaved, onDeleted }) {
  const [name, setName] = useState(store?.name || '');
  const [city, setCity] = useState(store?.city || '');
  const [notes, setNotes] = useState(store?.notes || '');
  const [operatingDays, setOperatingDays] = useState(store?.operatingDays || []);
  const [operatingHours, setOperatingHours] = useState(store?.operatingHours || '');
  const initialLinks = useState(() => buildInitialLinks(store))[0];
  const [platformLinks, setPlatformLinks] = useState(initialLinks.map);
  const [customLinks, setCustomLinks] = useState(initialLinks.custom);
  const [saving, setSaving] = useState(false);

  function toggleDay(dayValue) {
    setOperatingDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue]
    );
  }

  function updatePlatformLink(label, value) {
    setPlatformLinks((prev) => ({ ...prev, [label]: value }));
  }

  function addCustomLink() {
    setCustomLinks((prev) => [...prev, { label: '', url: '' }]);
  }
  function updateCustomLink(index, field, value) {
    setCustomLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }
  function removeCustomLink(index) {
    setCustomLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Nama toko tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      const allLinks = [
        ...STANDARD_LINK_LABELS
          .map((label) => ({ label, url: (platformLinks[label] || '').trim() }))
          .filter((l) => l.url),
        ...customLinks
          .map((l) => ({ label: (l.label || 'Lainnya').trim(), url: (l.url || '').trim() }))
          .filter((l) => l.url)
      ];
      const [primary, ...rest] = allLinks;

      const payload = {
        name,
        url: primary?.url || '',
        urlLabel: primary?.label || '',
        links: rest,
        city,
        notes,
        operatingDays,
        operatingHours
      };
      if (store?.id) {
        await window.api.kasetStores.update(store.id, payload);
      } else {
        await window.api.kasetStores.create(payload);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!store?.id) { onClose(); return; }
    if (!confirm('Hapus toko ini?')) return;
    await window.api.kasetStores.remove(store.id);
    onDeleted();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{store?.id ? 'Edit Toko' : 'Tambah Toko'}</div>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nama Toko / Marketplace</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Misalnya: Toko Retro Gamestation" />
          </div>
          <div className="form-group">
            <label className="form-label">Link Toko / Marketplace</label>
            <div className="store-link-form-list">
              {STANDARD_LINK_LABELS.map((label) => (
                <div key={label} className="store-link-form-row">
                  <span className="store-link-form-label">{label}</span>
                  <input
                    className="form-input"
                    placeholder="https://..."
                    value={platformLinks[label]}
                    onChange={(e) => updatePlatformLink(label, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="form-hint" style={{ marginTop: 6 }}>
              Kosongkan yang tidak dipakai — link kosong tidak akan tampil di daftar toko.
            </div>

            {customLinks.length > 0 && (
              <div className="store-link-form-list" style={{ marginTop: 10 }}>
                {customLinks.map((l, idx) => (
                  <div key={idx} className="store-link-form-row">
                    <input
                      className="form-input"
                      style={{ flex: '0 0 110px' }}
                      placeholder="Nama Platform"
                      value={l.label}
                      onChange={(e) => updateCustomLink(idx, 'label', e.target.value)}
                    />
                    <input
                      className="form-input"
                      placeholder="https://..."
                      value={l.url}
                      onChange={(e) => updateCustomLink(idx, 'url', e.target.value)}
                    />
                    <button className="btn btn-icon" onClick={() => removeCustomLink(idx)} title="Hapus link">×</button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={addCustomLink}>+ Tambah Link Lainnya</button>
          </div>
          <div className="form-group">
            <label className="form-label">Hari Operasi</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6 }}>
              {DAYS_OF_WEEK.map((day) => (
                <label key={day.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={operatingDays.includes(day.value)}
                    onChange={() => toggleDay(day.value)}
                  />
                  <span style={{ fontSize: 13 }}>{day.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Jam Operasi</label>
            <input
              className="form-input"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              placeholder="Misalnya: 09.00-17.00"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Kota</label>
            <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" />
          </div>
          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea className="form-textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Kontak, syarat COD, dll." />
          </div>
        </div>
        <div className="modal-footer">
          {store?.id && (
            <button className="btn btn-danger" onClick={handleDelete} style={{ marginRight: 'auto' }}>Hapus</button>
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

// Buka link toko lewat browser default OS (bukan window.open Electron),
// supaya user tetap pakai sesi login yang sudah ada di browsernya dan tidak
// diminta login ulang setiap klik. Fallback ke window.open kalau untuk
// alasan tertentu window.api tidak tersedia (mis. dijalankan di browser biasa
// saat development renderer-only).
function openStoreLink(url) {
  if (!url) return;
  if (window.api?.shell?.openExternal) {
    window.api.shell.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

export default function KasetStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [creating, setCreating] = useState(false);
  const dragIdRef = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const items = await window.api.kasetStores.list();
      setStores(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStores(); }, [fetchStores]);

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

    setStores((prev) => {
      const next = [...prev];
      const sourceIdx = next.findIndex((s) => s.id === sourceId);
      const targetIdx = next.findIndex((s) => s.id === targetId);
      const [moved] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, moved);
      window.api.kasetStores.reorder(next.map((s) => s.id)).catch(() => {});
      return next;
    });
  }

  return (
    <>
      <div className="topbar">
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setCreating(true)}>+ Tambah Toko</button>
      </div>

      {loading && <div className="loading-bar" />}

      <div className="content-scroll">
        {stores.length === 0 && !loading ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">🏬</div>
            <div>Belum ada toko/marketplace yang ditambahkan.</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-faint)' }}>
              Tambahkan daftar toko atau marketplace tempat membeli kaset.
            </div>
          </div>
        ) : (
          <div className="store-list">
            {stores.map((store) => (
              <div
                key={store.id}
                draggable
                onDragStart={() => handleDragStart(store.id)}
                onDragOver={(e) => handleDragOver(e, store.id)}
                onDrop={() => handleDrop(store.id)}
                onDragEnd={() => setDragOverId(null)}
                className={`store-row ${dragOverId === store.id ? 'store-row-drag-over' : ''}`}
                title={store.notes || undefined}
              >
                <span className="store-drag-handle" aria-hidden="true">⋮⋮</span>
                <span className="store-name">{store.name}</span>

                {(store.url || store.links?.length > 0) && (
                  <div className="store-links">
                    {store.url && (
                      <button className="store-link-pill" onClick={() => openStoreLink(store.url)}>
                        {store.urlLabel || 'Link Utama'}
                      </button>
                    )}
                    {store.links?.map((l, i) => (
                      <button key={i} className="store-link-pill" onClick={() => openStoreLink(l.url)}>
                        {l.label || `Link ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                <div className="store-meta">
                  {store.city && (
                    <span className="store-meta-item">📍 {store.city}</span>
                  )}
                  {(store.operatingDays?.length > 0 || store.operatingHours) && (
                    <span className="store-meta-item">
                      🕒 {formatOperatingDays(store.operatingDays)}
                      {store.operatingDays?.length > 0 && store.operatingHours ? ' • ' : ''}
                      {store.operatingHours}
                    </span>
                  )}
                </div>

                <button className="btn btn-sm store-edit-btn" onClick={() => setEditingStore(store)}>
                  Edit →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {(creating || editingStore) && (
        <StoreFormModal
          store={editingStore}
          onClose={() => { setCreating(false); setEditingStore(null); }}
          onSaved={() => { setCreating(false); setEditingStore(null); fetchStores(); }}
          onDeleted={() => { setCreating(false); setEditingStore(null); fetchStores(); }}
        />
      )}
    </>
  );
}
