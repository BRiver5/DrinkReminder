import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BASE_COLORS, CARD_SHADOW, RADIUS } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BASE_COLORS.card,
    borderRadius: RADIUS.card,
    padding: 16,
    ...CARD_SHADOW,
  },
});
