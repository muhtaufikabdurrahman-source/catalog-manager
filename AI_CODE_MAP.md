# Peta Kode untuk AI Assistant (Claude Code, Cursor, dll)

Dokumen ini membantu AI cepat menemukan file yang tepat sebelum melakukan
perubahan, supaya tidak salah lokasi atau menduplikasi pola yang sudah ada.
Baca bagian "Pola Wajib Diikuti" sebelum menambah fitur baru.

## 1. Arsitektur Singkat

Electron app: **main process** (Node.js, akses DB/filesystem) berkomunikasi
dengan **renderer** (React) lewat IPC yang dijembatani `preload.js`
(contextBridge -> `window.api.*`).

```
UI (React, src/renderer)
   -> window.api.xxx.yyy(...)   <- didefinisikan di preload.js
   -> ipcMain.handle('xxx:yyy') <- didaftarkan di ipc.js
   -> repository function       <- src/main/db/*Repository.js
   -> better-sqlite3            <- src/main/db/connection.js
```

## 2. "Saya mau mengubah X, file mana yang harus disentuh?"

| Yang ingin diubah | File |
|---|---|
| Tampilan/halaman katalog game | `src/renderer/pages/CatalogPage.jsx` |
| Tampilan Best Seller | `src/renderer/pages/BestSellerPage.jsx` |
| Tampilan FAQ (termasuk **landing page kategori**) | `src/renderer/pages/FaqPage.jsx` |
| Tampilan Tempat Beli Kaset (toko jual-beli) | `src/renderer/pages/KasetStoresPage.jsx` |
| Form tambah/edit game | `src/renderer/components/GameFormModal.jsx` |
| Upload foto game | `src/renderer/components/ImageUploader.jsx` |
| Upload gambar jawaban FAQ | `src/renderer/components/FaqImageUploader.jsx` |
| Sidebar menu kiri | `src/renderer/components/Sidebar.jsx` |
| Warna, spacing, font, style global, ukuran kartu landing | `src/renderer/styles/global.css` (cari berdasarkan nama class, mis. `.faq-landing-card`) |
| Daftar platform/region/kategori FAQ/kondisi (data statis) | `src/shared/constants.json` |
| Skema tabel database & migrasi | `src/main/db/schema.js` (selalu tambah migrasi baru di akhir array `MIGRATIONS`, jangan edit migrasi lama) |
| Logic CRUD game | `src/main/db/gamesRepository.js` |
| Logic CRUD FAQ | `src/main/db/faqRepository.js` |
| Logic override desc/icon kategori FAQ | `src/main/db/faqCategoryRepository.js` |
| Logic CRUD Tempat Beli Kaset | `src/main/db/kasetStoresRepository.js` |
| Logic backup/restore database | `src/main/db/backupRepository.js` |
| Pendaftaran channel IPC baru | `src/main/ipc.js` |
| Ekspos fungsi baru ke UI (`window.api.*`) | `src/main/preload.js` |
| Window app (ukuran, posisi, menu, zoom) | `src/main/main.js` |
| Lazy-load + cache thumbnail di grid/list | `src/renderer/hooks/useLazyThumbnail.js` |
| Export Excel/CSV/PDF | `src/main/db/exportRepository.js` |

## 3. Pola Wajib Diikuti Saat Menambah Fitur

1. **Tambah kolom/tabel baru** -> tambahkan migrasi baru di
   `schema.js` (jangan ubah array migrasi versi lama, SQLite akan
   menjalankan migrasi secara berurutan berdasarkan `user_version`).
2. **Tambah field di repository** -> selalu sediakan default aman
   (`input.x ?? existing.x` saat update, `input.x || null` saat create)
   supaya kompatibel dengan data lama.
3. **Tambah endpoint baru** -> 3 langkah wajib:
   a. Fungsi di `*Repository.js`
   b. `ipcMain.handle('namespace:action', ...)` di `ipc.js`
   c. `namespace: { action: (...) => invoke('namespace:action', ...) }` di `preload.js`
4. **Upload gambar** -> ikuti pola `imagesRepository.js` /
   `faqImagesRepository.js` / `faqCategoryRepository.js`: kompres dengan
   Jimp, simpan sebagai BLOB (bukan path file), simpan 2 versi (full +
   thumbnail).
5. **Komponen list yang bisa di-drag-reorder** -> ikuti pola
   `accordion-list` + `accordion-item` di FaqPage.jsx / KasetStoresPage.jsx.
6. **Styling** -> jangan hardcode warna/spacing; pakai CSS variable yang
   sudah ada di `global.css` (`var(--space-4)`, `var(--color-primary)`, dst).

## 4. Catatan Khusus Data

- Database tunggal: `catalog.db` (SQLite), berisi SEMUA tabel (game, FAQ,
  Tempat Beli Kaset, dll). **Backup/Restore cukup copy 1 file ini** --
  tidak perlu logic backup terpisah per fitur.
- Foto/gambar selalu disimpan sebagai BLOB di kolom database, bukan path
  file eksternal, supaya backup selalu lengkap & portabel.

## 6. Catatan Performa & Optimisasi (penting dibaca sebelum sentuh hal ini lagi)

**Sudah diperbaiki (jangan dikerjakan ulang):**
- `src/main/main.js` -- event `resize`/`move` window di-debounce 300ms
  (`saveWindowBoundsDebounced`) sebelum menulis ke SQLite. Sebelumnya
  menulis ke disk di SETIAP event resize/move (puluhan kali/detik) dan
  bikin drag-resize window terasa tersendat. Saat window ditutup tetap
  menyimpan langsung (non-debounced) lewat handler `close`.
- `src/renderer/hooks/useLazyThumbnail.js` -- `thumbCache` kini dibatasi
  LRU max 2000 entri (`THUMB_CACHE_MAX`, fungsi `cacheGet`/`cacheSet`).
  Sebelumnya `Map` tanpa batas, berisiko memori terus naik kalau user
  scroll sangat panjang dalam satu sesi pada katalog besar.

**Belum dikerjakan, dicatat untuk milestone berikutnya (urutan dampak):**
1. Filter `region` di `gamesRepository.js::listGames` pakai
   `LIKE '%"region"%'` pada kolom JSON-string (tidak pakai index). Aman di
   skala saat ini, tapi kalau filter region jadi sering dipakai di
   katalog 100rb+ baris, pertimbangkan tabel relasi `game_regions(game_id, region)`
   dengan index sendiri.
2. Logic kompresi gambar (Jimp, scaleToFit + quality) terduplikasi 3x di
   `imagesRepository.js`, `faqImagesRepository.js`, dan
   `faqCategoryRepository.js`. Sebaiknya diekstrak ke util bersama
   `src/main/db/imageUtils.js` (`compressImageToVariants(buffer, opts)`)
   supaya tidak triple-maintain.
3. `App.jsx` me-mount/unmount halaman secara kondisional
   (`{activePage === 'x' && <Page />}`), jadi tiap pindah menu, state
   filter/scroll/search di halaman sebelumnya hilang & refetch dari nol.
   Bukan masalah performa (query lokal cepat) tapi UX "reset" terus.
   Perbaikan: render semua halaman sekaligus + `display:none` untuk yang
   tidak aktif, atau cache state per halaman.
4. `GameCard.jsx`/`GameTable.jsx` belum pakai `React.memo`/`useMemo`.
   Tidak terasa di `PAGE_SIZE=60` saat ini, tapi kalau page size dinaikkan
   akan jadi titik lag berikutnya.
5. Tiap `GameCard` membuat `IntersectionObserver` sendiri (satu per
   kartu). Aman di skala 60 item/halaman; kalau nanti ada infinite-scroll
   atau page size besar, pindah ke satu shared observer (observer-pool
   pattern) supaya tidak ada ratusan observer paralel.

## 7. Riwayat Migrasi Schema (ringkas)

- v1: skema awal (games, images, price_history, best_seller, dll)
- v2: seed `shopee_admin_fee`
- v3: flag `is_best_seller`
- v4: flag `jangan_dibeli`
- v5: tabel `faq`, `faq_images`, `kaset_stores` + urutan sidebar
- v6: kolom `category` di `faq`
- v7: tabel `faq_category_settings` (desc & icon kustom per kategori FAQ),
  kolom `operating_hours` & `links` di `kaset_stores`
