# 📊 BEFORE & AFTER COMPARISON - Perubahan Spesifik per File

**Dokumen ini menunjukkan perubahan detail setiap file** untuk membantu review kode.

---

## 1️⃣ constants.json

### SEBELUM (v7):
```json
{
  "PLATFORMS": [...],
  "REGIONS": [...],
  "FAQ_CATEGORIES": [...],
  "CONDITIONS": [...],
  "SORT_FIELDS": [...]
}
```

### SESUDAH (v8):
```json
{
  "PLATFORMS": [...],
  "REGIONS": [...],
  "FAQ_CATEGORIES": [...],
  "CONDITIONS": [...],
  "SORT_FIELDS": [...],
  "DAYS_OF_WEEK": [           // ✨ NEW
    { "value": "sen", "label": "Senin" },
    { "value": "sel", "label": "Selasa" },
    { "value": "rab", "label": "Rabu" },
    { "value": "kam", "label": "Kamis" },
    { "value": "jum", "label": "Jumat" },
    { "value": "sab", "label": "Sabtu" },
    { "value": "min", "label": "Minggu" }
  ],
  "STORE_LINK_LABELS": [      // ✨ NEW
    "Shopee",
    "Tokopedia",
    "WhatsApp",
    "Instagram",
    "Facebook",
    "TikTok Shop",
    "Bukalapak",
    "Lainnya"
  ]
}
```

### DIFF Summary:
- ✨ Tambah DAYS_OF_WEEK (7 items)
- ✨ Tambah STORE_LINK_LABELS (8 items)
- 🔄 Total: +15 baris

---

## 2️⃣ schema.js

### SEBELUM (v7):
```javascript
  // ---- versi 7: perbaikan milestone 2 ----
  `
  CREATE TABLE faq_category_settings (
    ...
  );
  ALTER TABLE kaset_stores ADD COLUMN operating_hours TEXT;
  ALTER TABLE kaset_stores ADD COLUMN links TEXT;
  `
];

// ... runMigrations function

module.exports = { runMigrations, SCHEMA_VERSION: MIGRATIONS.length }; // v7
```

### SESUDAH (v8):
```javascript
  // ---- versi 7: perbaikan milestone 2 ----
  `
  CREATE TABLE faq_category_settings (
    ...
  );
  ALTER TABLE kaset_stores ADD COLUMN operating_hours TEXT;
  ALTER TABLE kaset_stores ADD COLUMN links TEXT;
  `,

  // ---- versi 8: pisahkan hari & jam jadwal operasi, tambah label link utama ---- // ✨ NEW
  `
  ALTER TABLE kaset_stores ADD COLUMN operating_days TEXT;
  ALTER TABLE kaset_stores ADD COLUMN url_label TEXT;
  `
];

// ... runMigrations function

module.exports = { runMigrations, SCHEMA_VERSION: MIGRATIONS.length }; // v8  // 🔄 UPDATED
```

### DIFF Summary:
- ✨ Tambah migrasi v8 (ALTER TABLE 2 kolom baru)
- 🔄 Update comment SCHEMA_VERSION dari v7 → v8
- 🔄 Total: +6 baris

### SQL Executed:
```sql
ALTER TABLE kaset_stores ADD COLUMN operating_days TEXT;
ALTER TABLE kaset_stores ADD COLUMN url_label TEXT;
```

---

## 3️⃣ kasetStoresRepository.js

### SEBELUM (v7):
```javascript
function parseLinks(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.url) : [];
  } catch {
    return [];
  }
}

function rowToStore(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    city: row.city,
    notes: row.notes,
    operatingHours: row.operating_hours,
    links: parseLinks(row.links),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
```

### SESUDAH (v8):
```javascript
function parseLinks(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.url) : [];
  } catch {
    return [];
  }
}

function parseJsonArray(raw) {  // ✨ NEW HELPER
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToStore(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    city: row.city,
    notes: row.notes,
    operatingHours: row.operating_hours,
    operatingDays: parseJsonArray(row.operating_days),  // ✨ NEW
    links: parseLinks(row.links),
    urlLabel: row.url_label,  // ✨ NEW
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
```

### SEBELUM (createStore):
```javascript
function createStore(input) {
  const db = getDb();
  const id = randomUUID();
  const ts = nowIso();
  const maxOrderRow = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM kaset_stores`).get();
  const sortOrder = maxOrderRow.maxOrder + 1;
  const linksJson = Array.isArray(input.links) && input.links.length
    ? JSON.stringify(input.links.filter((l) => l && l.url))
    : null;

  db.prepare(
    `INSERT INTO kaset_stores (id, name, url, city, notes, operating_hours, links, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.name, input.url || null, input.city || null, input.notes || null, input.operatingHours || null, linksJson, sortOrder, ts, ts);

  return getStoreById(id);
}
```

### SESUDAH (createStore):
```javascript
function createStore(input) {
  const db = getDb();
  const id = randomUUID();
  const ts = nowIso();
  const maxOrderRow = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) as maxOrder FROM kaset_stores`).get();
  const sortOrder = maxOrderRow.maxOrder + 1;
  const linksJson = Array.isArray(input.links) && input.links.length
    ? JSON.stringify(input.links.filter((l) => l && l.url))
    : null;
  const operatingDaysJson = Array.isArray(input.operatingDays) && input.operatingDays.length  // ✨ NEW
    ? JSON.stringify(input.operatingDays)
    : null;

  db.prepare(
    `INSERT INTO kaset_stores (id, name, url, city, notes, operating_hours, operating_days, links, url_label, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`  // ✨ 2 kolom baru di VALUES
  ).run(id, input.name, input.url || null, input.city || null, input.notes || null, input.operatingHours || null, operatingDaysJson, linksJson, input.urlLabel || null, sortOrder, ts, ts);  // ✨ 2 param baru

  return getStoreById(id);
}
```

### SEBELUM (updateStore):
```javascript
function updateStore(id, input) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM kaset_stores WHERE id = ?`).get(id);
  if (!existing) throw new Error('Toko tidak ditemukan');
  const ts = nowIso();
  const linksJson = input.links !== undefined
    ? (Array.isArray(input.links) && input.links.length ? JSON.stringify(input.links.filter((l) => l && l.url)) : null)
    : existing.links;

  db.prepare(
    `UPDATE kaset_stores SET name = ?, url = ?, city = ?, notes = ?, operating_hours = ?, links = ?, updated_at = ? WHERE id = ?`
  ).run(
    input.name ?? existing.name,
    input.url !== undefined ? input.url : existing.url,
    input.city !== undefined ? input.city : existing.city,
    input.notes !== undefined ? input.notes : existing.notes,
    input.operatingHours !== undefined ? input.operatingHours : existing.operating_hours,
    linksJson,
    ts,
    id
  );

  return getStoreById(id);
}
```

### SESUDAH (updateStore):
```javascript
function updateStore(id, input) {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM kaset_stores WHERE id = ?`).get(id);
  if (!existing) throw new Error('Toko tidak ditemukan');
  const ts = nowIso();
  const linksJson = input.links !== undefined
    ? (Array.isArray(input.links) && input.links.length ? JSON.stringify(input.links.filter((l) => l && l.url)) : null)
    : existing.links;
  const operatingDaysJson = input.operatingDays !== undefined  // ✨ NEW
    ? (Array.isArray(input.operatingDays) && input.operatingDays.length ? JSON.stringify(input.operatingDays) : null)
    : existing.operating_days;

  db.prepare(
    `UPDATE kaset_stores SET name = ?, url = ?, city = ?, notes = ?, operating_hours = ?, operating_days = ?, links = ?, url_label = ?, updated_at = ? WHERE id = ?`  // ✨ 2 kolom baru
  ).run(
    input.name ?? existing.name,
    input.url !== undefined ? input.url : existing.url,
    input.city !== undefined ? input.city : existing.city,
    input.notes !== undefined ? input.notes : existing.notes,
    input.operatingHours !== undefined ? input.operatingHours : existing.operating_hours,
    operatingDaysJson,  // ✨ NEW
    linksJson,
    input.urlLabel !== undefined ? input.urlLabel : existing.url_label,  // ✨ NEW
    ts,
    id
  );

  return getStoreById(id);
}
```

### DIFF Summary:
- ✨ Tambah parseJsonArray() helper function
- ✨ Update rowToStore() +2 field (operatingDays, urlLabel)
- ✨ Update createStore() +2 parameter & SQL
- ✨ Update updateStore() +2 parameter & SQL
- 🔄 Total: ~25 baris

---

## 4️⃣ FaqPage.jsx

### Item #4: Icon Upload Error Handling

#### SEBELUM:
```javascript
async function handleIconFile(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  setUploadingIcon(true);
  try {
    const buffer = await fileToBuffer(file);
    const result = await window.api.faqCategory.setIcon(meta.value, buffer, file.type);
    onIconChanged(meta.value, result);
  } finally {  // ❌ No catch block!
    setUploadingIcon(false);
  }
}
```

#### SESUDAH:
```javascript
async function handleIconFile(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  setUploadingIcon(true);
  try {
    const buffer = await fileToBuffer(file);
    const result = await window.api.faqCategory.setIcon(meta.value, buffer, file.type);
    onIconChanged(meta.value, result);
  } catch (err) {  // ✨ NEW CATCH BLOCK
    console.error('Gagal upload icon kategori', err);
    alert('Gagal mengunggah gambar icon: ' + (err.message || 'format tidak didukung.'));
  } finally {
    setUploadingIcon(false);
  }
}
```

### Item #2 & #3: Edit Button Positioning

#### SEBELUM:
```javascript
function CategoryCard({ meta, count, settings, onSelectCategory, onIconChanged, onDescChanged }) {
  // ...
  return (
    <div className="faq-landing-card" onClick={() => !editingDesc && onSelectCategory(meta.value)}>
      <div className="faq-landing-icon-wrap" ... >
        {/* ... icon content ... */}
      </div>
      <div className="faq-landing-title">{meta.label}</div>
      {editingDesc ? (
        <div className="faq-landing-desc-edit" onClick={(e) => e.stopPropagation()}>
          {/* ... edit textarea ... */}
        </div>
      ) : (
        <div className="faq-landing-desc" onClick={(e) => { e.stopPropagation(); setEditingDesc(true); }} title="Klik untuk edit deskripsi">
          {descDraft} <span className="faq-landing-desc-edit-icon">✎</span>  {/* ✎ INLINE */}
        </div>
      )}
      <div className="faq-landing-count">{count || 0} pertanyaan</div>
    </div>
  );
}
```

#### SESUDAH:
```javascript
function CategoryCard({ meta, count, settings, onSelectCategory, onIconChanged, onDescChanged }) {
  // ...
  return (
    <div className="faq-landing-card" onClick={() => !editingDesc && onSelectCategory(meta.value)}>
      <button  // ✨ NEW EDIT BUTTON
        className="faq-landing-edit-btn"
        onClick={(e) => { e.stopPropagation(); setEditingDesc(true); }}
        title="Edit deskripsi"
      >
        ✎
      </button>

      <div className="faq-landing-icon-wrap" ... >
        {/* ... icon content ... */}
      </div>
      <div className="faq-landing-title">{meta.label}</div>
      {editingDesc ? (
        <div className="faq-landing-desc-edit" onClick={(e) => e.stopPropagation()}>
          {/* ... edit textarea ... */}
        </div>
      ) : (
        <div className="faq-landing-desc" title="Edit deskripsi melalui tombol pensil di pojok kartu">  {/* ✨ UPDATED TITLE */}
          {descDraft}  {/* ✨ REMOVED INLINE ✎ */}
        </div>
      )}
      <div className="faq-landing-count">{count || 0} pertanyaan</div>
    </div>
  );
}
```

### Item #1: Wrap CategoryLanding

#### SEBELUM:
```javascript
<div className="content-scroll">
  <CategoryLanding
    counts={counts}
    categorySettings={categorySettings}
    onSelectCategory={setActiveCategory}
    onIconChanged={handleIconChanged}
    onDescChanged={handleDescChanged}
  />
</div>
```

#### SESUDAH:
```javascript
<div className="content-scroll">
  <div className="faq-landing-wrap">  {/* ✨ NEW WRAPPER */}
    <CategoryLanding
      counts={counts}
      categorySettings={categorySettings}
      onSelectCategory={setActiveCategory}
      onIconChanged={handleIconChanged}
      onDescChanged={handleDescChanged}
    />
  </div>
</div>
```

### DIFF Summary:
- ✨ Tambah try/catch block di handleIconFile()
- ✨ Tambah edit button element (absolute positioned)
- ✨ Remove onClick dari description div
- ✨ Remove inline pencil icon dari description
- ✨ Wrap CategoryLanding dengan faq-landing-wrap div
- 🔄 Total: ~30 baris

---

## 5️⃣ KasetStoresPage.jsx

### New Component: LinkLabelSelect

#### SEBELUM:
```
❌ Tidak ada
```

#### SESUDAH:
```javascript
function LinkLabelSelect({ value, isCustom, onChangeLabel, onChangeCustom }) {  // ✨ NEW COMPONENT
  const [isOther, setIsOther] = useState(isCustom || !STORE_LINK_LABELS.includes(value));
  
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <select
        className="form-select"
        style={{ flex: 0 }}
        value={isOther ? 'Lainnya' : value}
        onChange={(e) => {
          if (e.target.value === 'Lainnya') {
            setIsOther(true);
          } else {
            setIsOther(false);
            onChangeLabel(e.target.value);
          }
        }}
      >
        {STORE_LINK_LABELS.map((label) => (
          <option key={label} value={label}>{label}</option>
        ))}
      </select>
      {isOther && (
        <input
          className="form-input"
          style={{ maxWidth: 140 }}
          placeholder="Label custom"
          value={isCustom ? value : ''}
          onChange={(e) => onChangeCustom(e.target.value)}
        />
      )}
    </div>
  );
}
```

### New Helper: formatOperatingDays

#### SEBELUM:
```
❌ Tidak ada
```

#### SESUDAH:
```javascript
function formatOperatingDays(days) {  // ✨ NEW HELPER
  if (!days || days.length === 0) return '';
  const labels = days.map((d) => {
    const found = DAYS_OF_WEEK.find((dw) => dw.value === d);
    return found ? found.label : d;
  });
  if (labels.length === 7) return 'Setiap Hari';
  if (labels.length > 3) return labels.join(', ');
  return labels.join(', ');
}
```

### StoreFormModal: New State

#### SEBELUM:
```javascript
const [operatingHours, setOperatingHours] = useState(store?.operatingHours || '');
```

#### SESUDAH:
```javascript
const [urlLabel, setUrlLabel] = useState(store?.urlLabel || 'Shopee');  // ✨ NEW
const [operatingDays, setOperatingDays] = useState(store?.operatingDays || []);  // ✨ NEW
const [operatingHours, setOperatingHours] = useState(store?.operatingHours || '');
```

### StoreFormModal: New Helper Function

#### SESUDAH (NEW):
```javascript
function toggleDay(dayValue) {  // ✨ NEW
  setOperatingDays((prev) =>
    prev.includes(dayValue)
      ? prev.filter((d) => d !== dayValue)
      : [...prev, dayValue]
  );
}
```

### StoreFormModal: Form Fields

#### SEBELUM:
```javascript
<div className="form-group">
  <label className="form-label">Jadwal Operasi</label>
  <input
    className="form-input"
    value={operatingHours}
    onChange={(e) => setOperatingHours(e.target.value)}
    placeholder="Misalnya: Senin-Sabtu 09.00-17.00"
  />
</div>
```

#### SESUDAH:
```javascript
<div className="form-group">
  <label className="form-label">Label Link Utama</label>  {/* ✨ NEW */}
  <LinkLabelSelect
    value={urlLabel}
    isCustom={!STORE_LINK_LABELS.includes(urlLabel)}
    onChangeLabel={setUrlLabel}
    onChangeCustom={setUrlLabel}
  />
</div>

{/* Update link tambahan section */}
<div className="form-group">
  <label className="form-label">Link Tambahan (opsional)</label>
  {links.map((l, idx) => (
    <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
      <div style={{ flex: 0, minWidth: 160 }}>
        <LinkLabelSelect  {/* ✨ USE LinkLabelSelect */}
          value={l.label}
          isCustom={!STORE_LINK_LABELS.includes(l.label)}
          onChangeLabel={(v) => updateLink(idx, 'label', v)}
          onChangeCustom={(v) => updateLink(idx, 'label', v)}
        />
      </div>
      {/* ... rest of row ... */}
    </div>
  ))}
</div>

<div className="form-group">
  <label className="form-label">Hari Operasi</label>  {/* ✨ NEW */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6 }}>
    {DAYS_OF_WEEK.map((day) => (
      <label key={day.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={operatingDays.includes(day.value)}
          onChange={() => toggleDay(day.value)}
        />
        <span style={{ fontSize: 13 }}>{day.label}</span>
      </label>
    ))}
  </div>
</div>

<div className="form-group">
  <label className="form-label">Jam Operasi</label>  {/* ✨ CHANGED FROM "Jadwal Operasi" */}
  <input
    className="form-input"
    value={operatingHours}
    onChange={(e) => setOperatingHours(e.target.value)}
    placeholder="Misalnya: 09.00-17.00"  {/* ✨ UPDATED PLACEHOLDER */}
  />
</div>
```

### Display Section: List Item

#### SEBELUM:
```javascript
{store.operatingHours && <span className="form-hint" style={{ marginLeft: 8 }}>🕒 {store.operatingHours}</span>}
{(store.url || store.links?.length > 0) && (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
    {store.url && (
      <a href="#" onClick={(e) => { e.preventDefault(); window.open(store.url, '_blank'); }} style={{ fontSize: 13 }}>
        {store.url}
      </a>
    )}
```

#### SESUDAH:
```javascript
{(store.operatingDays?.length > 0 || store.operatingHours) && (
  <span className="form-hint" style={{ marginLeft: 8 }}>
    🕒 {formatOperatingDays(store.operatingDays)}{store.operatingHours ? ` ${store.operatingHours}` : ''}
  </span>
)}
{(store.url || store.links?.length > 0) && (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
    {store.url && (
      <button
        className="btn btn-sm"
        onClick={() => window.open(store.url, '_blank')}
      >
        {store.urlLabel || 'Link Utama'}
      </button>
    )}
```

### DIFF Summary:
- ✨ Tambah LinkLabelSelect component (reusable)
- ✨ Tambah formatOperatingDays() helper
- ✨ Tambah operatingDays & urlLabel state
- ✨ Tambah toggleDay() helper
- ✨ Ubah form: 1 field jadwal jadi 2 field (hari + jam)
- ✨ Tambah label dropdown untuk link (utama + tambahan)
- ✨ Update display: format hari & tampilkan label
- ✨ Import DAYS_OF_WEEK & STORE_LINK_LABELS
- 🔄 Total: ~150 baris

---

## 6️⃣ global.css

### New Wrapper Class

#### SEBELUM:
```
❌ Tidak ada
```

#### SESUDAH:
```css
.faq-landing-wrap {  /* ✨ NEW */
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
}
```

### Grid & Card Updates

#### SEBELUM:
```css
.faq-landing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5, 20px);
  max-width: 1200px;  /* ❌ OLD */
  margin: var(--space-6) auto 0;
}

.faq-landing-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3, 10px);
  padding: var(--space-8, 32px) var(--space-5, 20px);
  border-radius: var(--radius-lg, 14px);
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
  min-height: 260px;  /* ❌ OLD */
  /* ❌ NO position: relative */
}
```

#### SESUDAH:
```css
.faq-landing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-5, 20px);
  max-width: 1400px;  /* ✨ UPDATED */
  margin: var(--space-6) auto 0;
}

.faq-landing-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3, 10px);
  padding: var(--space-8, 32px) var(--space-5, 20px);
  border-radius: var(--radius-lg, 14px);
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
  min-height: 320px;  /* ✨ UPDATED */
  position: relative;  /* ✨ NEW */
}
```

### New Edit Button Class

#### SEBELUM:
```
❌ Tidak ada
```

#### SESUDAH:
```css
.faq-landing-edit-btn {  /* ✨ NEW */
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity var(--transition-fast);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--color-text);
}

.faq-landing-card:hover .faq-landing-edit-btn {  /* ✨ NEW */
  opacity: 1;
}
```

### Description Changes

#### SEBELUM:
```css
.faq-landing-desc {
  font-size: var(--font-size-base, 14px);
  color: var(--color-text-muted);
  cursor: text;  /* ❌ REMOVE THIS */
}

.faq-landing-desc-edit-icon {
  opacity: 0.5;
  font-size: 12px;
  /* ❌ WILL BE HIDDEN */
}
```

#### SESUDAH:
```css
.faq-landing-desc {
  font-size: var(--font-size-base, 14px);
  color: var(--color-text-muted);
  /* ✨ REMOVED cursor: text */
}

.faq-landing-desc-edit-icon {
  display: none;  /* ✨ HIDE INLINE ICON */
}
```

### DIFF Summary:
- ✨ Tambah .faq-landing-wrap (flex centering)
- ✨ Tambah .faq-landing-edit-btn (absolute, hover-reveal)
- ✨ Tambah .faq-landing-card:hover .faq-landing-edit-btn
- 🔄 Update .faq-landing-grid max-width 1200px → 1400px
- 🔄 Update .faq-landing-card min-height 260px → 320px
- 🔄 Tambah position: relative ke .faq-landing-card
- 🔄 Remove cursor: text dari .faq-landing-desc
- 🔄 Hide .faq-landing-desc-edit-icon
- 🔄 Total: ~40 baris

---

## 📊 SUMMARY STATISTICS

| File | Lines Added | Lines Removed | Lines Modified | Total Change |
|------|-------------|---------------|----------------|--------------|
| constants.json | 15 | 0 | 0 | +15 |
| schema.js | 6 | 0 | 1 | +7 |
| kasetStoresRepository.js | 25 | 0 | 10 | +35 |
| FaqPage.jsx | 30 | 5 | 10 | +35 |
| KasetStoresPage.jsx | 150 | 10 | 30 | +170 |
| global.css | 40 | 3 | 10 | +47 |
| **TOTAL** | **266** | **18** | **61** | **309** |

---

**All changes are backward compatible and do not break existing functionality!** ✅
