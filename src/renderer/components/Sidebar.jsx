import React, { useEffect, useRef, useState } from 'react';

const ICONS = {
  catalog: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  'best-seller': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  faq: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  'kaset-stores': (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      <path d="M5 9v10h14V9" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
};

const LABELS = {
  catalog: 'Katalog Game',
  'best-seller': 'Best Seller',
  faq: 'Pertanyaan',
  'kaset-stores': 'Tempat Beli Kaset',
};

export default function Sidebar({ activePage, onNavigate, onSettings }) {
  const [order, setOrder] = useState(['catalog', 'best-seller', 'faq', 'kaset-stores']);
  const dragKeyRef = useRef(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  useEffect(() => {
    window.api.sidebar.getOrder().then((saved) => {
      if (Array.isArray(saved) && saved.length) setOrder(saved);
    }).catch(() => {});
  }, []);

  function handleDragStart(key) {
    dragKeyRef.current = key;
  }

  function handleDragOver(e, key) {
    e.preventDefault();
    if (key !== dragOverKey) setDragOverKey(key);
  }

  function handleDrop(targetKey) {
    const sourceKey = dragKeyRef.current;
    dragKeyRef.current = null;
    setDragOverKey(null);
    if (!sourceKey || sourceKey === targetKey) return;

    setOrder((prev) => {
      const next = prev.filter((k) => k !== sourceKey);
      const targetIndex = next.indexOf(targetKey);
      next.splice(targetIndex, 0, sourceKey);
      window.api.sidebar.setOrder(next).catch(() => {});
      return next;
    });
  }

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        Catalog<span>Manager</span>
      </div>

      <nav style={{ flex: 1 }}>
        {order.map((key) => (
          <button
            key={key}
            draggable
            onDragStart={() => handleDragStart(key)}
            onDragOver={(e) => handleDragOver(e, key)}
            onDrop={() => handleDrop(key)}
            onDragEnd={() => setDragOverKey(null)}
            className={`nav-item nav-item-draggable ${activePage === key ? 'active' : ''} ${dragOverKey === key ? 'nav-item-drag-over' : ''}`}
            onClick={() => onNavigate(key)}
          >
            <span className="nav-item-drag-handle" aria-hidden="true">⋮⋮</span>
            {ICONS[key]}
            {LABELS[key]}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="nav-item"
          style={{ width: '100%' }}
          onClick={onSettings}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Pengaturan
        </button>
      </div>
    </div>
  );
}
