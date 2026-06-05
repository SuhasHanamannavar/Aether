import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';

export interface Integration {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

interface ToggleRowProps {
  integration: Integration;
  enabled: boolean;
  onToggle: () => void;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const TRACK_PADDING = 3;

export default function ToggleRow({ integration, enabled, onToggle }: ToggleRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={styles.left}>
        <Text style={styles.emoji}>{integration.emoji}</Text>
        <View style={styles.text}>
          <Text style={styles.name}>{integration.name}</Text>
          <Text style={styles.description}>{integration.description}</Text>
        </View>
      </View>
      <CustomToggle enabled={enabled} onToggle={onToggle} />
    </TouchableOpacity>
  );
}

function CustomToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const translateX = useSharedValue(enabled ? TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2 : 0);
  const trackColor = useSharedValue(enabled ? 1 : 0);

  const handlePress = useCallback(() => {
    const newValue = !enabled;
    translateX.value = withSpring(
      newValue ? TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2 : 0,
      { damping: 15, stiffness: 200 }
    );
    trackColor.value = withTiming(newValue ? 1 : 0, { duration: 200 });
    onToggle();
  }, [enabled, onToggle, translateX, trackColor]);

  React.useEffect(() => {
    translateX.value = withSpring(
      enabled ? TRACK_WIDTH - THUMB_SIZE - TRACK_PADDING * 2 : 0,
      { damping: 15, stiffness: 200 }
    );
    trackColor.value = withTiming(enabled ? 1 : 0, { duration: 200 });
  }, [enabled]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      trackColor.value,
      [0, 1],
      [colors.border, colors.accent]
    ),
  }));

  return (
    <Animated.View style={[styles.track, trackStyle]}>
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 28,
    marginRight: spacing.lg,
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
    paddingHorizontal: TRACK_PADDING,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
