import React from 'react';
import { useLazyThumbnail } from '../hooks/useLazyThumbnail.js';

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return 'Rp' + Number(value).toLocaleString('id-ID');
}

export default function GameCard({ game, selected, onToggleSelect, onOpen, onToggleBestSeller }) {
  const { src, elRef } = useLazyThumbnail(game.coverImageId);
  const regions = Array.isArray(game.region) ? game.region : [game.region];

  async function handleToggleBestSeller(e) {
    e.stopPropagation();
    if (onToggleBestSeller) onToggleBestSeller(game.id);
  }

  return (
    <div
      ref={elRef}
      className={`game-card ${selected ? 'selected' : ''} ${game.isBestSeller ? 'is-best-seller' : ''}`}
      onClick={() => onOpen(game)}
    >
      <input
        type="checkbox"
        className="game-card-checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleSelect(game.id)}
      />

      {/* Tombol toggle best seller */}
      <button
        className="game-card-star"
        title={game.isBestSeller ? 'Hapus dari Best Seller' : 'Tandai Best Seller'}
        onClick={handleToggleBestSeller}
      >
        {game.isBestSeller ? '⭐' : '☆'}
      </button>

      <div className="game-card-cover">
        {game.coverImageId ? (
          src ? <img src={src} alt={game.name} /> : <div className="placeholder">Memuat...</div>
        ) : (
          <div className="placeholder">Tidak ada foto</div>
        )}
      </div>

      <div className="game-card-body">
        <div className="game-card-title" title={game.name}>{game.name}</div>
        <div className="game-card-tags">
          <span className="tag tag-platform">{game.platform === '__custom__' ? game.platformCustom : game.platform}</span>
          {regions.map((r) => (
            <span key={r} className="tag tag-region">{r}</span>
          ))}
          <span className="tag tag-condition">{game.condition}</span>
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
    </div>
  );
}
