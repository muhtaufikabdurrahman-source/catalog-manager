import React, { useCallback, useEffect, useState } from 'react';
import { PLATFORMS, REGIONS, CONDITIONS } from '@shared/constants.json';
import GameCard from '../components/GameCard.jsx';
import GameTable from '../components/GameTable.jsx';
import GameFormModal from '../components/GameFormModal.jsx';
import BulkUpdatePriceModal from '../components/BulkUpdatePriceModal.jsx';

const PAGE_SIZE = 60;

export default function CatalogPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const [games, setGames] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingGame, setEditingGame] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, platform, region, condition, sortBy, sortDir]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.games.list({
        search: debouncedSearch,
        platform: platform || null,
        region: region || null,
        condition: condition || null,
        sortBy,
        sortDir,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      });
      setGames(result.items);
      setTotal(result.total);
    } catch (err) {
      console.error('Gagal memuat katalog', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, platform, region, condition, sortBy, sortDir, page]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allSelected = games.length > 0 && games.every((g) => prev.has(g.id));
      if (allSelected) return new Set();
      return new Set(games.map((g) => g.id));
    });
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} game terpilih?`)) return;
    await window.api.games.bulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    fetchGames();
  }

  async function handleBulkApplyPrice(params) {
    await window.api.games.bulkUpdatePrice({ ids: Array.from(selectedIds), ...params });
    setSelectedIds(new Set());
    fetchGames();
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <>
      <div className="topbar">
        <div className="search-box">
          <span className="icon">Cari</span>
          <input
            placeholder="Cari nama game, platform, atau region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Tambah Game
        </button>
      </div>

      {loading && <div className="loading-bar" />}

      <div className="content-scroll">
        <div className="toolbar-row">
          <div className="filter-row">
            <select className="select-input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">Semua Platform</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="select-input" value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">Semua Region</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="select-input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Semua Kondisi</option>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="select-input" value={`${sortBy}:${sortDir}`} onChange={(e) => {
              const parts = e.target.value.split(':');
              setSortBy(parts[0]); setSortDir(parts[1]);
            }}>
              <option value="updated_at:desc">Terakhir Diupdate</option>
              <option value="created_at:desc">Terbaru Ditambahkan</option>
              <option value="name:asc">Nama A-Z</option>
              <option value="name:desc">Nama Z-A</option>
              <option value="sell_price_offline:asc">Harga Offline Terendah</option>
              <option value="sell_price_offline:desc">Harga Offline Tertinggi</option>
              <option value="sell_price_shopee:asc">Harga Shopee Terendah</option>
              <option value="sell_price_shopee:desc">Harga Shopee Tertinggi</option>
            </select>
          </div>

          <div className="view-toggle">
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>Grid</button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
          </div>
        </div>

        {hasSelection && (
          <div className="bulk-bar">
            <span>{selectedIds.size} item terpilih</span>
            <button className="btn btn-sm" onClick={() => setShowBulkPriceModal(true)}>Bulk Update Harga</button>
            <button className="btn btn-sm btn-danger" onClick={handleDeleteSelected}>Hapus Terpilih</button>
            <button className="btn btn-sm" onClick={() => setSelectedIds(new Set())}>Batal Pilih</button>
          </div>
        )}

        {games.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">Kosong</div>
            <div>Belum ada game yang cocok dengan pencarian/filter ini.</div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Tambah Game Pertama</button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="game-grid">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                selected={selectedIds.has(game.id)}
                onToggleSelect={toggleSelect}
                onOpen={setEditingGame}
              />
            ))}
          </div>
        ) : (
          <GameTable
            games={games}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onOpen={setEditingGame}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        )}

        {total > PAGE_SIZE && (
          <div className="pagination-row">
            <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Sebelumnya</button>
            <span>Halaman {page + 1} dari {totalPages} ({total} total item)</span>
            <button className="btn btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Selanjutnya</button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <GameFormModal
          game={null}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => fetchGames()}
        />
      )}

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

      {showBulkPriceModal && (
        <BulkUpdatePriceModal
          count={selectedIds.size}
          onClose={() => setShowBulkPriceModal(false)}
          onApply={handleBulkApplyPrice}
        />
      )}
    </>
  );
}
