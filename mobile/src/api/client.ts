import Constants from 'expo-constants';

const REQUEST_TIMEOUT_MS = 6000;

export interface ServerEntry {
  id: number;
  device_id: string;
  amount_ml: number;
  container_type: string;
  created_at: string;
}

export interface ServerSettings {
  device_id: string;
  daily_goal_ml: number;
  weight_kg: number | null;
  unit: string;
  theme_color: string;
  container_icon: string;
}

export interface ServerDevice {
  device_id: string;
  created_at: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Backend base URL. Priority: EXPO_PUBLIC_API_URL env var, then `extra.apiUrl`
 * from app.json. Returns null when not configured (sync is silently skipped).
 */
export function getApiBaseUrl(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const url = fromEnv || extra?.apiUrl || null;
  return url ? url.replace(/\/+$/, '') : null;
}

async function request<T>(
  path: string,
  options: { method: string; deviceId: string; body?: unknown }
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new ApiError(0, 'API base URL is not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${base}${path}`, {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Id': options.deviceId,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(response.status, `${options.method} ${path} failed with ${response.status}`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  registerDevice(deviceId: string): Promise<ServerDevice> {
    return request<ServerDevice>('/devices/register', {
      method: 'POST',
      deviceId,
      body: { device_id: deviceId },
    });
  },

  getEntries(deviceId: string, from?: string, to?: string): Promise<ServerEntry[]> {
    const params = new URLSearchParams({ device_id: deviceId });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request<ServerEntry[]>(`/entries?${params.toString()}`, {
      method: 'GET',
      deviceId,
    });
  },

  createEntry(
    deviceId: string,
    entry: { amount_ml: number; container_type: string; created_at: string }
  ): Promise<ServerEntry> {
    return request<ServerEntry>('/entries', {
      method: 'POST',
      deviceId,
      body: { device_id: deviceId, ...entry },
    });
  },

  deleteEntry(deviceId: string, serverId: number): Promise<void> {
    return request<void>(`/entries/${serverId}`, { method: 'DELETE', deviceId });
  },

  getSettings(deviceId: string): Promise<ServerSettings> {
    const params = new URLSearchParams({ device_id: deviceId });
    return request<ServerSettings>(`/settings?${params.toString()}`, {
      method: 'GET',
      deviceId,
    });
  },

  putSettings(deviceId: string, settings: Omit<ServerSettings, 'device_id'>): Promise<ServerSettings> {
    return request<ServerSettings>('/settings', {
      method: 'PUT',
      deviceId,
      body: { device_id: deviceId, ...settings },
    });
  },
};
