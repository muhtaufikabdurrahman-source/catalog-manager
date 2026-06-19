// src/main/db/schema.js
//
// Skema database + sistem migrasi sederhana berbasis "user_version" SQLite.
// Setiap kali skema berubah di masa depan, tambahkan entri baru ke array
// MIGRATIONS di bawah ini -- jangan ubah migrasi yang sudah ada agar database
// pengguna lama tetap bisa di-upgrade dengan aman.

const MIGRATIONS = [
  // ---- versi 1: skema awal ----
  `
  CREATE TABLE games (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_custom TEXT,           -- diisi jika platform = '__custom__'
    region TEXT NOT NULL,
    condition TEXT NOT NULL,
    buy_price REAL NOT NULL DEFAULT 0,
    sell_price_offline REAL NOT NULL DEFAULT 0,
    sell_price_shopee REAL NOT NULL DEFAULT 0,
    notes TEXT,
    cover_image_id TEXT,            -- FK logis ke images.id (cover terpilih)
    is_deleted INTEGER NOT NULL DEFAULT 0,  -- soft delete untuk mendukung undo
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE images (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL,
    original_name TEXT,
    full_data BLOB NOT NULL,        -- gambar utama (dikompres, long-edge ~1600px)
    thumb_data BLOB NOT NULL,       -- thumbnail kecil (~300px) untuk grid view
    width INTEGER,
    height INTEGER,
    byte_size INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE price_history (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    field TEXT NOT NULL,            -- 'buy_price' | 'sell_price_offline' | 'sell_price_shopee'
    old_value REAL,
    new_value REAL,
    changed_at TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
  );

  CREATE TABLE best_seller (
    id TEXT PRIMARY KEY,
    game_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    region TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,   -- makin tinggi makin prioritas dicari
    buy_price REAL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE undo_log (
    id TEXT PRIMARY KEY,
    action_type TEXT NOT NULL,      -- 'create' | 'update' | 'delete' | 'bulk_update' | 'bulk_delete'
    payload TEXT NOT NULL,          -- JSON: snapshot data sebelum & sesudah, untuk undo/redo
    created_at TEXT NOT NULL,
    is_undone INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE app_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- Indeks untuk pencarian & sort instan walau data sudah puluhan ribu baris.
  CREATE INDEX idx_games_name ON games(name);
  CREATE INDEX idx_games_platform ON games(platform);
  CREATE INDEX idx_games_region ON games(region);
  CREATE INDEX idx_games_condition ON games(condition);
  CREATE INDEX idx_games_is_deleted ON games(is_deleted);
  CREATE INDEX idx_games_created_at ON games(created_at);
  CREATE INDEX idx_games_updated_at ON games(updated_at);
  CREATE INDEX idx_games_buy_price ON games(buy_price);
  CREATE INDEX idx_games_sell_offline ON games(sell_price_offline);
  CREATE INDEX idx_games_sell_shopee ON games(sell_price_shopee);

  CREATE INDEX idx_images_game_id ON images(game_id);
  CREATE INDEX idx_price_history_game_id ON price_history(game_id);
  CREATE INDEX idx_best_seller_priority ON best_seller(priority);

  -- FTS5 virtual table untuk realtime search yang cepat di skala besar.
  CREATE VIRTUAL TABLE games_fts USING fts5(
    name,
    platform,
    region,
    content='games',
    content_rowid='rowid'
  );

  CREATE TRIGGER games_ai AFTER INSERT ON games BEGIN
    INSERT INTO games_fts(rowid, name, platform, region)
    VALUES (new.rowid, new.name, new.platform, new.region);
  END;

  CREATE TRIGGER games_ad AFTER DELETE ON games BEGIN
    INSERT INTO games_fts(games_fts, rowid, name, platform, region)
    VALUES ('delete', old.rowid, old.name, old.platform, old.region);
  END;

  CREATE TRIGGER games_au AFTER UPDATE ON games BEGIN
    INSERT INTO games_fts(games_fts, rowid, name, platform, region)
    VALUES ('delete', old.rowid, old.name, old.platform, old.region);
    INSERT INTO games_fts(rowid, name, platform, region)
    VALUES (new.rowid, new.name, new.platform, new.region);
  END;
  `
];

/**
 * Menjalankan semua migrasi yang belum diterapkan pada koneksi db yang diberikan.
 * Menggunakan PRAGMA user_version sebagai penanda versi skema saat ini.
 */
function runMigrations(db) {
  const currentVersion = db.pragma('user_version', { simple: true });

  for (let i = currentVersion; i < MIGRATIONS.length; i++) {
    const migrationSql = MIGRATIONS[i];
    const tx = db.transaction(() => {
      db.exec(migrationSql);
      db.pragma(`user_version = ${i + 1}`);
    });
    tx();
  }
}

module.exports = { runMigrations, SCHEMA_VERSION: MIGRATIONS.length };
