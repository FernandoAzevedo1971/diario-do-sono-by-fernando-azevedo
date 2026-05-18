import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme/tokens';

interface OptionCardProps extends Omit<PressableProps, 'style'> {
  label: string;
  description?: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function OptionCard({ label, description, selected = false, style, ...props }: OptionCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed, style]} {...props}>
      <Text style={styles.label}>{label}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  selected: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(101,214,255,0.14)',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    marginTop: 4,
  },
});
