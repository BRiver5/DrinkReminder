import type { Unit } from '../types';

export const ML_PER_FL_OZ = 29.5735;

export function mlToOz(ml: number): number {
  return ml / ML_PER_FL_OZ;
}

export function ozToMl(oz: number): number {
  return Math.round(oz * ML_PER_FL_OZ);
}

export function unitLabel(unit: Unit): string {
  return unit === 'ml' ? 'ml' : 'fl oz';
}

/** Numeric part only, converted to the display unit */
export function displayAmount(ml: number, unit: Unit): string {
  if (unit === 'ml') return String(Math.round(ml));
  const oz = mlToOz(ml);
  return oz >= 100 ? String(Math.round(oz)) : (Math.round(oz * 10) / 10).toString();
}

/** "250 ml" / "8.5 fl oz" */
export function formatVolume(ml: number, unit: Unit): string {
  return `${displayAmount(ml, unit)} ${unitLabel(unit)}`;
}

/** Parse user input given in the display unit, returns ml (integer) or null if invalid */
export function parseVolumeInput(text: string, unit: Unit): number | null {
  const value = Number(text.replace(',', '.').trim());
  if (!Number.isFinite(value) || value <= 0) return null;
  return unit === 'ml' ? Math.round(value) : ozToMl(value);
}
