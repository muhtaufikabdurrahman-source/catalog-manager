import React, { useEffect, useState } from 'react';

export default function RecalcShopeeModal({ selectedCount, onClose, onApply }) {
  const [adminFee, setAdminFee] = useState(8);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { updated: N }

  useEffect(() => {
    window.api.settings.get('shopee_admin_fee').then((val) => {
      if (val) setAdminFee(parseFloat(val) || 8);
    });
  }, []);

  const scope = selectedCount > 0
    ? `${selectedCount} kartu terpilih`
    : 'semua kartu';

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await onApply();
      setDone(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">↺ Update Setting Shopee</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {done.updated} kartu berhasil diperbarui
              </div>
              <div className="form-hint" style={{ marginTop: 4 }}>
                Setting Shopee dihitung ulang dari Jual Offline dengan admin fee {adminFee}%.
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <p style={{ marginBottom: 8 }}>
                  Hitung ulang <strong>Setting Shopee</strong> dari <strong>Jual Offline</strong> menggunakan formula:
                </p>
                <div style={{
                  background: 'var(--color-surface-alt)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: 'var(--color-text)',
                  marginBottom: 12
                }}>
                  Shopee = Jual Offline ÷ (1 − {adminFee}%) → bulatkan ke 5rb
                </div>
                <div style={{
                  background: selectedCount > 0 ? 'rgba(59,130,246,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${selectedCount > 0 ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 13,
                  color: 'var(--color-text)'
                }}>
                  {selectedCount > 0
                    ? <>📌 Akan diterapkan ke <strong>{selectedCount} kartu terpilih</strong></>
                    : <>🌐 Akan diterapkan ke <strong>semua kartu</strong> (tidak ada yang dipilih)</>
                  }
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Admin Fee (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={adminFee}
                  min={0}
                  max={99}
                  step={0.5}
                  style={{ maxWidth: 120 }}
                  onChange={(e) => setAdminFee(parseFloat(e.target.value) || 0)}
                />
                <div className="form-hint" style={{ marginTop: 4 }}>
                  Dari pengaturan. Perubahan di sini hanya untuk batch ini — ubah permanen di Pengaturan.
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {done ? (
            <button className="btn btn-primary" onClick={onClose}>Tutup</button>
          ) : (
            <>
              <button className="btn" onClick={onClose} disabled={loading}>Batal</button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Memproses...' : `Update ${scope}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
