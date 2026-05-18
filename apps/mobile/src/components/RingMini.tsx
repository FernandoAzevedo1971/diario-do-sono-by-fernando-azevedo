import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Filter, FeGaussianBlur, FeMerge, FeMergeNode } from 'react-native-svg';
import { colors } from '../theme/tokens';

interface RingMiniProps {
  value: number;
  primary?: string;
  size?: number;
  strokeWidth?: number;
}

export const RingMini: React.FC<RingMiniProps> = ({
  value = 94,
  primary = colors.primary,
  size = 56,
  strokeWidth = 4,
}) => {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <Filter id="ringGlowN2" x="-20%" y="-20%" width="140%" height="140%">
            <FeGaussianBlur stdDeviation="2" result="b" />
            <FeMerge>
              <FeMergeNode in="b" />
              <FeMergeNode in="SourceGraphic" />
            </FeMerge>
          </Filter>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.ghost}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter="url(#ringGlowN2)"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
};
