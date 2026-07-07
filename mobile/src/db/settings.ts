import { getDb, setMeta } from './database';
import type { ContainerType, Unit, UserSettings } from '../types';

interface SettingsRow {
  daily_goal_ml: number;
  weight_kg: number | null;
  unit: string;
  theme_color: string;
  container_icon: string;
}

export function getSettings(): UserSettings {
  const row = getDb().getFirstSync<SettingsRow>(
    'SELECT daily_goal_ml, weight_kg, unit, theme_color, container_icon FROM user_settings WHERE id = 1'
  );
  if (!row) {
    // Row is seeded at init; this is a defensive fallback only.
    return { dailyGoalMl: 2000, weightKg: null, unit: 'ml', themeColor: '#0B57D0', containerIcon: 'glass' };
  }
  return {
    dailyGoalMl: row.daily_goal_ml,
    weightKg: row.weight_kg,
    unit: row.unit as Unit,
    themeColor: row.theme_color,
    containerIcon: row.container_icon as ContainerType,
  };
}

export function updateSettings(patch: Partial<UserSettings>): UserSettings {
  const db = getDb();
  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (patch.dailyGoalMl !== undefined) {
    sets.push('daily_goal_ml = ?');
    params.push(patch.dailyGoalMl);
  }
  if (patch.weightKg !== undefined) {
    sets.push('weight_kg = ?');
    params.push(patch.weightKg);
  }
  if (patch.unit !== undefined) {
    sets.push('unit = ?');
    params.push(patch.unit);
  }
  if (patch.themeColor !== undefined) {
    sets.push('theme_color = ?');
    params.push(patch.themeColor);
  }
  if (patch.containerIcon !== undefined) {
    sets.push('container_icon = ?');
    params.push(patch.containerIcon);
  }
  if (sets.length > 0) {
    db.runSync(`UPDATE user_settings SET ${sets.join(', ')} WHERE id = 1`, ...params);
    setMeta('settings_dirty', '1');
  }
  return getSettings();
}
