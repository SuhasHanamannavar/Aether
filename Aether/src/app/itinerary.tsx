import React, { useState, useCallback, useEffect } from 'react';
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
  StretchInY,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance, useSpringPress } from '../theme/animations';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import MapView from '../components/MapView';
import { useTrip } from '../context/TripContext';
import { tripsApi } from '../services/api';
import TransportBar from '../components/TransportBar';
import type { TransportMode } from '../components/TransportBar';

const defaultDays = [
  {
    day: 1,
    title: 'Arrival in Tokyo',
    date: 'Mon, Oct 14',
    items: [
      {
        id: 'flight-1',
        type: 'flight',
        title: 'JAL 42 • Narita Airport',
        time: '10:00 - 14:30',
        price: '$680',
        score: 92,
        emoji: '✈️',
      },
      {
        id: 'hotel-1',
        type: 'hotel',
        title: 'Shinjuku Granbell Hotel',
        time: 'Check-in: 15:00',
        price: '$210/night',
        score: 88,
        emoji: '🏨',
      },
      {
        id: 'activity-1',
        type: 'activity',
        title: 'Evening Ramen Tour',
        time: '19:00 - 21:00',
        price: '$45',
        score: 95,
        emoji: '🍜',
      },
    ],
  },
  {
    day: 2,
    title: 'Tokyo Exploration',
    date: 'Tue, Oct 15',
    items: [
      {
        id: 'activity-2',
        type: 'activity',
        title: 'Tsukiji Fish Market',
        time: '06:00 - 09:00',
        price: '$30',
        score: 90,
        emoji: '🐟',
      },
      {
        id: 'activity-3',
        type: 'activity',
        title: 'Shibuya & Harajuku Walk',
        time: '10:00 - 16:00',
        price: 'Free',
        score: 87,
        emoji: '🚶',
      },
      {
        id: 'dining-1',
        type: 'dining',
        title: 'Sushi Saito (Dinner)',
        time: '19:00',
        price: '$120',
        score: 96,
        emoji: '🍣',
      },
    ],
  },
  {
    day: 3,
    title: 'Kyoto Day Trip',
    date: 'Wed, Oct 16',
    items: [
      {
        id: 'activity-4',
        type: 'activity',
        title: 'Shinkansen to Kyoto',
        time: '07:00 - 09:00',
        price: '$110',
        score: 85,
        emoji: '🚄',
      },
      {
        id: 'activity-5',
        type: 'activity',
        title: 'Fushimi Inari Shrine',
        time: '09:30 - 12:00',
        price: 'Free',
        score: 93,
        emoji: '⛩️',
      },
      {
        id: 'activity-6',
        type: 'activity',
        title: 'Bamboo Grove & Tea Ceremony',
        time: '13:00 - 16:00',
        price: '$55',
        score: 91,
        emoji: '🍵',
      },
    ],
  },
];

const typeColors: Record<string, string> = {
  flight: '#41B3A3',
  hotel: '#E8A87C',
  activity: '#1A1A2E',
  dining: '#F59E0B',
};

type ItineraryItem = typeof defaultDays[0]['items'][0];

function TimelineItem({
  item,
  isExpanded,
  onPress,
  isLast,
  reorderMode,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onBookDirect,
  diyBooking,
}: {
  item: ItineraryItem;
  isExpanded: boolean;
  onPress: () => void;
  isLast: boolean;
  reorderMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onBookDirect?: () => void;
  diyBooking?: boolean;
}) {
  const { animatedStyle, pressIn, pressOut } = useSpringPress();

  return (
    <Animated.View entering={cardEntrance.delay(50)}>
      <AnimatedTouchable
        onPressIn={reorderMode ? undefined : pressIn}
        onPressOut={() => { if (!reorderMode) { pressOut(); onPress(); } }}
        activeOpacity={1}
        style={[styles.timelineItem, animatedStyle]}
      >
        <View style={[styles.timelineDot, isExpanded && { backgroundColor: typeColors[item.type] || colors.primary }]}>
          <Text style={styles.timelineEmoji}>{item.emoji}</Text>
        </View>
        <View style={[styles.timelineLine, isLast && { flex: 0, height: 0 }]} />
        <View style={[styles.timelineContent, isExpanded && { borderLeftWidth: 3, borderLeftColor: typeColors[item.type] || colors.primary }]}>
          <View style={styles.timelineTop}>
            {reorderMode && (
              <View style={styles.reorderArrows}>
                <TouchableOpacity onPress={onMoveUp} disabled={!canMoveUp} style={[styles.reorderBtn, !canMoveUp && styles.reorderBtnDisabled]}>
                  <Text style={[styles.reorderArrow, !canMoveUp && styles.reorderArrowDisabled]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onMoveDown} disabled={!canMoveDown} style={[styles.reorderBtn, !canMoveDown && styles.reorderBtnDisabled]}>
                  <Text style={[styles.reorderArrow, !canMoveDown && styles.reorderArrowDisabled]}>▼</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.timelineTitle, reorderMode && { marginLeft: spacing.sm }]}>{item.title}</Text>
            <View style={[styles.scorePill, { backgroundColor: (typeColors[item.type] || colors.primary) + '20' }]}>
              <Text style={[styles.scorePillText, { color: typeColors[item.type] || colors.primary }]}>{item.score}</Text>
            </View>
          </View>
          <Text style={styles.timelineTime}>{item.time}</Text>
          {isExpanded && !reorderMode && (
            <Animated.View entering={StretchInY.duration(250).springify().damping(16)} style={styles.expandedSection}>
              {diyBooking ? (
                <Text style={styles.selfBookNote}>Arrange on your own</Text>
              ) : (
                <>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Price</Text>
                    <Text style={styles.expandedValue}>{item.price}</Text>
                  </View>
                  <View style={styles.expandedRow}>
                    <Text style={styles.expandedLabel}>Quality/Price</Text>
                    <View style={styles.scoreBar}>
                      <View style={[styles.scoreFill, { width: `${item.score}%`, backgroundColor: typeColors[item.type] || colors.accent }]} />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.bookDirectBtn, { backgroundColor: typeColors[item.type] || colors.primary }]}
                    onPress={onBookDirect}
                  >
                    <Text style={styles.bookDirectText}>Book Direct</Text>
                    <Text style={styles.bookDirectArrow}>→</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          )}
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

function PillTab({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.pillTab, isActive && styles.pillTabActive]}
    >
      {isActive && (
        <Animated.View
          entering={ZoomIn.duration(200).springify().damping(12)}
          style={styles.pillDot}
        />
      )}
      <Text style={[styles.pillTabText, isActive && styles.pillTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ItineraryScreen() {
  const router = useRouter();
  const { trip, setDiyBooking } = useTrip();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map'>('timeline');
  const [showRestaurantSheet, setShowRestaurantSheet] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [days, setDays] = useState(() =>
    defaultDays.map((d) => ({ ...d, items: [...d.items] }))
  );
  const [loading, setLoading] = useState(true);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  useEffect(() => {
    const tid = trip.tripId;
    if (!tid) { setLoading(false); return; }
    (async () => {
      try {
        const data = await tripsApi.getItinerary(tid);
        if (data && data.length > 0) {
          const grouped: Record<number, any> = {};
          for (const item of data) {
            if (!grouped[item.day]) {
              grouped[item.day] = { day: item.day, title: item.dayTitle || `Day ${item.day}`, date: item.dayDate || '', items: [] };
            }
            grouped[item.day].items.push(item);
          }
          const apiDays = Object.values(grouped).sort((a: any, b: any) => a.day - b.day);
          if (apiDays.length > 0) setDays(apiDays as any);
        }
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, [trip.tripId]);

  const handleTimelinePress = useCallback((id: string) => {
    setExpandedItem((prev) => (prev === id ? null : id));
  }, []);

  const moveItem = useCallback((dayIndex: number, itemIndex: number, direction: 'up' | 'down') => {
    setDays((prev) => {
      const next = prev.map((d) => ({ ...d, items: [...d.items] }));
      const day = next[dayIndex];
      const swapIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (swapIndex < 0 || swapIndex >= day.items.length) return prev;
      [day.items[itemIndex], day.items[swapIndex]] = [day.items[swapIndex], day.items[itemIndex]];
      return next;
    });
  }, []);

  const handleSkipAll = async () => {
    setDiyBooking(true);
    if (trip.tripId) {
      try { await tripsApi.update(trip.tripId, { diyBooking: true }); } catch {}
    }
    setShowSkipConfirm(false);
    router.push('/prep-hub' as any);
  };

  const handleBookDirect = useCallback((item: ItineraryItem) => {
    router.push('/booking');
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Smart Itinerary</Text>
          <Text style={styles.headerSubtitle}>The Culinary Journey • Japan</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setReorderMode((p) => !p); setExpandedItem(null); }}
          style={[styles.reorderToggle, reorderMode && styles.reorderToggleActive]}
        >
          <Text style={[styles.reorderToggleText, reorderMode && styles.reorderToggleTextActive]}>
            {reorderMode ? 'Done' : 'Reorder'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {!reorderMode && (
        <TouchableOpacity
          onPress={() => setShowSkipConfirm(true)}
          style={styles.skipAllBtn}
        >
          <Text style={styles.skipAllText}>Skip all booking - I'll arrange my own</Text>
        </TouchableOpacity>
      )}

      {/* Pill Tabs */}
      {!reorderMode && (
        <Animated.View entering={sectionEntrance.delay(80)} style={styles.tabBar}>
          <PillTab
            label="Timeline"
            isActive={activeTab === 'timeline'}
            onPress={() => setActiveTab('timeline')}
          />
          <PillTab
            label="Map View"
            isActive={activeTab === 'map'}
            onPress={() => setActiveTab('map')}
          />
        </Animated.View>
      )}

      {activeTab === 'timeline' && !reorderMode ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {days.map((day, dayIndex) => (
            <Animated.View
              key={day.day}
              entering={cardEntrance.delay(dayIndex * 120)}
            >
              <View style={styles.dayHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {day.day}</Text>
                </View>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>
              </View>

              <View style={styles.transportHint}>
                <Text style={styles.transportHintText}>
                  Get around by {trip.transportMode === 'drive' ? 'car' : trip.transportMode === 'transit' ? 'transit' : trip.transportMode === 'walk' ? 'walking' : trip.transportMode === 'bike' ? 'bike' : 'flight'}
                </Text>
              </View>

              <View style={styles.timeline}>
                {day.items.map((item, itemIndex) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    isExpanded={expandedItem === item.id}
                    onPress={() => handleTimelinePress(item.id)}
                    isLast={itemIndex === day.items.length - 1}
                    onBookDirect={() => handleBookDirect(item)}
                    diyBooking={trip.diyBooking}
                  />
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Find Restaurant CTA */}
          <Animated.View entering={cardEntrance.delay(500)} style={styles.restaurantCta}>
            <Text style={styles.restaurantCtaEmoji}>🍽️</Text>
            <Text style={styles.restaurantCtaTitle}>Find a restaurant for tonight</Text>
            <Text style={styles.restaurantCtaDesc}>
              Local gems based on your location & Culinary Journey theme
            </Text>
            <Button
              title="Find Nearby"
              onPress={() => setShowRestaurantSheet(true)}
              variant="secondary"
              size="md"
              style={styles.restaurantBtn}
            />
          </Animated.View>
        </ScrollView>
      ) : activeTab === 'map' && !reorderMode ? (
        <View style={styles.mapView}>
          <MapView
            center={[137.6836, 36.1000]}
            zoom={5.5}
            interactive={true}
            markers={[
              { coordinates: [139.6917, 35.6895], title: 'Tokyo', emoji: '🗼', color: '#41B3A3' },
              { coordinates: [135.7681, 35.0116], title: 'Kyoto', emoji: '⛩️', color: '#E8A87C' },
            ]}
            colorScheme="Light"
          />
          <View style={styles.mapLegend}>
            <View style={styles.mapLegendInner}>
              {['Tokyo', 'Kyoto'].map((city) => (
                <View key={city} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: city === 'Tokyo' ? '#41B3A3' : '#E8A87C' }]} />
                  <Text style={styles.legendText}>{city}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : reorderMode && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeInUp.duration(250)} style={styles.reorderHint}>
            <Text style={styles.reorderHintText}>Tap ▲ ▼ to reorder your itinerary</Text>
          </Animated.View>
          {days.map((day, dayIndex) => (
            <View key={day.day}>
              <View style={styles.dayHeader}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayBadgeText}>Day {day.day}</Text>
                </View>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>
              </View>

              <View style={styles.timeline}>
                {day.items.map((item, itemIndex) => (
                  <TimelineItem
                    key={item.id}
                    item={item}
                    isExpanded={false}
                    onPress={() => {}}
                    isLast={itemIndex === day.items.length - 1}
                    reorderMode
                    onMoveUp={() => moveItem(dayIndex, itemIndex, 'up')}
                    onMoveDown={() => moveItem(dayIndex, itemIndex, 'down')}
                    canMoveUp={itemIndex > 0}
                    canMoveDown={itemIndex < day.items.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Bottom Bar (hidden during reorder) */}
      {!reorderMode && (
        <Animated.View
          entering={FadeInUp.duration(300).springify()}
          style={styles.bottomBar}
        >
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total estimated</Text>
            <Text style={styles.totalPrice}>$1,250</Text>
          </View>
          <Button title="Book All" onPress={() => router.push('/booking')} size="md" style={styles.bookAllBtn} />
        </Animated.View>
      )}

      {/* Skip Confirmation Sheet */}
      <BottomSheet
        visible={showSkipConfirm}
        title="Skip Booking?"
        onClose={() => setShowSkipConfirm(false)}
      >
        <Text style={styles.skipConfirmText}>
          Your itinerary will be saved without any bookings.{'\n'}
          You can book individual items later whenever you're ready.
        </Text>
        <Button
          title="Yes, Skip All Booking"
          onPress={handleSkipAll}
          variant="secondary"
          size="lg"
          style={styles.skipConfirmBtn}
        />
        <Button
          title="Go Back to Booking"
          onPress={() => setShowSkipConfirm(false)}
          variant="ghost"
          size="md"
          style={styles.skipCancelBtn}
        />
      </BottomSheet>

      {/* Restaurant Suggestions Sheet */}
      <BottomSheet
        visible={showRestaurantSheet}
        title="Tonight's Picks"
        onClose={() => setShowRestaurantSheet(false)}
      >
        <View style={styles.restaurantList}>
          <View style={styles.restaurantItem}>
            <Text style={styles.restaurantEmoji}>🍜</Text>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>Ichiran Ramen</Text>
              <Text style={styles.restaurantDetail}>Shinjuku • 5 min walk • $$</Text>
            </View>
            <View style={[styles.restaurantScore, { backgroundColor: '#41B3A3' }]}>
              <Text style={styles.restaurantScoreText}>94</Text>
            </View>
          </View>
          <View style={styles.restaurantItem}>
            <Text style={styles.restaurantEmoji}>🍣</Text>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>Uobei</Text>
              <Text style={styles.restaurantDetail}>Shibuya • 12 min walk • $</Text>
            </View>
            <View style={[styles.restaurantScore, { backgroundColor: '#E8A87C' }]}>
              <Text style={styles.restaurantScoreText}>91</Text>
            </View>
          </View>
          <View style={styles.restaurantItem}>
            <Text style={styles.restaurantEmoji}>🥟</Text>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>Gyoza King</Text>
              <Text style={styles.restaurantDetail}>Harajuku • 8 min walk • $$</Text>
            </View>
            <View style={[styles.restaurantScore, { backgroundColor: '#1A1A2E' }]}>
              <Text style={styles.restaurantScoreText}>88</Text>
            </View>
          </View>
        </View>
        <Button title="Close" onPress={() => setShowRestaurantSheet(false)} variant="ghost" size="md" style={styles.closeBtn} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
    marginRight: spacing.lg,
    fontWeight: '600',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  pillTabActive: {
    backgroundColor: colors.primary,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  pillTabText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  pillTabTextActive: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  dayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  dayBadgeText: {
    ...typography.captionBold,
    color: '#FFFFFF',
  },
  dayInfo: {
    marginLeft: spacing.md,
  },
  dayTitle: {
    ...typography.h3,
    color: colors.text,
  },
  dayDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeline: {
    marginLeft: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineEmoji: {
    fontSize: 18,
  },
  timelineLine: {
    position: 'absolute',
    left: 19.5,
    top: 40,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
    flex: 1,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
  },
  scorePill: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  scorePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineTime: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  expandedValue: {
    ...typography.captionBold,
    color: colors.text,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginLeft: spacing.md,
    maxWidth: 120,
  },
  scoreFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  bookDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  bookDirectText: {
    ...typography.captionBold,
    color: '#FFFFFF',
  },
  bookDirectArrow: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  restaurantCta: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  restaurantCtaEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  restaurantCtaTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  restaurantCtaDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  restaurantBtn: {
    marginTop: spacing.lg,
  },
  mapView: {
    flex: 1,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  mapLegend: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.xl,
  },
  mapLegendInner: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
    ...shadows.md,
  },
  totalRow: {
    flex: 1,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalPrice: {
    ...typography.h2,
    color: colors.text,
  },
  bookAllBtn: {
    flex: 1,
  },
  reorderToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reorderToggleActive: {
    backgroundColor: colors.primary,
  },
  reorderToggleText: {
    ...typography.captionBold,
    color: colors.primary,
  },
  reorderToggleTextActive: {
    color: '#FFFFFF',
  },
  reorderHint: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  reorderHintText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reorderArrows: {
    flexDirection: 'column',
    gap: 2,
    marginRight: spacing.xs,
  },
  reorderBtn: {
    width: 28,
    height: 22,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  reorderArrow: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  reorderArrowDisabled: {
    color: colors.border,
  },
  restaurantList: {
    gap: spacing.md,
  },
  restaurantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
  },
  restaurantEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  restaurantDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  restaurantScore: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  restaurantScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    marginTop: spacing.md,
  },
  skipAllBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginVertical: spacing.sm,
  },
  skipAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  skipConfirmText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  skipConfirmBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  skipCancelBtn: {
    width: '100%',
  },
  transportHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.sm,
  },
  transportHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  selfBookNote: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
});
