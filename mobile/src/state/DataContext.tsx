import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  addEntry as dbAddEntry,
  clearAllEntries as dbClearAllEntries,
  deleteEntry as dbDeleteEntry,
  getEntriesForDay,
} from '../db/entries';
import { getSettings as dbGetSettings, updateSettings as dbUpdateSettings } from '../db/settings';
import { todayKey as computeTodayKey } from '../utils/dates';
import { scheduleSync, syncNow } from '../api/sync';
import type { IntakeEntry, UserSettings } from '../types';

interface DataContextValue {
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => void;
  /** "YYYY-MM-DD" of the current local day; changes at midnight */
  todayKey: string;
  todayEntries: IntakeEntry[];
  todayTotalMl: number;
  addWater: (amountMl: number) => void;
  removeEntry: (id: number) => void;
  clearHistory: () => void;
  /** Bumped on every data mutation; Insights recomputes from SQLite when it changes */
  dataVersion: number;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => dbGetSettings());
  const [todayKey, setTodayKey] = useState<string>(() => computeTodayKey());
  const [todayEntries, setTodayEntries] = useState<IntakeEntry[]>(() =>
    getEntriesForDay(computeTodayKey())
  );
  const [dataVersion, setDataVersion] = useState(0);

  const refreshToday = useCallback(() => {
    const key = computeTodayKey();
    setTodayKey(key);
    setTodayEntries(getEntriesForDay(key));
  }, []);

  // Midnight rollover: the counter resets because "today" changes; history stays in SQLite.
  useEffect(() => {
    const interval = setInterval(() => {
      if (computeTodayKey() !== todayKey) refreshToday();
    }, 30000);
    return () => clearInterval(interval);
  }, [todayKey, refreshToday]);

  // Refresh and push pending changes whenever the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshToday();
        void syncNow();
      }
    });
    return () => sub.remove();
  }, [refreshToday]);

  const addWater = useCallback(
    (amountMl: number) => {
      dbAddEntry(amountMl, settings.containerIcon);
      refreshToday();
      setDataVersion((v) => v + 1);
      scheduleSync();
    },
    [settings.containerIcon, refreshToday]
  );

  const removeEntry = useCallback(
    (id: number) => {
      dbDeleteEntry(id);
      refreshToday();
      setDataVersion((v) => v + 1);
      scheduleSync();
    },
    [refreshToday]
  );

  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setSettings(dbUpdateSettings(patch));
    setDataVersion((v) => v + 1);
    scheduleSync();
  }, []);

  const clearHistory = useCallback(() => {
    dbClearAllEntries();
    refreshToday();
    setDataVersion((v) => v + 1);
  }, [refreshToday]);

  const todayTotalMl = useMemo(
    () => todayEntries.reduce((sum, e) => sum + e.amountMl, 0),
    [todayEntries]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      settings,
      updateSettings,
      todayKey,
      todayEntries,
      todayTotalMl,
      addWater,
      removeEntry,
      clearHistory,
      dataVersion,
    }),
    [
      settings,
      updateSettings,
      todayKey,
      todayEntries,
      todayTotalMl,
      addWater,
      removeEntry,
      clearHistory,
      dataVersion,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
