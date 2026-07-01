# Catalog Manager

Aplikasi desktop Windows untuk mengelola katalog jual-beli game original PlayStation & Nintendo. Berjalan 100% offline, database lokal (SQLite), foto disimpan langsung di database (tidak bergantung path file).

> Status terkini (schema v9): CRUD game lengkap (database, foto drag & drop
> dengan kompresi otomatis, thumbnail, zoom, cover, grid/list, search & filter
> & sort realtime, filter tanpa foto, bulk delete & bulk update harga, riwayat
> perubahan harga, duplikasi item) -- Best Seller -- Pertanyaan (FAQ) dengan
> kategori & icon custom -- Tempat Beli Kaset (multi-link, jadwal operasi,
> link dibuka lewat browser default OS agar sesi login tidak perlu diulang) --
> Import/Export Excel & CSV -- Backup/Restore database (1 file `catalog.db`
> mencakup semua data termasuk foto) -- sidebar reorder drag & drop.
> Belum tersedia: reposisi toolbar Import/Export/Backup/Restore (di-hold),
> Export PDF, Undo/Redo global.

---

## 1. Cara Mendapatkan File .exe (Tanpa Komputer Windows)

Project ini sudah dilengkapi GitHub Actions yang otomatis membuild installer .exe dan versi portable .zip di server Windows milik GitHub -- Anda tidak perlu komputer Windows sama sekali.

### Langkah-langkah:

1. Buat repository GitHub baru (boleh privat atau publik), lalu upload semua isi folder project ini ke repository tersebut.
   ```bash
   cd catalog-manager
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/catalog-manager.git
   git push -u origin main
   ```

2. Buka tab "Actions" di halaman repository GitHub Anda. Workflow bernama "Build Windows App" akan otomatis berjalan setiap kali Anda push kode ke branch main.

3. Tunggu proses build selesai (biasanya 3-7 menit). Anda bisa memantau progresnya secara live di tab Actions.

4. Unduh hasilnya: setelah selesai (tanda centang hijau), klik run tersebut, lalu scroll ke bagian "Artifacts" di bagian bawah halaman. Unduh catalog-manager-windows.zip -- di dalamnya ada:
   - Catalog Manager-Setup-1.0.0.exe (installer, double-click untuk install)
   - Catalog Manager-1.0.0-portable.exe atau .zip (versi portable, tidak perlu instalasi)

5. Bagikan file tersebut ke anggota tim Anda lewat WhatsApp, Google Drive, flashdisk, dll -- file ini standalone dan tidak butuh internet untuk berjalan.

Jika Anda ingin menjalankan build manual tanpa menunggu push, buka tab Actions -> pilih "Build Windows App" -> klik "Run workflow".

---

## 2. Menjalankan di Mode Development (opsional, untuk yang ingin modifikasi kode)

Butuh komputer Windows, macOS, atau Linux dengan Node.js 18+ terinstall.

```bash
npm install
npm run dev
```

Ini akan membuka aplikasi dalam mode development dengan hot-reload.

## 3. Build Manual di Komputer Windows (alternatif jika tidak memakai GitHub)

```bash
npm install
npm run build:win
```

Hasil build ada di folder dist_installer/.

---

## 4. Lokasi Database & Backup

Database SQLite (catalog.db) disimpan otomatis di:

```
C:\Users\<NamaUser>\AppData\Roaming\Catalog Manager\database\catalog.db
```

Cara paling gampang backup/restore: pakai tombol **Backup** dan **Restore** di halaman Katalog Game (sudah ada di aplikasi). Backup cukup 1 file `catalog.db` karena semua data -- termasuk foto yang tersimpan sebagai BLOB -- ada di dalamnya. Ini juga mencakup FAQ dan Tempat Beli Kaset, bukan cuma katalog game.

Kalau perlu salin manual (tanpa lewat UI), tutup aplikasi dulu sebelum menyalin file database, supaya file catalog.db-wal yang belum di-flush tidak ikut hilang/rusak.

---

## 5. Struktur Project

```
src/
  main/             Proses utama Electron (Node.js) - akses database & filesystem
    db/
      schema.js               Skema tabel + sistem migrasi (v1-v9)
      connection.js           Membuka koneksi SQLite di folder userData
      gamesRepository.js      CRUD game, search, sort, filter, riwayat harga
      imagesRepository.js     Penyimpanan foto game sebagai BLOB + kompresi (Jimp)
      faqRepository.js        CRUD Pertanyaan (FAQ)
      faqImagesRepository.js  Gambar jawaban FAQ
      faqCategoryRepository.js Deskripsi & icon custom per kategori FAQ
      kasetStoresRepository.js CRUD Tempat Beli Kaset
      exportRepository.js     Export Excel/CSV
      backupRepository.js     Backup/Restore file catalog.db
      sidebarRepository.js    Urutan menu sidebar (drag & drop)
    main.js          Entry point, membuat window aplikasi, buka link eksternal via browser default
    preload.js        Jembatan aman antara UI dan backend (contextBridge)
    ipc.js            Pendaftaran semua handler IPC
  renderer/          UI React (apa yang dilihat pengguna)
    components/      Komponen UI (GameCard, GameTable, GameFormModal, modal, dll)
    pages/            Halaman (Katalog Game, Best Seller, Pertanyaan/FAQ, Tempat Beli Kaset)
    hooks/             Custom hooks (lazy loading thumbnail)
    styles/            CSS global (design tokens, tema bright/minimalis)
  shared/            Konstanta yang dipakai bersama main & renderer (platform, region, dll)
.github/workflows/   Workflow GitHub Actions untuk build otomatis
build/               Icon aplikasi (.ico)
```

## 6. Teknologi yang Dipakai

- Electron -- membungkus aplikasi jadi desktop app Windows standalone
- React + Vite -- UI
- better-sqlite3 -- database lokal, dengan FTS5 untuk search realtime yang cepat di puluhan ribu data
- Jimp -- kompresi & thumbnail foto otomatis di sisi backend (game, FAQ, & icon kategori FAQ)
- exceljs -- import/export Excel & CSV
- electron-builder -- membungkus jadi installer .exe (NSIS) dan portable

## 7. Catatan Performa

- Foto disimpan dalam dua versi: versi penuh (long-edge ~1600px, untuk zoom viewer) dan thumbnail (~300px, untuk grid/list). Grid/list hanya memuat thumbnail, dan baru memuat saat kartu/baris terlihat di layar (lazy loading via IntersectionObserver) -- ini menjaga scroll tetap mulus walau katalog berisi ratusan ribu foto.
- Pencarian nama/platform/region memakai index FTS5 SQLite, bukan LIKE '%...%' biasa, sehingga tetap instan di 50.000+ data.
- Semua kolom yang dipakai untuk filter & sort (platform, region, kondisi, harga, tanggal) memiliki index database tersendiri.
