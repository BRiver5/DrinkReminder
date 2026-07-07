import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BASE_COLORS } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

interface SegmentedToggleProps<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.segment, selected && { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: BASE_COLORS.track,
    borderRadius: 12,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: BASE_COLORS.textSecondary,
  },
  labelSelected: {
    color: BASE_COLORS.white,
  },
});
