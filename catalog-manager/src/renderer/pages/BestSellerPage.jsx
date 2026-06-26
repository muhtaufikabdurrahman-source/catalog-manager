import React, { useCallback, useEffect, useState } from 'react';
import { PLATFORMS } from '@shared/constants.json';
import GameCard from '../components/GameCard.jsx';
import GameFormModal from '../components/GameFormModal.jsx';

const PAGE_SIZE = 200; // load semua sekaligus, grouped by platform

export default function BestSellerPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.games.list({
        search: debouncedSearch || '',
        isBestSeller: true,
        sortBy: 'name',
        sortDir: 'asc',
        limit: PAGE_SIZE,
        offset: 0
      });
      setGames(result.items);
    } catch (err) {
      console.error('Gagal memuat best seller', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  async function handleToggleBestSeller(id) {
    await window.api.games.toggleBestSeller(id);
    fetchGames();
  }

  // Group by platform — urut sesuai urutan PLATFORMS, lalu custom di akhir
  const platformOrder = [...PLATFORMS];
  const grouped = {};
  for (const g of games) {
    const key = g.platform === '__custom__' ? (g.platformCustom || 'Custom') : g.platform;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  }

  const sortedPlatforms = Object.keys(grouped).sort((a, b) => {
    const ia = platformOrder.indexOf(a);
    const ib = platformOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <>
      <div className="topbar">
        <div className="search-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, color: 'var(--color-text-muted, #888)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Cari best seller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          {games.length} item best seller
        </span>
      </div>

      {loading && <div className="loading-bar" />}

      <div className="content-scroll">
        {games.length === 0 && !loading ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="empty-state-icon">⭐</div>
            <div>Belum ada game yang ditandai Best Seller.</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-faint)' }}>
              Tandai game dari halaman Katalog dengan menekan ikon ☆ di pojok kanan atas kartu.
            </div>
          </div>
        ) : (
          sortedPlatforms.map((platform) => (
            <div key={platform} className="best-seller-section">
              <div className="best-seller-platform-header">
                <span className="tag tag-platform" style={{ fontSize: 13, padding: '4px 12px' }}>{platform}</span>
                <span className="best-seller-count">{grouped[platform].length} game</span>
              </div>
              <div className="game-grid">
                {grouped[platform].map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    selected={false}
                    onToggleSelect={() => {}}
                    onOpen={setEditingGame}
                    onToggleBestSeller={handleToggleBestSeller}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {editingGame && (
        <GameFormModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSaved={(updated) => {
            fetchGames();
            setEditingGame(updated);
          }}
        />
      )}
    </>
  );
}
