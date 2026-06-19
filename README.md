# Catalog Manager

Aplikasi desktop Windows untuk mengelola katalog jual-beli game original PlayStation & Nintendo. Berjalan 100% offline, database lokal (SQLite), foto disimpan langsung di database (tidak bergantung path file).

> Status: Milestone 1 selesai -- CRUD game lengkap, database, foto (drag & drop, kompresi otomatis, thumbnail, zoom, cover), grid/list view, search & filter & sort realtime, bulk delete & bulk update harga, riwayat perubahan harga, duplikasi item.
> Belum tersedia (milestone berikutnya): Import/Export Excel/CSV/PDF, Backup/Restore database, fitur Best Seller, Undo/Redo global.

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

## 4. Lokasi Database & Backup Manual

Database SQLite (catalog.db) disimpan otomatis di:

```
C:\Users\<NamaUser>\AppData\Roaming\Catalog Manager\database\catalog.db
```

Untuk migrasi data antar komputer atau backup manual (sebelum fitur Backup/Restore di UI tersedia), cukup salin folder database tersebut ke komputer tujuan, lalu letakkan di lokasi yang sama. Karena foto produk tersimpan sebagai BLOB di dalam file catalog.db itu sendiri, satu file ini sudah membawa seluruh data termasuk foto -- tidak ada file lain yang perlu disalin.

Tutup aplikasi terlebih dahulu sebelum menyalin file database untuk menghindari file catalog.db-wal yang belum di-flush.

---

## 5. Struktur Project

```
src/
  main/             Proses utama Electron (Node.js) - akses database & filesystem
    db/
      schema.js          Skema tabel + sistem migrasi
      connection.js       Membuka koneksi SQLite di folder userData
      gamesRepository.js  CRUD game, search, sort, filter, riwayat harga
      imagesRepository.js Penyimpanan foto sebagai BLOB + kompresi (Sharp)
    main.js          Entry point, membuat window aplikasi
    preload.js        Jembatan aman antara UI dan backend (contextBridge)
    ipc.js            Pendaftaran semua handler IPC
  renderer/          UI React (apa yang dilihat pengguna)
    components/      Komponen UI (GameCard, GameTable, modal, dll)
    pages/            Halaman (Catalog, Best Seller)
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
- Sharp -- kompresi & thumbnail foto otomatis di sisi backend (bukan di browser, jadi lebih cepat & hemat memori)
- electron-builder -- membungkus jadi installer .exe (NSIS) dan portable

## 7. Catatan Performa

- Foto disimpan dalam dua versi: versi penuh (long-edge ~1600px, untuk zoom viewer) dan thumbnail (~300px, untuk grid/list). Grid/list hanya memuat thumbnail, dan baru memuat saat kartu/baris terlihat di layar (lazy loading via IntersectionObserver) -- ini menjaga scroll tetap mulus walau katalog berisi ratusan ribu foto.
- Pencarian nama/platform/region memakai index FTS5 SQLite, bukan LIKE '%...%' biasa, sehingga tetap instan di 50.000+ data.
- Semua kolom yang dipakai untuk filter & sort (platform, region, kondisi, harga, tanggal) memiliki index database tersendiri.
