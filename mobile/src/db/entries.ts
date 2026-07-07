import { getDb } from './database';
import { toLocalISO } from '../utils/dates';
import type { ContainerType, DayTotal, IntakeEntry } from '../types';

interface EntryRow {
  id: number;
  amount_ml: number;
  container_type: string;
  created_at: string;
  synced: number;
  server_id: number | null;
}

function mapRow(row: EntryRow): IntakeEntry {
  return {
    id: row.id,
    amountMl: row.amount_ml,
    containerType: row.container_type as ContainerType,
    createdAt: row.created_at,
    synced: row.synced === 1,
    serverId: row.server_id,
  };
}

export function addEntry(amountMl: number, containerType: ContainerType): IntakeEntry {
  const db = getDb();
  const createdAt = toLocalISO(new Date());
  const result = db.runSync(
    'INSERT INTO intake_entries (amount_ml, container_type, created_at, synced) VALUES (?, ?, ?, 0)',
    amountMl,
    containerType,
    createdAt
  );
  return {
    id: result.lastInsertRowId,
    amountMl,
    containerType,
    createdAt,
    synced: false,
    serverId: null,
  };
}

export function deleteEntry(id: number): void {
  const db = getDb();
  const row = db.getFirstSync<EntryRow>('SELECT * FROM intake_entries WHERE id = ?', id);
  if (!row) return;
  if (row.synced === 1 && row.server_id != null) {
    db.runSync('INSERT OR IGNORE INTO pending_deletions (server_id) VALUES (?)', row.server_id);
  }
  db.runSync('DELETE FROM intake_entries WHERE id = ?', id);
}

export function getEntriesForDay(dayKey: string): IntakeEntry[] {
  const db = getDb();
  const rows = db.getAllSync<EntryRow>(
    'SELECT * FROM intake_entries WHERE substr(created_at, 1, 10) = ? ORDER BY created_at DESC, id DESC',
    dayKey
  );
  return rows.map(mapRow);
}

export function getDayTotal(dayKey: string): number {
  const db = getDb();
  const row = db.getFirstSync<{ total: number | null }>(
    'SELECT SUM(amount_ml) AS total FROM intake_entries WHERE substr(created_at, 1, 10) = ?',
    dayKey
  );
  return row?.total ?? 0;
}

/** Totals per day within [fromKey, toKey], only days that have entries */
export function getDailyTotals(fromKey: string, toKey: string): DayTotal[] {
  const db = getDb();
  const rows = db.getAllSync<{ day: string; total: number }>(
    `SELECT substr(created_at, 1, 10) AS day, SUM(amount_ml) AS total
     FROM intake_entries
     WHERE substr(created_at, 1, 10) BETWEEN ? AND ?
     GROUP BY day
     ORDER BY day ASC`,
    fromKey,
    toKey
  );
  return rows.map((r) => ({ day: r.day, totalMl: r.total }));
}

/** All-time totals per day, most recent first */
export function getAllDailyTotals(): DayTotal[] {
  const db = getDb();
  const rows = db.getAllSync<{ day: string; total: number }>(
    `SELECT substr(created_at, 1, 10) AS day, SUM(amount_ml) AS total
     FROM intake_entries
     GROUP BY day
     ORDER BY day DESC`
  );
  return rows.map((r) => ({ day: r.day, totalMl: r.total }));
}

export function getUnsyncedEntries(): IntakeEntry[] {
  const db = getDb();
  const rows = db.getAllSync<EntryRow>(
    'SELECT * FROM intake_entries WHERE synced = 0 ORDER BY id ASC'
  );
  return rows.map(mapRow);
}

export function markEntrySynced(localId: number, serverId: number): void {
  getDb().runSync('UPDATE intake_entries SET synced = 1, server_id = ? WHERE id = ?', serverId, localId);
}

export function getPendingDeletions(): number[] {
  const rows = getDb().getAllSync<{ server_id: number }>('SELECT server_id FROM pending_deletions');
  return rows.map((r) => r.server_id);
}

export function clearPendingDeletion(serverId: number): void {
  getDb().runSync('DELETE FROM pending_deletions WHERE server_id = ?', serverId);
}

export function clearAllEntries(): void {
  const db = getDb();
  db.execSync('DELETE FROM intake_entries; DELETE FROM pending_deletions;');
}
