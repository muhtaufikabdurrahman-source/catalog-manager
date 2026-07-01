# 🗄️ DATABASE MIGRATION GUIDE - Data Safety & Backward Compatibility

**Panduan lengkap untuk memastikan data lama tetap aman saat migrasi ke v8.**

---

## 📋 OVERVIEW

Migrasi v8 **100% backward compatible** - tidak ada data yang hilang atau dirusak.

| Aspek | Status | Detail |
|-------|--------|--------|
| **Existing Data** | ✅ Safe | Data lama tetap apa adanya |
| **New Columns** | ✅ Nullable | operating_days & url_label bisa kosong |
| **Breaking Changes** | ❌ None | Tidak ada |
| **Rollback** | ✅ Possible | Bisa kembali ke v7 jika perlu |
| **Downtime** | ✅ Zero | Migration otomatis, user tidak affected |

---

## 🔄 MIGRATION FLOW

```
v7 Database                Migration Script              v8 Database
┌─────────────────────┐   ┌────────────────────┐   ┌─────────────────────┐
│ kaset_stores:       │   │ Check version      │   │ kaset_stores:       │
│ - id                │   │ (pragm user_version)   │ - id                │
│ - name              │   │                    │   │ - name              │
│ - url               │   │ Add 2 columns:     │   │ - url               │
│ - operating_hours   ├──→│ operating_days     ├──→│ - operating_hours   │
│ - links             │   │ url_label          │   │ - operating_days ✨ │
│ - (other fields)    │   │                    │   │ - links             │
└─────────────────────┘   │ Migrate schema     │   │ - url_label ✨      │
                          │ version to v8      │   │ - (other fields)    │
                          └────────────────────┘   └─────────────────────┘
                                                           ↓
                                        Data automatically persisted
```

---

## 📊 DATA MAPPING

### operating_days (NEW COLUMN)

**Sebelum (v7)**: Data di `operating_hours`
```
operating_hours = "Senin-Sabtu 09.00-17.00"  (gabungan hari & jam)
```

**Sesudah (v8)**: Data terpisah
```
operating_days = ["sen", "sel", "rab", "kam", "jum", "sab"]  (JSON array)
operating_hours = "09.00-17.00"  (hanya jam)
```

**Migration Strategy**:
- ❌ TIDAK ada auto-split otomatis dari teks lama
- ✅ Data lama tetap di `operating_hours`
- ✅ User perlu re-edit manual kalau ingin split hari & jam
- ⚠️ Alasan: Teks bebas terlalu risky untuk di-parse otomatis

### url_label (NEW COLUMN)

**Sebelum (v7)**: Tidak ada
```
url = "https://shopee.co.id/..."  (hanya URL)
```

**Sesudah (v8)**: Ada label terpisah
```
url = "https://shopee.co.id/..."
url_label = "Shopee"  (default untuk link lama yang belum diset)
```

**Migration Strategy**:
- ✅ Default value: NULL (empty)
- ✅ User bisa set label saat edit toko
- ✅ Display: jika label empty, show "Link Utama"

---

## 🔍 DATA PRESERVATION CHECKS

### Pre-Migration Verification

Sebelum aplikasi run, cek database state:

```bash
# Backup database sebelum migration
cp ~/.catalog-manager/database.db ~/.catalog-manager/database.db.backup_v7

# Check current schema
sqlite3 ~/.catalog-manager/database.db
> .schema kaset_stores
# Lihat kolom yang ada v7 (tidak ada operating_days & url_label)

# Count toko yang ada
> SELECT COUNT(*) FROM kaset_stores;
# Catat jumlahnya, harus sama setelah migration
```

### Post-Migration Verification

Setelah aplikasi run migration:

```bash
# Check schema updated
sqlite3 ~/.catalog-manager/database.db
> .schema kaset_stores
# Harus punya: operating_days TEXT, url_label TEXT

# Verify data tidak hilang
> SELECT COUNT(*) FROM kaset_stores;
# Harus sama dengan pre-migration count

# Verify data lama masih intact
> SELECT id, name, url, operating_hours FROM kaset_stores LIMIT 3;
# Semua field harus punya data seperti sebelumnya

# Check new columns (harus NULL/empty untuk lama)
> SELECT operating_days, url_label FROM kaset_stores LIMIT 3;
# Harus NULL atau empty string untuk semua
```

---

## ✅ MIGRATION CHECKLIST

### Pre-Migration (Sebelum jalankan aplikasi v8)

- [ ] Backup database lama
  ```bash
  cp ~/.catalog-manager/database.db ~/.catalog-manager/database.db.backup_v7
  ```
- [ ] Catat jumlah toko di database
  ```bash
  sqlite3 ~/.catalog-manager/database.db "SELECT COUNT(*) FROM kaset_stores;"
  ```
- [ ] Catat schema v7
  ```bash
  sqlite3 ~/.catalog-manager/database.db ".schema kaset_stores" > schema_v7.txt
  ```
- [ ] Inform user: maintenance window jika diperlukan
- [ ] Prepare rollback plan (lihat section Rollback)

### Migration Execution

- [ ] Update source code ke v8 (integrate 6 file)
- [ ] Run `npx vite build` (check no error)
- [ ] Start app: `npm start`
- [ ] **App otomatis run migration v8** ✅
- [ ] Check console: tidak ada error
- [ ] Keep app running 1-2 menit (ensure migration complete)

### Post-Migration (Setelah aplikasi v8 running)

- [ ] Verify database schema updated
  ```bash
  sqlite3 ~/.catalog-manager/database.db ".schema kaset_stores"
  # Harus punya operating_days & url_label columns
  ```
- [ ] Verify data count sama
  ```bash
  sqlite3 ~/.catalog-manager/database.db "SELECT COUNT(*) FROM kaset_stores;"
  # Harus sama dengan pre-migration count
  ```
- [ ] Test app:
  - Buka FAQ page → OK
  - Buka Kaset Stores page → OK
  - List toko → data muncul semua
  - Edit toko → form punya hari checkbox & jam field
  - Add toko baru → bisa save dengan hari & jam
- [ ] Check DevTools console → tidak ada error
- [ ] Verify user data:
  - Hari operasi lama tetap di operating_hours
  - Link utama masih bisa di-klik
  - Semua toko masih terlihat

---

## 🔄 ROLLBACK PLAN (Jika ada issue)

### Immediate Rollback (Restore from backup)

Jika migration gagal atau ada critical issue:

```bash
# 1. Stop aplikasi v8
Ctrl+C

# 2. Restore database backup
cp ~/.catalog-manager/database.db.backup_v7 ~/.catalog-manager/database.db

# 3. Rollback source code ke v7
git checkout HEAD~1  # atau restore dari backup folder

# 4. Start aplikasi v7 kembali
npm start

# 5. Verify data intact
# Cek FAQ page, Kaset Stores page - semua harus normal
```

### Gradual Rollback (Minimal impact)

Jika ingin rollback tapi ingin preserve beberapa data v8:

```bash
# 1. Export data baru (v8) yang critical
sqlite3 ~/.catalog-manager/database.db
> .mode csv
> .output data_v8_backup.csv
> SELECT id, name, url, operating_hours, operating_days, url_label FROM kaset_stores;
> .quit

# 2. Restore v7 database
cp ~/.catalog-manager/database.db.backup_v7 ~/.catalog-manager/database.db

# 3. Start v7 app kembali
npm start

# 4. Manually import data dari CSV yang disave (if needed)
```

---

## 📝 BACKWARD COMPATIBILITY DETAILS

### existing_hours Field

**v7 Data Format**:
```
operating_hours = "Senin-Sabtu 09.00-17.00"
```

**v8 Handling**:
- ✅ Field `operating_hours` tetap ada di database
- ✅ Data lama tidak diubah otomatis
- ✅ Display di list: still show full string
- ✅ User dapat edit dan split manual ke operating_days

**Example Workflow**:
```
1. User punya toko dengan operating_hours = "Senin-Sabtu 09.00-17.00"
2. User buka app v8
3. Edit toko tersebut
4. Form menampilkan:
   - Hari checkbox: semua unchecked (karena belum punya operating_days)
   - Jam field: kosong
   - Note: operating_hours lama masih ada di database, belum split
5. User ubah form:
   - Check: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
   - Input jam: 09.00-17.00
6. Click Save
7. Sekarang tersimpan:
   - operating_hours = "09.00-17.00" (updated, jam saja)
   - operating_days = ["sen", "sel", "rab", "kam", "jum", "sab"] (new, hari saja)
```

### links Field

**v7 Data Format**:
```json
links = [
  { "label": "Tokopedia", "url": "https://tokopedia.com/..." },
  { "label": "WhatsApp", "url": "https://wa.me/..." }
]
```

**v8 Handling**:
- ✅ Field `links` tetap sama format
- ✅ Hanya UI yang berubah (dropdown instead of text)
- ✅ Data lama fully compatible
- ✅ User dapat edit label via dropdown

---

## 🧪 TESTING DATA INTEGRITY

### SQL Queries untuk verify data

```sql
-- 1. Check total records
SELECT COUNT(*) as total FROM kaset_stores;

-- 2. Check kolom operating_hours tetap isi
SELECT id, name, operating_hours 
FROM kaset_stores 
WHERE operating_hours IS NOT NULL 
LIMIT 5;

-- 3. Check kolom links tetap isi
SELECT id, name, links 
FROM kaset_stores 
WHERE links IS NOT NULL 
LIMIT 5;

-- 4. Check new kolom (harus ada tapi mostly NULL)
SELECT id, name, operating_days, url_label 
FROM kaset_stores 
LIMIT 5;

-- 5. Check no corruption
PRAGMA integrity_check;
-- Output harus: ok
```

### Python Script untuk automated check

```python
import sqlite3
import json
from datetime import datetime

def check_migration():
    db = sqlite3.connect(os.path.expanduser('~/.catalog-manager/database.db'))
    cursor = db.cursor()
    
    print(f"\n[{datetime.now()}] Starting migration verification...\n")
    
    # Check 1: Schema
    cursor.execute("PRAGMA table_info(kaset_stores)")
    columns = [col[1] for col in cursor.fetchall()]
    required_cols = ['operating_days', 'url_label']
    for col in required_cols:
        if col in columns:
            print(f"✅ Column {col} exists")
        else:
            print(f"❌ Column {col} MISSING")
    
    # Check 2: Data count
    cursor.execute("SELECT COUNT(*) FROM kaset_stores")
    count = cursor.fetchone()[0]
    print(f"✅ Total stores: {count}")
    
    # Check 3: Sample data
    cursor.execute("SELECT id, operating_hours, operating_days FROM kaset_stores LIMIT 3")
    for row in cursor.fetchall():
        id, hours, days = row
        print(f"  Store {id}: hours={hours}, days={days}")
    
    # Check 4: Integrity
    cursor.execute("PRAGMA integrity_check")
    result = cursor.fetchone()[0]
    if result == 'ok':
        print(f"✅ Database integrity: OK")
    else:
        print(f"❌ Database integrity: {result}")
    
    db.close()
    print("\n[✓] Migration verification complete!\n")

if __name__ == '__main__':
    check_migration()
```

---

## ⚠️ KNOWN ISSUES & WORKAROUNDS

### Issue #1: Migration tidak berjalan
**Symptom**: App run tapi kolom baru tidak ada  
**Root Cause**: Database locking atau permission issue  
**Fix**:
```bash
# Kill existing connection
lsof -i :3000  # atau port yang dipakai
kill -9 <PID>

# Clear database lock
rm ~/.catalog-manager/database.db-shm
rm ~/.catalog-manager/database.db-wal

# Restart app
npm start
```

### Issue #2: Data lama operating_hours tidak muncul
**Symptom**: Edit toko lama, jam field kosong  
**Root Cause**: Data di operating_hours belum di-split  
**Fix**: Itu normal! User perlu re-edit & set hari + jam di form baru

### Issue #3: URL label menunjukkan undefined
**Symptom**: Link utama menunjukkan "undefined" daripada label  
**Root Cause**: url_label NULL dan fallback logic error  
**Fix**: Check code - fallback harus ke "Link Utama" jika NULL
```javascript
{store.urlLabel || 'Link Utama'}
```

---

## 📊 MIGRATION SUCCESS METRICS

Setelah migration, pastikan:

| Metric | Nilai | Cara Check |
|--------|-------|-----------|
| **Database Integrity** | 100% | `PRAGMA integrity_check` |
| **Data Preservation** | 100% | COUNT(*) sebelum & sesudah sama |
| **Schema Update** | 100% | 2 kolom baru ada |
| **App Startup Time** | < 5s | Catat waktu startup |
| **User Experience** | No lag | Test buka 5 toko |
| **No Error Console** | 0 errors | DevTools Console |

---

## 🚀 PRODUCTION MIGRATION STEPS

### Phase 1: Preparation (1 hari sebelum)
- [ ] Backup production database 2x (local + cloud)
- [ ] Test migration di staging environment
- [ ] Prepare communication ke user (jika diperlukan)
- [ ] Schedule maintenance window (jika needed)

### Phase 2: Execution
- [ ] Deploy v8 code ke production
- [ ] App otomatis run migration
- [ ] Monitor logs: no errors
- [ ] Verify data: SQL checks
- [ ] Test key features: FAQ, Kaset Stores

### Phase 3: Validation
- [ ] User acceptance testing
- [ ] Monitor app performance
- [ ] Keep v7 backup tersedia 24-48 jam

### Phase 4: Post-Migration
- [ ] Document any issues encountered
- [ ] Archive backup setelah 7 hari
- [ ] Update runbooks & documentation

---

## 📞 SUPPORT CONTACTS

**Jika ada data issue:**
1. Check database backup di `~/.catalog-manager/database.db.backup_v7`
2. Review migration logs
3. Contact database admin
4. Escalate jika perlu restore dari backup

---

**Data safety is paramount. All checks passed? You're ready to migrate! 🎉**
