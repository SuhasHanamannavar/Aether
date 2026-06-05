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

function getScoreColor(score: number): string {
  if (score >= 90) return colors.success;
  if (score >= 80) return colors.warning;
  return colors.textTertiary;
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
                { width: `${item.qualityPrice}%`, backgroundColor: colors.accent },
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
  const [restaurants, setRestaurants] = useState<any[]>([]);
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
        color: colors.accent,
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
            <Text style={styles.emptyText}>Try a different filter or check back later</Text>
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
    backgroundColor: colors.background,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backArrow: {
    fontSize: 20,
    color: colors.textInverse,
    fontWeight: '600',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textInverse,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  mapToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapToggleIcon: {
    fontSize: 20,
  },
  glassFilter: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
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
    backgroundColor: colors.accent,
  },
  filterChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  filterChipText: {
    ...typography.captionBold,
    color: 'rgba(255,255,255,0.7)',
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
    color: 'rgba(255,255,255,0.7)',
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
    color: colors.textInverse,
  },
  emptyText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
  },
  listHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  listHeaderCount: {
    ...typography.captionBold,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restaurantCard: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.accentLight + '30',
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
    color: colors.text,
  },
  cardDetail: {
    ...typography.caption,
    color: colors.text + '99',
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
    color: colors.text + '80',
    fontWeight: '600',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  qualityLabel: {
    ...typography.small,
    color: 'rgba(255,255,255,0.4)',
    marginRight: spacing.md,
    width: 80,
  },
  qualityBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    borderTopColor: 'rgba(255,255,255,0.08)',
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
    color: colors.text + 'CC',
  },
  expandedDesc: {
    ...typography.caption,
    color: colors.text + '99',
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
    backgroundColor: colors.accent,
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
