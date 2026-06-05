import React, { useCallback } from 'react';
import { Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, animation } from '../theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  emoji?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Chip({ label, selected = false, onPress, style, emoji }: ChipProps) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(selected ? 1 : 0);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, animation.spring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animation.spring);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (onPress) {
      bgOpacity.value = withTiming(selected ? 0 : 1, { duration: 200 });
      onPress();
    }
  }, [onPress, selected, bgOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        selected && styles.selected,
        animatedStyle,
        style,
      ]}
      activeOpacity={1}
    >
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
});
