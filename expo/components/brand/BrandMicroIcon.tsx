import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface BrandMicroIconProps {
  size?: number;
  color?: string;
  withGlow?: boolean;
}

export default function BrandMicroIcon({ 
  size = 16, 
  color = Colors.accent,
  withGlow = false 
}: BrandMicroIconProps) {
  return (
    <View style={[
      styles.container,
      withGlow && styles.glow,
      { width: size + 4, height: size + 4 }
    ]}>
      <Zap size={size} color={color} strokeWidth={2.5} fill={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
});
