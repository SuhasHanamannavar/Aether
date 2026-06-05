import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import Animated, {
  FadeInUp,
  FadeInDown,
  ZoomIn,
  StretchInY,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, useSpringPress } from '../theme/animations';
import MapView, { MapMarker } from '../components/MapView';
import { useTrip } from '../context/TripContext';
import { tripsApi } from '../services/api';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_HEIGHT = 180;

const FOOD_THEME = {
  bg: '#2D4A2D',
  surface: '#1E3A1E',
  card: '#FFFFFF',
  accent: '#E8A87C',
  accentLight: '#F0C4A8',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.4)',
  borderLight: 'rgba(255,255,255,0.08)',
  borderMedium: 'rgba(255,255,255,0.15)',
  glassBg: 'rgba(255,255,255,0.1)',
  glassBorder: 'rgba(255,255,255,0.18)',
  scoreHigh: '#10B981',
  scoreMid: '#F59E0B',
  scoreLow: '#9CA3AF',
};

const FILTERS = ['All', '$$', '$$$', '$$$$', 'Near Me', 'Top Rated'];

const PRICE_MAP: Record<string, string[]> = {
  '$$': ['$', '$$'],
  '$$$': ['$$$'],
  '$$$$': ['$$$$'],
};

interface Restaurant {
  id: string;
  name: string;
  emoji: string;
  cuisine: string;
  distance: string;
  price: string;
  score: number;
  qualityPrice: number;
  lat: number;
  lng: number;
  address: string;
  hours: string;
  description: string;
}

const DEFAULT_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Ichiran Ramen', emoji: '🍜', cuisine: 'Ramen', distance: '5 min', price: '$$', score: 94, qualityPrice: 92, lat: 35.6895, lng: 139.6917, address: 'Shinjuku, Tokyo', hours: '10:00 - 23:00', description: 'Renowned solo-booth ramen experience with rich tonkotsu broth.' },
  { id: 'r2', name: 'Uobei', emoji: '🍣', cuisine: 'Sushi', distance: '12 min', price: '$', score: 91, qualityPrice: 95, lat: 35.6615, lng: 139.6982, address: 'Shibuya, Tokyo', hours: '11:00 - 22:00', description: 'Fast-paced conveyor belt sushi at unbeatable prices.' },
  { id: 'r3', name: 'Gyoza King', emoji: '🥟', cuisine: 'Gyoza', distance: '8 min', price: '$$', score: 88, qualityPrice: 85, lat: 35.6702, lng: 139.7023, address: 'Harajuku, Tokyo', hours: '12:00 - 21:30', description: 'Crispy hand-made gyoza with creative fillings.' },
  { id: 'r4', name: 'Kikunoi', emoji: '🍱', cuisine: 'Kaiseki', distance: '20 min', price: '$$$$', score: 97, qualityPrice: 78, lat: 35.6648, lng: 139.7294, address: 'Akasaka, Tokyo', hours: '12:00 - 20:00', description: 'Michelin-starred traditional kaiseki dining experience.' },
  { id: 'r5', name: 'Tsukiji Outer Grill', emoji: '🐟', cuisine: 'Seafood', distance: '15 min', price: '$$$', score: 89, qualityPrice: 82, lat: 35.6654, lng: 139.7707, address: 'Tsukiji, Tokyo', hours: '06:00 - 14:00', description: 'Fresh-off-the-boat seafood grilled to perfection.' },
  { id: 'r6', name: 'Nakiryu', emoji: '🍜', cuisine: 'Ramen', distance: '10 min', price: '$', score: 93, qualityPrice: 96, lat: 35.6762, lng: 139.7153, address: 'Minami-Aoyama, Tokyo', hours: '11:00 - 15:00', description: 'Michelin Bib Gourmand tantanmen ramen.' },
  { id: 'r7', name: 'Tapas Molecular Bar', emoji: '🍸', cuisine: 'Fusion', distance: '25 min', price: '$$$$', score: 95, qualityPrice: 72, lat: 35.6652, lng: 139.7301, address: 'Nihonbashi, Tokyo', hours: '18:00 - 23:00', description: 'Avant-garde molecular gastronomy in an intimate setting.' },
  { id: 'r8', name: 'Katsu Midori', emoji: '🍛', cuisine: 'Katsu', distance: '7 min', price: '$$', score: 87, qualityPrice: 90, lat: 35.6605, lng: 139.7002, address: 'Shibuya, Tokyo', hours: '11:30 - 21:00', description: 'Legendary katsu curry with perfectly panko-crusted cutlets.' },
];

function getScoreColor(score: number): string {
  if (score >= 90) return FOOD_THEME.scoreHigh;
  if (score >= 80) return FOOD_THEME.scoreMid;
  return FOOD_THEME.scoreLow;
}

function RestaurantCard({
  item,
  isExpanded,
  onPress,
  index,
}: {
  item: Restaurant;
  isExpanded: boolean;
  onPress: () => void;
  index: number;
}) {
  const { animatedStyle, pressIn, pressOut } = useSpringPress();
  const scoreColor = getScoreColor(item.score);

  return (
    <Animated.View entering={cardEntrance.delay(index * 80)}>
      <AnimatedTouchable
        onPressIn={pressIn}
        onPressOut={() => { pressOut(); onPress(); }}
        activeOpacity={1}
        style={[styles.restaurantCard, animatedStyle]}
      >
        <View style={styles.cardMain}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
          </View>
          <View style={styles.cardCenter}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardDetail}>
              {item.cuisine} • {item.distance}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.scoreBadge, { backgroundColor: scoreColor + '20' }]}>
              <Text style={[styles.scoreText, { color: scoreColor }]}>{item.score}</Text>
            </View>
            <Text style={styles.priceLabel}>{item.price}</Text>
          </View>
        </View>
        <View style={styles.qualityRow}>
          <Text style={styles.qualityLabel}>Quality/Price</Text>
          <View style={styles.qualityBarBg}>
            <View
              style={[
                styles.qualityBarFill,
                { width: `${item.qualityPrice}%`, backgroundColor: FOOD_THEME.accent },
              ]}
            />
          </View>
        </View>
        {isExpanded && (
          <Animated.View entering={StretchInY.duration(250).springify().damping(16)} style={styles.expandedSection}>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedIcon}>📍</Text>
              <Text style={styles.expandedText}>{item.address}</Text>
            </View>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedIcon}>🕐</Text>
              <Text style={styles.expandedText}>{item.hours}</Text>
            </View>
            <Text style={styles.expandedDesc}>{item.description}</Text>
            <TouchableOpacity style={styles.detailBtn} activeOpacity={0.8}>
              <Text style={styles.detailBtnText}>View Details</Text>
              <Text style={styles.detailBtnArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </AnimatedTouchable>
    </Animated.View>
  );
}

function FilterChip({
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
      activeOpacity={0.7}
      style={[styles.filterChip, isActive && styles.filterChipActive]}
    >
      {isActive && (
        <Animated.View
          entering={ZoomIn.duration(200).springify().damping(12)}
          style={styles.filterChipDot}
        />
      )}
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function FoodFinderScreen() {
  const router = useRouter();
  const { trip } = useTrip();
  const [restaurants, setRestaurants] = useState<Restaurant[]>(DEFAULT_RESTAURANTS);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const mapHeight = useSharedValue(0);

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    height: mapHeight.value,
    opacity: mapHeight.value > 0 ? 1 : 0,
  }));

  const toggleMap = useCallback(() => {
    mapHeight.value = withSpring(mapVisible ? 0 : MAP_HEIGHT, {
      damping: 18,
      stiffness: 150,
    });
    setMapVisible((p) => !p);
  }, [mapVisible, mapHeight]);

  useEffect(() => {
    const tid = trip.tripId;
    if (!tid) { setLoading(false); return; }
    (async () => {
      try {
        const data = await tripsApi.getRestaurants(tid, 35.6762, 139.6503);
        if (data && Array.isArray(data) && data.length > 0) {
          setRestaurants(data);
        }
      } catch {}
      setLoading(false);
    })();
  }, [trip.tripId]);

  const filtered = useMemo(() => {
    let result = [...restaurants];
    if (activeFilter === 'Top Rated') {
      result.sort((a, b) => b.score - a.score);
    } else if (activeFilter === 'Near Me') {
      result = result;
    } else if (activeFilter !== 'All') {
      const acceptable = PRICE_MAP[activeFilter] || [];
      result = result.filter((r) => acceptable.includes(r.price));
    }
    if (activeFilter !== 'Top Rated') {
      result.sort((a, b) => b.score - a.score);
    }
    return result;
  }, [restaurants, activeFilter]);

  const markers: MapMarker[] = useMemo(
    () =>
      filtered.map((r) => ({
        coordinates: [r.lng, r.lat] as [number, number],
        title: r.name,
        emoji: r.emoji,
        color: FOOD_THEME.accent,
      })),
    [filtered]
  );

  const handleFilterPress = useCallback((f: string) => {
    setActiveFilter(f);
    setExpandedId(null);
  }, []);

  const handleCardPress = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Food Finder</Text>
          <Text style={styles.headerSubtitle}>Based on your Culinary Journey theme</Text>
        </View>
        <TouchableOpacity onPress={toggleMap} style={styles.mapToggleBtn} activeOpacity={0.7}>
          <Text style={styles.mapToggleIcon}>{mapVisible ? '🗺️' : '📍'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(350).springify().damping(18)} style={styles.glassFilter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={f}
              isActive={activeFilter === f}
              onPress={() => handleFilterPress(f)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.mapContainer, mapAnimatedStyle]}>
        <View style={styles.mapInner}>
          <MapView
            center={[139.6503, 35.6762]}
            zoom={13}
            markers={markers}
            colorScheme="Light"
            interactive={false}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.loadingBox}>
            <Text style={styles.loadingEmoji}>🔍</Text>
            <Text style={styles.loadingText}>Finding the best spots...</Text>
          </Animated.View>
        ) : filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No restaurants found</Text>
            <Text style={styles.emptyDesc}>Try a different filter</Text>
          </Animated.View>
        ) : (
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderCount}>{filtered.length} spots near you</Text>
          </View>
        )}
        {filtered.map((item, idx) => (
          <RestaurantCard
            key={item.id}
            item={item}
            index={idx}
            isExpanded={expandedId === item.id}
            onPress={() => handleCardPress(item.id)}
          />
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FOOD_THEME.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FOOD_THEME.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backArrow: {
    fontSize: 20,
    color: FOOD_THEME.textPrimary,
    fontWeight: '600',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: FOOD_THEME.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: FOOD_THEME.textSecondary,
    marginTop: 2,
  },
  mapToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: FOOD_THEME.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapToggleIcon: {
    fontSize: 20,
  },
  glassFilter: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: FOOD_THEME.glassBg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: FOOD_THEME.glassBorder,
    overflow: 'hidden',
  },
  filterContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: FOOD_THEME.accent,
  },
  filterChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  filterChipText: {
    ...typography.captionBold,
    color: FOOD_THEME.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  mapInner: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  loadingEmoji: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: FOOD_THEME.textSecondary,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: FOOD_THEME.textPrimary,
  },
  emptyDesc: {
    ...typography.caption,
    color: FOOD_THEME.textSecondary,
    marginTop: spacing.sm,
  },
  listHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  listHeaderCount: {
    ...typography.captionBold,
    color: FOOD_THEME.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restaurantCard: {
    backgroundColor: FOOD_THEME.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLeft: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: FOOD_THEME.accentLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardCenter: {
    flex: 1,
  },
  cardName: {
    ...typography.bodyBold,
    color: FOOD_THEME.bg,
  },
  cardDetail: {
    ...typography.caption,
    color: FOOD_THEME.bg + '99',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  scoreBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceLabel: {
    ...typography.small,
    color: FOOD_THEME.bg + '80',
    fontWeight: '600',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: FOOD_THEME.borderLight,
  },
  qualityLabel: {
    ...typography.small,
    color: FOOD_THEME.textTertiary,
    marginRight: spacing.md,
    width: 80,
  },
  qualityBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: FOOD_THEME.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: FOOD_THEME.borderLight,
    gap: spacing.sm,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expandedIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  expandedText: {
    ...typography.caption,
    color: FOOD_THEME.bg + 'CC',
  },
  expandedDesc: {
    ...typography.caption,
    color: FOOD_THEME.bg + '99',
    lineHeight: 20,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: FOOD_THEME.accent,
    borderRadius: borderRadius.sm,
  },
  detailBtnText: {
    ...typography.captionBold,
    color: '#FFFFFF',
  },
  detailBtnArrow: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
