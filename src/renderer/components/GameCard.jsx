import React from 'react';
import { useLazyThumbnail } from '../hooks/useLazyThumbnail.js';

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return 'Rp' + Number(value).toLocaleString('id-ID');
}

export default function GameCard({ game, selected, onToggleSelect, onOpen }) {
  const { src, elRef } = useLazyThumbnail(game.coverImageId);

  return (
    <div
      ref={elRef}
      className={`game-card ${selected ? 'selected' : ''}`}
      onClick={() => onOpen(game)}
    >
      <input
        type="checkbox"
        className="game-card-checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleSelect(game.id)}
      />

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
          <span className="tag tag-region">{game.region}</span>
          <span className="tag tag-condition">{game.condition}</span>
        </div>
        <div className="game-card-prices">
          <div className="price-row">
            <span className="price-label">Offline</span>
            <span className="price-value">{formatPrice(game.sellPriceOffline)}</span>
          </div>
          <div className="price-row">
            <span className="price-label">Shopee</span>
            <span className="price-value">{formatPrice(game.sellPriceShopee)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
