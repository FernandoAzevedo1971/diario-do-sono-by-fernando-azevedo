import React from 'react';
import { View, Text } from 'react-native';
import { colors, fonts } from '../theme/tokens';

interface NightBarProps {
  bedtime: string;
  wakeTime: string;
  sleepPercentage: number;
  primary?: string;
}

export const NightBar: React.FC<NightBarProps> = ({
  bedtime = '23:14',
  wakeTime = '07:08',
  sleepPercentage = 94,
  primary = colors.primary,
}) => {
  return (
    <View style={{ marginTop: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', fontSize: 10.5, marginBottom: 6 }}>
        <Text style={{
          fontFamily: fonts.mono.default,
          fontSize: 10.5,
          color: colors.dim,
          letterSpacing: 0.1,
        }}>
          {bedtime}
        </Text>
        <Text style={{
          fontFamily: fonts.mono.default,
          fontSize: 10.5,
          color: colors.dim,
          letterSpacing: 0.1,
        }}>
          {wakeTime}
        </Text>
      </View>

      <View style={{ position: 'relative', height: 22, borderRadius: 11, backgroundColor: colors.surface, overflow: 'hidden' }}>
        {/* Latency indicator */}
        <View style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4%',
          backgroundColor: 'rgba(255,255,255,0.18)',
        }} />

        {/* Sleep bar */}
        <View style={{
          position: 'absolute',
          left: '4%',
          top: 0,
          bottom: 0,
          width: '94%',
          backgroundColor: primary,
          shadowColor: primary,
          shadowOpacity: 0.4,
          shadowRadius: 7,
          elevation: 3,
        }} />

        {/* Awakening markers */}
        <View style={{
          position: 'absolute',
          left: '42%',
          top: 0,
          bottom: 0,
          width: '2%',
          backgroundColor: 'rgba(255,255,255,0.22)',
        }} />
        <View style={{
          position: 'absolute',
          left: '68%',
          top: 0,
          bottom: 0,
          width: '1.5%',
          backgroundColor: 'rgba(255,255,255,0.22)',
        }} />
      </View>

      <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: primary }} />
          <Text style={{ fontSize: 10, color: colors.textMuted }}>Sono útil</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' }} />
          <Text style={{ fontSize: 10, color: colors.textMuted }}>Acordada / latência</Text>
        </View>
      </View>
    </View>
  );
};
