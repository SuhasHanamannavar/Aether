import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  ZoomIn,
  StretchInY,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { heritageColors, colors, spacing, borderRadius, typography, shadows, animation } from '../theme/tokens';
import { cardEntrance, sectionEntrance } from '../theme/animations';
import Button from '../components/Button';
import { useTrip } from '../context/TripContext';
import { feedbackApi } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'flights', emoji: '✈️', label: 'Flights & Transport' },
  { key: 'accommodation', emoji: '🏨', label: 'Accommodation' },
  { key: 'activities', emoji: '🎫', label: 'Activities' },
  { key: 'food', emoji: '🍜', label: 'Food & Dining' },
  { key: 'value', emoji: '💰', label: 'Value for Money' },
];

const EMOJI_MAP = ['😞', '😐', '🙂', '😍', '🤩'];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function StarButton({ filled, onPress, size }: { filled: boolean; onPress: () => void; size: number }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.35, { damping: 8, stiffness: 250 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );
    onPress();
  }, [onPress, scale]);

  return (
    <AnimatedTouchable onPress={handlePress} activeOpacity={1} style={animatedStyle}>
      <Text style={{ fontSize: size }}>{filled ? '★' : '☆'}</Text>
    </AnimatedTouchable>
  );
}

function StarRating({ value, onChange, size = 20 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarButton
          key={star}
          filled={star <= value}
          onPress={() => onChange(star)}
          size={size}
        />
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});

function ConfettiPiece({ delay: d, color, left }: { delay: number; color: string; left: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(d, withTiming(-300, { duration: 800, easing: Easing.out(Easing.cubic) }));
    translateX.value = withDelay(d, withTiming((Math.random() - 0.5) * 200, { duration: 800 }));
    opacity.value = withDelay(d + 600, withTiming(0, { duration: 300 }));
    rotate.value = withDelay(d, withTiming(360, { duration: 800 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 80,
          left,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function FeedbackScreen() {
  const router = useRouter();
  const { trip } = useTrip();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const overallAvg = (() => {
    const vals = Object.values(ratings);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  const sentimentIndex = overallAvg === 0 ? 2 : Math.min(Math.floor(overallAvg), 4);
  const heroEmoji = EMOJI_MAP[sentimentIndex];
  const filledStars = Math.round(overallAvg);

  const setRating = useCallback((key: string) => (value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!trip.tripId) return;
    setSubmitting(true);
    try {
      await feedbackApi.submit({
        tripId: trip.tripId,
        ratings: Object.entries(ratings).map(([category, score]) => ({ category, score })),
        review: review.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      // error handled silently
    }
    setSubmitting(false);
  }, [trip.tripId, ratings, review]);

  const handleBackHome = useCallback(() => {
    router.back();
  }, [router]);

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View entering={ZoomIn.duration(500).springify().damping(12)}>
            <Text style={styles.successEmoji}>🎉</Text>
          </Animated.View>
          <Animated.Text entering={FadeInUp.duration(400).springify().delay(200)} style={styles.successTitle}>
            Thank You!
          </Animated.Text>
          <Animated.Text entering={FadeInUp.duration(400).springify().delay(350)} style={styles.successSubtitle}>
            Your feedback helps us create better experiences for travelers like you.
          </Animated.Text>
          <Animated.View entering={FadeInUp.duration(400).springify().delay(500)} style={styles.successRating}>
            <Text style={styles.successStars}>{'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}</Text>
            <Text style={styles.successScore}>{overallAvg.toFixed(1)}</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(400).springify().delay(650)}>
            <Button title="Back to Dashboard" onPress={handleBackHome} variant="secondary" />
          </Animated.View>
          {['#E8A87C', '#41B3A3'].map((color, i) => (
            <ConfettiPiece
              key={i}
              delay={i * 80}
              color={color}
              left={20 + (SCREEN_WIDTH - 40) * (i / 1)}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Feedback</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={cardEntrance} style={styles.heroSection}>
            <Text style={styles.heroEmoji}>{heroEmoji}</Text>
            <Text style={styles.heroSubtext}>Tap the stars to rate your trip</Text>
          </Animated.View>

          <Animated.View entering={sectionEntrance.delay(150)} style={styles.overallCard}>
            <Text style={styles.overallLabel}>Overall Rating</Text>
            <View style={styles.overallRow}>
              <Text style={styles.overallScore}>{overallAvg > 0 ? overallAvg.toFixed(1) : '—'}</Text>
              <View style={styles.overallStars}>
                <StarRating value={filledStars} onChange={() => {}} size={28} />
                <Text style={styles.overallHint}>
                  {overallAvg === 0 ? 'Not yet rated' : overallAvg >= 4.5 ? 'Outstanding!' : overallAvg >= 3.5 ? 'Great trip' : overallAvg >= 2.5 ? 'Good' : 'Needs improvement'}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={sectionEntrance.delay(250)} style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Rate Each Category</Text>
            <View style={styles.categoriesList}>
              {CATEGORIES.map((cat, idx) => (
                <Animated.View
                  key={cat.key}
                  entering={StretchInY.duration(300).springify().damping(18).delay(300 + idx * 80)}
                  style={styles.categoryRow}
                >
                  <View style={styles.categoryLabel}>
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={styles.categoryText}>{cat.label}</Text>
                  </View>
                  <StarRating value={ratings[cat.key] || 0} onChange={setRating(cat.key)} size={22} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={sectionEntrance.delay(600)} style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Write a Review</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textInput}
                placeholder="Share your experience..."
                placeholderTextColor={heritageColors.textTertiary}
                multiline
                textAlignVertical="top"
                value={review}
                onChangeText={setReview}
                maxLength={1000}
              />
              <View style={styles.charCountRow}>
                <Text style={styles.charCount}>{review.length}/1000</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={sectionEntrance.delay(750)} style={styles.submitSection}>
            <Button
              title="Share Feedback"
              onPress={handleSubmit}
              loading={submitting}
              disabled={Object.keys(ratings).length === 0 || submitting}
              size="lg"
              style={styles.submitButton}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: heritageColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: heritageColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: heritageColors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: heritageColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: heritageColors.text,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: heritageColors.text,
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.huge + spacing.xxxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  heroEmoji: {
    fontSize: 72,
    marginBottom: spacing.sm,
  },
  heroSubtext: {
    fontSize: 14,
    color: heritageColors.textTertiary,
    fontWeight: '500',
  },
  overallCard: {
    backgroundColor: heritageColors.surface,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: heritageColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: '700',
    color: heritageColors.text,
    letterSpacing: -1,
    minWidth: 60,
  },
  overallStars: {
    flex: 1,
    gap: spacing.xs,
  },
  overallHint: {
    fontSize: 13,
    color: heritageColors.textSecondary,
    fontWeight: '500',
  },
  categoriesSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: heritageColors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.lg,
  },
  categoriesList: {
    gap: spacing.md,
  },
  categoryRow: {
    backgroundColor: heritageColors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  categoryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: heritageColors.text,
  },
  reviewSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  inputCard: {
    backgroundColor: heritageColors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  textInput: {
    minHeight: 130,
    padding: spacing.lg,
    fontSize: 16,
    fontWeight: '400',
    color: heritageColors.text,
    lineHeight: 24,
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  charCount: {
    fontSize: 12,
    color: heritageColors.textTertiary,
    fontWeight: '500',
  },
  submitSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  submitButton: {
    width: '100%',
  },
  successContainer: {
    flex: 1,
    backgroundColor: heritageColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: heritageColors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  successSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: heritageColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  successRating: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  successStars: {
    fontSize: 32,
    color: colors.secondary,
    letterSpacing: 4,
    marginBottom: spacing.sm,
  },
  successScore: {
    fontSize: 20,
    fontWeight: '700',
    color: heritageColors.text,
  },
});
