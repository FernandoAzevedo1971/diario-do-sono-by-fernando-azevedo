import React from 'react';
import { View, Text } from 'react-native';
import { colors, fonts } from '../theme/tokens';

interface BigPctProps {
  value: number;
  primary?: string;
  fontFamily?: string;
  italic?: boolean;
  weight?: string;
}

export const BigPct: React.FC<BigPctProps> = ({
  value,
  primary = colors.primary,
  fontFamily = fonts.serif.accent,
  italic = true,
  weight = '300',
}) => {
  const numStyle = {
    fontFamily,
    fontSize: 92,
    lineHeight: 0.82,
    letterSpacing: -0.05,
    fontWeight: weight as any,
    color: colors.ink,
  };

  const unitStyle = {
    fontFamily,
    fontSize: 36,
    color: primary,
    letterSpacing: -0.02,
    fontWeight: weight as any,
    fontStyle: italic ? ('italic' as const) : ('normal' as const),
    marginLeft: 2,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={numStyle}>{value}</Text>
      <Text style={unitStyle}>%</Text>
    </View>
  );
};
