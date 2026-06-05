import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, StretchInY } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance } from '../theme/animations';
import Button from '../components/Button';
import { useUser } from '../context/UserContext';
import { tripsApi } from '../services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}



type PastTrip = {
  tripId: string;
  destination: string;
  emoji: string;
  dateStart: string;
  dateEnd: string;
  cities: number;
  totalSpent: number;
  archetype: string;
  archetypeColor: string;
  memories: number;
};

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${s.toLocaleDateString('en-US', opts)} — ${e.toLocaleDateString('en-US', opts)}`;
}

function tripDays(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

function matchesFilter(trip: PastTrip, filter: string) {
  if (filter === 'All') return true;
  if (filter === 'Recent') {
    const year = new Date(trip.dateStart).getFullYear();
    return year === new Date().getFullYear();
  }
  return true;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function TripCard({
  trip,
  index,
  expandedId,
  onToggle,
  onViewMemories,
  onLeaveFeedback,
}: {
  trip: PastTrip;
  index: number;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onViewMemories: (id: string) => void;
  onLeaveFeedback: (id: string) => void;
}) {
  const isExpanded = expandedId === trip.tripId;
  const days = tripDays(trip.dateStart, trip.dateEnd);

  return (
    <Animated.View entering={cardEntrance.delay(100 + index * 80)}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle(trip.tripId);
        }}
        style={styles.card}
      >
        <View style={styles.cardMain}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardEmoji}>{trip.emoji}</Text>
          </View>
          <View style={styles.cardCenter}>
            <Text style={styles.cardDestination}>{trip.destination}</Text>
            <Text style={styles.cardDate}>{formatDateRange(trip.dateStart, trip.dateEnd)}</Text>
            <View style={styles.cardStats}>
              <Text style={styles.cardStatsText}>
                🗓️ {days} days {'•'} 📍 {trip.cities} cities {'•'} 💰 ${trip.totalSpent.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.archetypePill, { backgroundColor: trip.archetypeColor + '20', borderColor: trip.archetypeColor + '40' }]}>
              <Text style={[styles.archetypeText, { color: trip.archetypeColor }]}>{trip.archetype}</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.chevron}>{isExpanded ? '⌃' : '›'}</Text>
          </View>
        </View>
        {isExpanded ? (
          <Animated.View entering={StretchInY.duration(250).springify()} style={styles.cardExpanded}>
            <View style={styles.expandedDivider} />
            <View style={styles.expandedRow}>
              <View style={styles.expandedStat}>
                <Text style={styles.expandedStatValue}>{trip.memories}</Text>
                <Text style={styles.expandedStatLabel}>Memories</Text>
              </View>
              <View style={styles.expandedStat}>
                <Text style={styles.expandedStatValue}>{days}</Text>
                <Text style={styles.expandedStatLabel}>Days</Text>
              </View>
              <View style={styles.expandedStat}>
                <Text style={styles.expandedStatValue}>{trip.cities}</Text>
                <Text style={styles.expandedStatLabel}>Cities</Text>
              </View>
            </View>
            <View style={styles.expandedActions}>
              <Button
                title="View Memories"
                onPress={() => onViewMemories(trip.tripId)}
                size="md"
                variant="primary"
                style={styles.expandedBtn}
              />
              <Button
                title="Leave Feedback"
                onPress={() => onLeaveFeedback(trip.tripId)}
                size="md"
                variant="secondary"
                style={styles.expandedBtn}
              />
            </View>
          </Animated.View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PastTripsScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const [trips, setTrips] = useState<PastTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const data = await tripsApi.list('completed');
        if (data && Array.isArray(data) && data.length > 0) {
          setTrips(data);
        }
      } catch {
        /* silent */
      }
      setLoading(false);
    })();
  }, []);

  const filteredTrips = useMemo(
    () => trips.filter((t) => matchesFilter(t, activeFilter)),
    [trips, activeFilter]
  );

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleViewMemories = (tripId: string) => {
    router.push(`/memory-reel?tripId=${tripId}` as any);
  };

  const handleFeedback = (tripId: string) => {
    router.push(`/feedback?tripId=${tripId}` as any);
  };

  const hasTrips = filteredTrips.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Past Trips</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{trips.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {['All', 'Recent'].map((f) => (
            <TouchableOpacity
              key={f}
              activeOpacity={0.7}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setActiveFilter(f);
                setExpandedId(null);
              }}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, !hasTrips && styles.scrollContentEmpty]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>⏳</Text>
            <Text style={styles.emptyTitle}>Loading your adventures...</Text>
          </View>
        ) : hasTrips ? (
          filteredTrips.map((trip, i) => (
            <TripCard
              key={trip.tripId}
              trip={trip}
              index={i}
              expandedId={expandedId}
              onToggle={handleToggle}
              onViewMemories={handleViewMemories}
              onLeaveFeedback={handleFeedback}
            />
          ))
        ) : (
          <Animated.View entering={sectionEntrance} style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✈️</Text>
            <Text style={styles.emptyTitle}>No past trips yet</Text>
            <Text style={styles.emptySubtitle}>
              Your completed adventures will appear here. Ready for a new one?
            </Text>
            <Button
              title="Plan your first adventure"
              onPress={() => router.push('/new-trip')}
              size="lg"
              variant="primary"
              style={styles.emptyBtn}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4A2D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  countBadge: {
    backgroundColor: 'rgba(232,168,124,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(232,168,124,0.35)',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  filterBar: {
    paddingBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.md,
  },
  scrollContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardLeft: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardCenter: {
    flex: 1,
  },
  cardDestination: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  cardDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardStats: {
    marginTop: spacing.sm,
  },
  cardStatsText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  cardRight: {
    marginLeft: spacing.md,
    width: 24,
    alignItems: 'flex-end',
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
    fontWeight: '300',
  },
  archetypePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs - 1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  archetypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardExpanded: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  expandedRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  expandedStat: {
    flex: 1,
    alignItems: 'center',
  },
  expandedStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  expandedStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  expandedBtn: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
  },
  emptyBtn: {
    marginTop: spacing.xxl,
    width: '100%',
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
