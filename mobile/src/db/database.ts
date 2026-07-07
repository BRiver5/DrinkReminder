import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

const DEFAULT_REMINDER_TIMES = ['09:00', '12:00', '15:00', '18:00', '20:00'];

const db = SQLite.openDatabaseSync('drinkreminder.db');
let initialized = false;

export function initDatabase(): void {
  if (initialized) return;
  db.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS intake_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount_ml INTEGER NOT NULL,
      container_type TEXT NOT NULL DEFAULT 'glass',
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      server_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_entries_created_at ON intake_entries (created_at);
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      daily_goal_ml INTEGER NOT NULL DEFAULT 2000,
      weight_kg INTEGER,
      unit TEXT NOT NULL DEFAULT 'ml',
      theme_color TEXT NOT NULL DEFAULT '#0B57D0',
      container_icon TEXT NOT NULL DEFAULT 'glass'
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      notification_id TEXT
    );
    CREATE TABLE IF NOT EXISTS pending_deletions (
      server_id INTEGER PRIMARY KEY
    );
  `);
  db.runSync('INSERT OR IGNORE INTO user_settings (id) VALUES (1)');
  initialized = true;

  if (!getMeta('device_id')) {
    setMeta('device_id', Crypto.randomUUID());
  }
  if (getMeta('reminders_seeded') !== '1') {
    for (const time of DEFAULT_REMINDER_TIMES) {
      db.runSync('INSERT INTO reminders (time, enabled) VALUES (?, 1)', time);
    }
    setMeta('reminders_seeded', '1');
  }
}

export function getDb(): SQLite.SQLiteDatabase {
  initDatabase();
  return db;
}

export function getMeta(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key);
  return row ? row.value : null;
}

export function setMeta(key: string, value: string): void {
  db.runSync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export function getDeviceId(): string {
  initDatabase();
  const id = getMeta('device_id');
  if (!id) {
    const fresh = Crypto.randomUUID();
    setMeta('device_id', fresh);
    return fresh;
  }
  return id;
}
