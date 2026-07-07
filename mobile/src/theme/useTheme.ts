import { useMemo } from 'react';
import { buildTheme, type Theme } from './theme';
import { useData } from '../state/DataContext';

export function useTheme(): Theme {
  const { settings } = useData();
  return useMemo(() => buildTheme(settings.themeColor), [settings.themeColor]);
}
