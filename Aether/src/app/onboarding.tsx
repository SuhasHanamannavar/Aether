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
import Animated, { FadeInUp } from 'react-native-reanimated';
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
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: '5-star stays and fine dining',
    emoji: '✨',
    color: '#E8A87C',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Kid-friendly fun for everyone',
    emoji: '👨‍👩‍👧‍👦',
    color: '#F59E0B',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Hikes, dives, and extreme sports',
    emoji: '🏔️',
    color: '#EF4444',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Animated.View entering={FadeInUp.duration(600).springify()}>
          <Text style={styles.welcome}>Welcome to</Text>
          <Text style={styles.title}>Aether</Text>
          <Text style={styles.subtitle}>
            Your intelligent travel companion
          </Text>
        </Animated.View>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.question}>What kind of traveler are you?</Text>
        <StaggerContainer staggerDelay={100} duration={400} style={styles.cardsContainer}>
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
                    backgroundColor: type.color,
                    borderColor: type.color,
                  },
                ]}
              >
                <Text style={styles.cardEmoji}>{type.emoji}</Text>
                <View style={styles.cardText}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isSelected && { color: '#FFFFFF' },
                    ]}
                  >
                    {type.name}
                  </Text>
                  <Text
                    style={[
                      styles.cardDesc,
                      isSelected && { color: 'rgba(255,255,255,0.8)' },
                    ]}
                  >
                    {type.description}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </StaggerContainer>
      </View>

      <View style={styles.bottomSection}>
        <Button
          title="Continue"
          onPress={() => router.push('/integrations')}
          disabled={!selectedType}
          size="lg"
          style={styles.continueBtn}
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
  topSection: {
    paddingTop: spacing.huge,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  welcome: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.display,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  question: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xl,
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
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: spacing.lg,
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
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  continueBtn: {
    width: '100%',
  },
});
