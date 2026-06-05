import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance } from '../theme/animations';
import { useTrip } from '../context/TripContext';
import { tripsApi } from '../services/api';
import type { TransportMode } from '../components/TransportBar';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function GlassCard({ icon, label, value, delay }: { icon: string; label: string; value: string; delay: number }) {
  return (
    <Animated.View entering={cardEntrance.delay(delay)} style={styles.glassCard}>
      <Text style={styles.glassIcon}>{icon}</Text>
      <Text style={styles.glassLabel}>{label}</Text>
      <Text style={styles.glassValue} numberOfLines={2}>{value}</Text>
    </Animated.View>
  );
}

function ActionRow({ icon, label, subtitle, onPress, grayed, delay }: { icon: string; label: string; subtitle?: string; onPress?: () => void; grayed?: boolean; delay: number }) {
  return (
    <Animated.View entering={sectionEntrance.delay(delay)}>
      <TouchableOpacity
        onPress={grayed ? undefined : onPress}
        activeOpacity={grayed ? 1 : 0.7}
        style={[styles.actionRow, grayed && styles.actionRowGrayed]}
      >
        <Text style={styles.actionIcon}>{icon}</Text>
        <View style={styles.actionContent}>
          <Text style={[styles.actionLabel, grayed && styles.actionLabelGrayed]}>{label}</Text>
          {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={[styles.actionChevron, grayed && styles.actionChevronGrayed]}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function TripDashboardScreen() {
  const router = useRouter();
  const { trip } = useTrip();
  const [apiTrip, setApiTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tid = trip.tripId;
    if (!tid) { setLoading(false); return; }
    (async () => {
      try {
        const data = await tripsApi.get(tid);
        setApiTrip(data);
      } catch {
        /* use context data as fallback */
      }
      setLoading(false);
    })();
  }, [trip.tripId]);

  const daysUntil = useMemo(() => {
    const start = apiTrip?.dateStart || trip.dateStart;
    if (!start) return null;
    const now = new Date();
    const diff = new Date(start).getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [apiTrip, trip.dateStart]);

  const destination = apiTrip?.destination || trip.destination || 'Your Destination';
  const dateStart = apiTrip?.dateStart || trip.dateStart;
  const dateEnd = apiTrip?.dateEnd || trip.dateEnd;
  const vibeTags = apiTrip?.vibeTags || trip.vibeTags;
  const budget = apiTrip?.budget || trip.budget;
  const archetype = apiTrip?.archetype || trip.archetype;

  const formatDateRange = () => {
    if (!dateStart) return 'Select your travel dates';
    const start = new Date(dateStart);
    const end = dateEnd ? new Date(dateEnd) : null;
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    if (end) {
      return `${start.toLocaleDateString('en-US', opts)} — ${end.toLocaleDateString('en-US', opts)}`;
    }
    return start.toLocaleDateString('en-US', opts);
  };

  const tripDays = (() => {
    if (!dateStart || !dateEnd) return '—';
    const diff = new Date(dateEnd).getTime() - new Date(dateStart).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  })();

  const countdownScale = useSharedValue(1);

  useEffect(() => {
    countdownScale.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const countdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  const isFarAway = daysUntil !== null && daysUntil > 20;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} bounces={false}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).springify().damping(16)} style={styles.hero}>
          <Text style={styles.heroEmoji}>🗺️</Text>
          <Text style={styles.heroDestination}>{destination}</Text>
          <Text style={styles.heroDate}>{formatDateRange()}</Text>
          <View style={styles.horizonBadge}>
            <Text style={styles.horizonLabel}>HORIZON GLIMPSE</Text>
          </View>
          <View style={styles.tripBadges}>
            <View style={styles.transportBadge}>
              <Text style={styles.transportBadgeText}>{trip.transportMode.toUpperCase()}</Text>
            </View>
            {trip.diyBooking ? (
              <View style={styles.diyBadge}>
                <Text style={styles.diyBadgeText}>SELF-ARRANGED</Text>
              </View>
            ) : (
              <View style={styles.bookedBadge}>
                <Text style={styles.bookedBadgeText}>BOOKED</Text>
              </View>
            )}
          </View>
          {daysUntil !== null ? (
            <Animated.View style={[styles.countdownContainer, countdownStyle]}>
              <Text style={styles.countdownNumber}>{daysUntil}</Text>
              <Text style={styles.countdownText}>days until your adventure begins</Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View entering={sectionEntrance.delay(200)} style={styles.snapshotSection}>
          <Text style={styles.sectionTitle}>Trip Snapshot</Text>
          <View style={styles.snapshotGrid}>
            <GlassCard
              icon="🎭"
              label="Vibe"
              value={vibeTags.length > 0 ? vibeTags.join(' · ') : 'Not set yet'}
              delay={250}
            />
            <GlassCard
              icon="💰"
              label="Budget"
              value={budget ? `$${budget.toLocaleString()}` : 'Not set'}
              delay={350}
            />
            {archetype ? (
              <GlassCard
                icon="🧭"
                label="Archetype"
                value={archetype}
                delay={450}
              />
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={sectionEntrance.delay(400)} style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>What's Next</Text>
          <View style={styles.actionsList}>
            <ActionRow
              icon="📋"
              label="Start Prepping"
              subtitle="Prepare for your journey"
              onPress={() => router.push('/prep-hub' as any)}
              grayed={isFarAway}
              delay={450}
            />
            <ActionRow
              icon="💡"
              label="Get Inspired"
              subtitle="Discover experiences"
              onPress={() => {}}
              delay={550}
            />
            <ActionRow
              icon="📅"
              label="View Full Itinerary"
              subtitle="See your day-by-day plan"
              onPress={() => router.push('/itinerary')}
              delay={650}
            />
          </View>
        </Animated.View>

        <Animated.View entering={sectionEntrance.delay(600)} style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatItem label="Destinations" value={destination !== 'Your Destination' ? 1 : 0} />
            <View style={styles.statDivider} />
            <StatItem label="Days" value={tripDays} />
            <View style={styles.statDivider} />
            <StatItem label="Items Booked" value={trip.diyBooking ? 'DIY' : 0} />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4A2D',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  heroDestination: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroDate: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  horizonBadge: {
    backgroundColor: 'rgba(232, 168, 124, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232, 168, 124, 0.3)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.xl,
  },
  horizonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 2,
  },
  tripBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  transportBadge: {
    backgroundColor: 'rgba(124,255,107,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,255,107,0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  transportBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7CFF6B',
    letterSpacing: 1,
  },
  diyBadge: {
    backgroundColor: 'rgba(232,168,124,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,168,124,0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  diyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: 1,
  },
  bookedBadge: {
    backgroundColor: 'rgba(124,255,107,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(124,255,107,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  bookedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7CFF6B',
    letterSpacing: 1,
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.secondary,
    letterSpacing: -1.5,
  },
  countdownText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  snapshotSection: {
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: -0.2,
    marginBottom: spacing.lg,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '47%',
    flexGrow: 1,
  },
  glassIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  glassLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  glassValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 20,
  },
  actionsSection: {
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  actionsList: {
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  actionRowGrayed: {
    opacity: 0.5,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: spacing.lg,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  actionLabelGrayed: {
    color: colors.textTertiary,
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionChevron: {
    fontSize: 26,
    color: colors.textTertiary,
    fontWeight: '300',
    marginLeft: spacing.md,
  },
  actionChevronGrayed: {
    color: colors.border,
  },
  statsSection: {
    marginTop: spacing.xxxl,
    marginHorizontal: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.secondary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
