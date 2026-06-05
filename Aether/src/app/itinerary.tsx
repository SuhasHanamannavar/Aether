import React, { useState } from 'react';
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
import Card from '../components/Card';
import BottomSheet from '../components/BottomSheet';
import StaggerContainer from '../components/StaggerContainer';

const { width } = Dimensions.get('window');

const itineraryDays = [
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

export default function ItineraryScreen() {
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'map'>('timeline');
  const [showRestaurantSheet, setShowRestaurantSheet] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Smart Itinerary</Text>
          <Text style={styles.headerSubtitle}>The Culinary Journey • Japan</Text>
        </View>
      </View>

      {/* Tab Toggle */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>
            Timeline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'map' && styles.tabActive]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>
            Map View
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'timeline' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {itineraryDays.map((day, dayIndex) => (
            <Animated.View
              key={day.day}
              entering={FadeInUp.duration(400).delay(dayIndex * 150).springify()}
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

              <View style={styles.timeline}>
                {day.items.map((item, itemIndex) => {
                  const isExpanded = expandedItem === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.timelineItem}
                      onPress={() => setExpandedItem(isExpanded ? null : item.id)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.timelineDot}>
                        <Text style={styles.timelineEmoji}>{item.emoji}</Text>
                      </View>
                      <View style={[styles.timelineLine, itemIndex === day.items.length - 1 && { flex: 0, height: 0 }]} />
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineTop}>
                          <Text style={styles.timelineTitle}>{item.title}</Text>
                          <View style={styles.scorePill}>
                            <Text style={styles.scorePillText}>{item.score}</Text>
                          </View>
                        </View>
                        <Text style={styles.timelineTime}>{item.time}</Text>
                        {isExpanded && (
                          <Animated.View entering={FadeInUp.duration(200)} style={styles.expandedSection}>
                            <View style={styles.expandedRow}>
                              <Text style={styles.expandedLabel}>Price</Text>
                              <Text style={styles.expandedValue}>{item.price}</Text>
                            </View>
                            <View style={styles.expandedRow}>
                              <Text style={styles.expandedLabel}>Quality/Price</Text>
                              <View style={styles.scoreBar}>
                                <View style={[styles.scoreFill, { width: `${item.score}%` }]} />
                              </View>
                            </View>
                            <TouchableOpacity style={styles.bookDirectBtn}>
                              <Text style={styles.bookDirectText}>Book Direct</Text>
                              <Text style={styles.bookDirectArrow}>→</Text>
                            </TouchableOpacity>
                          </Animated.View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          ))}

          {/* Find Restaurant CTA */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.restaurantCta}>
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
      ) : (
        <View style={styles.mapView}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapBigEmoji}>🗺️</Text>
            <Text style={styles.mapPlaceholderTitle}>Interactive Route Map</Text>
            <Text style={styles.mapPlaceholderDesc}>
              Your 3-day itinerary mapped with{'\n'}route lines and points of interest
            </Text>
            <View style={styles.mapLegend}>
              {['Tokyo', 'Kyoto', 'Osaka'].map((city) => (
                <View key={city} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: city === 'Tokyo' ? '#41B3A3' : city === 'Kyoto' ? '#E8A87C' : '#1A1A2E' }]} />
                  <Text style={styles.legendText}>{city}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total estimated</Text>
          <Text style={styles.totalPrice}>$1,250</Text>
        </View>
        <Button title="Book All" onPress={() => router.push('/booking')} size="md" style={styles.bookAllBtn} />
      </View>

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
            <View style={styles.restaurantScore}>
              <Text style={styles.restaurantScoreText}>94</Text>
            </View>
          </View>
          <View style={styles.restaurantItem}>
            <Text style={styles.restaurantEmoji}>🍣</Text>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>Uobei</Text>
              <Text style={styles.restaurantDetail}>Shibuya • 12 min walk • $</Text>
            </View>
            <View style={styles.restaurantScore}>
              <Text style={styles.restaurantScoreText}>91</Text>
            </View>
          </View>
          <View style={styles.restaurantItem}>
            <Text style={styles.restaurantEmoji}>🥟</Text>
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>Gyoza King</Text>
              <Text style={styles.restaurantDetail}>Harajuku • 8 min walk • $$</Text>
            </View>
            <View style={styles.restaurantScore}>
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
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
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
    paddingHorizontal: spacing.xl,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  mapBigEmoji: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  mapPlaceholderTitle: {
    ...typography.h2,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  mapPlaceholderDesc: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  mapLegend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
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
});
