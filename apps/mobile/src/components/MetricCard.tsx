import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: colors.border,
    borderWidth: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },
});
