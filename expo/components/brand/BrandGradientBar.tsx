import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface BrandGradientBarProps {
  height?: number;
  opacity?: number;
  direction?: 'horizontal' | 'vertical';
}

export default function BrandGradientBar({ 
  height = 2, 
  opacity = 0.4,
  direction = 'horizontal'
}: BrandGradientBarProps) {
  const start = direction === 'horizontal' ? { x: 0, y: 0.5 } : { x: 0.5, y: 0 };
  const end = direction === 'horizontal' ? { x: 1, y: 0.5 } : { x: 0.5, y: 1 };

  return (
    <View style={[styles.container, { opacity }]}>
      <LinearGradient
        colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]}
        start={start}
        end={end}
        style={[styles.gradient, { height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gradient: {
    width: '100%',
  },
});
