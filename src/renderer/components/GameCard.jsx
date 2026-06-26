import React from 'react';
import { useLazyThumbnail } from '../hooks/useLazyThumbnail.js';

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return 'Rp' + Number(value).toLocaleString('id-ID');
}

// Kondisi → label pendek untuk badge di cover foto
const CONDITION_BADGE = {
  'Loose':  { label: 'LOOSE',  style: { background: '#6b7280', color: '#fff' } },
  'CIB':    { label: 'CIB',    style: { background: '#2563eb', color: '#fff' } },
  'Sealed': { label: 'SEGEL',  style: { background: '#16a34a', color: '#fff' } },
  'Second': { label: 'SECOND', style: { background: '#7c3aed', color: '#fff' } },
};

function getPriceWarning(game) {
  const buy = game.buyPrice || 0;
  const offline = game.sellPriceOffline || 0;
  const shopee = game.sellPriceShopee || 0;
  if (buy > 0 && offline > 0 && buy > offline) return true;
  if (offline > 0 && shopee > 0 && offline > shopee) return true;
  return false;
}

export default function GameCard({
  game,
  selected,
  onToggleSelect,
  onOpen,
  onToggleBestSeller,
  onDuplicate,
  isDragOver,
  isDropUploading,
  onCardDragOver,
  onCardDragLeave,
  onCardDrop,
}) {
  const { src, elRef } = useLazyThumbnail(game.coverImageId);
  const regions = Array.isArray(game.region) ? game.region : [game.region];
  const badge = CONDITION_BADGE[game.condition];
  const hasWarning = getPriceWarning(game);

  return (
    <div
      ref={elRef}
      className={[
        'game-card',
        selected ? 'selected' : '',
        game.isBestSeller ? 'is-best-seller' : '',
        game.jangandibeli ? 'is-jangan-dibeli' : '',
        isDragOver ? 'card-drag-over' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onOpen(game)}
      onDragOver={onCardDragOver}
      onDragLeave={onCardDragLeave}
      onDrop={onCardDrop}
    >
      {/* Checkbox — transparan, muncul saat hover atau selected */}
      <input
        type="checkbox"
        className={`game-card-checkbox ${selected ? 'always-visible' : ''}`}
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleSelect(game.id)}
      />

      {/* Bintang Best Seller — pojok kanan atas */}
      <button
        className="game-card-star"
        onClick={(e) => { e.stopPropagation(); onToggleBestSeller(game.id); }}
        title={game.isBestSeller ? 'Hapus dari Best Seller' : 'Tandai Best Seller'}
      >
        {game.isBestSeller ? '★' : '☆'}
      </button>

      {/* Cover foto */}
      <div className="game-card-cover">
        {/* Jangan Dibeli watermark — di area foto, full cover */}
        {game.jangandibeli && (
          <div className="jangan-dibeli-overlay" aria-hidden="true">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <line x1="5" y1="5" x2="95" y2="95" stroke="currentColor" strokeWidth="14" strokeLinecap="round"/>
              <line x1="95" y1="5" x2="5" y2="95" stroke="currentColor" strokeWidth="14" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* Condition badge — pojok kiri bawah cover */}
        {badge && (
          <span className="game-card-condition-badge" style={badge.style}>
            {badge.label}
          </span>
        )}

        {/* Price warning icon — pojok kanan bawah cover */}
        {hasWarning && (
          <span className="game-card-price-warning" title="Periksa harga: ada ketidaksesuaian harga">
            ⚠️
          </span>
        )}

        {isDropUploading ? (
          <div className="placeholder">Mengupload...</div>
        ) : game.coverImageId ? (
          src ? <img src={src} alt={game.name} /> : <div className="placeholder">Memuat...</div>
        ) : (
          <div className="placeholder">Tidak ada foto</div>
        )}
      </div>

      {/* Body */}
      <div className="game-card-body">
        <div className="game-card-title" title={game.name}>{game.name}</div>
        <div className="game-card-tags">
          <span className="tag tag-platform">
            {game.platform === '__custom__' ? game.platformCustom : game.platform}
          </span>
          {regions.map((r) => (
            <span key={r} className="tag tag-region">{r}</span>
          ))}
          <span className="tag tag-condition">{game.condition}</span>
          {game.isBestSeller && (
            <span className="tag tag-best-seller">★ Best Seller</span>
          )}
          {game.jangandibeli && (
            <span className="tag tag-jangan-dibeli">JANGAN DIBELI</span>
          )}
        </div>
        <div className="game-card-prices">
          <div className="price-row">
            <span className="price-label">Beli</span>
            <span className="price-value">{formatPrice(game.buyPrice)}</span>
          </div>
          <div className="price-row">
            <span className="price-label">Jual</span>
            <span className="price-value">{formatPrice(game.sellPriceOffline)}</span>
          </div>
          <div className="price-row">
            <span className="price-label">Setting Shopee</span>
            <span className="price-value">{formatPrice(game.sellPriceShopee)}</span>
          </div>
        </div>
      </div>

      {/* Tombol duplikat — pojok kanan bawah, muncul saat hover */}
      <button
        className="game-card-duplicate"
        onClick={(e) => { e.stopPropagation(); onDuplicate(game.id); }}
        title="Duplikat kartu ini"
      >
        ⧉
      </button>
    </div>
  );
}
