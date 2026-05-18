import React from 'react';
import { View, Text } from 'react-native';
import { colors, fonts } from '../theme/tokens';

interface LatencyTrackProps {
  value: number;
  maxValue?: number;
  primary?: string;
}

export const LatencyTrack: React.FC<LatencyTrackProps> = ({
  value,
  maxValue = 60,
  primary = colors.primary,
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  const idealPercentage = (20 / maxValue) * 100;

  return (
    <View>
      <View style={{
        position: 'relative',
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      }}>
        {/* Ideal range indicator */}
        <View style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${idealPercentage}%`,
          backgroundColor: `${primary}44`,
        }} />

        {/* Cursor */}
        <View style={{
          position: 'absolute',
          left: `${percentage}%`,
          top: -3,
          width: 2,
          height: 14,
          backgroundColor: '#fff',
          borderRadius: 1,
          shadowColor: primary,
          shadowOpacity: 0.6,
          shadowRadius: 4,
          elevation: 2,
        }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{
          fontFamily: fonts.mono.default,
          fontSize: 10,
          color: colors.dim,
          letterSpacing: 0.08,
        }}>
          0
        </Text>
        <Text style={{
          fontFamily: fonts.mono.default,
          fontSize: 10,
          color: colors.dim,
          letterSpacing: 0.08,
        }}>
          20 min · ideal
        </Text>
        <Text style={{
          fontFamily: fonts.mono.default,
          fontSize: 10,
          color: colors.dim,
          letterSpacing: 0.08,
        }}>
          {maxValue}
        </Text>
      </View>
    </View>
  );
};
