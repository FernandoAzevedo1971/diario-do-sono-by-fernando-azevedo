import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme/tokens';

interface PrimaryButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, variant = 'primary', style, ...props }: PrimaryButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.base, styles[variant], props.disabled && styles.disabled, pressed && !props.disabled && styles.pressed, style]} {...props}>
      <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel, props.disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  disabledLabel: {
    color: colors.textMuted,
  },
  secondaryLabel: {
    color: colors.primaryLight,
  },
});
