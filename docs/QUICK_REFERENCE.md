# ⚡ QUICK REFERENCE CARD - Perubahan v8

**Cetak atau pin di monitor Anda saat integrasi!**

---

## 🔍 CHECKLIST SEBELUM & SESUDAH

### SEBELUM Integrasi (v7):
```
❌ DAYS_OF_WEEK di constants.json
❌ STORE_LINK_LABELS di constants.json
❌ Migrasi v8 di schema.js
❌ operating_days kolom di kaset_stores
❌ url_label kolom di kaset_stores
❌ parseJsonArray() di repository
❌ Edit pencil di kartu FAQ
❌ Try/catch di icon upload
```

### SESUDAH Integrasi (v8):
```
✅ DAYS_OF_WEEK ada di constants.json
✅ STORE_LINK_LABELS ada di constants.json
✅ Migrasi v8 ada di schema.js (SCHEMA_VERSION = v8)
✅ operating_days bisa disimpan ke database
✅ url_label bisa disimpan ke database
✅ parseJsonArray() parsing hari & label
✅ Edit pencil di pojok kartu (hover only)
✅ Error alert muncul jika upload gagal
✅ Hari & jam terpisah di form
✅ Dropdown label untuk link
```

---

## 🎯 FILE CHANGES AT A GLANCE

| File | Lines Changed | Type |
|------|---------------|------|
| constants.json | +15 | ADD |
| schema.js | +6 | ADD |
| kasetStoresRepository.js | ~25 | MODIFY |
| FaqPage.jsx | ~30 | MODIFY |
| KasetStoresPage.jsx | ~150 | MODIFY |
| global.css | ~40 | MODIFY |

---

## 🚨 CRITICAL CHANGES (Jangan Lupa!)

### 1️⃣ Schema.js
```
⚠️ HANYA TAMBAH migrasi v8 di akhir array
❌ JANGAN ubah migrasi v1-v7
✅ Update SCHEMA_VERSION ke 'v8'
```

### 2️⃣ Constants.json
```
✅ Tambah DAYS_OF_WEEK (7 object dengan value & label)
✅ Tambah STORE_LINK_LABELS (8 string)
❌ JANGAN hapus field lama (PLATFORMS, REGIONS, FAQ_CATEGORIES, dsb)
```

### 3️⃣ KasetStoresRepository.js
```
✅ Tambah parseJsonArray() helper
✅ Update rowToStore() - parse operating_days & url_label
✅ Update createStore() - handle 2 field baru
✅ Update updateStore() - handle 2 field baru
```

### 4️⃣ FaqPage.jsx
```
✅ Tambah try/catch di handleIconFile()
✅ Pindahkan pencil button ke pojok (absolute positioned)
✅ Remove onClick dari description div
✅ Wrap CategoryLanding dengan <div className="faq-landing-wrap">
```

### 5️⃣ KasetStoresPage.jsx
```
✅ Tambah LinkLabelSelect component (dropdown + custom)
✅ Tambah formatOperatingDays() helper function
✅ Ubah operatingHours jadi 2 field (hari checkbox + jam text)
✅ Gunakan LinkLabelSelect di 2 tempat (link utama + link tambahan)
```

### 6️⃣ global.css
```
✅ Tambah .faq-landing-wrap (flex centering)
✅ Update .faq-landing-grid (max-width 1400px)
✅ Update .faq-landing-card (min-height 320px, position relative)
✅ Tambah .faq-landing-edit-btn (absolute, opacity 0)
✅ Update .faq-landing-card:hover .faq-landing-edit-btn (opacity 1)
```

---

## 🧪 TEST COMMANDS

```bash
# 1. Check syntax semua file JS
node --check src/main/db/schema.js
node --check src/main/db/kasetStoresRepository.js
node --check src/renderer/pages/FaqPage.jsx
node --check src/renderer/pages/KasetStoresPage.jsx

# 2. Build project
npx vite build

# 3. Run development server
npm start

# 4. Check browser console (F12)
# - Tidak ada error red
# - Tidak ada warning orange

# 5. Manual testing (lihat section berikutnya)
```

---

## 🎬 MANUAL TEST SCENARIOS

### Test 1: FAQ Page Layout
```
1. Buka FAQ page
2. Lihat landing page dengan 3 kartu (Nintendo, PlayStation, Umum)
3. Kartu HARUS centered di tengah layar (bukan di atas)
4. Kartu lebih besar dari sebelumnya (min-height 320px)
5. Hover kartu → edit button (✎) muncul di pojok kanan atas
6. Click edit button → edit mode untuk description
```

### Test 2: Icon Upload
```
1. Hover kartu FAQ
2. Click di icon area (📷 overlay muncul)
3. Upload gambar valid (JPG/PNG) → OK
4. Upload file bukan gambar (TXT) → Alert "Gagal mengunggah..."
5. Upload gambar besar (10MB) → Check error handling
```

### Test 3: Kaset Stores - New Form
```
1. Tambah toko baru
2. Isi nama toko
3. Isi URL utama
4. Pilih label link utama (dropdown: Shopee, Tokopedia, dll)
5. Opsi "Lainnya" → input text custom label
6. Check hari operasi: 7 checkbox (Senin-Minggu)
7. Isi jam operasi (terpisah dari hari)
8. Add link tambahan → juga punya dropdown label
9. Save → check di database ada operating_days & url_label
```

### Test 4: Kaset Stores - Display
```
1. List toko menampilkan:
   - Hari operasi (format ringkas, misal "Senin–Sabtu")
   - Jam operasi (di sebelah hari)
2. Link utama tampil sebagai button dengan label (misal "Shopee")
   - BUKAN raw URL
3. Link tambahan juga button dengan label
```

---

## 💾 DATABASE CHECK (Advanced)

Kalau ingin check database langsung:

```bash
# Install SQLite browser (optional)
# MacOS: brew install sqlitebrowser
# Windows: Download dari sqlitebrowser.org

# Atau via CLI:
sqlite3 /path/to/database.db

# Dalam sqlite3:
> .schema kaset_stores
# Output harus punya kolom:
# - operating_days TEXT
# - url_label TEXT

> SELECT operating_days, url_label FROM kaset_stores LIMIT 1;
# Lihat data ada yang tersimpan
```

---

## 🆘 QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Edit button tidak muncul saat hover | Check global.css - pastikan `.faq-landing-edit-btn` opacity: 0 dan `.faq-landing-card:hover` punya opacity: 1 |
| Dropdown label tidak muncul | Check KasetStoresPage import: `import { DAYS_OF_WEEK, STORE_LINK_LABELS } from '@shared/constants.json'` |
| Database error setelah update | Clear database dan restart: `rm ~/.catalog-manager/database.db` |
| Build gagal | Run `npx vite build` dan lihat error message lengkap |
| Hari tidak tersimpan | Check kasetStoresRepository - pastikan `operatingDaysJson` di-serialize dengan `JSON.stringify()` |

---

## 📱 RESPONSIVE DESIGN

### FAQ Grid akan responsive di:
- **Desktop (1400px)**: 3-4 kartu per baris
- **Tablet (1024px)**: 2 kartu per baris
- **Mobile (480px)**: 1 kartu per baris

CSS sudah handle `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`

---

## 🎓 LEARNING NOTES

### Konsep baru yang digunakan:

1. **Hover-only UI Element**:
   - `.faq-landing-edit-btn` opacity 0 (hidden)
   - `.faq-landing-card:hover .faq-landing-edit-btn` opacity 1 (reveal)
   - CSS transition untuk smooth effect

2. **JSON Array Parsing**:
   - `operating_days` disimpan sebagai JSON string: `["sen","sel","rab"]`
   - Parse back: `JSON.parse(raw)` → array
   - Helper function `parseJsonArray()` dengan try/catch

3. **Controlled Checkbox Grid**:
   - Array state: `const [operatingDays, setOperatingDays] = useState([])`
   - Toggle logic: `setOperatingDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val])`

4. **Reusable Component Pattern**:
   - `LinkLabelSelect` - component kecil yang bisa dipakai 2+ tempat
   - Props: value, isCustom, onChangeLabel, onChangeCustom

5. **Conditional Rendering**:
   - Show custom input hanya jika user pilih "Lainnya": `{isOther && <input ... />}`

---

## 📌 FINAL REMINDERS

- ✅ **Backup lama sebelum mulai integrasi**
- ✅ **Test satu file per satu** (jangan sekaligus 6 file)
- ✅ **Buka DevTools F12** saat testing (lihat console errors)
- ✅ **Restart app** setelah ubah database schema
- ✅ **Clear cache** browser jika ada styling issue: Ctrl+Shift+R (hard refresh)

---

**Good luck! Semua implementasi sudah solid dan ready!** 🚀
