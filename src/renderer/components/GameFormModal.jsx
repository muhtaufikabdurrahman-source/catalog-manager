import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PLATFORMS, REGIONS, CONDITIONS } from '@shared/constants.json';
import ImageUploader from './ImageUploader.jsx';

function roundTo5000(value) {
  if (!value || value <= 0) return value;
  const sisa = value % 5000;
  if (sisa === 0) return value;
  if (sisa < 2000) return value - sisa;
  return value + (5000 - sisa);
}

function calcShopeePrice(jualOffline, adminFeePercent) {
  if (!jualOffline || jualOffline <= 0) return 0;
  const fee = parseFloat(adminFeePercent) || 0;
  if (fee <= 0 || fee >= 100) return jualOffline;
  const raw = jualOffline / (1 - fee / 100);
  return roundTo5000(Math.round(raw));
}

const emptyForm = {
  name: '',
  platform: PLATFORMS[0],
  platformCustom: '',
  regions: [],
  condition: CONDITIONS[0].value,
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
  sell_price_offline: 'Jual Offline',
  sell_price_shopee: 'Setting Shopee'
};

export default function GameFormModal({ game, onClose, onSaved }) {
  const isEdit = Boolean(game);
  const [form, setForm] = useState(emptyForm);
  const [savedGameId, setSavedGameId] = useState(game?.id || null);
  const [coverImageId, setCoverImageId] = useState(game?.coverImageId || null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [adminFee, setAdminFee] = useState(8);
  const [shopeeManual, setShopeeManual] = useState(false);

  // Ref untuk memanggil flushPending dari ImageUploader
  const pendingRef = useRef(null);

  useEffect(() => {
    window.api.settings.get('shopee_admin_fee').then((val) => {
      if (val !== null) setAdminFee(parseFloat(val) || 8);
    });
  }, []);

  useEffect(() => {
    if (game) {
      const regions = Array.isArray(game.region) ? game.region : (game.region ? [game.region] : []);
      setForm({
        name: game.name || '',
        platform: game.platform || PLATFORMS[0],
        platformCustom: game.platformCustom || '',
        regions,
        condition: game.condition || CONDITIONS[0].value,
        buyPrice: game.buyPrice ?? '',
        sellPriceOffline: game.sellPriceOffline ?? '',
        sellPriceShopee: game.sellPriceShopee ?? '',
        notes: game.notes || ''
      });
      setSavedGameId(game.id);
      setCoverImageId(game.coverImageId);
      setShopeeManual(true);
    }
  }, [game]);

  useEffect(() => {
    if (shopeeManual) return;
    const offline = Number(form.sellPriceOffline);
    if (offline > 0) {
      const calculated = calcShopeePrice(offline, adminFee);
      setForm((prev) => ({ ...prev, sellPriceShopee: calculated }));
    }
  }, [form.sellPriceOffline, adminFee, shopeeManual]);

  async function loadHistory() {
    if (!savedGameId) return;
    const h = await window.api.games.priceHistory(savedGameId);
    setHistory(h);
    setShowHistory(true);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOfflineChange(value) {
    setShopeeManual(false);
    setForm((prev) => ({ ...prev, sellPriceOffline: value }));
  }

  function handleShopeeChange(value) {
    setShopeeManual(true);
    setForm((prev) => ({ ...prev, sellPriceShopee: value }));
  }

  function toggleRegion(region) {
    setForm((prev) => {
      const current = prev.regions;
      if (current.includes(region)) {
        return { ...prev, regions: current.filter((r) => r !== region) };
      }
      return { ...prev, regions: [...current, region] };
    });
  }

  async function handleSave(closeAfter) {
    if (!form.name.trim()) {
      alert('Nama game wajib diisi.');
      return;
    }
    if (form.regions.length === 0) {
      alert('Pilih minimal satu region.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        platform: form.platform,
        platformCustom: form.platform === '__custom__' ? form.platformCustom.trim() : null,
        region: form.regions,
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

      // Upload foto pending (jika ada) ke game yang baru saja disimpan
      if (pendingRef.current) {
        await pendingRef.current(result.id);
      }

      onSaved(result);
      if (closeAfter) onClose();
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Bug 2 fix: gunakan onMouseDown + cek target untuk tutup modal,
  // lebih reliable di Electron daripada onClick pada overlay
  function handleOverlayMouseDown(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="modal-panel" style={{ maxWidth: 760 }} onMouseDown={(e) => e.stopPropagation()}>
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
              <div className="region-multiselect">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`region-chip ${form.regions.includes(r) ? 'active' : ''}`}
                    onClick={() => toggleRegion(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {form.regions.length === 0 && (
                <div className="form-hint" style={{ color: 'var(--color-danger, #e53e3e)', marginTop: 4 }}>
                  Pilih minimal satu region
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kondisi</label>
            <select
              className="form-select"
              value={form.condition}
              onChange={(e) => update('condition', e.target.value)}
              style={{ maxWidth: '100%' }}
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}{'  —  '}{c.desc}
                </option>
              ))}
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
                onChange={(e) => handleOfflineChange(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Setting Shopee
                {!shopeeManual && (
                  <span className="form-hint" style={{ marginLeft: 6, display: 'inline' }}>auto</span>
                )}
              </label>
              <input
                type="number"
                className="form-input"
                value={form.sellPriceShopee}
                onChange={(e) => handleShopeeChange(e.target.value)}
                placeholder="0"
              />
              <div className="form-hint" style={{ marginTop: 4 }}>
                Admin {adminFee}% · bulatkan 5rb
                {shopeeManual && form.sellPriceOffline > 0 && (
                  <button
                    type="button"
                    style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => { setShopeeManual(false); }}
                  >
                    ↺ auto
                  </button>
                )}
              </div>
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
              Mendukung multi-foto. Klik foto untuk zoom, atau tandai sebagai cover.
            </div>
            <ImageUploader
              gameId={savedGameId}
              coverImageId={coverImageId}
              onCoverChange={setCoverImageId}
              pendingRef={pendingRef}
              condition={form.condition}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => handleSave(true)}>
            {saving ? 'Menyimpan...' : 'Simpan & Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
}
