import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalePressable } from './ScalePressable';
import { ContainerIcon } from './ContainerIcon';
import { BASE_COLORS } from '../theme/theme';
import { displayAmount, unitLabel } from '../utils/units';
import { useTheme } from '../theme/useTheme';
import type { ContainerType, Unit } from '../types';

export const QUICK_ADD_PRESETS_ML = [100, 150, 200, 250, 300];

interface QuickAddRowProps {
  unit: Unit;
  containerIcon: ContainerType;
  onAdd: (amountMl: number) => void;
  onCustom: () => void;
}

export function QuickAddRow({ unit, containerIcon, onAdd, onCustom }: QuickAddRowProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {QUICK_ADD_PRESETS_ML.map((ml) => (
        <ScalePressable key={ml} onPress={() => onAdd(ml)} style={styles.item}>
          <View style={[styles.circle, { backgroundColor: theme.soft }]}>
            <ContainerIcon type={containerIcon} size={24} color={theme.primary} />
          </View>
          <Text style={styles.label}>
            {displayAmount(ml, unit)} {unitLabel(unit)}
          </Text>
        </ScalePressable>
      ))}
      <ScalePressable onPress={onCustom} style={styles.item}>
        <View style={[styles.circle, styles.customCircle, { borderColor: theme.primary }]}>
          <Ionicons name="add" size={26} color={theme.primary} />
        </View>
        <Text style={styles.label}>Custom</Text>
      </ScalePressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 14,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  item: {
    alignItems: 'center',
    width: 62,
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCircle: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: BASE_COLORS.textPrimary,
  },
});
