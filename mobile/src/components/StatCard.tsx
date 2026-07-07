import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { BASE_COLORS } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={16} color={theme.primary} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 12,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
  },
  label: {
    fontSize: 11,
    color: BASE_COLORS.textSecondary,
    marginTop: 2,
  },
});
