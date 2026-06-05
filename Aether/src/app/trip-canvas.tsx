import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  StretchInY,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance, mapEntrance } from '../theme/animations';
import Button from '../components/Button';
import MapView from '../components/MapView';
import { useTrip } from '../context/TripContext';
import { tripsApi } from '../services/api';
import TransportBar from '../components/TransportBar';
import type { TransportMode } from '../components/TransportBar';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 280;
const CARD_WIDTH = width * 0.75;

interface ArchetypeType {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  score: number;
  highlights: string[];
}

function ArchetypeCard({
  archetype,
  isSelected,
  onPress,
  width,
}: {
  archetype: ArchetypeType;
  isSelected: boolean;
  onPress: () => void;
  width: number;
}) {
  const scale = useSharedValue(1);
  const selectedScale = useSharedValue(isSelected ? 1 : 0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: selectedScale.value,
    transform: [{ scale: selectedScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    onPress();
  };

  return (
    <Animated.View entering={cardEntrance} style={{ width }}>
      <Animated.View
        style={[
          styles.glowRing,
          { borderColor: archetype.color },
          glowStyle,
        ]}
        pointerEvents="none"
      />
      <AnimatedTouchable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.archetypeCard,
          {
            borderColor: isSelected ? archetype.color : 'transparent',
            borderWidth: 1.5,
          },
          cardStyle,
        ]}
      >
        <View style={[styles.archetypeAccent, { backgroundColor: archetype.color }]} />
        <View style={styles.archetypeContent}>
          <View style={styles.archetypeTop}>
            <Text style={styles.archetypeEmoji}>{archetype.emoji}</Text>
            <View style={[styles.scoreBadge, { backgroundColor: archetype.color + '20' }]}>
              <Text style={[styles.scoreText, { color: archetype.color }]}>{archetype.score}%</Text>
            </View>
          </View>
          <Text style={styles.archetypeTitle}>{archetype.title}</Text>
          <Text style={styles.archetypeSubtitle}>{archetype.subtitle}</Text>
          <View style={styles.highlightsList}>
            {archetype.highlights.map((h) => (
              <View key={h} style={styles.highlightItem}>
                <View style={[styles.highlightDot, { backgroundColor: archetype.color }]} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function TripCanvasScreen() {
  const router = useRouter();
  const { trip, setArchetype, setTransportMode } = useTrip();
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canvasData, setCanvasData] = useState<ArchetypeType[]>([]);
  const [generating, setGenerating] = useState(false);
  const [transportMode, setLocalTransportMode] = useState<TransportMode>(trip.transportMode || 'fly');

  useEffect(() => {
    const tid = trip.tripId;
    if (!tid) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await tripsApi.getCanvas(tid);
        if (data && data.archetypes) {
          setCanvasData(data.archetypes);
        }
      } catch {}
      setLoading(false);
    })();
  }, [trip.tripId]);

  const handleCardPress = useCallback((id: string) => {
    setSelectedArchetype(id);
  }, []);

  const handleBuildItinerary = async () => {
    if (!selectedArchetype || !trip.tripId || generating) return;
    setGenerating(true);
    try {
      await tripsApi.generateCanvas(trip.tripId);
      setArchetype(selectedArchetype);
      await tripsApi.update(trip.tripId, { archetype: selectedArchetype });
    } catch { /* silent */ }
    setGenerating(false);
    router.push('/itinerary');
  };

  const handleTransportMode = (mode: TransportMode) => {
    setLocalTransportMode(mode);
    setTransportMode(mode);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} bounces={false}>
        {/* Map Section */}
        <Animated.View entering={mapEntrance}>
          <View style={styles.mapContainer}>
            <MapView
              center={[137.6836, 36.1000]}
              zoom={5.5}
              interactive={true}
              markers={[]}
              colorScheme="Light"
            />
            <View style={styles.mapGradient} />
            <View style={styles.mapOverlay}>
              <TransportBar
                selected={transportMode}
                onSelect={handleTransportMode}
              />
            </View>
          </View>
        </Animated.View>

        {/* Archetypes Section */}
        <View style={styles.archetypesSection}>
          <Animated.View entering={sectionEntrance.delay(150)}>
            <Text style={styles.sectionTitle}>Trip Archetypes</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a style that matches your vibe
            </Text>
          </Animated.View>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : canvasData.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsScroll}
              snapToInterval={CARD_WIDTH + spacing.lg}
              decelerationRate="fast"
            >
              <View style={styles.cardsRow}>
                {canvasData.map((arch, i) => (
                  <ArchetypeCard
                    key={arch.id}
                    archetype={arch}
                    isSelected={selectedArchetype === arch.id}
                    onPress={() => handleCardPress(arch.id)}
                    width={CARD_WIDTH}
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎨</Text>
              <Text style={styles.emptyTitle}>No archetypes available</Text>
              <Text style={styles.emptyDesc}>Complete your trip details to generate personalized archetypes</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {selectedArchetype && (
        <Animated.View
          entering={StretchInY.duration(350).springify().damping(14)}
          style={styles.bottomSection}
        >
          <Button
            title={generating ? 'Building...' : 'Build My Itinerary'}
            onPress={handleBuildItinerary}
            size="lg"
            style={styles.buildBtn}
          />
        </Animated.View>
      )}
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
    position: 'relative',
  },
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  filterChip: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  filterIcon: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  mapOverlay: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.xl,
    right: spacing.xl,
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
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardsScroll: {
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl - 4,
    paddingVertical: spacing.lg,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingRight: spacing.xxl,
  },
  glowRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: borderRadius.xl + 3,
    borderWidth: 2,
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
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
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
    gap: spacing.sm,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: spacing.sm,
  },
  highlightText: {
    ...typography.caption,
    color: colors.textTertiary,
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
