import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, animation } from '../theme/tokens';

interface VibeTag {
  id: string;
  label: string;
  emoji: string;
}

interface VibeTagGridProps {
  tags: VibeTag[];
  selected: string[];
  onToggle: (id: string) => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function VibeChip({ tag, isSelected, onPress }: { tag: VibeTag; isSelected: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.93, animation.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animation.spring);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.chip, isSelected && styles.chipSelected, animatedStyle]}
    >
      <Text style={[styles.emoji, isSelected && styles.emojiSelected]}>{tag.emoji}</Text>
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{tag.label}</Text>
    </AnimatedTouchable>
  );
}

export default function VibeTagGrid({ tags, selected, onToggle, style }: VibeTagGridProps) {
  return (
    <View style={[styles.grid, style]}>
      {tags.map((tag) => (
        <VibeChip
          key={tag.id}
          tag={tag}
          isSelected={selected.includes(tag.id)}
          onPress={() => onToggle(tag.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: 16,
  },
  emojiSelected: {},
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  labelSelected: {
    color: colors.text,
  },
});
