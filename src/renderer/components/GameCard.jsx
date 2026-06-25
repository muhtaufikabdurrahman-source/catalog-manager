import React from 'react';
import { useLazyThumbnail } from '../hooks/useLazyThumbnail.js';

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return 'Rp' + Number(value).toLocaleString('id-ID');
}

function ConditionBadge({ condition }) {
  const isSealed = condition === 'Sealed';
  const isSecond = ['Loose', 'CIB', 'CIB+'].includes(condition);
  if (!isSealed && !isSecond) return null;

  const label = isSealed ? 'Baru Segel' : 'Second';
  const bg = isSealed ? 'rgba(22, 163, 74, 0.82)' : 'rgba(30, 64, 175, 0.78)';

  return (
    <div style={{
      position: 'absolute', bottom: 5, left: 5,
      background: bg, color: '#fff',
      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: 4,
      backdropFilter: 'blur(2px)',
      pointerEvents: 'none', userSelect: 'none',
      textTransform: 'uppercase',
      boxShadow: '0 1px 3px rgba(0,0,0,0.35)', lineHeight: 1.5
    }}>
      {label}
    </div>
  );
}

export default function GameCard({
  game, selected, onToggleSelect, onOpen,
  onToggleBestSeller, onDuplicate,
  isDragOver, isDropUploading,
  onCardDragOver, onCardDragLeave, onCardDrop
}) {
  const { src, elRef } = useLazyThumbnail(game.coverImageId);
  const regions = Array.isArray(game.region) ? game.region : [game.region];

  return (
    <div
      ref={elRef}
      className={`game-card ${selected ? 'selected' : ''} ${game.isBestSeller ? 'is-best-seller' : ''} ${isDragOver ? 'card-drag-over' : ''}`}
      onClick={() => onOpen(game)}
      onDragOver={onCardDragOver}
      onDragLeave={onCardDragLeave}
      onDrop={onCardDrop}
    >
      <input
        type="checkbox"
        className="game-card-checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onToggleSelect(game.id)}
      />

      <button
        className="game-card-star"
        title={game.isBestSeller ? 'Hapus dari Best Seller' : 'Tandai Best Seller'}
        onClick={(e) => { e.stopPropagation(); onToggleBestSeller?.(game.id); }}
      >
        {game.isBestSeller ? '⭐' : '☆'}
      </button>

      {/* Tombol duplikat */}
      <button
        className="game-card-duplicate"
        title="Duplikat game ini"
        onClick={(e) => { e.stopPropagation(); onDuplicate?.(game.id); }}
      >
        ⧉
      </button>

      {/* Cover foto + badge */}
      <div className="game-card-cover" style={{ position: 'relative' }}>
        {isDropUploading ? (
          <div className="placeholder" style={{ fontSize: 11 }}>Mengupload...</div>
        ) : isDragOver ? (
          <div className="placeholder" style={{ fontSize: 11, color: 'var(--color-primary)' }}>Lepas untuk tambah foto</div>
        ) : game.coverImageId ? (
          src
            ? <img src={src} alt={game.name} />
            : <div className="placeholder">Memuat...</div>
        ) : (
          <div className="placeholder">Tidak ada foto</div>
        )}
        {game.coverImageId && src && !isDragOver && !isDropUploading && (
          <ConditionBadge condition={game.condition} />
        )}
      </div>

      <div className="game-card-body">
        <div className="game-card-title" title={game.name}>{game.name}</div>
        <div className="game-card-tags">
          <span className="tag tag-platform">{game.platform === '__custom__' ? game.platformCustom : game.platform}</span>
          {regions.map((r) => <span key={r} className="tag tag-region">{r}</span>)}
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
