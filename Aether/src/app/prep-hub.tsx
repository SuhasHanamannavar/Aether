import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  StretchInY,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance } from '../theme/animations';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import type { TransportMode } from '../components/TransportBar';
import { useTrip } from '../context/TripContext';
import { tripsApi, prepApi } from '../services/api';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ChecklistItemType {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
}

interface PackingItemType {
  id: string;
  title: string;
  packed: boolean;
}

interface PackingSectionType {
  id: string;
  title: string;
  items: PackingItemType[];
}

interface EtiquetteTipType {
  id: string;
  tip: string;
  category: string;
}

const defaultChecklist: ChecklistItemType[] = [
  { id: 'c1', title: 'Confirm flight details', notes: 'Check-in opens 24h before departure', completed: false },
  { id: 'c2', title: 'Book airport transfer', notes: 'Pre-arranged through hotel concierge', completed: false },
  { id: 'c3', title: 'Validate passport', notes: 'Must be valid for 6+ months beyond travel dates', completed: false },
  { id: 'c4', title: 'Download offline maps', notes: 'Google Maps — Tokyo metropolitan area', completed: false },
  { id: 'c5', title: 'Get travel insurance', notes: 'Policy #AET-7892 — covers medical & cancellation', completed: false },
  { id: 'c6', title: 'Notify bank of travel', notes: 'Chase Sapphire & Amex Platinum', completed: false },
  { id: 'c7', title: 'Check visa requirements', notes: 'Visa-free for US passport holders — 90 days', completed: false },
  { id: 'c8', title: 'Pack carry-on essentials', notes: 'Chargers, medications, change of clothes', completed: false },
];

const defaultPackingSections: PackingSectionType[] = [
  {
    id: 'essentials',
    title: 'Essentials',
    items: [
      { id: 'p1', title: 'Passport & ID', packed: false },
      { id: 'p2', title: 'Wallet & cash (JPY)', packed: false },
      { id: 'p3', title: 'Phone & charging cable', packed: false },
      { id: 'p4', title: 'Universal travel adapter', packed: false },
    ],
  },
  {
    id: 'clothing',
    title: 'Clothing',
    items: [
      { id: 'p5', title: 'Lightweight jackets', packed: false },
      { id: 'p6', title: 'Comfortable walking shoes', packed: false },
      { id: 'p7', title: 'Raincoat or compact umbrella', packed: false },
    ],
  },
  {
    id: 'toiletries',
    title: 'Toiletries',
    items: [
      { id: 'p8', title: 'Toiletry bag (TSA-size)', packed: false },
      { id: 'p9', title: 'Sunscreen SPF 50+', packed: false },
      { id: 'p10', title: 'Hand sanitizer & wipes', packed: false },
    ],
  },
  {
    id: 'documents',
    title: 'Documents',
    items: [
      { id: 'p11', title: 'Flight e-ticket confirmations', packed: false },
      { id: 'p12', title: 'Hotel booking vouchers', packed: false },
      { id: 'p13', title: 'Travel insurance certificate', packed: false },
    ],
  },
];

const defaultEtiquette: EtiquetteTipType[] = [
  { id: 'e1', tip: 'Bow when greeting — a slight bow from the waist shows respect', category: 'Greetings' },
  { id: 'e2', tip: 'Remove shoes before entering homes, temples, and many traditional restaurants', category: 'Customs' },
  { id: 'e3', tip: 'Do not tip — tipping is not customary in Japan and may cause confusion', category: 'Dining' },
  { id: 'e4', tip: 'Use both hands when giving or receiving items, especially business cards', category: 'General' },
  { id: 'e5', tip: 'Avoid eating while walking in public — it is considered impolite', category: 'Dining' },
  { id: 'e6', tip: 'Keep conversations quiet on public transportation and trains', category: 'General' },
];

function getTransportChecklistItems(mode?: TransportMode): ChecklistItemType[] {
  switch (mode) {
    case 'drive':
      return [
        { id: 't_drive_1', title: 'Check vehicle maintenance', notes: 'Oil, tires, brakes, fluids', completed: false },
        { id: 't_drive_2', title: 'Plan fuel/charging stops', completed: false },
        { id: 't_drive_3', title: 'Download offline maps', completed: false },
      ];
    case 'transit':
      return [
        { id: 't_transit_1', title: 'Purchase transit pass', completed: false },
        { id: 't_transit_2', title: 'Download route maps', completed: false },
        { id: 't_transit_3', title: 'Check station connections', completed: false },
      ];
    case 'walk':
    case 'bike':
      return [
        { id: 't_walk_1', title: 'Check route conditions', notes: 'Weather, closures, safety', completed: false },
        { id: 't_walk_2', title: 'Download walking/bike maps', completed: false },
      ];
    default:
      return [];
  }
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function CountdownPulse({ days }: { days: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.countdownBadge, animatedStyle]}>
      <Text style={styles.countdownNumber}>{days}</Text>
      <Text style={styles.countdownLabel}>days to departure</Text>
    </Animated.View>
  );
}

function PillTab({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.pillTab, isActive && styles.pillTabActive]}
    >
      {isActive && (
        <Animated.View
          entering={ZoomIn.duration(200).springify().damping(12)}
          style={styles.pillDot}
        />
      )}
      <Text style={[styles.pillTabText, isActive && styles.pillTabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ChecklistItemCard({
  item,
  onToggle,
  index,
}: {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    onToggle(item.id);
  };

  return (
    <Animated.View entering={cardEntrance.delay(index * 60)}>
      <AnimatedTouchable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.checklistCard, cardStyle, item.completed && styles.checklistCardDone]}
      >
        <View style={[styles.checkCircle, item.completed && styles.checkCircleDone]}>
          {item.completed && (
            <Animated.View entering={ZoomIn.duration(200).springify().damping(12)}>
              <Text style={styles.checkMark}>✓</Text>
            </Animated.View>
          )}
        </View>
        <View style={styles.checklistTextCol}>
          <Text style={[styles.checklistTitle, item.completed && styles.checklistTitleDone]}>
            {item.title}
          </Text>
          {item.notes ? (
            <Text style={[styles.checklistNotes, item.completed && styles.checklistNotesDone]}>
              {item.notes}
            </Text>
          ) : null}
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

function PackingItemRow({
  item,
  onToggle,
}: {
  item: PackingItemType;
  onToggle: (id: string) => void;
}) {
  const scale = useSharedValue(1);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    onToggle(item.id);
  };

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.packingRow, rowStyle]}
    >
      <View style={[styles.packCheck, item.packed && styles.packCheckDone]}>
        {item.packed ? (
          <Animated.Text
            entering={ZoomIn.duration(150).springify().damping(12)}
            style={styles.packCheckMark}
          >
            ✓
          </Animated.Text>
        ) : null}
      </View>
      <Text style={[styles.packingItemText, item.packed && styles.packingItemTextDone]}>
        {item.title}
      </Text>
    </AnimatedTouchable>
  );
}

function EtiquetteCard({
  item,
  index,
}: {
  item: EtiquetteTipType;
  index: number;
}) {
  return (
    <Animated.View entering={cardEntrance.delay(index * 80)}>
      <View style={styles.etiquetteCard}>
        <View style={styles.etiquetteAccent} />
        <View style={styles.etiquetteContent}>
          <Text style={styles.etiquetteCategory}>{item.category}</Text>
          <Text style={styles.etiquetteTip}>{item.tip}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function PrepHubScreen() {
  const router = useRouter();
  const { trip } = useTrip();
  const [activeTab, setActiveTab] = useState<'checklist' | 'packing' | 'etiquette'>('checklist');
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItemType[]>(
    defaultChecklist.map(c => ({ ...c, completed: false }))
  );
  const [packingSections, setPackingSections] = useState<PackingSectionType[]>(
    defaultPackingSections.map(s => ({ ...s, items: s.items.map(i => ({ ...i, packed: false })) }))
  );
  const [etiquette, setEtiquette] = useState<EtiquetteTipType[]>(defaultEtiquette);
  const [showSkipPrep, setShowSkipPrep] = useState(false);

  useEffect(() => {
    const tid = trip.tripId;
    if (!tid) { setLoading(false); return; }
    (async () => {
      try {
        const [prepData, packingData, stateData] = await Promise.all([
          tripsApi.getPrep(tid),
          tripsApi.getPacking(tid),
          prepApi.getState(tid),
        ]);

        if (prepData) {
          if (prepData.destination) setDestination(prepData.destination);
          if (prepData.checklist) {
            setChecklist(prepData.checklist.map((c: any) => ({
              id: c.id,
              title: c.title,
              notes: c.notes,
              completed: false,
            })));
          }
          if (prepData.etiquette) {
            setEtiquette(prepData.etiquette.map((e: any) => ({
              id: e.id,
              tip: e.tip,
              category: e.category,
            })));
          }
        }

        if (packingData) {
          const sections: PackingSectionType[] = [];
          if (packingData.essentials) sections.push({
            id: 'essentials',
            title: 'Essentials',
            items: packingData.essentials.map((i: any) => ({ id: i.id, title: i.title, packed: false })),
          });
          if (packingData.clothing) sections.push({
            id: 'clothing',
            title: 'Clothing',
            items: packingData.clothing.map((i: any) => ({ id: i.id, title: i.title, packed: false })),
          });
          if (packingData.toiletries) sections.push({
            id: 'toiletries',
            title: 'Toiletries',
            items: packingData.toiletries.map((i: any) => ({ id: i.id, title: i.title, packed: false })),
          });
          if (packingData.documents) sections.push({
            id: 'documents',
            title: 'Documents',
            items: packingData.documents.map((i: any) => ({ id: i.id, title: i.title, packed: false })),
          });
          if (sections.length > 0) setPackingSections(sections);
        }

        if (stateData) {
          setChecklist(prev => prev.map(item => ({
            ...item,
            completed: stateData[item.id] ?? item.completed,
          })));
        }

        // Append transport-specific checklist items
        const transportItems = getTransportChecklistItems(trip.transportMode);
        if (transportItems.length > 0) {
          setChecklist(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newItems = transportItems.filter(ti => !existingIds.has(ti.id));
            if (newItems.length > 0) return [...prev, ...newItems];
            return prev;
          });
        }
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, [trip.tripId]);

  const displayDestination = destination || trip.destination || 'Your Destination';
  const dateRange = trip.dateStart && trip.dateEnd
    ? `${formatDisplayDate(trip.dateStart)} — ${formatDisplayDate(trip.dateEnd)}`
    : '';
  const daysToGo = getDaysUntil(trip.dateStart);
  const completedCount = checklist.filter(c => c.completed).length;
  const totalCount = checklist.length;
  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  const handleToggleChecklist = useCallback(async (id: string) => {
    const tid = trip.tripId;
    if (!tid) return;
    const prev = checklist.find(c => c.id === id);
    const newVal = !prev?.completed;
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, completed: newVal } : item
    ));
    try {
      await prepApi.updateItem(tid, id, newVal);
    } catch { /* silent */ }
  }, [trip.tripId, checklist]);

  const handleTogglePacking = useCallback((sectionId: string, itemId: string) => {
    setPackingSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, items: section.items.map(item =>
            item.id === itemId ? { ...item, packed: !item.packed } : item
          )}
        : section
    ));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInUp.duration(400).springify().damping(16)}>
          <View style={styles.heroSection}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.heroDestination}>{displayDestination}</Text>
            {dateRange ? <Text style={styles.heroDates}>{dateRange}</Text> : null}
            <CountdownPulse days={daysToGo} />
          </View>
        </Animated.View>

        {/* Progress Summary */}
        <Animated.View entering={sectionEntrance.delay(100)} style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Prep Progress</Text>
            <Text style={styles.progressCount}>{completedCount}/{totalCount} complete</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.round(progressPct * 100)}%` },
                allComplete && styles.progressBarFillComplete,
              ]}
            />
          </View>
        </Animated.View>

        {/* Tab Bar */}
        <Animated.View entering={sectionEntrance.delay(180)} style={styles.tabBar}>
          <PillTab
            label="Checklist"
            isActive={activeTab === 'checklist'}
            onPress={() => setActiveTab('checklist')}
          />
          <PillTab
            label="Packing"
            isActive={activeTab === 'packing'}
            onPress={() => setActiveTab('packing')}
          />
          <PillTab
            label="Etiquette"
            isActive={activeTab === 'etiquette'}
            onPress={() => setActiveTab('etiquette')}
          />
        </Animated.View>

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <View style={styles.tabContent}>
            {checklist.map((item, index) => (
              <ChecklistItemCard
                key={item.id}
                item={item}
                onToggle={handleToggleChecklist}
                index={index}
              />
            ))}
          </View>
        )}

        {/* Packing Tab */}
        {activeTab === 'packing' && (
          <View style={styles.tabContent}>
            {packingSections.map((section) => (
              <Animated.View
                key={section.id}
                entering={sectionEntrance.delay(80)}
                style={styles.packingSection}
              >
                <Text style={styles.sectionHeader}>{section.title}</Text>
                {section.items.map((item) => (
                  <PackingItemRow
                    key={item.id}
                    item={item}
                    onToggle={(id) => handleTogglePacking(section.id, id)}
                  />
                ))}
              </Animated.View>
            ))}
          </View>
        )}

        {/* Etiquette Tab */}
        {activeTab === 'etiquette' && (
          <View style={styles.tabContent}>
            {etiquette.map((item, index) => (
              <EtiquetteCard key={item.id} item={item} index={index} />
            ))}
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <Animated.View
        entering={StretchInY.duration(350).springify().damping(14)}
        style={styles.bottomBar}
      >
        <Button
          title={allComplete ? 'Trip Ready? →' : 'Trip Ready?'}
          onPress={() => router.push('/live-mode' as any)}
          size="lg"
          disabled={!allComplete}
          style={styles.tripReadyBtn}
        />
        <TouchableOpacity
          onPress={() => setShowSkipPrep(true)}
          style={styles.skipPrepBtn}
        >
          <Text style={styles.skipPrepText}>Skip, I'll figure it out</Text>
        </TouchableOpacity>
      </Animated.View>

      <BottomSheet
        visible={showSkipPrep}
        title="Skip Prep?"
        onClose={() => setShowSkipPrep(false)}
      >
        <Text style={styles.skipPrepSheetText}>
          Your prep checklist will be saved as-is.{'\n'}
          You can come back anytime to complete it.
        </Text>
        <Button
          title="Yes, Skip Prep"
          onPress={() => { setShowSkipPrep(false); router.push('/live-mode' as any); }}
          variant="secondary"
          size="lg"
          style={styles.skipPrepSheetBtn}
        />
        <Button
          title="Stay on Prep"
          onPress={() => setShowSkipPrep(false)}
          variant="ghost"
          size="md"
          style={styles.skipPrepSheetCancel}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  backArrow: {
    fontSize: 28,
    color: colors.textInverse,
    fontWeight: '600',
  },
  heroSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  heroDestination: {
    ...typography.display,
    color: colors.textInverse,
    marginBottom: spacing.sm,
  },
  heroDates: {
    ...typography.body,
    color: colors.textInverse,
    opacity: 0.8,
    marginBottom: spacing.xl,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
    lineHeight: 36,
  },
  countdownLabel: {
    ...typography.captionBold,
    color: colors.textInverse,
    opacity: 0.85,
  },
  progressSection: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  progressCount: {
    ...typography.captionBold,
    color: colors.accent,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressBarFillComplete: {
    backgroundColor: colors.success,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pillTabActive: {
    backgroundColor: colors.surface,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  pillTabText: {
    ...typography.captionBold,
    color: colors.textInverse,
    opacity: 0.7,
  },
  pillTabTextActive: {
    color: colors.text,
    opacity: 1,
  },
  tabContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  checklistCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  checklistCardDone: {
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkCircleDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkMark: {
    fontSize: 13,
    color: colors.textInverse,
    fontWeight: '800',
  },
  checklistTextCol: {
    flex: 1,
  },
  checklistTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  checklistTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  checklistNotes: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  checklistNotesDone: {
    color: colors.textTertiary,
  },
  packingSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.textInverse,
    marginBottom: spacing.md,
  },
  packingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  packCheck: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packCheckDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  packCheckMark: {
    fontSize: 11,
    color: colors.textInverse,
    fontWeight: '800',
  },
  packingItemText: {
    ...typography.body,
    color: colors.textInverse,
    flex: 1,
  },
  packingItemTextDone: {
    textDecorationLine: 'line-through',
    color: colors.textInverse,
    opacity: 0.5,
  },
  etiquetteCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  etiquetteAccent: {
    width: 4,
    backgroundColor: colors.accent,
  },
  etiquetteContent: {
    flex: 1,
    padding: spacing.lg,
  },
  etiquetteCategory: {
    ...typography.captionBold,
    color: colors.accent,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  etiquetteTip: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tripReadyBtn: {
    width: '100%',
  },
  skipPrepBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skipPrepText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
  skipPrepSheetText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  skipPrepSheetBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  skipPrepSheetCancel: {
    width: '100%',
  },
});
