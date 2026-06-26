import React, { useEffect, useState } from 'react';

export default function SettingsModal({ onClose }) {
  const [adminFee, setAdminFee] = useState('8');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.api.settings.get('shopee_admin_fee').then((val) => {
      if (val !== null) setAdminFee(val);
    });
  }, []);

  async function handleSave() {
    const num = parseFloat(adminFee);
    if (isNaN(num) || num < 0 || num >= 100) {
      alert('Persentase admin harus antara 0 dan 100.');
      return;
    }
    setSaving(true);
    await window.api.settings.set('shopee_admin_fee', String(num));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">⚙️ Pengaturan Aplikasi</div>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Biaya Admin Shopee (%)</label>
            <div className="form-hint" style={{ marginBottom: 8 }}>
              Digunakan untuk menghitung Setting Shopee otomatis.<br />
              <strong>Rumus:</strong> Harga Jual ÷ (1 − % Admin)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                className="form-input"
                style={{ width: 120 }}
                value={adminFee}
                min="0"
                max="99"
                step="0.1"
                onChange={(e) => setAdminFee(e.target.value)}
                placeholder="8"
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>%</span>
            </div>
            <div className="form-hint" style={{ marginTop: 8 }}>
              Contoh: Jual Rp200.000 dengan admin 8% →&nbsp;
              <strong>Setting Shopee Rp{(200000 / (1 - (parseFloat(adminFee) || 0) / 100)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</strong>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Tutup</button>
          <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saved ? '✓ Tersimpan' : saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
