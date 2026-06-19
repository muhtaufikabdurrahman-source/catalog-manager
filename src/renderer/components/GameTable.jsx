import React from 'react';
import { SORT_FIELDS } from '@shared/constants.json';
import { useLazyThumbnail } from '../hooks/useLazyThumbnail.js';

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return 'Rp' + Number(value).toLocaleString('id-ID');
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function RowThumb({ game }) {
  const { src, elRef } = useLazyThumbnail(game.coverImageId);
  return (
    <div ref={elRef}>
      {src ? <img className="table-thumb" src={src} alt={game.name} /> : <div className="table-thumb" />}
    </div>
  );
}

export default function GameTable({ games, selectedIds, onToggleSelect, onToggleSelectAll, onOpen, sortBy, sortDir, onSort }) {
  const allSelected = games.length > 0 && games.every((g) => selectedIds.has(g.id));

  return (
    <table className="game-table">
      <thead>
        <tr>
          <th style={{ width: 36 }}>
            <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} />
          </th>
          <th style={{ width: 50 }}>Foto</th>
          {SORT_FIELDS.map((f) => (
            <th key={f.key} onClick={() => onSort(f.key)}>
              {f.label} {sortBy === f.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
            </th>
          ))}
          <th>Kondisi</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game) => (
          <tr
            key={game.id}
            className={selectedIds.has(game.id) ? 'selected' : ''}
            onClick={() => onOpen(game)}
          >
            <td onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.has(game.id)}
                onChange={() => onToggleSelect(game.id)}
              />
            </td>
            <td><RowThumb game={game} /></td>
            <td>{game.name}</td>
            <td>{game.platform === '__custom__' ? game.platformCustom : game.platform}</td>
            <td>{game.region}</td>
            <td>{formatPrice(game.buyPrice)}</td>
            <td>{formatPrice(game.sellPriceOffline)}</td>
            <td>{formatPrice(game.sellPriceShopee)}</td>
            <td>{formatDate(game.createdAt)}</td>
            <td>{formatDate(game.updatedAt)}</td>
            <td>{game.condition}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
