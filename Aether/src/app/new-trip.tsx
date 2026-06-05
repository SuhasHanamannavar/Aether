import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '../theme/tokens';
import Button from '../components/Button';
import ModeToggle from '../components/ModeToggle';
import VibeTagGrid from '../components/VibeTagGrid';
import PopularDestinationChip from '../components/PopularDestinationChip';
import BudgetPresetChips from '../components/BudgetPresetChips';
import BottomSheet from '../components/BottomSheet';
import { useUser } from '../context/UserContext';
import { useTrip } from '../context/TripContext';
import { tripsApi } from '../services/api';

const vibeTags = [
  { id: 'mountains', label: 'Mountains', emoji: '🏔️' },
  { id: 'foodie', label: 'Foodie', emoji: '🍜' },
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
  { id: 'relaxing', label: 'Relaxing', emoji: '🏖️' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌃' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'history', label: 'History', emoji: '📜' },
];

const popularDestinations = [
  { name: 'Tokyo', emoji: '🗼', color: '#EF4444' },
  { name: 'Paris', emoji: '🗼', color: '#6366F1' },
  { name: 'Bali', emoji: '🏝️', color: '#10B981' },
  { name: 'New York', emoji: '🗽', color: '#F59E0B' },
  { name: 'London', emoji: '🎡', color: '#3B82F6' },
  { name: 'Sydney', emoji: '🏄', color: '#EC4899' },
];

const budgetPresets = [
  { label: '$1k', value: 1000 },
  { label: '$3k', value: 3000 },
  { label: '$5k', value: 5000 },
  { label: '$10k+', value: 10000 },
];

const modeOptions = [
  { id: 'destination', label: 'Destination', emoji: '🌍' },
  { id: 'vibe', label: 'Vibe', emoji: '🎯' },
];

export default function NewTripScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const { setTripId, setDestination, setVibeTags, setBudget: setTripBudget, setDateStart, setDateEnd } = useTrip();
  const [mode, setMode] = useState<'destination' | 'vibe'>('destination');
  const [destination, setDestinationLocal] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [budget, setBudget] = useState('');
  const [selectedBudget, setSelectedBudgetLocal] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const canGenerate = mode === 'destination'
    ? destination.length > 0
    : selectedVibes.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate || !userId || generating) return;
    setGenerating(true);
    try {
      const budgetVal = selectedBudget || (budget ? parseInt(budget, 10) : undefined);
      const trip = await tripsApi.create({
        destination: mode === 'destination' ? destination : undefined,
        vibeTags: mode === 'vibe' ? selectedVibes : undefined,
        budget: budgetVal,
        dateStart: startDate || undefined,
        dateEnd: endDate || undefined,
      });
      setTripId(trip.tripId);
      setDestination(trip.destination);
      setVibeTags(trip.vibeTags);
      setBudget(trip.budget);
      setDateStart(trip.dateStart);
      setDateEnd(trip.dateEnd);
      router.push('/trip-canvas');
    } catch {
      // Still navigate even if API fails (offline fallback)
      router.push('/trip-canvas');
    }
    setGenerating(false);
  };

  const totalSteps = 4;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInUp.duration(500)}>
          <Text style={styles.stepLabel}>Step 3 of {totalSteps}</Text>
          <Text style={styles.title}>
            Where to,{'\n'}or what's the vibe?
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(100)}
          style={styles.toggleSection}
        >
          <ModeToggle
            options={modeOptions}
            selected={mode}
            onSelect={(id) => setMode(id as 'destination' | 'vibe')}
          />
        </Animated.View>

        {mode === 'destination' ? (
          <Animated.View
            entering={FadeInUp.duration(400).delay(150)}
            key="destination"
            style={styles.destinationSection}
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🌍</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a destination..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={destination}
                 onChangeText={setDestinationLocal}
                autoFocus
              />
              {destination.length > 0 && (
                <TouchableOpacity onPress={() => setDestinationLocal('')} style={styles.clearBtn}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.suggestionLabel}>Popular destinations</Text>
            <View style={styles.suggestionRow}>
              {popularDestinations.map((s) => (
                <PopularDestinationChip
                  key={s.name}
                  name={s.name}
                  emoji={s.emoji}
                  color={s.color}
                  isSelected={destination === s.name}
                  onPress={() => setDestinationLocal(s.name)}
                />
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInUp.duration(400).delay(150)}
            key="vibe"
            style={styles.vibeSection}
          >
            <Text style={styles.vibeHint}>Pick your travel style</Text>
            <VibeTagGrid
              tags={vibeTags}
              selected={selectedVibes}
              onToggle={toggleVibe}
            />
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.duration(400).delay(200)}
          style={styles.detailsSection}
        >
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowDetails(true)}
          >
            <View style={styles.detailsIconCircle}>
              <Text style={styles.detailsIconEmoji}>📅</Text>
            </View>
            <View style={styles.detailsButtonText}>
              <Text style={styles.detailsButtonTitle}>Add dates & budget</Text>
              <Text style={styles.detailsButtonHint}>
                Optional — we can suggest based on your preferences
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {(budget || startDate || selectedBudget) ? (
            <View style={styles.previewChips}>
              {startDate ? (
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText}>
                    📅 {startDate}{endDate ? ` → ${endDate}` : ''}
                  </Text>
                </View>
              ) : null}
              {(budget || selectedBudget) ? (
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText}>
                    💰 ${selectedBudget || budget}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.duration(400).delay(300)}
        style={styles.bottomSection}
      >
        <Button
          title={generating ? 'Generating...' : (canGenerate ? 'Generate Trip Plan' : 'Tell us more...')}
          onPress={handleGenerate}
          disabled={!canGenerate}
          size="lg"
          style={styles.generateBtn}
        />
      </Animated.View>

      <BottomSheet
        visible={showDetails}
        title="Trip Details"
        onClose={() => setShowDetails(false)}
      >
        <Text style={styles.sheetLabel}>When are you going?</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={styles.dateInput}
              placeholder="Start date"
              placeholderTextColor={colors.textTertiary}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <Text style={styles.dateSeparator}>→</Text>
          <View style={styles.dateInputWrapper}>
            <TextInput
              style={styles.dateInput}
              placeholder="End date"
              placeholderTextColor={colors.textTertiary}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <Text style={[styles.sheetLabel, { marginTop: spacing.xl }]}>Budget</Text>
        <BudgetPresetChips
          presets={budgetPresets}
          selected={selectedBudget}
          onSelect={setSelectedBudgetLocal}
          style={{ marginBottom: spacing.md }}
        />
        <View style={styles.budgetInputContainer}>
          <Text style={styles.budgetCurrency}>$</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder="Custom amount"
            placeholderTextColor={colors.textTertiary}
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
          />
          <Text style={styles.budgetHint}>USD</Text>
        </View>

        <Button
          title="Done"
          onPress={() => setShowDetails(false)}
          size="lg"
          style={styles.sheetDone}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4A2D',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.3,
    marginBottom: spacing.xxl,
  },
  toggleSection: {
    marginBottom: spacing.xl,
  },
  destinationSection: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: spacing.lg,
  },
  clearBtn: {
    padding: spacing.sm,
  },
  clearIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  vibeSection: {
    marginBottom: spacing.xl,
  },
  vibeHint: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing.lg,
  },
  detailsSection: {
    marginTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  detailsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  detailsIconEmoji: {
    fontSize: 20,
  },
  detailsButtonText: {
    flex: 1,
  },
  detailsButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsButtonHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.3)',
  },
  previewChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  previewChip: {
    backgroundColor: 'rgba(232, 168, 124, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  previewChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  generateBtn: {
    width: '100%',
  },
  sheetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
  },
  dateInput: {
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  dateSeparator: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
  },
  budgetCurrency: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingVertical: spacing.md,
  },
  budgetHint: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  sheetDone: {
    marginTop: spacing.xxl,
  },
});
