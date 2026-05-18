import React from 'react';
import { View, Text } from 'react-native';
import { colors, fonts } from '../theme/tokens';

interface BigNumberHMProps {
  hours: number;
  minutes: number;
  primary?: string;
  fontFamily?: string;
  italic?: boolean;
  weight?: string;
}

export const BigNumberHM: React.FC<BigNumberHMProps> = ({
  hours,
  minutes,
  primary = colors.primary,
  fontFamily = fonts.serif.accent,
  italic = true,
  weight = '300',
}) => {
  const numStyle = {
    fontFamily,
    fontSize: 84,
    lineHeight: 0.82,
    letterSpacing: -0.05,
    fontWeight: weight as any,
    color: colors.ink,
  };

  const unitStyle = {
    fontFamily,
    fontSize: 46,
    color: primary,
    letterSpacing: -0.03,
    fontWeight: weight as any,
    fontStyle: italic ? ('italic' as const) : ('normal' as const),
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 6 }}>
      <Text style={numStyle}>{hours}</Text>
      <Text style={unitStyle}>h</Text>
      <Text style={{ ...numStyle, marginLeft: 2 }}>{String(minutes).padStart(2, '0')}</Text>
    </View>
  );
};
