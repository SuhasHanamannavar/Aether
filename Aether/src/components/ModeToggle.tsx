import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { spacing, borderRadius } from '../theme/tokens';

interface ModeToggleProps {
  options: { id: string; label: string; emoji: string }[];
  selected: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export default function ModeToggle({ options, selected, onSelect, style }: ModeToggleProps) {
  return (
    <View style={[styles.container, style]}>
      {options.map((option) => {
        const isActive = option.id === selected;
        return (
          <TouchableOpacity
            key={option.id}
            style={[styles.option, isActive && styles.optionActive]}
            onPress={() => onSelect(option.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  optionActive: {
    backgroundColor: '#FFFFFF',
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  labelActive: {
    color: '#2D4A2D',
  },
});
