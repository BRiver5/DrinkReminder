import { api, ApiError, getApiBaseUrl } from './client';
import { getDeviceId, getMeta, setMeta } from '../db/database';
import {
  clearPendingDeletion,
  getPendingDeletions,
  getUnsyncedEntries,
  markEntrySynced,
} from '../db/entries';
import { getSettings } from '../db/settings';

let syncing = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Push local changes to the backend. The app never depends on this succeeding:
 * every failure is swallowed and retried on the next trigger (app foreground,
 * next mutation). Local SQLite remains the source of truth.
 */
export async function syncNow(): Promise<void> {
  if (syncing || !getApiBaseUrl()) return;
  syncing = true;
  try {
    const deviceId = getDeviceId();

    if (getMeta('device_registered') !== '1') {
      await api.registerDevice(deviceId);
      setMeta('device_registered', '1');
    }

    for (const entry of getUnsyncedEntries()) {
      const created = await api.createEntry(deviceId, {
        amount_ml: entry.amountMl,
        container_type: entry.containerType,
        created_at: entry.createdAt,
      });
      markEntrySynced(entry.id, created.id);
    }

    for (const serverId of getPendingDeletions()) {
      try {
        await api.deleteEntry(deviceId, serverId);
      } catch (err) {
        // Already gone on the server — safe to drop from the queue.
        if (!(err instanceof ApiError && err.status === 404)) throw err;
      }
      clearPendingDeletion(serverId);
    }

    if (getMeta('settings_dirty') === '1') {
      const s = getSettings();
      await api.putSettings(deviceId, {
        daily_goal_ml: s.dailyGoalMl,
        weight_kg: s.weightKg,
        unit: s.unit,
        theme_color: s.themeColor,
        container_icon: s.containerIcon,
      });
      setMeta('settings_dirty', '0');
    }
  } catch {
    // Offline or backend unreachable — keep working from local data.
  } finally {
    syncing = false;
  }
}

/** Debounced sync used after local mutations so rapid taps batch into one push. */
export function scheduleSync(delayMs = 2000): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncNow();
  }, delayMs);
}
