import React, { useState } from 'react';

const FIELD_OPTIONS = [
  { value: 'buy_price', label: 'Harga Beli' },
  { value: 'sell_price_offline', label: 'Harga Jual Offline' },
  { value: 'sell_price_shopee', label: 'Harga Jual Shopee' }
];

const MODE_OPTIONS = [
  { value: 'set', label: 'Samakan ke nilai ini' },
  { value: 'increase_percent', label: 'Naikkan (%)' },
  { value: 'decrease_percent', label: 'Turunkan (%)' },
  { value: 'increase_amount', label: 'Naikkan (Rp)' },
  { value: 'decrease_amount', label: 'Turunkan (Rp)' }
];

export default function BulkUpdatePriceModal({ count, onClose, onApply }) {
  const [field, setField] = useState('sell_price_offline');
  const [mode, setMode] = useState('increase_percent');
  const [value, setValue] = useState('');
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    if (value === '' || isNaN(Number(value))) {
      alert('Masukkan nilai yang valid.');
      return;
    }
    setApplying(true);
    try {
      await onApply({ field, mode, value: Number(value) });
      onClose();
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Bulk Update Harga ({count} item)</div>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Field Harga</label>
            <select className="form-select" value={field} onChange={(e) => setField(e.target.value)}>
              {FIELD_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Mode</label>
            <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODE_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nilai</label>
            <input
              type="number"
              className="form-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode.includes('percent') ? 'Contoh: 10 (artinya 10%)' : 'Contoh: 5000'}
            />
          </div>
          <div className="form-hint">
            Perubahan ini akan tercatat otomatis di riwayat harga masing-masing item.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" disabled={applying} onClick={handleApply}>
            {applying ? 'Menerapkan...' : 'Terapkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
