import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp, StretchInX, useAnimatedStyle, useSharedValue, withSpring, withTiming, withSequence,
} from 'react-native-reanimated';
import { colors, darkColors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance } from '../theme/animations';
import Button from '../components/Button';
import MapView from '../components/MapView';
import BottomSheet from '../components/BottomSheet';
import TransportBar from '../components/TransportBar';
import type { TransportMode } from '../components/TransportBar';
import { useTrip } from '../context/TripContext';
import { tripsApi } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.45;
const BG_COLOR = '#2D4A2D';
const GLASS_BG = 'rgba(255,255,255,0.08)';
const GLASS_BORDER = 'rgba(255,255,255,0.12)';
const ACCENT_GREEN = '#7CFF6B';
const TOKYO_CENTER: [number, number] = [139.6503, 35.6762];

const expenseCategories = [
  { emoji: '🍽️', label: 'Food', value: 'food' },
  { emoji: '🚕', label: 'Transport', value: 'transport' },
  { emoji: '🏨', label: 'Hotel', value: 'hotel' },
  { emoji: '🎟️', label: 'Activities', value: 'activities' },
  { emoji: '🛍️', label: 'Shopping', value: 'shopping' },
  { emoji: '📦', label: 'Other', value: 'other' },
];

interface TimelineItemData {
  id: string;
  time: string;
  title: string;
  emoji: string;
  duration?: string;
  coordinates?: [number, number];
}

interface DayData {
  day: number;
  title: string;
  date: string;
  items: TimelineItemData[];
}

function parseHour(time: string): number | null {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

function parseMinute(time: string): number | null {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  return match ? parseInt(match[2], 10) : null;
}

function isItemPast(item: TimelineItemData): boolean {
  const hour = parseHour(item.time);
  const minute = parseMinute(item.time);
  if (hour === null || minute === null) return false;
  const now = new Date();
  const itemDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  return now.getTime() > itemDate.getTime();
}

function getMinutesUntil(item: TimelineItemData): number {
  const hour = parseHour(item.time);
  const minute = parseMinute(item.time);
  if (hour === null || minute === null) return 0;
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  return Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000));
}

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

const defaultDays: DayData[] = [
  {
    day: 1, title: 'Arrival & Explore', date: 'Mon, Oct 14',
    items: [
      { id: 'd1-1', time: '09:00', title: 'Tsukiji Fish Market', emoji: '🐟', duration: '3h', coordinates: [139.7723, 35.6654] },
      { id: 'd1-2', time: '13:00', title: 'Shibuya Crossing', emoji: '🚶', duration: '1h', coordinates: [139.7004, 35.6595] },
      { id: 'd1-3', time: '15:30', title: 'Harajuku Walk', emoji: '🛍️', duration: '2h', coordinates: [139.7025, 35.6702] },
      { id: 'd1-4', time: '19:00', title: 'Ramen Dinner', emoji: '🍜', duration: '1.5h', coordinates: [139.7008, 35.6697] },
    ],
  },
  {
    day: 2, title: 'Culture Day', date: 'Tue, Oct 15',
    items: [
      { id: 'd2-1', time: '08:00', title: 'Meiji Shrine', emoji: '⛩️', duration: '2h', coordinates: [139.6993, 35.6764] },
      { id: 'd2-2', time: '11:00', title: 'Asakusa & Senso-ji', emoji: '🏯', duration: '2.5h', coordinates: [139.7967, 35.7148] },
      { id: 'd2-3', time: '14:00', title: 'Akihabara', emoji: '🎮', duration: '3h', coordinates: [139.7714, 35.7023] },
      { id: 'd2-4', time: '19:00', title: 'Teppanyaki Dinner', emoji: '🥩', duration: '2h', coordinates: [139.7101, 35.6639] },
    ],
  },
  {
    day: 3, title: 'Nature & Departure', date: 'Wed, Oct 16',
    items: [
      { id: 'd3-1', time: '06:00', title: 'Shinkansen to Kyoto', emoji: '🚄', duration: '2.5h', coordinates: [139.7671, 35.6812] },
      { id: 'd3-2', time: '09:30', title: 'Fushimi Inari', emoji: '⛩️', duration: '2h', coordinates: [135.7727, 34.9671] },
      { id: 'd3-3', time: '12:00', title: 'Bamboo Forest', emoji: '🎋', duration: '1.5h', coordinates: [135.6729, 35.0170] },
      { id: 'd3-4', time: '15:00', title: 'Departure', emoji: '✈️', duration: '-', coordinates: [135.7649, 34.8583] },
    ],
  },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function TimelineItemRow({ item, isNext, index }: { item: TimelineItemData; isNext: boolean; index: number }) {
  const past = isItemPast(item);
  const isCurrent = isNext && !past;
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(isCurrent ? 0.6 : 0);

  useEffect(() => {
    if (isCurrent) {
      glowIntensity.value = withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.4, { duration: 1000 }),
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 })
      );
    }
  }, [isCurrent, glowIntensity]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowIntensity.value * 0.3,
    borderColor: isCurrent ? `rgba(124,255,107,${0.3 + glowIntensity.value * 0.4})` : 'transparent',
  }));

  return (
    <Animated.View entering={cardEntrance.delay(index * 80)}>
      <AnimatedTouchable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        activeOpacity={1}
        style={[styles.timelineItem, past && styles.timelineItemPast, isCurrent && styles.timelineItemCurrent, animatedStyle, glowStyle]}
      >
        <View style={styles.timelineTimeCol}>
          <Text style={[styles.timelineTime, past && styles.timelineTimePast]}>{item.time}</Text>
          {item.duration && <Text style={[styles.timelineDuration, past && styles.timelineDurationPast]}>{item.duration}</Text>}
        </View>
        <View style={[styles.timelineDot, isCurrent && styles.timelineDotCurrent, past && styles.timelineDotPast]}>
          <Text style={styles.timelineDotEmoji}>{past ? '✓' : item.emoji}</Text>
        </View>
        <View style={styles.timelineContent}>
          <Text style={[styles.timelineTitle, past && styles.timelineTitlePast]} numberOfLines={1}>{item.title}</Text>
          {isCurrent && !past && <View style={styles.nextBadge}><Text style={styles.nextBadgeText}>NEXT</Text></View>}
          {past && <Text style={styles.timelineCompleted}>Done</Text>}
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

function QuickActionButton({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedTouchable
      onPressIn={() => { scale.value = withSpring(0.93); }}
      onPressOut={() => { scale.value = withSpring(1); onPress(); }}
      style={[styles.quickAction, animatedStyle]}
      activeOpacity={1}
    >
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </AnimatedTouchable>
  );
}

export default function LiveModeScreen() {
  const router = useRouter();
  const { trip } = useTrip();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [days, setDays] = useState<DayData[]>(defaultDays);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expenseSheetVisible, setExpenseSheetVisible] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('food');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [memorySheetVisible, setMemorySheetVisible] = useState(false);
  const { setTransportMode } = useTrip();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tid = trip.tripId;
    if (!tid) { setLoading(false); return; }
    (async () => {
      try {
        const data = await tripsApi.getItinerary(tid);
        if (data && data.length > 0) {
          const grouped: Record<number, DayData> = {};
          for (const item of data) {
            if (!grouped[item.day]) {
              grouped[item.day] = { day: item.day, title: item.dayTitle || `Day ${item.day}`, date: item.dayDate || '', items: [] };
            }
            grouped[item.day].items.push({
              id: item.id, time: item.time || '09:00', title: item.title,
              emoji: item.emoji || '📍', duration: item.duration, coordinates: item.coordinates,
            });
          }
          const apiDays = Object.values(grouped).sort((a: any, b: any) => a.day - b.day);
          if (apiDays.length > 0) {
            setDays(apiDays as DayData[]);
            if (trip.dateStart) {
              const diff = Math.floor((new Date().getTime() - new Date(trip.dateStart).getTime()) / 86400000);
              if (diff >= 0 && diff < apiDays.length) setCurrentDayIndex(diff);
            }
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, [trip.tripId, trip.dateStart]);

  const currentDay = days[currentDayIndex] || days[0];
  const todayItems = currentDay?.items || [];
  const completedCount = todayItems.filter(isItemPast).length;
  const totalCount = todayItems.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const nextItem = useMemo(() => todayItems.find((item) => !isItemPast(item)), [todayItems, currentTime]);
  const nextItemIndex = nextItem ? todayItems.indexOf(nextItem) : -1;
  const countdownMinutes = nextItem ? getMinutesUntil(nextItem) : 0;

  const progressWidth = useSharedValue(0);
  useEffect(() => { progressWidth.value = withTiming(progress, { duration: 600 }); }, [progress, progressWidth]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.4 + progressWidth.value * 0.3 }));

  const mapMarkers = useMemo(() => todayItems
    .filter((item) => item.coordinates)
    .map((item) => ({
      coordinates: item.coordinates as [number, number],
      title: item.title, emoji: item.emoji,
      color: isItemPast(item) ? '#6B7280' : ACCENT_GREEN,
    })), [todayItems, currentTime]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Live Mode</Text>
          {currentDay && <Text style={styles.headerSubtitle}>{currentDay.title}</Text>}
        </View>
      </Animated.View>

      <Animated.View entering={sectionEntrance.delay(50)} style={styles.mapSection}>
        <MapView center={TOKYO_CENTER} zoom={13} interactive markers={mapMarkers} colorScheme="Dark" />
        <TransportBar
          selected={trip.transportMode}
          onSelect={setTransportMode}
          style={styles.mapTransportBar}
        />
        <View style={styles.mapOverlay}>
          <Text style={styles.mapDayTitle}>{currentDay?.title || 'Today'}</Text>
          <Text style={styles.mapDayDate}>{currentDay?.date || ''}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={sectionEntrance.delay(120)} style={styles.statusBar}>
        <View style={styles.statusTop}>
          <View style={styles.currentTimeBox}>
            <Text style={styles.statusLabel}>Now</Text>
            <Text style={styles.currentTimeValue}>{formatTime(currentTime)}</Text>
          </View>
          {nextItem && (
            <View style={styles.nextBox}>
              <Text style={styles.statusLabel}>Next</Text>
              <Text style={styles.nextText} numberOfLines={1}>{nextItem.emoji} {nextItem.title}</Text>
              <Text style={styles.nextTime}>at {nextItem.time}</Text>
            </View>
          )}
          {nextItem && (
            <View style={styles.countdownBox}>
              <Text style={styles.statusLabel}>in</Text>
              <Text style={styles.countdownValue}>{formatCountdown(countdownMinutes)}</Text>
            </View>
          )}
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]}>
              <Animated.View style={[styles.progressGlow, glowStyle]} />
            </Animated.View>
          </View>
          <Text style={styles.progressText}>{completedCount}/{totalCount}</Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {todayItems.length > 0 ? todayItems.map((item, index) => (
          <TimelineItemRow key={item.id} item={item} isNext={nextItemIndex === index} index={index} />
        )) : (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyEmoji}>🗓️</Text>
            <Text style={styles.emptyTitle}>No items scheduled</Text>
            <Text style={styles.emptyDesc}>Your timeline for today is clear</Text>
          </View>
        )}
      </ScrollView>

      <Animated.View entering={sectionEntrance.delay(300)} style={styles.quickActions}>
        <View style={styles.quickActionsGrid}>
          {trip.transportMode === 'drive' ? (
            <>
              <QuickActionButton emoji="⛽" label="Find Gas" onPress={() => {}} />
              <QuickActionButton emoji="🗺️" label="Navigate" onPress={() => Linking.openURL('https://maps.apple.com/?ll=35.6762,139.6503')} />
              <QuickActionButton emoji="📸" label="Add Memory" onPress={() => setMemorySheetVisible(true)} />
              <QuickActionButton emoji="💰" label="Add Expense" onPress={() => setExpenseSheetVisible(true)} />
            </>
          ) : trip.transportMode === 'transit' ? (
            <>
              <QuickActionButton emoji="🎫" label="Transit Pass" onPress={() => {}} />
              <QuickActionButton emoji="🗺️" label="Station Map" onPress={() => Linking.openURL('https://maps.apple.com/?ll=35.6762,139.6503')} />
              <QuickActionButton emoji="📸" label="Add Memory" onPress={() => setMemorySheetVisible(true)} />
              <QuickActionButton emoji="💰" label="Add Expense" onPress={() => setExpenseSheetVisible(true)} />
            </>
          ) : trip.transportMode === 'walk' || trip.transportMode === 'bike' ? (
            <>
              <QuickActionButton emoji="🗺️" label="Find Route" onPress={() => Linking.openURL('https://maps.apple.com/?ll=35.6762,139.6503')} />
              <QuickActionButton emoji="🌤️" label="Conditions" onPress={() => {}} />
              <QuickActionButton emoji="📸" label="Add Memory" onPress={() => setMemorySheetVisible(true)} />
              <QuickActionButton emoji="💰" label="Add Expense" onPress={() => setExpenseSheetVisible(true)} />
            </>
          ) : (
            <>
              <QuickActionButton emoji="✈️" label="Flight Status" onPress={() => {}} />
              <QuickActionButton emoji="🗺️" label="Airport Nav" onPress={() => Linking.openURL('https://maps.apple.com/?ll=35.6762,139.6503')} />
              <QuickActionButton emoji="📸" label="Add Memory" onPress={() => setMemorySheetVisible(true)} />
              <QuickActionButton emoji="💰" label="Add Expense" onPress={() => setExpenseSheetVisible(true)} />
            </>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={sectionEntrance.delay(350)} style={styles.bottomBar}>
        <View style={styles.daySelector}>
          <TouchableOpacity
            onPress={() => setCurrentDayIndex(Math.max(0, currentDayIndex - 1))}
            disabled={currentDayIndex === 0}
            style={[styles.dayArrow, currentDayIndex === 0 && styles.dayArrowDisabled]}
          >
            <Text style={[styles.dayArrowText, currentDayIndex === 0 && styles.dayArrowTextDisabled]}>←</Text>
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayPills}>
            {days.map((day, idx) => (
              <TouchableOpacity
                key={day.day} onPress={() => setCurrentDayIndex(idx)}
                style={[styles.dayPill, idx === currentDayIndex && styles.dayPillActive]}
              >
                <Text style={[styles.dayPillText, idx === currentDayIndex && styles.dayPillTextActive]}>Day {day.day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setCurrentDayIndex(Math.min(days.length - 1, currentDayIndex + 1))}
            disabled={currentDayIndex === days.length - 1}
            style={[styles.dayArrow, currentDayIndex === days.length - 1 && styles.dayArrowDisabled]}
          >
            <Text style={[styles.dayArrowText, currentDayIndex === days.length - 1 && styles.dayArrowTextDisabled]}>→</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.endTripBtn}>
          <Text style={styles.endTripText}>End Trip</Text>
        </TouchableOpacity>
      </Animated.View>

      <BottomSheet visible={expenseSheetVisible} title="Add Expense" onClose={() => setExpenseSheetVisible(false)}>
        <View style={styles.expenseSheet}>
          <Text style={styles.expenseLabel}>Category</Text>
          <View style={styles.expenseCategoryRow}>
            {expenseCategories.map((cat) => (
              <TouchableOpacity
                key={cat.value} onPress={() => setExpenseCategory(cat.value)}
                style={[styles.expensePill, expenseCategory === cat.value && styles.expensePillActive]}
              >
                <Text style={styles.expensePillEmoji}>{cat.emoji}</Text>
                <Text style={[styles.expensePillLabel, expenseCategory === cat.value && styles.expensePillLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.expenseLabel}>Amount</Text>
          <TextInput style={styles.expenseInput} placeholder="$0.00" placeholderTextColor="rgba(255,255,255,0.35)" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="decimal-pad" />
          <Text style={styles.expenseLabel}>Description</Text>
          <TextInput style={styles.expenseInput} placeholder="What was it for?" placeholderTextColor="rgba(255,255,255,0.35)" value={expenseDescription} onChangeText={setExpenseDescription} />
          <Button title="Save Expense" onPress={() => { setExpenseSheetVisible(false); setExpenseAmount(''); setExpenseDescription(''); setExpenseCategory('food'); }} size="md" style={styles.expenseButton} />
        </View>
      </BottomSheet>

      <BottomSheet visible={memorySheetVisible} title="Add Memory" onClose={() => setMemorySheetVisible(false)}>
        <View style={styles.memorySheet}>
          <View style={styles.memoryPlaceholder}>
            <Text style={styles.memoryEmoji}>📸</Text>
            <Text style={styles.memoryTitle}>Camera</Text>
            <Text style={styles.memoryDesc}>Capture this moment</Text>
          </View>
          <Button title="Take Photo" onPress={() => setMemorySheetVisible(false)} size="md" style={styles.memoryButton} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: GLASS_BG, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  backArrow: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  mapSection: { height: MAP_HEIGHT, position: 'relative', marginHorizontal: spacing.lg, borderRadius: borderRadius.xl, overflow: 'hidden' },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, backgroundColor: 'rgba(0,0,0,0.5)', borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg },
  mapTransportBar: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md },
  mapDayTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  mapDayDate: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  statusBar: { marginHorizontal: spacing.lg, marginTop: spacing.md, backgroundColor: GLASS_BG, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: GLASS_BORDER, padding: spacing.lg },
  statusTop: { flexDirection: 'row', alignItems: 'center' },
  currentTimeBox: { alignItems: 'center', marginRight: spacing.lg },
  statusLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  currentTimeValue: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5, marginTop: 2 },
  nextBox: { flex: 1, marginRight: spacing.md },
  nextText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginTop: 2 },
  nextTime: { fontSize: 12, color: ACCENT_GREEN, marginTop: 1, fontWeight: '500' },
  countdownBox: { alignItems: 'center', backgroundColor: 'rgba(124,255,107,0.1)', borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  countdownValue: { fontSize: 18, fontWeight: '700', color: ACCENT_GREEN, marginTop: 1 },

  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  progressTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ACCENT_GREEN, borderRadius: 3, position: 'relative' },
  progressGlow: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 12, backgroundColor: ACCENT_GREEN, borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', minWidth: 32, textAlign: 'right' },

  scroll: { flex: 1, marginTop: spacing.md },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },

  timelineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, backgroundColor: GLASS_BG, borderRadius: borderRadius.md, borderWidth: 1, borderColor: GLASS_BORDER, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, shadowColor: ACCENT_GREEN, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8 },
  timelineItemPast: { opacity: 0.45 },
  timelineItemCurrent: { borderColor: 'rgba(124,255,107,0.3)', shadowOpacity: 0.15 },
  timelineTimeCol: { width: 52, marginRight: spacing.md },
  timelineTime: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  timelineTimePast: { color: 'rgba(255,255,255,0.3)' },
  timelineDuration: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: '500' },
  timelineDurationPast: { color: 'rgba(255,255,255,0.2)' },
  timelineDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: GLASS_BG, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: GLASS_BORDER },
  timelineDotCurrent: { backgroundColor: 'rgba(124,255,107,0.2)', borderColor: ACCENT_GREEN },
  timelineDotPast: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'transparent' },
  timelineDotEmoji: { fontSize: 14 },
  timelineContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', flex: 1 },
  timelineTitlePast: { color: 'rgba(255,255,255,0.3)' },
  nextBadge: { backgroundColor: ACCENT_GREEN, borderRadius: 4, paddingHorizontal: spacing.sm, paddingVertical: 1, marginLeft: spacing.sm },
  nextBadgeText: { fontSize: 9, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.5 },
  timelineCompleted: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '500', marginLeft: spacing.sm },

  emptyTimeline: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyEmoji: { fontSize: 36, marginBottom: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  emptyDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: spacing.xs },

  quickActions: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickAction: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2, flexDirection: 'row', alignItems: 'center', backgroundColor: GLASS_BG, borderRadius: borderRadius.md, borderWidth: 1, borderColor: GLASS_BORDER, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.sm },
  quickActionEmoji: { fontSize: 20 },
  quickActionLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: GLASS_BG, borderTopWidth: 1, borderTopColor: GLASS_BORDER },
  daySelector: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dayArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  dayArrowDisabled: { opacity: 0.25 },
  dayArrowText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  dayArrowTextDisabled: { color: 'rgba(255,255,255,0.3)' },
  dayPills: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  dayPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)' },
  dayPillActive: { backgroundColor: ACCENT_GREEN },
  dayPillText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  dayPillTextActive: { color: '#1A1A1A' },
  endTripBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  endTripText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },

  expenseSheet: { gap: spacing.md },
  expenseLabel: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  expenseCategoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  expensePill: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'transparent' },
  expensePillActive: { backgroundColor: 'rgba(124,255,107,0.15)', borderColor: 'rgba(124,255,107,0.4)' },
  expensePillEmoji: { fontSize: 16 },
  expensePillLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  expensePillLabelActive: { color: ACCENT_GREEN },
  expenseInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.md, borderWidth: 1, borderColor: GLASS_BORDER, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: 16, color: '#FFFFFF' },
  expenseButton: { marginTop: spacing.sm },

  memorySheet: { alignItems: 'center', gap: spacing.lg },
  memoryPlaceholder: { alignItems: 'center', paddingVertical: spacing.xl },
  memoryEmoji: { fontSize: 48, marginBottom: spacing.md },
  memoryTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  memoryDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: spacing.xs },
  memoryButton: { width: '100%' },
});
