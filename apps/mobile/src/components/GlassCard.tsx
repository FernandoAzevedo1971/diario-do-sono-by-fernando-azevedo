import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export function GlassCard({ children, style }: ViewProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
