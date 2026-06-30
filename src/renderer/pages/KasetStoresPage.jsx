import React, { useCallback, useEffect, useRef, useState } from 'react';

function StoreFormModal({ store, onClose, onSaved, onDeleted }) {
  const [name, setName] = useState(store?.name || '');
  const [url, setUrl] = useState(store?.url || '');
  const [city, setCity] = useState(store?.city || '');
  const [notes, setNotes] = useState(store?.notes || '');
  const [operatingHours, setOperatingHours] = useState(store?.operatingHours || '');
  const [links, setLinks] = useState(store?.links?.length ? store.links : []);
  const [saving, setSaving] = useState(false);

  function addLink() {
    setLinks((prev) => [...prev, { label: '', url: '' }]);
  }
  function updateLink(index, field, value) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }
  function removeLink(index) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Nama toko tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      const cleanLinks = links.filter((l) => l.url && l.url.trim());
      const payload = { name, url, city, notes, operatingHours, links: cleanLinks };
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
      <div className="modal-panel" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
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
            <label className="form-label">Link / URL Utama</label>
            <input className="form-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://shopee.co.id/..." />
          </div>
          <div className="form-group">
            <label className="form-label">Link Tambahan (opsional)</label>
            {links.map((l, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  className="form-input"
                  style={{ maxWidth: 130 }}
                  placeholder="Label (Tokopedia, WA, dll)"
                  value={l.label}
                  onChange={(e) => updateLink(idx, 'label', e.target.value)}
                />
                <input
                  className="form-input"
                  placeholder="https://..."
                  value={l.url}
                  onChange={(e) => updateLink(idx, 'url', e.target.value)}
                />
                <button className="btn btn-icon" onClick={() => removeLink(idx)} title="Hapus link">×</button>
              </div>
            ))}
            <button className="btn btn-sm" onClick={addLink}>+ Tambah Link</button>
          </div>
          <div className="form-group">
            <label className="form-label">Kota</label>
            <input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" />
          </div>
          <div className="form-group">
            <label className="form-label">Jadwal Operasi</label>
            <input
              className="form-input"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              placeholder="Misalnya: Senin-Sabtu 09.00-17.00"
            />
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
        <div style={{ fontWeight: 600, fontSize: 15 }}>Tempat Beli Kaset</div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>+ Tambah Toko</button>
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
          <div className="accordion-list">
            {stores.map((store) => (
              <div
                key={store.id}
                draggable
                onDragStart={() => handleDragStart(store.id)}
                onDragOver={(e) => handleDragOver(e, store.id)}
                onDrop={() => handleDrop(store.id)}
                onDragEnd={() => setDragOverId(null)}
                className={`accordion-item ${dragOverId === store.id ? 'accordion-item-drag-over' : ''}`}
              >
                <div className="accordion-header" style={{ cursor: 'default' }}>
                  <span className="accordion-drag-handle" aria-hidden="true">⋮⋮</span>
                  <div style={{ flex: 1 }}>
                    <span className="accordion-title">{store.name}</span>
                    {store.city && <span className="form-hint" style={{ marginLeft: 8 }}>📍 {store.city}</span>}
                    {store.operatingHours && <span className="form-hint" style={{ marginLeft: 8 }}>🕒 {store.operatingHours}</span>}
                    {(store.url || store.links?.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        {store.url && (
                          <a href="#" onClick={(e) => { e.preventDefault(); window.open(store.url, '_blank'); }} style={{ fontSize: 13 }}>
                            {store.url}
                          </a>
                        )}
                        {store.links?.map((l, i) => (
                          <button
                            key={i}
                            className="btn btn-sm"
                            onClick={() => window.open(l.url, '_blank')}
                          >
                            {l.label || `Link ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                    {store.notes && <div className="form-hint" style={{ marginTop: 4 }}>{store.notes}</div>}
                  </div>
                  <button className="btn btn-sm" onClick={() => setEditingStore(store)}>Edit</button>
                </div>
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
