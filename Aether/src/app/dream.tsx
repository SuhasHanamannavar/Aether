import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import StaggerContainer from '../components/StaggerContainer';

const { width } = Dimensions.get('window');

const suggestedTrips = [
  {
    id: 'japan',
    destination: 'Japan',
    emoji: '🗾',
    subtitle: 'Cherry blossom season',
    score: 96,
    color: '#E8A87C',
  },
  {
    id: 'italy',
    destination: 'Italy',
    emoji: '🍝',
    subtitle: 'Culinary adventure',
    score: 92,
    color: '#41B3A3',
  },
  {
    id: 'peru',
    destination: 'Peru',
    emoji: '🏔️',
    subtitle: 'Machu Picchu awaits',
    score: 88,
    color: '#10B981',
  },
];

const quickActions = [
  { emoji: '✈️', label: 'Past Trips', color: colors.primaryLight },
  { emoji: '💡', label: 'Inspiration', color: colors.secondary },
  { emoji: '⚙️', label: 'Settings', color: colors.accent },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅';
  if (hour < 17) return '☀️';
  if (hour < 21) return '🌆';
  return '🌙';
}

export default function DreamScreen() {
  const router = useRouter();
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInUp.duration(600).springify()}
          style={styles.topSection}
        >
          <View style={styles.greetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{getGreetingEmoji()}</Text>
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.greetingLabel}>{greeting}</Text>
              <Text style={styles.greetingName}>Traveler</Text>
            </View>
          </View>

          <Text style={styles.title}>Where will the wind take you?</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(150).springify()}
          style={styles.heroCard}
        >
          <View style={styles.heroBackground} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEmoji}>🌍</Text>
            <Text style={styles.heroTitle}>Ready for your next adventure?</Text>
            <Text style={styles.heroDesc}>
              Tell us where you want to go, and we'll build the perfect trip
            </Text>
            <Button
              title="Start New Trip"
              onPress={() => router.push('/new-trip')}
              variant="secondary"
              size="md"
              style={styles.heroBtn}
            />
          </View>
        </Animated.View>

        <View style={styles.suggestedSection}>
          <Animated.View
            entering={FadeInUp.duration(400).delay(250)}
            style={styles.sectionHeader}
          >
            <Text style={styles.sectionTitle}>Suggested for you</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedScroll}
            snapToInterval={width * 0.6 + spacing.lg}
            decelerationRate="fast"
          >
            <StaggerContainer
              staggerDelay={80}
              duration={350}
              index={3}
              style={styles.suggestedRow}
            >
              {suggestedTrips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  activeOpacity={0.9}
                  style={[styles.suggestedCard, { width: width * 0.6 }]}
                >
                  <View
                    style={[
                      styles.suggestedAccent,
                      { backgroundColor: trip.color },
                    ]}
                  />
                  <View style={styles.suggestedContent}>
                    <Text style={styles.suggestedEmoji}>{trip.emoji}</Text>
                    <Text style={styles.suggestedTitle}>
                      {trip.destination}
                    </Text>
                    <Text style={styles.suggestedSubtitle}>
                      {trip.subtitle}
                    </Text>
                    <View style={styles.suggestedScore}>
                      <Text style={styles.scoreLabel}>Match</Text>
                      <View style={styles.scoreBarBg}>
                        <View
                          style={[
                            styles.scoreBarFill,
                            {
                              width: `${trip.score}%`,
                              backgroundColor: trip.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.scoreValue}>{trip.score}%</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </StaggerContainer>
          </ScrollView>
        </View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(350)}
          style={styles.actionsSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionCard, { borderTopColor: action.color }]}
                activeOpacity={0.8}
              >
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  topSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  greetingText: {
    flex: 1,
  },
  greetingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  greetingName: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: -2,
  },
  title: {
    ...typography.display,
    color: colors.text,
  },
  heroCard: {
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  heroBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary,
  },
  heroContent: {
    padding: spacing.xxl,
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
  heroBtn: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: '#FFFFFF',
  },
  suggestedSection: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  seeAllText: {
    ...typography.captionBold,
    color: colors.accent,
  },
  suggestedScroll: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
  },
  suggestedRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  suggestedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  suggestedAccent: {
    height: 4,
  },
  suggestedContent: {
    padding: spacing.xl,
  },
  suggestedEmoji: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  suggestedTitle: {
    ...typography.h3,
    color: colors.text,
  },
  suggestedSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  suggestedScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  scoreLabel: {
    ...typography.small,
    color: colors.textTertiary,
  },
  scoreBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  scoreValue: {
    ...typography.captionBold,
    color: colors.text,
  },
  actionsSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 3,
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
});
