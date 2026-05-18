import React from 'react';
import { View, Text } from 'react-native';
import { colors, fonts, typography } from '../theme/tokens';

interface KickerProps {
  num: string;
  label: string;
  delta?: string;
}

export const Kicker: React.FC<KickerProps> = ({ num, label, delta }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{
          fontFamily: fonts.mono.default,
          fontSize: typography.kicker.fontSize,
          color: colors.dim,
          letterSpacing: typography.kicker.letterSpacing,
        }}>
          {num}
        </Text>
        <Text style={{
          fontSize: 11,
          color: colors.textMuted,
          letterSpacing: 0.16,
          textTransform: 'uppercase',
          fontWeight: '500',
        }}>
          {label}
        </Text>
      </View>
      {delta && (
        <Text style={{
          fontSize: 10.5,
          color: colors.dim,
          fontFamily: fonts.mono.default,
          letterSpacing: 0.04,
        }}>
          {delta}
        </Text>
      )}
    </View>
  );
};
