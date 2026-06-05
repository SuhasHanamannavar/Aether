import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows } from '../theme/tokens';

interface BottomSheetProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
}

export default function BottomSheet({
  visible,
  children,
  title,
  style,
}: BottomSheetProps) {
  if (!visible) return null;

  return (
    <Animated.View
      style={styles.overlay}
      entering={SlideInDown.springify().damping(20).stiffness(120)}
      exiting={SlideOutDown.duration(200)}
    >
      <View style={[styles.sheet, style]}>
        <View style={styles.handle} />
        {title && <Text style={styles.title}>{title}</Text>}
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
