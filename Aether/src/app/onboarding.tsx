import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import StaggerContainer from '../components/StaggerContainer';

const { width } = Dimensions.get('window');

const travelerTypes = [
  {
    id: 'backpacker',
    name: 'Backpacker',
    description: 'Hostels, trains, and local eats',
    emoji: '🎒',
    color: '#41B3A3',
    accent: '#E8F5F3',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: '5-star stays and fine dining',
    emoji: '✨',
    color: '#E8A87C',
    accent: '#FEF5EF',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Kid-friendly fun for everyone',
    emoji: '👨‍👩‍👧‍👦',
    color: '#F59E0B',
    accent: '#FFF8ED',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Hikes, dives, and extreme sports',
    emoji: '🏔️',
    color: '#EF4444',
    accent: '#FEF2F2',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          entering={FadeInUp.duration(600).springify()}
          style={styles.header}
        >
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Step 1 of 2</Text>
          </View>
          <Text style={styles.welcome}>Welcome to</Text>
          <Text style={styles.title}>Zelo</Text>
          <Text style={styles.subtitle}>
            Your intelligent travel planner
          </Text>
        </Animated.View>

        <StaggerContainer
          staggerDelay={100}
          duration={400}
          style={styles.cardsContainer}
        >
          {travelerTypes.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedType(type.id)}
                activeOpacity={0.9}
                style={[
                  styles.travelerCard,
                  isSelected && {
                    backgroundColor: type.accent,
                    borderColor: type.color,
                    borderWidth: 2,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardEmojiContainer,
                    isSelected && { backgroundColor: type.color },
                  ]}
                >
                  <Text style={styles.cardEmoji}>{type.emoji}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isSelected && { color: type.color },
                    ]}
                  >
                    {type.name}
                  </Text>
                  <Text style={styles.cardDesc}>
                    {type.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.cardCheck,
                    isSelected && {
                      backgroundColor: type.color,
                      borderColor: type.color,
                    },
                  ]}
                >
                  <Text style={styles.checkMark}>
                    {isSelected ? '✓' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </StaggerContainer>
      </View>

      <Animated.View
        entering={FadeInUp.duration(400).delay(500)}
        style={styles.bottom}
      >
        <Button
          title="Continue"
          onPress={() => router.push('/integrations')}
          disabled={!selectedType}
          size="lg"
          style={styles.continueBtn}
        />
        <TouchableOpacity
          onPress={() => router.push('/integrations')}
          style={styles.skipRow}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
  },
  stepText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  welcome: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cardsContainer: {
    gap: spacing.md,
  },
  travelerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  cardDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    alignItems: 'center',
  },
  continueBtn: {
    width: '100%',
  },
  skipRow: {
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.body,
    color: colors.textTertiary,
  },
});
