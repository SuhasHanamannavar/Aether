import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import Chip from '../components/Chip';
import BottomSheet from '../components/BottomSheet';
import StaggerContainer from '../components/StaggerContainer';

const { width } = Dimensions.get('window');

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

export default function NewTripScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'destination' | 'vibe'>('destination');
  const [destination, setDestination] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const canGenerate = mode === 'destination'
    ? destination.length > 0
    : selectedVibes.length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    router.push('/trip-canvas');
  };

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
        <Animated.View entering={FadeInUp.duration(600).springify()}>
          <Text style={styles.title}>
            Where to,{'\n'}or what's the vibe?
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(100).springify()}
          style={styles.modeToggle}
        >
          <TouchableOpacity
            style={[styles.modeOption, mode === 'destination' && styles.modeActive]}
            onPress={() => setMode('destination')}
          >
            <Text style={[styles.modeEmoji]}>🌍</Text>
            <Text
              style={[styles.modeText, mode === 'destination' && styles.modeTextActive]}
            >
              Destination
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeOption, mode === 'vibe' && styles.modeActive]}
            onPress={() => setMode('vibe')}
          >
            <Text style={[styles.modeEmoji]}>🎯</Text>
            <Text
              style={[styles.modeText, mode === 'vibe' && styles.modeTextActive]}
            >
              Vibe
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {mode === 'destination' ? (
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            key="destination"
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🌍</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter a destination..."
                placeholderTextColor={colors.textTertiary}
                value={destination}
                onChangeText={setDestination}
                autoFocus
              />
              {destination.length > 0 && (
                <TouchableOpacity
                  onPress={() => setDestination('')}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.suggestionLabel}>Popular destinations</Text>
            <View style={styles.suggestionRow}>
              {popularDestinations.map((s) => (
                <TouchableOpacity
                  key={s.name}
                  style={[
                    styles.suggestion,
                    destination === s.name && {
                      backgroundColor: s.color + '20',
                      borderColor: s.color,
                    },
                  ]}
                  onPress={() => setDestination(s.name)}
                >
                  <Text style={styles.suggestionEmoji}>{s.emoji}</Text>
                  <Text style={styles.suggestionText}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            key="vibe"
            style={styles.vibeContainer}
          >
            <Text style={styles.vibeHint}>Pick your travel style</Text>
            <View style={styles.chipRow}>
              {vibeTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.label}
                  emoji={tag.emoji}
                  selected={selectedVibes.includes(tag.id)}
                  onPress={() => toggleVibe(tag.id)}
                  style={styles.chip}
                />
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.duration(400).delay(300)}
          style={styles.detailsPreview}
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

          {budget || startDate ? (
            <View style={styles.previewChips}>
              {startDate ? (
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText}>
                    📅 {startDate}{endDate ? ` → ${endDate}` : ''}
                  </Text>
                </View>
              ) : null}
              {budget ? (
                <View style={styles.previewChip}>
                  <Text style={styles.previewChipText}>💰 ${budget}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.duration(400).delay(400)}
        style={styles.bottomSection}
      >
        <Button
          title={canGenerate ? 'Generate Trip Plan' : 'Tell us more...'}
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
        style={styles.sheet}
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
        <View style={styles.budgetInputContainer}>
          <Text style={styles.budgetCurrency}>$</Text>
          <TextInput
            style={styles.budgetInput}
            placeholder="Estimate your budget"
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xxl,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  modeActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  modeEmoji: {
    fontSize: 16,
  },
  modeText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.h2,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  clearBtn: {
    padding: spacing.sm,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  suggestionLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  suggestionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  suggestionEmoji: {
    fontSize: 14,
  },
  suggestionText: {
    ...typography.captionBold,
    color: colors.textSecondary,
  },
  vibeContainer: {
    marginBottom: spacing.xl,
  },
  vibeHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    marginBottom: spacing.xs,
  },
  detailsPreview: {
    marginTop: spacing.xl,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  detailsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
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
    ...typography.bodyBold,
    color: colors.text,
  },
  detailsButtonHint: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
  },
  previewChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  previewChip: {
    backgroundColor: colors.accentLight,
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
  sheet: {
    paddingBottom: spacing.xxxl + 20,
  },
  sheetLabel: {
    ...typography.bodyBold,
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
    ...typography.h2,
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
    ...typography.h2,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    ...typography.h2,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  budgetHint: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  sheetDone: {
    marginTop: spacing.xxl,
  },
});
