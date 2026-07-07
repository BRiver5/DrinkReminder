import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ContainerIcon } from './ContainerIcon';
import { BASE_COLORS } from '../theme/theme';
import { formatTime } from '../utils/dates';
import { formatVolume } from '../utils/units';
import { useTheme } from '../theme/useTheme';
import type { IntakeEntry, Unit } from '../types';

interface EntryRowProps {
  entry: IntakeEntry;
  unit: Unit;
  onDelete?: (id: number) => void;
}

/** One intake record row; animates in/out and collapses smoothly on delete. */
export function EntryRow({ entry, unit, onDelete }: EntryRowProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.duration(200)}
      style={styles.row}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.soft }]}>
        <ContainerIcon type={entry.containerType} size={20} color={theme.primary} />
      </View>
      <Text style={styles.amount}>{formatVolume(entry.amountMl, unit)}</Text>
      <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
      {onDelete ? (
        <Pressable
          onPress={() => onDelete(entry.id)}
          hitSlop={10}
          style={styles.deleteButton}
          accessibilityLabel="Delete record"
        >
          <Ionicons name="trash-outline" size={19} color={BASE_COLORS.textSecondary} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amount: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: BASE_COLORS.textPrimary,
  },
  time: {
    fontSize: 13,
    color: BASE_COLORS.textSecondary,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
});
