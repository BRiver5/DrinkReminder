import { getDb, getMeta, setMeta } from './database';
import type { Reminder } from '../types';

interface ReminderRow {
  id: number;
  time: string;
  enabled: number;
  notification_id: string | null;
}

function mapRow(row: ReminderRow): Reminder {
  return {
    id: row.id,
    time: row.time,
    enabled: row.enabled === 1,
    notificationId: row.notification_id,
  };
}

export function getReminders(): Reminder[] {
  const rows = getDb().getAllSync<ReminderRow>('SELECT * FROM reminders ORDER BY time ASC, id ASC');
  return rows.map(mapRow);
}

export function addReminder(time: string): Reminder {
  const result = getDb().runSync('INSERT INTO reminders (time, enabled) VALUES (?, 1)', time);
  return { id: result.lastInsertRowId, time, enabled: true, notificationId: null };
}

export function updateReminderTime(id: number, time: string): void {
  getDb().runSync('UPDATE reminders SET time = ? WHERE id = ?', time, id);
}

export function setReminderEnabled(id: number, enabled: boolean): void {
  getDb().runSync('UPDATE reminders SET enabled = ? WHERE id = ?', enabled ? 1 : 0, id);
}

export function setReminderNotificationId(id: number, notificationId: string | null): void {
  getDb().runSync('UPDATE reminders SET notification_id = ? WHERE id = ?', notificationId, id);
}

export function deleteReminder(id: number): void {
  getDb().runSync('DELETE FROM reminders WHERE id = ?', id);
}

/** Master "Enable reminders" switch, persisted in the meta table */
export function getRemindersMasterEnabled(): boolean {
  return getMeta('reminders_enabled') === '1';
}

export function setRemindersMasterEnabled(enabled: boolean): void {
  setMeta('reminders_enabled', enabled ? '1' : '0');
}
