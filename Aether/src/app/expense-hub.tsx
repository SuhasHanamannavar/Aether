import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import { cardEntrance, sectionEntrance, useSpringPress } from '../theme/animations';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { useTrip } from '../context/TripContext';
import { expensesApi } from '../services/api';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SCREEN_WIDTH = Dimensions.get('window').width;

const CATEGORIES = [
  { key: 'accommodation', label: 'Accommodation', emoji: '🏨', color: '#E8A87C' },
  { key: 'food', label: 'Food', emoji: '🍜', color: '#10B981' },
  { key: 'transport', label: 'Transport', emoji: '🚗', color: '#3B82F6' },
  { key: 'activities', label: 'Activities', emoji: '🎫', color: '#8B5CF6' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#F59E0B' },
  { key: 'other', label: 'Other', emoji: '📦', color: '#6B7280' },
];

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface CategoryTotals {
  [key: string]: { spent: number; count: number; budget?: number };
}

function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 12,
  color = colors.accent,
  trackColor = 'rgba(255,255,255,0.1)',
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const animatedValue = useSharedValue(0);
  const half = size / 2;
  const innerSize = size - strokeWidth * 2;

  useEffect(() => {
    animatedValue.value = withTiming(progress, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const rightStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.min(animatedValue.value * 180, 180)}deg` }],
  }));

  const leftContainerStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value > 0.5 ? 1 : 0,
  }));

  const leftStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${Math.max(0, animatedValue.value * 180 - 180)}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: half, backgroundColor: trackColor }}>
        <View style={{ position: 'absolute', width: half, height: size, right: 0, overflow: 'hidden' }}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: half,
                backgroundColor: color,
                left: -half,
              },
              rightStyle,
            ]}
          />
        </View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: half,
              height: size,
              left: 0,
              overflow: 'hidden',
            },
            leftContainerStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: half,
                backgroundColor: color,
                left: 0,
              },
              leftStyle,
            ]}
          />
        </Animated.View>
        <View
          style={{
            position: 'absolute',
            top: strokeWidth,
            left: strokeWidth,
            width: innerSize,
            height: innerSize,
            borderRadius: half - strokeWidth,
            backgroundColor: colors.surface,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}

function CategoryCard({
  category,
  spent,
  totalBudget,
  isActive,
  onPress,
  index,
}: {
  category: (typeof CATEGORIES)[number];
  spent: number;
  totalBudget: number;
  isActive: boolean;
  onPress: () => void;
  index: number;
}) {
  const { animatedStyle, pressIn, pressOut } = useSpringPress();
  const fraction = totalBudget > 0 ? Math.min(spent / totalBudget, 1) : 0;

  return (
    <Animated.View entering={cardEntrance.delay(index * 80)}>
      <AnimatedTouchable
        onPressIn={pressIn}
        onPressOut={() => { pressOut(); onPress(); }}
        activeOpacity={1}
        style={[
          styles.categoryCard,
          isActive && { borderColor: category.color, borderWidth: 1.5 },
          animatedStyle,
        ]}
      >
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <Text style={styles.categoryAmount}>${spent.toLocaleString()}</Text>
        <View style={styles.categoryBarBg}>
          <View
            style={[
              styles.categoryBarFill,
              { width: `${fraction * 100}%`, backgroundColor: category.color },
            ]}
          />
        </View>
        <Text style={styles.categoryLabel}>{category.label}</Text>
      </AnimatedTouchable>
    </Animated.View>
  );
}

function ExpenseItem({
  expense,
  category,
  isExpanded,
  onToggle,
  onDelete,
  index,
}: {
  expense: Expense;
  category: (typeof CATEGORIES)[number];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  index: number;
}) {
  const { animatedStyle, pressIn, pressOut } = useSpringPress();
  const formattedDate = useMemo(() => {
    try {
      return new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return expense.date;
    }
  }, [expense.date]);

  return (
    <Animated.View entering={FadeInUp.duration(300).delay(index * 40).springify().damping(18)}>
      <AnimatedTouchable
        onPressIn={pressIn}
        onPressOut={() => { pressOut(); onToggle(); }}
        activeOpacity={1}
        style={[styles.expenseItem, animatedStyle]}
      >
        <View style={styles.expenseLeft}>
          <Text style={styles.expenseDate}>{formattedDate}</Text>
        </View>
        <View style={styles.expenseCenter}>
          <View style={styles.expenseDescRow}>
            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
            <Text style={styles.expenseDesc} numberOfLines={1}>{expense.description}</Text>
          </View>
        </View>
        <Text style={styles.expenseAmount}>-${expense.amount.toFixed(2)}</Text>
        {isExpanded && (
          <Animated.View entering={StretchInY.duration(200).springify().damping(20)} style={styles.expenseActions}>
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} activeOpacity={0.7}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </AnimatedTouchable>
    </Animated.View>
  );
}

export default function ExpenseHubScreen() {
  const router = useRouter();
  const { trip } = useTrip();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState<string>('food');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [adding, setAdding] = useState(false);

  const tid = trip.tripId;

  useEffect(() => {
    if (!tid) { setLoading(false); return; }
    (async () => {
      try {
        const data = await expensesApi.list(tid);
        if (Array.isArray(data)) setExpenses(data);
      } catch {}
      setLoading(false);
    })();
  }, [tid]);

  const totals = useMemo(() => {
    const map: CategoryTotals = {};
    CATEGORIES.forEach((c) => { map[c.key] = { spent: 0, count: 0 }; });
    expenses.forEach((e) => {
      if (map[e.category]) {
        map[e.category].spent += e.amount;
        map[e.category].count += 1;
      } else {
        map[e.category] = { spent: e.amount, count: 1 };
      }
    });
    return map;
  }, [expenses]);

  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const budget = trip.budget || 0;
  const budgetProgress = budget > 0 ? Math.min(totalSpent / budget, 1) : 0;
  const remaining = budget - totalSpent;
  const isOverBudget = remaining < 0;

  const groupedExpenses = useMemo(() => {
    const groups: { category: string; expenses: Expense[] }[] = [];
    CATEGORIES.forEach((c) => {
      const items = expenses.filter((e) => e.category === c.key);
      if (items.length > 0) groups.push({ category: c.key, expenses: items });
    });
    return groups;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!activeCategory) return groupedExpenses;
    return groupedExpenses.filter((g) => g.category === activeCategory);
  }, [groupedExpenses, activeCategory]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleDeleteExpense = useCallback((expenseId: string) => {
    if (!tid) return;
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
          try {
            await expensesApi.remove(tid, expenseId);
          } catch {
            setExpenses((prev) => [...prev]);
          }
        },
      },
    ]);
  }, [tid]);

  const handleAddExpense = useCallback(async () => {
    if (!tid) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Invalid amount', 'Please enter a valid amount.'); return; }
    if (!formDescription.trim()) { Alert.alert('Missing description', 'Please enter a description.'); return; }
    setAdding(true);
    const tempId = `temp_${Date.now()}`;
    const newExpense: Expense = {
      id: tempId,
      category: formCategory,
      amount,
      description: formDescription.trim(),
      date: formDate,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setShowForm(false);
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    try {
      const created = await expensesApi.create(tid, {
        category: formCategory,
        amount,
        description: formDescription.trim(),
        date: formDate,
      });
      setExpenses((prev) => prev.map((e) => (e.id === tempId ? { ...e, id: created.id } : e)));
    } catch {
      setExpenses((prev) => prev.filter((e) => e.id !== tempId));
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    }
    setAdding(false);
  }, [tid, formCategory, formAmount, formDescription, formDate]);

  const handleCategorySelect = useCallback((key: string) => {
    setActiveCategory((prev) => (prev === key ? null : key));
  }, []);

  const getCategoryByKey = useCallback((key: string) => {
    return CATEGORIES.find((c) => c.key === key) || CATEGORIES[5];
  }, []);

  const formatCurrency = (val: number) => {
    return `$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Expense Hub</Text>
          <Text style={styles.headerSubtitle}>
            {budget > 0
              ? `${((totalSpent / budget) * 100).toFixed(0)}% of budget used`
              : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={[styles.headerBadgeText, isOverBudget && { color: colors.error }]}>
            {budget > 0 ? formatCurrency(totalSpent) : '$0'}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={cardEntrance.delay(100)} style={styles.budgetCard}>
          <Text style={styles.budgetTitle}>Budget Overview</Text>
          <View style={styles.budgetMain}>
            <CircularProgress progress={budgetProgress} size={130} strokeWidth={14}>
              <Text style={styles.circularAmount}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.circularLabel}>of {formatCurrency(budget)}</Text>
            </CircularProgress>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetStatus}>
                {budget > 0
                  ? isOverBudget
                    ? 'Overspent'
                    : 'Remaining'
                  : 'No budget set'}
              </Text>
              <Text style={[styles.budgetValue, isOverBudget && { color: colors.error }]}>
                {budget > 0
                  ? `${isOverBudget ? '-' : '+'}${formatCurrency(remaining)}`
                  : formatCurrency(totalSpent)}
              </Text>
              <Text style={styles.budgetMeta}>
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.legendRow}>
            {CATEGORIES.map((c) => {
              const spent = totals[c.key]?.spent || 0;
              if (spent === 0) return null;
              return (
                <View key={c.key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                  <Text style={styles.legendLabel}>{c.emoji}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={sectionEntrance.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {CATEGORIES.map((c, idx) => (
              <CategoryCard
                key={c.key}
                category={c}
                spent={totals[c.key]?.spent || 0}
                totalBudget={budget || totalSpent || 1}
                isActive={activeCategory === c.key}
                onPress={() => handleCategorySelect(c.key)}
                index={idx}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={sectionEntrance.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {activeCategory
              ? `${getCategoryByKey(activeCategory).emoji} ${getCategoryByKey(activeCategory).label}`
              : 'All Expenses'}
          </Text>
          {loading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyTitle}>Loading expenses...</Text>
            </View>
          ) : filteredExpenses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyDesc}>Tap + to add your first expense</Text>
            </View>
          ) : (
            <View style={styles.expenseGroups}>
              {filteredExpenses.map((group) => {
                const cat = getCategoryByKey(group.category);
                const groupTotal = group.expenses.reduce((s, e) => s + e.amount, 0);
                return (
                  <View key={group.category} style={styles.expenseGroup}>
                    <View style={styles.expenseGroupHeader}>
                      <View style={styles.expenseGroupLeft}>
                        <Text style={styles.expenseGroupEmoji}>{cat.emoji}</Text>
                        <Text style={styles.expenseGroupLabel}>{cat.label}</Text>
                      </View>
                      <Text style={styles.expenseGroupTotal}>${groupTotal.toFixed(2)}</Text>
                    </View>
                    {group.expenses.map((expense, idx) => (
                      <ExpenseItem
                        key={expense.id}
                        expense={expense}
                        category={cat}
                        isExpanded={expandedId === expense.id}
                        onToggle={() => handleToggleExpand(expense.id)}
                        onDelete={() => handleDeleteExpense(expense.id)}
                        index={idx}
                      />
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Animated.View entering={ZoomIn.duration(300).springify().damping(14)} style={styles.fabContainer}>
        <AnimatedTouchable
          onPress={() => setShowForm(true)}
          activeOpacity={1}
          style={styles.fab}
        >
          <Text style={styles.fabIcon}>+</Text>
        </AnimatedTouchable>
      </Animated.View>

      <BottomSheet visible={showForm} title="Add Expense">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setFormCategory(c.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.categoryChip,
                    formCategory === c.key && { backgroundColor: c.color + '30', borderColor: c.color },
                  ]}
                >
                  <Text style={styles.categoryChipEmoji}>{c.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      formCategory === c.key && { color: colors.text },
                    ]}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Amount</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputCurrency}>$</Text>
              <TextInput
                style={styles.input}
                value={formAmount}
                onChangeText={setFormAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="What was this for?"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.formLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={formDate}
              onChangeText={setFormDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
            />

            <Button
              title={adding ? 'Adding...' : 'Add Expense'}
              onPress={handleAddExpense}
              loading={adding}
              disabled={adding}
              style={styles.submitBtn}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backArrow: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  headerBadgeText: {
    ...typography.captionBold,
    color: colors.accent,
  },
  budgetCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  budgetTitle: {
    ...typography.captionBold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  budgetMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  circularAmount: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: -0.3,
  },
  circularLabel: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
  },
  budgetInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  budgetStatus: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  budgetValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: -0.5,
  },
  budgetMeta: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 14,
  },
  section: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  categoryScrollContent: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryAmount: {
    ...typography.h3,
    color: colors.text,
    letterSpacing: -0.2,
  },
  categoryBarBg: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryLabel: {
    ...typography.small,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  expenseGroups: {
    gap: spacing.xl,
  },
  expenseGroup: {
    gap: spacing.sm,
  },
  expenseGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  expenseGroupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expenseGroupEmoji: {
    fontSize: 16,
  },
  expenseGroupLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  expenseGroupTotal: {
    ...typography.captionBold,
    color: colors.text,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  expenseLeft: {
    width: 56,
  },
  expenseDate: {
    ...typography.small,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  expenseCenter: {
    flex: 1,
  },
  expenseDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expenseDesc: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  expenseAmount: {
    ...typography.bodyBold,
    color: colors.error,
    marginLeft: spacing.md,
  },
  expenseActions: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: colors.error + '25',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  deleteBtnText: {
    ...typography.small,
    color: colors.error,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
  },
  emptyDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xl,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 30,
  },
  formScroll: {
    maxHeight: 420,
  },
  formLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputCurrency: {
    ...typography.h2,
    color: colors.textTertiary,
    paddingLeft: spacing.lg,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  submitBtn: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
