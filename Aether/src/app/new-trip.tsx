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

export default function NewTripScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'destination' | 'vibe'>('destination');
  const [destination, setDestination] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [budget, setBudget] = useState('');

  const toggleVibe = (id: string) => {
    setSelectedVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const canGenerate = mode === 'destination' ? destination.length > 0 : selectedVibes.length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    router.push('/trip-canvas');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(500).springify()}>
          <Text style={styles.title}>Where to,{'\n'}or what's the vibe?</Text>
        </Animated.View>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeOption, mode === 'destination' && styles.modeActive]}
            onPress={() => setMode('destination')}
          >
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
            <Text style={[styles.modeText, mode === 'vibe' && styles.modeTextActive]}>
              Vibe
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'destination' ? (
          <Animated.View entering={FadeInUp.duration(400)}>
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
            </View>
            <View style={styles.suggestionRow}>
              {['Paris', 'Tokyo', 'Bali', 'New York'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestion}
                  onPress={() => setDestination(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(400)} style={styles.vibeContainer}>
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

        <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.detailsPreview}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => setShowDetails(true)}
          >
            <Text style={styles.detailsButtonEmoji}>📅</Text>
            <View style={styles.detailsButtonText}>
              <Text style={styles.detailsButtonTitle}>Add dates & budget</Text>
              <Text style={styles.detailsButtonHint}>
                Optional — we can suggest based on your preferences
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <Button
          title={canGenerate ? "Generate Trip Plan" : "Tell us more..."}
          onPress={handleGenerate}
          disabled={!canGenerate}
          size="lg"
          style={styles.generateBtn}
        />
      </View>

      <BottomSheet
        visible={showDetails}
        title="Trip Details"
        onClose={() => setShowDetails(false)}
        style={styles.sheet}
      >
        <Text style={styles.sheetLabel}>When are you going?</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <Text style={styles.datePlaceholder}>Start date</Text>
          </View>
          <Text style={styles.dateSeparator}>→</Text>
          <View style={styles.dateInput}>
            <Text style={styles.datePlaceholder}>End date</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
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
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  modeActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
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
  suggestionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
  },
  suggestion: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
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
  detailsButtonEmoji: {
    fontSize: 24,
    marginRight: spacing.lg,
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
  dateInput: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  datePlaceholder: {
    ...typography.body,
    color: colors.textTertiary,
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
  sheetDone: {
    marginTop: spacing.xxl,
  },
});
