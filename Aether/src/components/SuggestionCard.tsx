import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows, animation } from '../theme/tokens';

interface SuggestionCardProps {
  destination: string;
  emoji: string;
  subtitle: string;
  score: number;
  color: string;
  onPress?: () => void;
  style?: ViewStyle;
  width: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function SuggestionCard({
  destination,
  emoji,
  subtitle,
  score,
  color,
  onPress,
  style,
  width,
}: SuggestionCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, animation.spring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animation.spring);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const scoreColor = score >= 90 ? colors.success : score >= 80 ? colors.warning : colors.textTertiary;

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.card, { width }, animatedStyle, style]}
    >
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
            <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
          </View>
        </View>
        <Text style={styles.destination}>{destination}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.matchBar}>
          <View style={styles.matchBarBg}>
            <View style={[styles.matchBarFill, { width: `${score}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.matchLabel}>Match</Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  accent: {
    height: 4,
  },
  content: {
    padding: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 32,
  },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  destination: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  matchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  matchBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  matchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
