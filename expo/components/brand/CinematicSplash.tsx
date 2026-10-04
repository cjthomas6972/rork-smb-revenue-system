import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import Colors from '@/constants/colors';

interface CinematicSplashProps {
  onComplete: () => void;
}

/**
 * Cold open. Black canvas, one wordmark, one hairline of ember.
 * Nothing announces itself; it simply arrives, then gets out of the way.
 */
export default function CinematicSplash({ onComplete }: CinematicSplashProps) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslate = useRef(new Animated.Value(10)).current;
  const lineScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkTranslate, {
          toValue: 0,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(lineScale, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.delay(550),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, [containerOpacity, lineScale, onComplete, wordmarkOpacity, wordmarkTranslate]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View
        style={[
          styles.wordmarkWrap,
          {
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslate }],
          },
        ]}
      >
        <Text style={styles.wordmark}>SKYFORGE</Text>
        <Animated.View
          style={[
            styles.emberLine,
            { transform: [{ scaleX: lineScale }] },
          ]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  wordmarkWrap: {
    alignItems: 'center',
  },
  wordmark: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '600' as const,
    letterSpacing: 9,
  },
  emberLine: {
    marginTop: 18,
    width: 64,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.accent,
  },
});
