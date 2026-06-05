import React, { useMemo, useEffect, useState } from 'react';
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
import Animated, { ZoomInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '../theme/tokens';
import { cardEntrance, sectionEntrance, mapEntrance } from '../theme/animations';
import HeroCtaCard from '../components/HeroCtaCard';
import SuggestionCard from '../components/SuggestionCard';
import ActiveTripBanner from '../components/ActiveTripBanner';
import QuickActionGrid from '../components/QuickActionGrid';
import { useTrip } from '../context/TripContext';
import { tripsApi } from '../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.6;



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
  const { trip } = useTrip();
  const greeting = useMemo(() => getGreeting(), []);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [suggestedTrips, setSuggestedTrips] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [quickActions] = useState([
    { id: 'past-trips', emoji: '📋', label: 'Past Trips', color: colors.primaryLight },
    { id: 'new-trip', emoji: '✨', label: 'New Trip', color: colors.secondary },
  ]);

  useEffect(() => {
    if (trip.tripId) {
      setActiveTrip(trip);
      return;
    }
    (async () => {
      try {
        const trips = await tripsApi.list('active');
        if (trips && trips.length > 0) setActiveTrip(trips[0]);
      } catch { /* silent */ }
    })();
  }, [trip.tripId]);

  const handleQuickAction = (id: string) => {
    router.push('/' + id as any);
  };

  const handleTripPress = () => {
    if (!activeTrip?.dateStart) { router.push('/new-trip'); return; }
    const daysUntil = Math.ceil((new Date(activeTrip.dateStart).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 2) { router.push('/prep-hub' as any); return; }
    if (daysUntil > 20) { router.push('/trip-dashboard' as any); return; }
    router.push('/prep-hub' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <Animated.View
          entering={ZoomInUp.duration(500).springify().damping(16)}
          style={styles.topSection}
        >
          <View style={styles.greetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{getGreetingEmoji()}</Text>
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.greetingLabel}>{greeting}</Text>
              <Text style={styles.greetingName}>{activeTrip?.destination || 'Traveler'}</Text>
            </View>
          </View>
          <Text style={styles.title}>Where will the wind take you?</Text>
        </Animated.View>

        {activeTrip ? (
          <Animated.View
            entering={cardEntrance.delay(100)}
            style={styles.bannerSection}
          >
            <ActiveTripBanner
              destination={activeTrip.destination || 'Your Trip'}
              daysUntil={activeTrip.dateStart ? Math.ceil((new Date(activeTrip.dateStart).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0}
              onPress={handleTripPress}
            />
          </Animated.View>
        ) : null}

        {/* Hero CTA */}
        <Animated.View
          entering={cardEntrance.delay(200)}
          style={styles.heroSection}
        >
          <HeroCtaCard
            title="Ready for your next adventure?"
            subtitle="Tell us where you want to go, and we'll build the perfect trip"
            onPress={() => router.push('/new-trip')}
          />
        </Animated.View>

        {/* Suggested Trips */}
        <Animated.View
          entering={sectionEntrance.delay(280)}
          style={styles.suggestedSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested for you</Text>
            <TouchableOpacity onPress={() => router.push('/past-trips' as any)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          {suggestionsLoading ? (
            <View style={styles.emptySuggestions}>
              <Text style={styles.loadingText}>Finding destinations for you...</Text>
            </View>
          ) : suggestedTrips.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestedScroll}
              snapToInterval={CARD_WIDTH + spacing.lg}
              decelerationRate="fast"
            >
              {suggestedTrips.map((trip, index) => (
                <Animated.View
                  key={trip.id}
                  entering={cardEntrance.delay(350 + index * 80)}
                >
                  <SuggestionCard
                    destination={trip.destination}
                    emoji={trip.emoji}
                    subtitle={trip.subtitle}
                    score={trip.score}
                    color={trip.color}
                    width={CARD_WIDTH}
                    onPress={() => router.push('/new-trip')}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySuggestions}>
              <Text style={styles.emptyText}>No suggestions yet</Text>
            </View>
          )}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={cardEntrance.delay(450)}
          style={styles.actionsSection}
        >
          <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.xl }]}>
            Quick Actions
          </Text>
          <QuickActionGrid
            actions={quickActions}
            onAction={handleQuickAction}
            style={styles.actionsGrid}
          />
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
    paddingBottom: spacing.xxxl,
  },
  topSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: -2,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  bannerSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  heroSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  suggestedScroll: {
    paddingLeft: spacing.xl,
    gap: spacing.lg,
  },
  actionsSection: {
    marginTop: spacing.xxl,
  },
  actionsGrid: {
    marginTop: spacing.lg,
  },
  emptySuggestions: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
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
