import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, animation } from '../theme/tokens';

interface BudgetPresetChipsProps {
  presets: { label: string; value: number }[];
  selected: number | null;
  onSelect: (value: number | null) => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function BudgetChip({ label, isSelected, onPress }: { label: string; isSelected: boolean; onPress: () => void }) {
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
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
    </AnimatedTouchable>
  );
}

export default function BudgetPresetChips({ presets, selected, onSelect, style }: BudgetPresetChipsProps) {
  return (
    <View style={[styles.container, style]}>
      {presets.map((preset) => (
        <BudgetChip
          key={preset.value}
          label={preset.label}
          isSelected={selected === preset.value}
          onPress={() => onSelect(selected === preset.value ? null : preset.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
