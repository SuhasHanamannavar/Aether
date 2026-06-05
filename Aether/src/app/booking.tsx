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
import Animated, {
  FadeInUp,
  FadeInDown,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import StaggerContainer from '../components/StaggerContainer';

const { width } = Dimensions.get('window');

const bookingItems = [
  { emoji: '✈️', label: 'JAL 42 • Tokyo', price: '$680', id: 'f1' },
  { emoji: '🏨', label: 'Shinjuku Granbell • 3 nights', price: '$630', id: 'h1' },
  { emoji: '🍜', label: 'Ramen Tour • Oct 14', price: '$45', id: 'a1' },
  { emoji: '🍣', label: 'Sushi Saito Reservation', price: '$120', id: 'a2' },
  { emoji: '🚄', label: 'Shinkansen • Tokyo → Kyoto', price: '$110', id: 'a3' },
  { emoji: '🍵', label: 'Tea Ceremony Experience', price: '$55', id: 'a4' },
];

export default function BookingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'summary' | 'success'>('summary');
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const handleConfirmBooking = () => {
    setStep('success');
    checkScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 100 }));
    checkOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  };

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  if (step === 'success') {
    return (
      <SafeAreaView style={styles.successContainer}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.successContent}>
          <Animated.View style={[styles.checkCircle, checkStyle]}>
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(600).springify()}>
            <Text style={styles.successTitle}>All Booked!</Text>
            <Text style={styles.successDesc}>
              Your trip to Japan is confirmed.{'\n'}Everything is saved to your itinerary.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(400).delay(900).springify()}
            style={styles.successCards}
          >
            <View style={styles.successCard}>
              <Text style={styles.successCardEmoji}>🎫</Text>
              <Text style={styles.successCardTitle}>Digital Wallet</Text>
              <Text style={styles.successCardDesc}>6 tickets & QR codes saved</Text>
            </View>
            <View style={styles.successCard}>
              <Text style={styles.successCardEmoji}>📋</Text>
              <Text style={styles.successCardTitle}>Smart Itinerary</Text>
              <Text style={styles.successCardDesc}>Full schedule with confirmations</Text>
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(1200)}
          style={styles.successBottom}
        >
          <Button
            title="Go to My Trip"
            onPress={() => router.replace('/dream')}
            size="lg"
            style={styles.successBtn}
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <StaggerContainer staggerDelay={80} duration={350}>
          {bookingItems.map((item) => (
            <View key={item.id} style={styles.bookingItem}>
              <Text style={styles.bookingEmoji}>{item.emoji}</Text>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingLabel}>{item.label}</Text>
              </View>
              <Text style={styles.bookingPrice}>{item.price}</Text>
            </View>
          ))}
        </StaggerContainer>

        <View style={styles.divider} />

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>$1,640</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxes & fees</Text>
            <Text style={styles.totalValue}>$124</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>$1,764</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Pay with</Text>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentMethodText}>•••• 4242</Text>
          </View>
        </View>
        <Button
          title="Confirm & Book All"
          onPress={handleConfirmBooking}
          size="lg"
          style={styles.confirmBtn}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
    marginRight: spacing.lg,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  bookingEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingLabel: {
    ...typography.body,
    color: colors.text,
  },
  bookingPrice: {
    ...typography.bodyBold,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  totalSection: {
    gap: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.body,
    color: colors.text,
  },
  grandTotal: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandTotalLabel: {
    ...typography.h3,
    color: colors.text,
  },
  grandTotalValue: {
    ...typography.h2,
    color: colors.primary,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: spacing.md,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  paymentMethod: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  paymentMethodText: {
    ...typography.captionBold,
    color: colors.text,
  },
  confirmBtn: {
    width: '100%',
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    ...shadows.lg,
  },
  checkMark: {
    fontSize: 44,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successTitle: {
    ...typography.display,
    color: colors.text,
    textAlign: 'center',
  },
  successDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  successCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
  },
  successCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  successCardEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  successCardTitle: {
    ...typography.captionBold,
    color: colors.text,
  },
  successCardDesc: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  successBottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  successBtn: {
    width: '100%',
  },
});
