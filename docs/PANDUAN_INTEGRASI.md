# 🔧 PANDUAN INTEGRASI - Cara Menerapkan Perubahan v8

Dokumen ini menjelaskan **langkah demi langkah** cara mengintegrasikan semua file yang sudah dimodifikasi ke dalam project Anda.

---

## 📋 DAFTAR FILE YANG DIMODIFIKASI

File-file berikut telah diubah dan tersedia untuk download:

```
✅ constants.json             (src/shared/)
✅ schema.js                  (src/main/db/)
✅ kasetStoresRepository.js   (src/main/db/)
✅ FaqPage.jsx                (src/renderer/pages/)
✅ KasetStoresPage.jsx        (src/renderer/pages/)
✅ global.css                 (src/renderer/styles/)
```

---

## 🚀 LANGKAH INTEGRASI

### **Langkah 1: Backup Project Lama**
```bash
# Buat backup folder
cp -r catalog-manager catalog-manager.backup_v7
```

### **Langkah 2: Update Constants**

**File**: `src/shared/constants.json`

✅ **Aksi**: Replace/update dengan file baru yang sudah disediakan
- **Apa yang ditambah**:
  - `DAYS_OF_WEEK` array (7 hari kerja + hari)
  - `STORE_LINK_LABELS` array (platform marketplace)

⚠️ **Hati-hati**: Jangan hapus field lama (`PLATFORMS`, `REGIONS`, `FAQ_CATEGORIES`, `CONDITIONS`, `SORT_FIELDS`) - tetap butuh!

---

### **Langkah 3: Update Database Schema**

**File**: `src/main/db/schema.js`

✅ **Aksi**: Replace/update dengan file baru

✔️ **Apa yang berubah**:
- Migrasi v7 (sudah ada) tetap tidak diubah
- **Tambahan**: Migrasi v8 (di akhir array `MIGRATIONS`)
  - `ALTER TABLE kaset_stores ADD COLUMN operating_days TEXT;`
  - `ALTER TABLE kaset_stores ADD COLUMN url_label TEXT;`
- `SCHEMA_VERSION` diubah dari `v7` → `v8`

⚠️ **PENTING**: 
- Jangan ubah migrasi v1-v7 yang sudah ada!
- Hanya tambahkan v8 di akhir array

**Test**:
```bash
node --check src/main/db/schema.js
```

---

### **Langkah 4: Update Repository**

**File**: `src/main/db/kasetStoresRepository.js`

✅ **Aksi**: Replace/update dengan file baru

✔️ **Apa yang berubah**:
- Tambah helper function: `parseJsonArray()`
- Update `rowToStore()`: tambah parsing untuk `operatingDays` & `urlLabel`
- Update `createStore()`: handle 2 field baru
- Update `updateStore()`: handle 2 field baru

**Test**:
```bash
node --check src/main/db/kasetStoresRepository.js
```

---

### **Langkah 5: Update FAQ Page**

**File**: `src/renderer/pages/FaqPage.jsx`

✅ **Aksi**: Replace/update dengan file baru

✔️ **Apa yang berubah**:

1. **CategoryCard component**:
   - Tambah tombol edit pensil di pojok kanan atas (hidden by default)
   - Tombol muncul saat hover kartu
   - Hapus onClick dari description
   - Tambah try/catch di `handleIconFile()`

2. **Wrapping CategoryLanding**:
   - Wrap dengan `<div className="faq-landing-wrap">`

**Test**:
```bash
# Check syntax
node --check src/renderer/pages/FaqPage.jsx
```

---

### **Langkah 6: Update Kaset Stores Page**

**File**: `src/renderer/pages/KasetStoresPage.jsx`

✅ **Aksi**: Replace/update dengan file baru

✔️ **Apa yang berubah**:

1. **LinkLabelSelect component** (baru):
   - Dropdown untuk pilih label
   - Input custom jika pilih "Lainnya"
   - Reusable untuk link utama & link tambahan

2. **StoreFormModal component**:
   - State baru: `operatingDays`, `urlLabel`
   - Checkbox grid 7 hari (bukan text input lagi)
   - Input teks terpisah untuk jam
   - LinkLabelSelect di 2 tempat

3. **KasetStoresPage display**:
   - Tampilkan formatted hari & jam
   - Tampilkan label pada link utama (bukan raw URL)

4. **Helper function** `formatOperatingDays()`:
   - Input: array hari
   - Output: string label ringkas

**Test**:
```bash
node --check src/renderer/pages/KasetStoresPage.jsx
```

---

### **Langkah 7: Update Global CSS**

**File**: `src/renderer/styles/global.css`

✅ **Aksi**: Replace/update dengan file baru

✔️ **Apa yang berubah**:

1. **FAQ Landing Grid** (item #1):
   - Tambah `.faq-landing-wrap` (centering + min-height)
   - Update `.faq-landing-grid` max-width: 1200px → **1400px**

2. **FAQ Landing Card** (item #1, #2, #3):
   - Update min-height: 260px → **320px**
   - Tambah `position: relative`

3. **Edit Button** (item #2, #3):
   - Tambah `.faq-landing-edit-btn` (absolute positioned, hover-reveal)
   - Update `.faq-landing-card:hover .faq-landing-edit-btn` opacity

4. **Description** (item #2, #3):
   - Remove `cursor: text` dari `.faq-landing-desc`
   - Hide `.faq-landing-desc-edit-icon` dengan `display: none`

**Verification**:
- Buka file CSS, cari class `.faq-landing-card`
- Pastikan ada `position: relative` dan `min-height: 320px`
- Pastikan ada `.faq-landing-edit-btn` dengan hover effect

---

## ✅ CHECKLIST INTEGRASI

- [ ] constants.json updated (DAYS_OF_WEEK + STORE_LINK_LABELS ditambah)
- [ ] schema.js updated (migrasi v8 ditambah)
- [ ] kasetStoresRepository.js updated (parsing & CRUD logic)
- [ ] FaqPage.jsx updated (edit button, wrapper, try/catch)
- [ ] KasetStoresPage.jsx updated (LinkLabelSelect, form, display)
- [ ] global.css updated (styling, grid, card size)
- [ ] Syntax check: `node --check src/main/**/*.js`
- [ ] Build check: `npx vite build`
- [ ] Run app: `npm start`

---

## 🧪 TESTING SETELAH INTEGRASI

### **1. Database Migration**
```
✅ Buka app → aplikasi otomatis migrasi v8
✅ Check di DevTools: tidak ada error di console
✅ Data lama tetap ada (backward compatible)
```

### **2. FAQ Page**
```
✅ Halaman FAQ landing OK
✅ Grid centered, spacing bagus
✅ Hover card → edit button (pensil) muncul di pojok kanan atas
✅ Click pensil → edit mode
✅ Description tidak clickable lagi (hanya via tombol)
✅ Upload icon → jika error, tampil alert
```

### **3. Kaset Stores Page**
```
✅ Form tambah/edit toko
✅ Hari operasi: checkbox grid 7 hari
✅ Jam operasi: input text terpisah (placeholder "09.00-17.00")
✅ Link utama: ada dropdown label + option custom
✅ Link tambahan: sama seperti link utama (dropdown + custom)

✅ Tampilan list toko:
  - Hari operasi ditampilkan (format ringkas, misal "Senin–Sabtu")
  - Jam ditampilkan di sebelah hari
  - Link utama: button dengan label (bukan raw URL)
  - Link tambahan: button seperti sebelumnya
```

---

## 🛠️ TROUBLESHOOTING

### **Error: "Cannot find module @shared/constants.json"**
**Solusi**: Pastikan import path benar di React components:
```javascript
import { DAYS_OF_WEEK, STORE_LINK_LABELS } from '@shared/constants.json';
```
(Dengan `@` alias, bukan `../../../shared/constants.json`)

---

### **Error: "Migrasi v8 tidak berjalan"**
**Solusi**: 
1. Check `src/main/db/schema.js` - pastikan migrasi v8 di akhir array
2. Clear database (untuk dev):
   ```bash
   rm ~/.catalog-manager/database.db  # atau path aplikasi
   ```
3. Restart app

---

### **Edit Button Tidak Muncul Saat Hover**
**Solusi**: 
1. Check global.css - pastikan ada `.faq-landing-edit-btn` dengan `opacity: 0`
2. Check `.faq-landing-card:hover .faq-landing-edit-btn` dengan `opacity: 1`
3. DevTools → Inspect element → check computed styles

---

### **Dropdown Label Link Tidak Berfungsi**
**Solusi**:
1. Check constants.json - pastikan `STORE_LINK_LABELS` array ada
2. Check KasetStoresPage.jsx - pastikan import dari constants
3. Check LinkLabelSelect component state & callbacks

---

## 📞 TIPS

1. **Aman untuk edit secara incremental**:
   - Bisa update file satu per satu
   - Test setelah setiap file sebelum lanjut ke file berikutnya

2. **Git diff untuk review**:
   ```bash
   git diff src/shared/constants.json  # lihat perubahan
   ```

3. **Vite build tanpa start**:
   ```bash
   npx vite build  # hanya build, tidak run
   # Cek apakah ada error
   ```

4. **Debug database**:
   ```bash
   # Install SQLite CLI (optional)
   sqlite3 ~/.catalog-manager/database.db
   > .schema kaset_stores
   # Lihat kolom yang ada
   ```

---

## 🎉 SELESAI!

Setelah semua file terintegrasi dan testing berhasil, Anda sudah ready untuk production! 

Semua fitur baru siap digunakan:
- ✅ FAQ landing page lebih rapi & responsif
- ✅ Edit pencil hover-based (tidak mengganggu UX)
- ✅ Icon upload dengan error handling
- ✅ Jadwal operasi hari & jam terpisah (lebih fleksibel)
- ✅ Link label dropdown (lebih user-friendly)

---

**Good luck! Happy coding! 🚀**
