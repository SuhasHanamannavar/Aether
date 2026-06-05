import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '../theme/tokens';
import Button from '../components/Button';
import TravelerTypeCard from '../components/TravelerTypeCard';
import StepProgressBar from '../components/StepProgressBar';
import type { TravelerType } from '../components/TravelerTypeCard';
import { useUser } from '../context/UserContext';
import { usersApi } from '../services/api';

const travelerTypes: TravelerType[] = [
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
  const { userId } = useUser();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selectedType || !userId || saving) return;
    setSaving(true);
    try {
      await usersApi.update(userId, { travelerType: selectedType, onboardingComplete: true });
    } catch { /* silent */ }
    setSaving(false);
    router.push('/integrations');
  };

  const handleSkip = () => {
    router.push('/integrations');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.topSection}>
          <StepProgressBar currentStep={1} totalSteps={4} />
        </Animated.View>

        <View style={styles.headerSection}>
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <Text style={styles.title}>
              What kind of{'\n'}traveler are you?
            </Text>
            <Text style={styles.subtitle}>
              Choose your style, we'll handle the rest
            </Text>
          </Animated.View>
        </View>

        <View style={styles.cardsSection}>
          {travelerTypes.map((type, index) => (
            <Animated.View
              key={type.id}
              entering={FadeInUp.duration(400).delay(200 + index * 100)}
            >
              <TravelerTypeCard
                type={type}
                selected={selectedType === type.id}
                onPress={() => setSelectedType(type.id)}
              />
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View
        entering={FadeInUp.duration(400).delay(600)}
        style={styles.bottom}
      >
        <Button
          title={saving ? 'Saving...' : 'Continue'}
          onPress={handleContinue}
          disabled={!selectedType || saving}
          size="lg"
          style={styles.continueBtn}
        />
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipRow}
        >
          <Text style={styles.skipText}>I'll decide later</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4A2D',
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  topSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  headerSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  cardsSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
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
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
});
