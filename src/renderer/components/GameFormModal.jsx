import React, { useEffect, useState } from 'react';
import { PLATFORMS, REGIONS, CONDITIONS } from '@shared/constants.json';
import ImageUploader from './ImageUploader.jsx';

const emptyForm = {
  name: '',
  platform: PLATFORMS[0],
  platformCustom: '',
  region: REGIONS[0],
  condition: CONDITIONS[0],
  buyPrice: '',
  sellPriceOffline: '',
  sellPriceShopee: '',
  notes: ''
};

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return 'Rp' + Number(value).toLocaleString('id-ID');
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

const FIELD_LABELS = {
  buy_price: 'Harga Beli',
  sell_price_offline: 'Harga Jual Offline',
  sell_price_shopee: 'Harga Jual Shopee'
};

export default function GameFormModal({ game, onClose, onSaved }) {
  const isEdit = Boolean(game);
  const [form, setForm] = useState(emptyForm);
  const [savedGameId, setSavedGameId] = useState(game?.id || null);
  const [coverImageId, setCoverImageId] = useState(game?.coverImageId || null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (game) {
      setForm({
        name: game.name || '',
        platform: game.platform || PLATFORMS[0],
        platformCustom: game.platformCustom || '',
        region: game.region || REGIONS[0],
        condition: game.condition || CONDITIONS[0],
        buyPrice: game.buyPrice ?? '',
        sellPriceOffline: game.sellPriceOffline ?? '',
        sellPriceShopee: game.sellPriceShopee ?? '',
        notes: game.notes || ''
      });
      setSavedGameId(game.id);
      setCoverImageId(game.coverImageId);
    }
  }, [game]);

  async function loadHistory() {
    if (!savedGameId) return;
    const h = await window.api.games.priceHistory(savedGameId);
    setHistory(h);
    setShowHistory(true);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(closeAfter) {
    if (!form.name.trim()) {
      alert('Nama game wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        platform: form.platform,
        platformCustom: form.platform === '__custom__' ? form.platformCustom.trim() : null,
        region: form.region,
        condition: form.condition,
        buyPrice: form.buyPrice === '' ? 0 : Number(form.buyPrice),
        sellPriceOffline: form.sellPriceOffline === '' ? 0 : Number(form.sellPriceOffline),
        sellPriceShopee: form.sellPriceShopee === '' ? 0 : Number(form.sellPriceShopee),
        notes: form.notes.trim() || null
      };

      let result;
      if (savedGameId) {
        result = await window.api.games.update(savedGameId, payload);
      } else {
        result = await window.api.games.create(payload);
        setSavedGameId(result.id);
      }

      onSaved(result);
      if (closeAfter) onClose();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? 'Edit Game' : 'Tambah Game'}</div>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nama Game</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Contoh: God of War Ragnarok"
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Platform</label>
              <select className="form-select" value={form.platform} onChange={(e) => update('platform', e.target.value)}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                <option value="__custom__">Platform custom...</option>
              </select>
              {form.platform === '__custom__' && (
                <input
                  className="form-input"
                  style={{ marginTop: 8 }}
                  placeholder="Nama platform custom"
                  value={form.platformCustom}
                  onChange={(e) => update('platformCustom', e.target.value)}
                />
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Region</label>
              <select className="form-select" value={form.region} onChange={(e) => update('region', e.target.value)}>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kondisi</label>
            <select className="form-select" value={form.condition} onChange={(e) => update('condition', e.target.value)}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-group">
              <label className="form-label">Harga Beli</label>
              <input
                type="number"
                className="form-input"
                value={form.buyPrice}
                onChange={(e) => update('buyPrice', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jual Offline</label>
              <input
                type="number"
                className="form-input"
                value={form.sellPriceOffline}
                onChange={(e) => update('sellPriceOffline', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jual Shopee</label>
              <input
                type="number"
                className="form-input"
                value={form.sellPriceShopee}
                onChange={(e) => update('sellPriceShopee', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {isEdit && (
            <div className="form-group">
              <button className="btn btn-sm" onClick={loadHistory}>Lihat Riwayat Perubahan Harga</button>
              {showHistory && (
                <div style={{ marginTop: 8, maxHeight: 160, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8 }}>
                  {history.length === 0 ? (
                    <div className="form-hint">Belum ada riwayat perubahan harga.</div>
                  ) : (
                    history.map((h) => (
                      <div key={h.id} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <strong>{FIELD_LABELS[h.field] || h.field}</strong>: {formatPrice(h.oldValue)} → {formatPrice(h.newValue)}
                        <span style={{ color: 'var(--color-text-faint)', marginLeft: 8 }}>{formatDateTime(h.changedAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Foto Produk</label>
            <div className="form-hint" style={{ marginBottom: 8 }}>
              {savedGameId ? 'Mendukung multi-foto. Klik foto untuk zoom, atau tandai sebagai cover.' : 'Simpan data dasar terlebih dahulu untuk menambahkan foto.'}
            </div>
            <ImageUploader gameId={savedGameId} coverImageId={coverImageId} onCoverChange={setCoverImageId} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Batal</button>
          {!isEdit && (
            <button className="btn" disabled={saving} onClick={() => handleSave(false)}>
              Simpan & Tambah Foto
            </button>
          )}
          <button className="btn btn-primary" disabled={saving} onClick={() => handleSave(true)}>
            {saving ? 'Menyimpan...' : 'Simpan & Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
}
