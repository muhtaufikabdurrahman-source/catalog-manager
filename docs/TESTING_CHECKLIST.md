# ✅ TESTING CHECKLIST - Rencana Perubahan v8

**Selesaikan checklist ini untuk memastikan semua fitur bekerja dengan baik setelah integrasi.**

Tanggal Testing: ________________  
Tester: ________________  
Status: ☐ PASSED  ☐ FAILED

---

## 📋 PRE-INTEGRATION CHECKS

### Code Review
- [ ] Baca IMPLEMENTASI_SUMMARY.md
- [ ] Baca PANDUAN_INTEGRASI.md
- [ ] Review semua 6 file yang akan diintegrasikan
- [ ] Sudah backup project lama (catalog-manager.backup_v7)

### Environment
- [ ] Node.js installed: `node --version` ✅
- [ ] npm/yarn working: `npm --version` ✅
- [ ] Git available: `git --version` ✅
- [ ] SQLite CLI available (optional): `sqlite3 --version` ✅

---

## 🔧 INTEGRATION STEPS & CHECKS

### Step 1: Update constants.json
- [ ] Copy constants.json ke `src/shared/`
- [ ] Validate JSON format: `node -e "require('./src/shared/constants.json')"`
- [ ] Check DAYS_OF_WEEK ada (7 items)
- [ ] Check STORE_LINK_LABELS ada (8 items)
- [ ] Check field lama masih ada (PLATFORMS, REGIONS, dll)

### Step 2: Update schema.js
- [ ] Copy schema.js ke `src/main/db/`
- [ ] Run syntax check: `node --check src/main/db/schema.js`
- [ ] Verify migrasi v8 ada di akhir array
- [ ] Verify SCHEMA_VERSION = MIGRATIONS.length
- [ ] JANGAN ubah migrasi v1-v7

### Step 3: Update kasetStoresRepository.js
- [ ] Copy file ke `src/main/db/`
- [ ] Run syntax check: `node --check src/main/db/kasetStoresRepository.js`
- [ ] Verify parseJsonArray() function ada
- [ ] Verify rowToStore() include operatingDays & urlLabel
- [ ] Verify createStore() handle 2 field baru
- [ ] Verify updateStore() handle 2 field baru

### Step 4: Update FaqPage.jsx
- [ ] Copy file ke `src/renderer/pages/`
- [ ] Run syntax check: `node --check src/renderer/pages/FaqPage.jsx`
- [ ] Verify edit button dengan class faq-landing-edit-btn ada
- [ ] Verify try/catch di handleIconFile() ada
- [ ] Verify faq-landing-wrap wrapper ada
- [ ] Verify description tidak punya onClick handler

### Step 5: Update KasetStoresPage.jsx
- [ ] Copy file ke `src/renderer/pages/`
- [ ] Run syntax check: `node --check src/renderer/pages/KasetStoresPage.jsx`
- [ ] Verify LinkLabelSelect component ada
- [ ] Verify formatOperatingDays() function ada
- [ ] Verify operatingDays & urlLabel state ada
- [ ] Verify DAYS_OF_WEEK & STORE_LINK_LABELS imported

### Step 6: Update global.css
- [ ] Copy file ke `src/renderer/styles/`
- [ ] Verify CSS syntax: `grep -E "^\s*\." src/renderer/styles/global.css | head -20`
- [ ] Verify .faq-landing-wrap class ada
- [ ] Verify .faq-landing-edit-btn class ada
- [ ] Verify .faq-landing-card min-height: 320px
- [ ] Verify .faq-landing-grid max-width: 1400px

---

## 🏗️ BUILD & DEPLOYMENT

### Build Check
- [ ] Run build: `npx vite build` ✅
- [ ] Build completed without errors
- [ ] Build completed without warnings (atau hanya minor warnings)
- [ ] dist/ folder created

### Development Server
- [ ] Start dev: `npm start` ✅
- [ ] Server started on port 5173 (atau port yang sesuai)
- [ ] Buka http://localhost:5173
- [ ] Page loads without errors

---

## 🧪 FUNCTIONAL TESTING

### TEST #1: FAQ Page Layout

#### Visual Check
- [ ] FAQ landing page menampilkan 3 kartu (Nintendo, PlayStation, Umum)
- [ ] Kartu **centered di tengah layar** (bukan di atas)
- [ ] Kartu **lebih besar dari sebelumnya** (visually bigger)
- [ ] Spacing antara kartu consistent
- [ ] Icon/emoji tetap muncul di kartu

#### Hover Behavior
- [ ] Hover kartu → edit button (✎) muncul di **pojok kanan atas**
- [ ] Edit button hidden ketika NOT hovering
- [ ] Edit button smooth fade in/out (ada transition)
- [ ] Edit button dalam lingkaran (border-radius 50%)

#### Edit Functionality
- [ ] Click edit button → modal/edit mode terbuka
- [ ] Dapat mengedit description
- [ ] Click save → description updated di kartu
- [ ] Click cancel → description kembali ke original

#### Description Behavior (Item #3)
- [ ] Description text tidak clickable lagi
- [ ] Description tidak punya cursor pointer
- [ ] HANYA bisa edit via edit button (✎)
- [ ] Inline pencil icon (✎) HILANG dari text

---

### TEST #2: Icon Upload & Error Handling

#### Upload Valid Image
- [ ] Hover kartu → icon area punya overlay 📷
- [ ] Click icon area → file picker terbuka
- [ ] Upload JPG/PNG valid → icon berubah
- [ ] Tidak ada error di console

#### Upload Invalid File
- [ ] Upload file TXT/PDF → alert muncul: "Gagal mengunggah gambar icon..."
- [ ] Alert berisi error message yang jelas
- [ ] Icon tidak berubah (tetap semula)
- [ ] App tetap responsif (bukan freeze)

#### Large File
- [ ] Upload gambar sangat besar (5MB+) → check behavior
- [ ] Either success (jika format OK) atau error (jika gagal)
- [ ] Tidak crash atau freeze

#### Remove Icon
- [ ] Icon custom ada X button (red circle)
- [ ] Click X → icon kembali ke default emoji
- [ ] Tidak ada error

---

### TEST #3: Kaset Stores - New Form Fields

#### Hari Operasi (Checkbox Grid)
- [ ] Add toko baru → form punya section "Hari Operasi"
- [ ] 7 checkbox grid (Senin-Minggu)
- [ ] Checkbox dapat di-toggle
- [ ] Dapat memilih multiple hari sekaligus
- [ ] Dapat deselect semua hari

#### Jam Operasi (Terpisah)
- [ ] Form punya field "Jam Operasi" (terpisah dari hari)
- [ ] Input text dengan placeholder "09.00-17.00"
- [ ] Dapat input teks bebas (bukan hanya angka)
- [ ] Tidak ada dropdown (pure text input)

#### Link Label Dropdown (Link Utama)
- [ ] Link Utama field tetap ada
- [ ] Ada field baru "Label Link Utama"
- [ ] Dropdown dengan pilihan: Shopee, Tokopedia, WhatsApp, Instagram, Facebook, TikTok Shop, Bukalapak, Lainnya
- [ ] Default value: Shopee
- [ ] Dapat mengganti pilihan
- [ ] Pilih "Lainnya" → text input muncul untuk custom label

#### Link Label Dropdown (Link Tambahan)
- [ ] Setiap row link tambahan punya dropdown label (bukan text input)
- [ ] Dropdown sama seperti link utama
- [ ] Pilih "Lainnya" → text input untuk custom label
- [ ] Dapat add multiple link dengan berbagai label

#### Form Submission
- [ ] Isi semua field (nama, hari, jam, label, dll)
- [ ] Click save → toko berhasil disimpan
- [ ] Check DevTools console → tidak ada error

---

### TEST #4: Kaset Stores - Display List

#### Hari & Jam Display
- [ ] List toko menampilkan hari operasi
- [ ] Format: icon 🕒 + hari ringkas (misal "Senin–Sabtu")
- [ ] Jam ditampilkan di sebelah hari
- [ ] Contoh: 🕒 Senin–Sabtu 09.00-17.00
- [ ] Jika hanya 1-2 hari: format list (misal "Senin, Rabu")

#### Link Utama Display
- [ ] Link utama tampil sebagai **BUTTON** (bukan text link)
- [ ] Button menampilkan **LABEL** (misal "Shopee")
- [ ] BUKAN raw URL
- [ ] Klik button → buka link di browser baru

#### Link Tambahan Display
- [ ] Link tambahan juga tampil sebagai button
- [ ] Masing-masing button punya labelnya
- [ ] Klik button → buka link

#### Edit Existing Store
- [ ] Edit toko yang sudah ada
- [ ] Hari operasi, jam, label semua ter-populate dari database
- [ ] Ubah hari/jam/label → save → display updated

---

### TEST #5: Database Integrity

#### Schema Migration
- [ ] Startup app → tidak ada error
- [ ] Database migration v8 berjalan otomatis
- [ ] No SQL errors di console

#### Column Existence (Advanced)
```bash
# Check punya kolom baru
sqlite3 ~/.catalog-manager/database.db
> .schema kaset_stores
# Output harus include: operating_days TEXT, url_label TEXT
```

#### Data Persistence
- [ ] Add toko dengan hari & jam → save
- [ ] Restart app
- [ ] Data masih ada (tidak hilang)
- [ ] Hari & jam ditampilkan dengan benar

#### Data Format
```bash
# Check format data di database
sqlite3 ~/.catalog-manager/database.db
> SELECT operating_days, url_label FROM kaset_stores LIMIT 1;
# operating_days harus JSON array format: ["sen","sel",...]
# url_label harus string: Shopee atau custom label
```

---

## 🎨 UI/UX CHECKS

### Responsive Design
- [ ] Desktop (1400px+): Grid tampil dengan baik (3+ kartu)
- [ ] Tablet (1024px): Grid adjust (2 kartu)
- [ ] Mobile (480px): Grid adjust (1 kartu)
- [ ] No horizontal scroll
- [ ] No text overflow

### Color & Styling
- [ ] Edit button punya border color yang sesuai theme
- [ ] Edit button punya background sesuai theme
- [ ] Hover effect smooth (ada CSS transition)
- [ ] Form input consistent styling
- [ ] Button consistent styling

### Accessibility
- [ ] Form checkbox punya label (clickable)
- [ ] Dropdown punya proper focus state
- [ ] Button punya hover/focus state
- [ ] Color contrast OK (tidak terlalu terang/gelap)

---

## ⚠️ ERROR & EDGE CASES

### Edge Case #1: Empty Fields
- [ ] Add toko tanpa hari operasi (checkbox kosong) → save OK
- [ ] Add toko tanpa jam operasi (input kosong) → save OK
- [ ] Add toko tanpa label utama (dropdown default) → save OK
- [ ] Display: tidak show 🕒 jika tidak ada hari & jam

### Edge Case #2: Special Characters
- [ ] Label custom dengan karakter khusus (ñ, é, emoji) → save OK
- [ ] Display: label rendered dengan benar

### Edge Case #3: Very Long Text
- [ ] URL panjang → tidak overflow di display
- [ ] Label panjang → button wrap dengan baik (tidak break layout)

### Edge Case #4: Browser Back Button
- [ ] Edit toko → ambil data dari form
- [ ] Cancel/close → ambil data original dari database
- [ ] Browser back → app state consistent

---

## 🔐 DATA VALIDATION

### Input Validation
- [ ] Nama toko tidak boleh kosong (sudah ada validation)
- [ ] URL harus format valid (optional, tapi kalau diisi)
- [ ] Hari: array valid dengan value yang sesuai
- [ ] Label: string valid dengan panjang reasonable

### Database Validation
- [ ] Tidak ada duplicate toko ID
- [ ] Tidak ada orphaned data
- [ ] Foreign key constraints tetap intact

---

## 📊 PERFORMANCE CHECK

### Page Load Time
- [ ] FAQ page load < 2 detik
- [ ] Kaset Stores page load < 2 detik
- [ ] Tidak ada lag atau stutter

### Interaction Response
- [ ] Click button → instant response (< 200ms)
- [ ] Hover effect smooth (60fps)
- [ ] No jank atau frame drop

### Memory Usage
- [ ] App tidak memory leak
- [ ] Open/close modal beberapa kali → no leak
- [ ] Dev Tools → memory stable

---

## 📝 BROWSER DEVTOOLS CHECK

### Console (F12 → Console)
- [ ] Tidak ada red error message
- [ ] Tidak ada orange warning (atau hanya minor warnings)
- [ ] No undefined variables

### Network Tab
- [ ] Semua assets load successfully (200 status)
- [ ] Tidak ada 404 errors
- [ ] Tidak ada slow request (> 3s)

### Elements/Inspector
- [ ] DOM structure terlihat clean
- [ ] CSS classes applied dengan benar
- [ ] No duplicate IDs

---

## ✨ FINAL SIGN-OFF

### Code Quality
- [ ] No linting errors (jika punya eslint)
- [ ] Code formatted consistently
- [ ] Comments added untuk complex logic

### Documentation
- [ ] Code have comments/docstrings
- [ ] File headers updated (if applicable)
- [ ] README updated (if applicable)

### Git/Version Control
- [ ] Changes committed: `git commit -m "feat: implement v8 changes"`
- [ ] Branch merged ke main/develop
- [ ] No merge conflicts

---

## 🎯 TESTING SUMMARY

Total Tests: _____  
Passed: _____ ✅  
Failed: _____ ❌  
Skipped: _____

### Critical Issues Found:
```
1. _______________
2. _______________
3. _______________
```

### Minor Issues / Improvements:
```
1. _______________
2. _______________
```

---

## ✅ FINAL APPROVAL

- [ ] All tests PASSED
- [ ] No critical issues
- [ ] Ready for production deployment
- [ ] Signed off by: ________________ on ________________

**Status**: 
- [ ] ✅ APPROVED FOR PRODUCTION
- [ ] ⚠️ APPROVED WITH NOTES (see above)
- [ ] ❌ NOT APPROVED (see issues above)

---

**Testing Completed: ________________**

**Tester Signature: ________________**

---

## 📞 SUPPORT

Jika ada error/issue:
1. Check QUICK_REFERENCE.md untuk troubleshooting
2. Check console DevTools (F12)
3. Review PANDUAN_INTEGRASI.md untuk step-by-step
4. Check syntax dengan: `node --check <file>`
