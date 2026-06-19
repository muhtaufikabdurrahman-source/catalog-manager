import React from 'react';

const NAV_ITEMS = [
  { key: 'catalog', label: 'Katalog Game', icon: '🗂️' },
  { key: 'best-seller', label: 'Best Seller', icon: '⭐' }
];

export default function Sidebar({ activePage, onNavigate, onSettings }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        Catalog<span>Manager</span>
      </div>

      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`nav-item ${activePage === item.key ? 'active' : ''}`}
          onClick={() => onNavigate(item.key)}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div className="sidebar-footer">
        <button
          className="btn btn-sm"
          style={{ marginBottom: 8, width: '100%' }}
          onClick={onSettings}
          title="Pengaturan Aplikasi"
        >
          ⚙️ Pengaturan
        </button>
        Catalog Manager v1.0
        <br />
        Database lokal &middot; Offline
      </div>
    </div>
  );
}
