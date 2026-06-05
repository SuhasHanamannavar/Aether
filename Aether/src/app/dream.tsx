import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import StaggerContainer from '../components/StaggerContainer';

const { width } = Dimensions.get('window');

const quickActions = [
  { emoji: '✈️', label: 'Past Trips', route: '/past-trips' },
  { emoji: '💡', label: 'Inspiration', route: '/inspiration' },
  { emoji: '⚙️', label: 'Settings', route: '/settings' },
];

export default function DreamScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Animated.View entering={FadeInUp.duration(600).springify()}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>Dream</Text>
          <Text style={styles.subtitle}>Where will the wind take you?</Text>
        </Animated.View>
      </View>

      <View style={styles.middleSection}>
        <Animated.View
          entering={FadeInUp.duration(500).delay(200).springify()}
          style={styles.heroCard}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>🌍</Text>
            <Text style={styles.heroTitle}>Ready for your next adventure?</Text>
            <Text style={styles.heroDesc}>
              Tell us where you want to go, and we'll build the perfect trip
            </Text>
          </View>
        </Animated.View>

        <StaggerContainer staggerDelay={120} duration={400} index={2} style={styles.actionsRow}>
          {quickActions.map((action) => (
            <View key={action.label} style={styles.actionCard}>
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </View>
          ))}
        </StaggerContainer>
      </View>

      <View style={styles.bottomSection}>
        <Button
          title="Start New Trip"
          onPress={() => router.push('/new-trip')}
          size="lg"
          style={styles.newTripBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topSection: {
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  greeting: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroDesc: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  newTripBtn: {
    width: '100%',
  },
});
