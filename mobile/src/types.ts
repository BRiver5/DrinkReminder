export type Unit = 'ml' | 'oz';

export type ContainerType = 'glass' | 'bottle' | 'mug' | 'cup';

export interface IntakeEntry {
  id: number;
  amountMl: number;
  containerType: ContainerType;
  /** ISO datetime in local time, e.g. "2026-07-07T14:03:22" */
  createdAt: string;
  synced: boolean;
  serverId: number | null;
}

export interface UserSettings {
  dailyGoalMl: number;
  weightKg: number | null;
  unit: Unit;
  themeColor: string;
  containerIcon: ContainerType;
}

export interface Reminder {
  id: number;
  /** "HH:MM" 24h */
  time: string;
  enabled: boolean;
  notificationId: string | null;
}

export interface DayTotal {
  /** "YYYY-MM-DD" */
  day: string;
  totalMl: number;
}
