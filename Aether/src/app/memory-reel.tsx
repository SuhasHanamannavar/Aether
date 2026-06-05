import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { spacing, borderRadius, typography } from '../theme/tokens';
import { cardEntrance, sectionEntrance, useSpringPress } from '../theme/animations';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { useTrip } from '../context/TripContext';
import { memoriesApi } from '../services/api';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 4;
const PHOTO_SIZE = Math.floor((SCREEN_WIDTH - GAP * 4) / 3);

const THEME = {
  bg: '#2D4A2D',
  accent: '#E8A87C',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.4)',
  glassBg: 'rgba(255,255,255,0.1)',
  glassBorder: 'rgba(255,255,255,0.18)',
  glassOverlay: 'rgba(0,0,0,0.5)',
};

const EMOJI_POOL = ['🏯', '🗼', '🍜', '🌸', '⛩️', '🎋', '🍣', '🎎', '🏔️', '🌊', '🎭', '🍡'];
const COLOR_POOL = ['#5B4A3F', '#4A6741', '#6B4E5A', '#3F5E6B', '#7A5C3A', '#4B6A5A', '#6A4B5E', '#3E5A4A', '#7E6A4A', '#4A5E6A'];

interface Memory {
  id: string;
  imageUrl: string;
  caption: string;
  day: number;
  emoji: string;
  bgColor: string;
}

function genId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function MemoryPhoto({ item, index, onPress }: { item: Memory; index: number; onPress: () => void }) {
  const { animatedStyle, pressIn, pressOut } = useSpringPress();
  const delay = (index % 3) * 60 + Math.floor(index / 3) * 80;
  return (
    <Animated.View entering={cardEntrance.delay(delay)}>
      <AnimatedTouchable
        onPressIn={pressIn}
        onPressOut={() => { pressOut(); onPress(); }}
        activeOpacity={1}
        style={[styles.photoCard, animatedStyle]}
      >
        <View style={[styles.photoBg, { backgroundColor: item.bgColor }]}>
          <Text style={styles.photoEmoji}>{item.emoji}</Text>
        </View>
        {item.caption ? (
          <View style={styles.capOverlay}>
            <View style={styles.capGlass}>
              <Text style={styles.capText} numberOfLines={2}>{item.caption}</Text>
            </View>
          </View>
        ) : null}
      </AnimatedTouchable>
    </Animated.View>
  );
}

function DayPill({ day, count, active, onPress }: { day: number; count: number; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.dayPill, active && styles.dayPillActive]}>
      <Text style={[styles.dayNum, active && styles.dayNumActive]}>Day {day}</Text>
      <View style={[styles.dayCount, active && styles.dayCountActive]}>
        <Text style={styles.dayCountText}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.emptyBox}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{desc}</Text>
    </Animated.View>
  );
}

export default function MemoryReelScreen() {
  const router = useRouter();
  const { trip } = useTrip();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDay, setNewDay] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const tid = trip.tripId;
    if (!tid) { setLoading(false); return; }
    (async () => {
      try {
        const data = await memoriesApi.list(tid);
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: Memory[] = data.map((m: any, i: number) => ({
            id: m.id || genId(),
            imageUrl: m.imageUrl || '',
            caption: m.caption || '',
            day: m.day || 1,
            emoji: EMOJI_POOL[i % EMOJI_POOL.length],
            bgColor: COLOR_POOL[i % COLOR_POOL.length],
          }));
          setMemories(mapped);
          const days = [...new Set(mapped.map((m) => m.day))].sort((a, b) => a - b);
          if (days.length > 0) setActiveDay(days[0]);
        }
      } catch {}
      setLoading(false);
    })();
  }, [trip.tripId]);

  const groupedByDay = useMemo(() => {
    const map: Record<number, Memory[]> = {};
    for (const m of memories) {
      if (!map[m.day]) map[m.day] = [];
      map[m.day].push(m);
    }
    return map;
  }, [memories]);

  const dayKeys = useMemo(() => Object.keys(groupedByDay).map(Number).sort((a, b) => a - b), [groupedByDay]);
  const activeMemories = groupedByDay[activeDay] || [];
  const activeDaySet = useMemo(() => new Set(dayKeys), [dayKeys]);

  const handleAddMemory = useCallback(async () => {
    const tid = trip.tripId;
    if (!tid) return;
    const dayNum = parseInt(newDay, 10);
    if (!newImageUrl.trim() || !dayNum || dayNum < 1) return;
    setSaving(true);
    const optimistic: Memory = {
      id: genId(),
      imageUrl: newImageUrl.trim(),
      caption: newCaption.trim(),
      day: dayNum,
      emoji: EMOJI_POOL[memories.length % EMOJI_POOL.length],
      bgColor: COLOR_POOL[memories.length % COLOR_POOL.length],
    };
    setMemories((prev) => [...prev, optimistic]);
    setSheetVisible(false);
    setNewImageUrl('');
    setNewCaption('');
    setNewDay('1');
    if (!activeDaySet.has(dayNum)) setActiveDay(dayNum);
    try {
      await memoriesApi.create(tid, { imageUrl: optimistic.imageUrl, caption: optimistic.caption, day: dayNum });
    } catch {
      setMemories((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
    setSaving(false);
  }, [trip.tripId, newImageUrl, newCaption, newDay, memories.length, activeDaySet]);

  const handleDeleteMemory = useCallback((memory: Memory) => {
    const tid = trip.tripId;
    if (!tid) return;
    Alert.alert('Delete Memory', 'Remove this photo from your reel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setMemories((prev) => prev.filter((m) => m.id !== memory.id));
          setSelectedMemory(null);
          try { await memoriesApi.remove(tid, memory.id); }
          catch { setMemories((prev) => [...prev, memory]); }
        },
      },
    ]);
  }, [trip.tripId]);

  const handleDayChange = useCallback((dir: number) => {
    const idx = dayKeys.indexOf(activeDay);
    const next = idx + dir;
    if (next >= 0 && next < dayKeys.length) setActiveDay(dayKeys[next]);
  }, [dayKeys, activeDay]);

  const dayArrowLeftDisabled = dayKeys.indexOf(activeDay) <= 0;
  const dayArrowRightDisabled = dayKeys.indexOf(activeDay) >= dayKeys.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Memory Reel</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{memories.length}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={sectionEntrance.delay(80)} style={styles.dayBar}>
        <TouchableOpacity
          onPress={() => handleDayChange(-1)}
          disabled={dayArrowLeftDisabled}
          style={[styles.dayArrow, dayArrowLeftDisabled && styles.dayArrowDisabled]}
        >
          <Text style={[styles.dayArrowText, dayArrowLeftDisabled && styles.dayArrowTextDisabled]}>←</Text>
        </TouchableOpacity>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPillsRow}
        >
          {dayKeys.length > 0 ? dayKeys.map((day) => (
            <DayPill key={day} day={day} count={groupedByDay[day].length} active={activeDay === day} onPress={() => setActiveDay(day)} />
          )) : (
            <View style={styles.dayPill}><Text style={styles.dayNum}>Day 1</Text></View>
          )}
        </ScrollView>
        <TouchableOpacity
          onPress={() => handleDayChange(1)}
          disabled={dayArrowRightDisabled}
          style={[styles.dayArrow, dayArrowRightDisabled && styles.dayArrowDisabled]}
        >
          <Text style={[styles.dayArrowText, dayArrowRightDisabled && styles.dayArrowTextDisabled]}>→</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.centerBox}>
            <Text style={styles.centerEmoji}>🔄</Text>
            <Text style={styles.centerTitle}>Loading memories...</Text>
          </Animated.View>
        ) : memories.length === 0 ? (
          <EmptyState emoji="📷" title="No memories yet" desc="Start capturing your trip moments" />
        ) : activeMemories.length === 0 ? (
          <EmptyState emoji="📭" title="No memories this day" desc="Add a memory from today" />
        ) : (
          <Animated.View entering={sectionEntrance} style={styles.photoGrid}>
            {activeMemories.map((item, idx) => (
              <MemoryPhoto key={item.id} item={item} index={idx} onPress={() => setSelectedMemory(item)} />
            ))}
          </Animated.View>
        )}

        <AnimatedTouchable onPressIn={() => {}} onPressOut={() => setSheetVisible(true)} activeOpacity={1} style={styles.addCard}>
          <Text style={styles.addCardEmoji}>📸</Text>
          <Text style={styles.addCardTitle}>Add a memory from today</Text>
          <Text style={styles.addCardDesc}>Capture the moment</Text>
        </AnimatedTouchable>
      </ScrollView>

      <Modal visible={selectedMemory !== null} transparent animationType="fade" onRequestClose={() => setSelectedMemory(null)}>
        <TouchableOpacity style={styles.fsOverlay} activeOpacity={1} onPress={() => setSelectedMemory(null)}>
          {selectedMemory && (
            <Animated.View entering={ZoomIn.duration(300).springify()} style={styles.fsContent}>
              <View style={[styles.fsImage, { backgroundColor: selectedMemory.bgColor }]}>
                <Text style={styles.fsEmoji}>{selectedMemory.emoji}</Text>
              </View>
              {selectedMemory.caption ? (
                <View style={styles.fsCaption}>
                  <Text style={styles.fsCaptionText}>{selectedMemory.caption}</Text>
                </View>
              ) : null}
              <Text style={styles.fsDay}>Day {selectedMemory.day}</Text>
              <TouchableOpacity onPress={() => handleDeleteMemory(selectedMemory)} style={styles.deleteBtn} activeOpacity={0.7}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Modal>

      <BottomSheet visible={sheetVisible} title="Add Memory" onClose={() => setSheetVisible(false)}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetLabel}>Image URL</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="Paste image URL..."
            placeholderTextColor={THEME.textTertiary}
            value={newImageUrl}
            onChangeText={setNewImageUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.sheetLabel}>Caption</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="What happened here?"
            placeholderTextColor={THEME.textTertiary}
            value={newCaption}
            onChangeText={setNewCaption}
          />
          <Text style={styles.sheetLabel}>Day</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="1"
            placeholderTextColor={THEME.textTertiary}
            value={newDay}
            onChangeText={setNewDay}
            keyboardType="number-pad"
          />
          <Button
            title={saving ? 'Saving...' : 'Save Memory'}
            onPress={handleAddMemory}
            disabled={saving || !newImageUrl.trim()}
            size="md"
            style={styles.sheetButton}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: THEME.glassBg, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  backArrow: { fontSize: 20, color: THEME.textPrimary, fontWeight: '600' },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h2, color: THEME.textPrimary },
  countBadge: {
    minWidth: 28, height: 28, borderRadius: 14,
    backgroundColor: THEME.accent, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  countBadgeText: { ...typography.small, color: '#FFFFFF', fontWeight: '700' },
  dayBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
    backgroundColor: THEME.glassBg, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: THEME.glassBorder,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
  },
  dayArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  dayArrowDisabled: { opacity: 0.25 },
  dayArrowText: { fontSize: 16, color: THEME.textPrimary, fontWeight: '600' },
  dayArrowTextDisabled: { color: 'rgba(255,255,255,0.3)' },
  dayPillsRow: {
    flexDirection: 'row', gap: spacing.xs,
    paddingHorizontal: spacing.sm, alignItems: 'center',
  },
  dayPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full, backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dayPillActive: { backgroundColor: THEME.accent },
  dayNum: { fontSize: 12, fontWeight: '600', color: THEME.textSecondary },
  dayNumActive: { color: '#FFFFFF' },
  dayCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  dayCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  dayCountText: { fontSize: 10, fontWeight: '700', color: THEME.textSecondary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 2, paddingBottom: 32 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: 2 },
  photoCard: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: borderRadius.md, overflow: 'hidden' },
  photoBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  photoEmoji: { fontSize: 36 },
  capOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xs },
  capGlass: {
    backgroundColor: THEME.glassOverlay, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 1,
  },
  capText: { ...typography.small, color: '#FFFFFF', fontWeight: '500' },
  addCard: {
    marginTop: spacing.lg, marginHorizontal: spacing.lg, alignItems: 'center',
    backgroundColor: THEME.glassBg, borderRadius: borderRadius.lg, paddingVertical: spacing.xl,
    borderWidth: 1, borderColor: THEME.glassBorder, borderStyle: 'dashed',
  },
  addCardEmoji: { fontSize: 36, marginBottom: spacing.sm },
  addCardTitle: { ...typography.bodyBold, color: THEME.textPrimary },
  addCardDesc: { ...typography.caption, color: THEME.textSecondary, marginTop: 2 },
  centerBox: { alignItems: 'center', paddingVertical: spacing.xxxl },
  centerEmoji: { fontSize: 36, marginBottom: spacing.md },
  centerTitle: { ...typography.h3, color: THEME.textPrimary },
  emptyBox: { alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.lg },
  emptyTitle: { ...typography.h2, color: THEME.textPrimary },
  emptyDesc: { ...typography.body, color: THEME.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  fsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  fsContent: { alignItems: 'center', width: SCREEN_WIDTH - spacing.xxl * 2 },
  fsImage: {
    width: SCREEN_WIDTH - spacing.xxl * 2,
    height: SCREEN_WIDTH - spacing.xxl * 2,
    borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center',
  },
  fsEmoji: { fontSize: 80 },
  fsCaption: {
    marginTop: spacing.lg, width: '100%',
    backgroundColor: THEME.glassBg, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: THEME.glassBorder,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  fsCaptionText: { ...typography.body, color: THEME.textPrimary, textAlign: 'center' },
  fsDay: { ...typography.captionBold, color: THEME.accent, marginTop: spacing.lg, textTransform: 'uppercase', letterSpacing: 1 },
  deleteBtn: {
    marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.1)',
  },
  deleteBtnText: { ...typography.captionBold, color: '#EF4444' },
  sheetContent: { gap: spacing.md },
  sheetLabel: { ...typography.captionBold, color: THEME.textPrimary },
  sheetInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: THEME.glassBorder,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: 16, color: THEME.textPrimary,
  },
  sheetButton: { marginTop: spacing.sm },
});
