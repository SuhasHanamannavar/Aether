import React, { useState, useCallback, useEffect } from 'react';
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
  FadeOutUp,
  ZoomIn,
  StretchInY,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance } from '../theme/animations';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { useUser } from '../context/UserContext';
import { useTrip } from '../context/TripContext';
import { bookingsApi, tripsApi } from '../services/api';

const { width } = Dimensions.get('window');

type ItemType = 'flight' | 'hotel' | 'activity' | 'dining';

interface BookingItem {
  id: string;
  emoji: string;
  label: string;
  price: string;
  priceNum: number;
  type: ItemType;
}

function mapItemType(type: string): ItemType {
  if (type === 'flight' || type === 'transport') return 'flight';
  if (type === 'hotel' || type === 'accommodation') return 'hotel';
  if (type === 'dining' || type === 'food') return 'dining';
  return 'activity';
}

const typeConfig: Record<ItemType, { color: string; label: string }> = {
  flight: { color: '#41B3A3', label: 'Flights' },
  hotel: { color: '#E8A87C', label: 'Hotels' },
  activity: { color: '#1A1A2E', label: 'Activities' },
  dining: { color: '#F59E0B', label: 'Dining' },
};

function ConfettiParticle({ index }: { index: number }) {
  const size = 6 + Math.random() * 8;
  const startX = Math.random() * width;
  const colors = ['#E8A87C', '#41B3A3', '#F59E0B', '#10B981', '#FFFFFF'];
  const color = colors[index % colors.length];
  const duration = 600 + Math.random() * 600;
  const delay = Math.random() * 300;

  const particleStyle = useAnimatedStyle(() => ({}));

  return (
    <Animated.View
      entering={FadeInUp.duration(duration).delay(delay).springify()}
      exiting={FadeOutUp.duration(300)}
      style={[
        styles.particle,
        {
          width: size,
          height: size * 1.2,
          backgroundColor: color,
          left: startX,
          borderRadius: index % 2 === 0 ? size / 2 : 2,
        },
      ]}
    />
  );
}

export default function BookingScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const { trip, setDiyBooking } = useTrip();
  const [step, setStep] = useState<'summary' | 'success' | 'diy-success'>('summary');
  const [items, setItems] = useState<BookingItem[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [showSkipSheet, setShowSkipSheet] = useState(false);
  const [diySuccess, setDiySuccess] = useState(false);

  useEffect(() => {
    if (trip.tripId) {
      (async () => {
        try {
          const data = await tripsApi.getItinerary(trip.tripId!);
          if (data && data.length > 0) {
            const mapped: BookingItem[] = data.map((item: any, i: number) => ({
              id: item.itemId || `item-${i}`,
              emoji: item.emoji || '📍',
              label: item.title || 'Item',
              price: item.price ? `$${item.price}` : '$0',
              priceNum: typeof item.price === 'number' ? item.price : 0,
              type: mapItemType(item.type),
            }));
            setItems(mapped);
          }
        } catch {}
      })();
    }
  }, [trip.tripId]);

  const checkScale = useSharedValue(0);
  const checkRotate = useSharedValue(0);

  const handleRemoveItem = useCallback((id: string) => {
    setRemovedIds((prev) => new Set(prev).add(id));
  }, []);

  const visibleItems = items.filter((i) => !removedIds.has(i.id));
  const subtotal = visibleItems.reduce((sum, i) => sum + i.priceNum, 0);
  const tax = Math.round(subtotal * 0.075);
  const total = subtotal + tax;

  const handleConfirmBooking = async () => {
    if (!userId || confirming) return;
    setConfirming(true);
    try {
      const booking = await bookingsApi.create({
        tripId: trip.tripId || 'unknown',
        items: visibleItems,
        subtotal,
        taxes: tax,
        total,
        paymentMethod: 'card',
      });
      await bookingsApi.confirm(booking.bookingId);
    } catch { /* silent */ }
    setConfirming(false);
    setStep('success');
    checkScale.value = withSequence(
      withDelay(200, withSpring(0, { damping: 8, stiffness: 200 })),
      withSpring(1, { damping: 8, stiffness: 120 })
    );
    checkRotate.value = withDelay(200, withTiming(360, {
      duration: 600,
      easing: Easing.out(Easing.exp),
    }));
  };

  const handleSkipBooking = async () => {
    setDiyBooking(true);
    if (trip.tripId) {
      try { await tripsApi.update(trip.tripId, { diyBooking: true }); } catch {}
    }
    setShowSkipSheet(false);
    setStep('diy-success');
  };

  const checkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotate.value}deg` },
    ],
  }));

  if (step === 'success') {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.confettiLayer} pointerEvents="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </View>
        <Animated.View
          entering={ZoomIn.duration(400).springify().damping(14)}
          style={styles.successContent}
        >
          <Animated.View style={[styles.checkCircle, checkStyle]}>
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(300).delay(500).springify()}>
            <Text style={styles.successTitle}>All Booked!</Text>
            <Text style={styles.successDesc}>
              Your trip to {trip.destination || 'your destination'} is confirmed.{'\n'}Everything is saved to your itinerary.
            </Text>
          </Animated.View>

          <Animated.View
            entering={StretchInY.duration(350).delay(700).springify().damping(14)}
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
          entering={FadeInUp.duration(300).delay(1000)}
          style={styles.successBottom}
        >
          <Button
            title="Go to My Trip"
            onPress={() => {
              if (trip.dateStart) {
                const daysUntil = Math.ceil((new Date(trip.dateStart).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              if (daysUntil <= 2) { router.replace('/prep-hub' as any); return; }
              if (daysUntil > 20) { router.replace('/trip-dashboard' as any); return; }
              }
              router.replace('/dream');
            }}
            size="lg"
            style={styles.successBtn}
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (step === 'diy-success') {
    return (
      <SafeAreaView style={styles.successContainer}>
        <Animated.View
          entering={ZoomIn.duration(400).springify().damping(14)}
          style={styles.successContent}
        >
          <Animated.View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(300).delay(500).springify()}>
            <Text style={styles.successTitle}>Trip Saved!</Text>
            <Text style={styles.successDesc}>
              Your itinerary is ready. You can book items later when you're ready.
            </Text>
          </Animated.View>

          <Animated.View
            entering={StretchInY.duration(350).delay(700).springify().damping(14)}
            style={styles.successCards}
          >
            <View style={styles.successCard}>
              <Text style={styles.successCardEmoji}>📋</Text>
              <Text style={styles.successCardTitle}>Itinerary Ready</Text>
              <Text style={styles.successCardDesc}>Full schedule with all your plans</Text>
            </View>
            <View style={styles.successCard}>
              <Text style={styles.successCardEmoji}>🗺️</Text>
              <Text style={styles.successCardTitle}>Self-Arranged</Text>
              <Text style={styles.successCardDesc}>Add bookings anytime you want</Text>
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(300).delay(1000)}
          style={styles.successBottom}
        >
          <Button
            title="Go to My Trip"
            onPress={() => {
              if (trip.dateStart) {
                const daysUntil = Math.ceil((new Date(trip.dateStart).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              if (daysUntil <= 2) { router.replace('/prep-hub' as any); return; }
              if (daysUntil > 20) { router.replace('/trip-dashboard' as any); return; }
              }
              router.replace('/dream');
            }}
            size="lg"
            style={styles.successBtn}
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

  const sections = ['flight', 'hotel', 'activity', 'dining'] as ItemType[];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {sections.map((type) => {
          const sectionItems = visibleItems.filter((i) => i.type === type);
          if (sectionItems.length === 0) return null;
          const config = typeConfig[type];
          return (
            <Animated.View key={type} entering={sectionEntrance}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: config.color }]} />
                <Text style={styles.sectionLabel}>{config.label}</Text>
                <Text style={styles.sectionCount}>{sectionItems.length}</Text>
              </View>
              {sectionItems.map((item) => (
                <Animated.View key={item.id} entering={cardEntrance}>
                  <View style={[styles.bookingItem, { borderLeftColor: config.color }]}>
                    <Text style={styles.bookingEmoji}>{item.emoji}</Text>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingLabel}>{item.label}</Text>
                    </View>
                    <Text style={[styles.bookingPrice, { color: config.color }]}>{item.price}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.id)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          );
        })}

        <View style={styles.divider} />

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Taxes & fees (7.5%)</Text>
            <Text style={styles.totalValue}>${tax.toLocaleString()}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.duration(300)}
        style={styles.bottomSection}
      >
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Pay with</Text>
          <View style={styles.paymentMethod}>
            <Text style={styles.paymentCardIcon}>💳</Text>
            <Text style={styles.paymentMethodText}>•••• 4242</Text>
            <Text style={styles.paymentExpiry}>09/27</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowSkipSheet(true)}
          style={styles.skipBookingBtn}
        >
          <Text style={styles.skipBookingText}>Skip Booking -- Save trip without payment</Text>
        </TouchableOpacity>
        <Button
          title={`Confirm & Pay $${total.toLocaleString()}`}
          onPress={handleConfirmBooking}
          size="lg"
          style={styles.confirmBtn}
        />
      </Animated.View>
      <BottomSheet
        visible={showSkipSheet}
        title="Skip Booking?"
        onClose={() => setShowSkipSheet(false)}
      >
        <Text style={styles.skipSheetText}>
          Your trip will be saved with your itinerary ready.{'\n'}
          You can book individual items later whenever you're ready.
        </Text>
        <Button
          title="Yes, Save Without Payment"
          onPress={handleSkipBooking}
          variant="secondary"
          size="lg"
          style={styles.skipSheetBtn}
        />
        <Button
          title="Go Back"
          onPress={() => setShowSkipSheet(false)}
          variant="ghost"
          size="md"
          style={styles.skipSheetCancel}
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    ...typography.captionBold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    ...typography.small,
    color: colors.textTertiary,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: 'auto',
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  bookingEmoji: {
    fontSize: 22,
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
    marginRight: spacing.sm,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  totalSection: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
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
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
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
    borderTopColor: colors.border,
    gap: spacing.md,
    ...shadows.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  paymentCardIcon: {
    fontSize: 16,
  },
  paymentMethodText: {
    ...typography.captionBold,
    color: colors.text,
  },
  paymentExpiry: {
    ...typography.small,
    color: colors.textTertiary,
  },
  confirmBtn: {
    width: '100%',
  },
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: -20,
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 1,
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
    zIndex: 1,
  },
  successBtn: {
    width: '100%',
  },
  skipBookingBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipBookingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  skipSheetText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  skipSheetBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  skipSheetCancel: {
    width: '100%',
  },
});
