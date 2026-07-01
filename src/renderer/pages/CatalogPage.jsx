import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PLATFORMS, REGIONS, CONDITIONS } from '@shared/constants.json';
import GameCard from '../components/GameCard.jsx';
import GameTable from '../components/GameTable.jsx';
import GameFormModal from '../components/GameFormModal.jsx';
import BulkUpdatePriceModal from '../components/BulkUpdatePriceModal.jsx';
import RecalcShopeeModal from '../components/RecalcShopeeModal.jsx';

const PAGE_SIZE = 60;

export default function CatalogPage() {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const [condition, setCondition] = useState('');
  const [noPhoto, setNoPhoto] = useState(false);
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
  const [showRecalcShopeeModal, setShowRecalcShopeeModal] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const dataMenuRef = useRef(null);

  // State untuk drop foto ke card
  const [dragOverCardId, setDragOverCardId] = useState(null);
  const [dropUploading, setDropUploading] = useState(null); // gameId sedang diupload

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(0); }, [debouncedSearch, platform, region, condition, noPhoto, sortBy, sortDir]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.games.list({
        search: debouncedSearch,
        platform: platform || null,
        region: region || null,
        condition: condition || null,
        noPhoto,
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
  }, [debouncedSearch, platform, region, condition, noPhoto, sortBy, sortDir, page]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  // Tutup dropdown "Data" (Backup/Restore) saat klik di luar area dropdown.
  useEffect(() => {
    if (!showDataMenu) return;
    function handleClickOutside(e) {
      if (dataMenuRef.current && !dataMenuRef.current.contains(e.target)) {
        setShowDataMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDataMenu]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('asc'); }
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

  async function handleBatchRecalcShopee() {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : [];
    const adminFeeRaw = await window.api.settings.get('shopee_admin_fee');
    const adminFeePercent = parseFloat(adminFeeRaw) || 8;
    const result = await window.api.games.batchRecalcShopee({ ids, adminFeePercent });
    setSelectedIds(new Set());
    fetchGames();
    return result;
  }

  async function handleToggleBestSeller(id) {
    await window.api.games.toggleBestSeller(id);
    fetchGames();
  }

  // ---- Duplikat ----
  async function handleDuplicate(id) {
    try {
      await window.api.games.duplicate(id);
      fetchGames();
    } catch (err) {
      alert('Gagal duplikat: ' + err.message);
    }
  }

  // ---- Export ----
  async function handleExportExcel() {
    const result = await window.api.importExport.exportExcel();
    if (!result.canceled) alert(`Export Excel selesai: ${result.count} game disimpan ke:\n${result.filePath}`);
  }

  // ---- Import ----
  async function handleImport() {
    const pick = await window.api.importExport.pickImportFile();
    if (pick.canceled) return;
    setLoading(true);
    try {
      const result = await window.api.importExport.importFile(pick.filePath);
      setImportStatus(result);
      fetchGames();
    } catch (err) {
      alert('Gagal import: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- Backup / Restore ----
  // Backup menyalin seluruh file database SQLite (catalog.db) apa adanya,
  // sehingga otomatis mencakup SEMUA tabel: katalog game, riwayat harga,
  // best seller, daftar Pertanyaan (FAQ) beserta gambar jawabannya, dan
  // daftar Tempat Beli Kaset beserta jadwal operasi & multi-link toko.
  // Tidak ada langkah tambahan yang diperlukan -- satu file ini sudah utuh.
  async function handleBackup() {
    const result = await window.api.backup.backupTo();
    if (!result.canceled) {
      alert(
        `Backup berhasil disimpan ke:\n${result.path}\n\n` +
        'Backup ini sudah mencakup seluruh data: katalog game, FAQ (Pertanyaan), dan Tempat Beli Kaset.'
      );
    }
  }

  async function handleRestore() {
    const ok = confirm(
      '⚠️ PERHATIAN: Restore akan MENGGANTIKAN semua data saat ini (termasuk katalog game, FAQ, dan Tempat Beli Kaset) dengan data dari file backup.\n\n' +
      'Pastikan Anda sudah membuat backup data terbaru sebelum melanjutkan.\n\nLanjutkan restore?'
    );
    if (!ok) return;
    try {
      const result = await window.api.backup.restoreFrom();
      if (!result.canceled) {
        alert('Restore berhasil! Aplikasi perlu dimuat ulang.');
        window.location.reload();
      }
    } catch (err) {
      alert('Gagal restore: ' + err.message);
    }
  }

  // ---- Drop foto dari luar aplikasi ke GameCard ----
  async function handleCardDrop(e, gameId) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardId(null);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setDropUploading(gameId);
    try {
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        await window.api.images.add(gameId, buffer, file.name);
      }
      fetchGames();
    } catch (err) {
      alert('Gagal upload foto: ' + err.message);
    } finally {
      setDropUploading(null);
    }
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <>
      <div className="topbar">
        {/* Search box dengan icon */}
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
            placeholder="Cari nama game, platform, atau region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
          <button className="btn btn-sm" onClick={handleImport}>⬆ Import</button>
          <button className="btn btn-sm" onClick={handleExportExcel}>⬇ Export</button>
          <div className="dropdown-wrap" ref={dataMenuRef}>
            <button
              className="btn btn-sm"
              onClick={() => setShowDataMenu((v) => !v)}
            >🗄 Data</button>
            {showDataMenu && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-menu-item"
                  title="Backup database"
                  onClick={() => { setShowDataMenu(false); handleBackup(); }}
                >💾 Backup</button>
                <button
                  className="dropdown-menu-item"
                  title="Restore database"
                  onClick={() => { setShowDataMenu(false); handleRestore(); }}
                >♻️ Restore</button>
              </div>
            )}
          </div>
          <button
            className="btn btn-accent"
            title="Hitung ulang Setting Shopee semua kartu dari Jual Offline"
            onClick={() => setShowRecalcShopeeModal(true)}
          >↺ Update Shopee</button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ Tambah Game</button>
        </div>
      </div>

      {loading && <div className="loading-bar" />}

      {importStatus && (
        <div className="import-result-bar">
          <span>Import selesai — Baru: <strong>{importStatus.inserted}</strong> · Diupdate: <strong>{importStatus.updated}</strong> · Dilewati: <strong>{importStatus.skipped}</strong></span>
          {importStatus.errors.length > 0 && (
            <span style={{ color: 'var(--color-danger)', marginLeft: 12 }}>{importStatus.errors.length} error</span>
          )}
          <button className="btn btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setImportStatus(null)}>✕</button>
        </div>
      )}

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
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
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
            <label className="checkbox-filter" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={noPhoto} onChange={(e) => setNoPhoto(e.target.checked)} />
              Tanpa foto
            </label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{total} game</span>
            <div className="view-toggle">
              <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>Grid</button>
              <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>List</button>
            </div>
          </div>
        </div>

        {hasSelection && (
          <div className="bulk-bar">
            <span>{selectedIds.size} item terpilih</span>
            <button className="btn btn-sm" onClick={() => setShowBulkPriceModal(true)}>Bulk Update Harga</button>
            <button className="btn btn-sm" onClick={() => setShowRecalcShopeeModal(true)}>
              ↺ Update Shopee Terpilih
            </button>
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
                onToggleBestSeller={handleToggleBestSeller}
                onDuplicate={handleDuplicate}
                isDragOver={dragOverCardId === game.id}
                isDropUploading={dropUploading === game.id}
                onCardDragOver={(e) => { e.preventDefault(); setDragOverCardId(game.id); }}
                onCardDragLeave={() => setDragOverCardId(null)}
                onCardDrop={(e) => handleCardDrop(e, game.id)}
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
            onDuplicate={handleDuplicate}
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
        <GameFormModal game={null} onClose={() => setShowCreateModal(false)} onSaved={() => fetchGames()} />
      )}
      {editingGame && (
        <GameFormModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSaved={(updated) => { fetchGames(); setEditingGame(updated); }}
        />
      )}
      {showBulkPriceModal && (
        <BulkUpdatePriceModal
          count={selectedIds.size}
          onClose={() => setShowBulkPriceModal(false)}
          onApply={handleBulkApplyPrice}
        />
      )}
      {showRecalcShopeeModal && (
        <RecalcShopeeModal
          selectedCount={selectedIds.size}
          onClose={() => setShowRecalcShopeeModal(false)}
          onApply={handleBatchRecalcShopee}
        />
      )}
    </>
  );
}
