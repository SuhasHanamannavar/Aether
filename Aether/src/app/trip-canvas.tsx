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
import Chip from '../components/Chip';
import StaggerContainer from '../components/StaggerContainer';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 280;
const CARD_WIDTH = width * 0.75;

const archetypes = [
  {
    id: 'culinary',
    title: 'The Culinary Journey',
    subtitle: 'Taste the heart of Japan',
    emoji: '🍜',
    color: '#E8A87C',
    score: 94,
    highlights: ['Sushi masterclasses', 'Street food tours', 'Sake tasting'],
  },
  {
    id: 'zen',
    title: 'The Zen Garden Retreat',
    subtitle: 'Find your inner peace',
    emoji: '🏯',
    color: '#41B3A3',
    score: 91,
    highlights: ['Temple stays', 'Tea ceremonies', 'Onsen baths'],
  },
  {
    id: 'urban',
    title: 'The Urban Explorer',
    subtitle: 'City lights & hidden alleys',
    emoji: '🌃',
    color: '#1A1A2E',
    score: 88,
    highlights: ['Neon Tokyo nights', 'Akihabara anime', 'Rooftop bars'],
  },
  {
    id: 'nature',
    title: 'The Mountain Wanderer',
    subtitle: 'Trails, peaks & sunrise',
    emoji: '🏔️',
    color: '#10B981',
    score: 86,
    highlights: ['Mt. Fuji trek', 'Bamboo forests', 'Alpine villages'],
  },
];

const regions = [
  { name: 'Tokyo', emoji: '🗼', active: true },
  { name: 'Kyoto', emoji: '⛩️', active: true },
  { name: 'Osaka', emoji: '🏯', active: true },
  { name: 'Hokkaido', emoji: '❄️', active: false },
  { name: 'Okinawa', emoji: '🏝️', active: false },
];

export default function TripCanvasScreen() {
  const router = useRouter();
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} bounces={false}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapTitle}>Japan</Text>
            <Text style={styles.mapDesc}>7 regions identified</Text>

            <View style={styles.regionRow}>
              {regions.map((r) => (
                <View
                  key={r.name}
                  style={[styles.regionBadge, r.active && styles.regionActive]}
                >
                  <Text style={styles.regionEmoji}>{r.emoji}</Text>
                  <Text
                    style={[styles.regionName, r.active && styles.regionNameActive]}
                  >
                    {r.name}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.filterChip}>
              <Text style={styles.filterIcon}>✓</Text>
              <Text style={styles.filterText}>Value-for-Money filter active</Text>
            </View>
          </View>
        </View>

        {/* Archetypes Section */}
        <View style={styles.archetypesSection}>
          <Animated.View entering={FadeInUp.duration(500).delay(200)}>
            <Text style={styles.sectionTitle}>Trip Archetypes</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a style that matches your vibe
            </Text>
          </Animated.View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
            snapToInterval={CARD_WIDTH + spacing.lg}
            decelerationRate="fast"
          >
            <StaggerContainer staggerDelay={100} duration={400} style={styles.cardsRow}>
              {archetypes.map((arch) => {
                const isSelected = selectedArchetype === arch.id;
                return (
                  <TouchableOpacity
                    key={arch.id}
                    activeOpacity={0.9}
                    onPress={() => setSelectedArchetype(arch.id)}
                    style={[
                      styles.archetypeCard,
                      { width: CARD_WIDTH },
                      isSelected && { borderColor: arch.color, borderWidth: 2 },
                    ]}
                  >
                    <View
                      style={[styles.archetypeAccent, { backgroundColor: arch.color }]}
                    />
                    <View style={styles.archetypeContent}>
                      <View style={styles.archetypeTop}>
                        <Text style={styles.archetypeEmoji}>{arch.emoji}</Text>
                        <View style={styles.scoreBadge}>
                          <Text style={styles.scoreText}>{arch.score}%</Text>
                        </View>
                      </View>
                      <Text style={styles.archetypeTitle}>{arch.title}</Text>
                      <Text style={styles.archetypeSubtitle}>{arch.subtitle}</Text>
                      <View style={styles.highlightsList}>
                        {arch.highlights.map((h) => (
                          <View key={h} style={styles.highlightItem}>
                            <Text style={styles.highlightDot}>•</Text>
                            <Text style={styles.highlightText}>{h}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </StaggerContainer>
          </ScrollView>

          {selectedArchetype && (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.selectedInfo}>
              <Text style={styles.selectedInfoText}>
                {archetypes.find((a) => a.id === selectedArchetype)?.title} selected
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Button
          title={selectedArchetype ? "Build My Itinerary" : "Select an archetype"}
          onPress={() => {
            if (selectedArchetype) router.push('/itinerary');
          }}
          disabled={!selectedArchetype}
          size="lg"
          style={styles.buildBtn}
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
  scroll: {
    flex: 1,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: colors.primary,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  mapEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  mapTitle: {
    ...typography.h2,
    color: '#FFFFFF',
  },
  mapDesc: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginTop: spacing.xs,
  },
  regionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  regionActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  regionEmoji: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  regionName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  regionNameActive: {
    color: '#FFFFFF',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.lg,
  },
  filterIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: spacing.xs,
  },
  filterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  archetypesSection: {
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    paddingHorizontal: spacing.xl,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  cardsScroll: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  archetypeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  archetypeAccent: {
    height: 6,
  },
  archetypeContent: {
    padding: spacing.xl,
  },
  archetypeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  archetypeEmoji: {
    fontSize: 36,
  },
  scoreBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  archetypeTitle: {
    ...typography.h3,
    color: colors.text,
  },
  archetypeSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  highlightsList: {
    marginTop: spacing.md,
    gap: spacing.xs + 2,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightDot: {
    fontSize: 14,
    color: colors.accent,
    marginRight: spacing.sm,
  },
  highlightText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  selectedInfo: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  selectedInfoText: {
    ...typography.captionBold,
    color: colors.accent,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  buildBtn: {
    width: '100%',
  },
});
