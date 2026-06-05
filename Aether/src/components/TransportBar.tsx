import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '../theme/tokens';

export const TRANSPORT_MODES = [
  { id: 'drive', label: 'Drive' },
  { id: 'transit', label: 'Transit' },
  { id: 'walk', label: 'Walk' },
  { id: 'bike', label: 'Bike' },
  { id: 'fly', label: 'Fly' },
] as const;

export type TransportMode = typeof TRANSPORT_MODES[number]['id'];

interface TransportBarProps {
  selected: TransportMode;
  onSelect: (mode: TransportMode) => void;
  style?: any;
}

function PillTab({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.pill, isActive && styles.pillActive]}
    >
      {isActive && (
        <Animated.View
          entering={ZoomIn.duration(200).springify().damping(12)}
          style={styles.pillDot}
        />
      )}
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function TransportBar({ selected, onSelect, style }: TransportBarProps) {
  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TRANSPORT_MODES.map((mode) => (
          <PillTab
            key={mode.id}
            label={mode.label}
            isActive={selected === mode.id}
            onPress={() => onSelect(mode.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
