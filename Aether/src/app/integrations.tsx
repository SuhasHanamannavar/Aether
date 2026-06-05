import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography } from '../theme/tokens';
import Button from '../components/Button';
import ToggleRow from '../components/ToggleRow';
import StepProgressBar from '../components/StepProgressBar';
import type { Integration } from '../components/ToggleRow';
import { useUser } from '../context/UserContext';
import { usersApi } from '../services/api';

const integrations: Integration[] = [
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Check availability & avoid double-booking',
    emoji: '📅',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Share your journey with one tap',
    emoji: '📸',
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Track budget & trip spending',
    emoji: '💰',
  },
];

export default function IntegrationsScreen() {
  const router = useRouter();
  const { userId } = useUser();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    calendar: false,
    instagram: false,
    finance: false,
  });
  const [saving, setSaving] = useState(false);

  const toggleSwitch = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGetStarted = async () => {
    if (!userId || saving) return;
    setSaving(true);
    try {
      await usersApi.updateIntegrations(userId, toggles);
    } catch { /* silent */ }
    setSaving(false);
    router.replace('/dream');
  };

  const handleSkip = async () => {
    router.replace('/dream');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.topSection}>
          <StepProgressBar currentStep={2} totalSteps={4} />
        </Animated.View>

        <View style={styles.headerSection}>
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <Text style={styles.title}>Optional Integrations</Text>
            <Text style={styles.subtitle}>
              Connect your accounts for a smarter experience
            </Text>
          </Animated.View>
        </View>

        <View style={styles.toggleSection}>
          {integrations.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInUp.duration(400).delay(200 + index * 100)}
            >
              <ToggleRow
                integration={item}
                enabled={toggles[item.id]}
                onToggle={() => toggleSwitch(item.id)}
              />
            </Animated.View>
          ))}

          <Animated.View entering={FadeInUp.duration(400).delay(500)}>
            <Text style={styles.hint}>
              You can always connect these later in Settings
            </Text>
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={FadeInUp.duration(400).delay(600)}
        style={styles.bottom}
      >
        <Button
          title={saving ? 'Saving...' : 'Get Started'}
          onPress={handleGetStarted}
          size="lg"
          style={styles.continueBtn}
        />
        <Button
          title="Skip"
          onPress={handleSkip}
          variant="ghost"
          size="md"
          style={styles.skipBtn}
        />
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
    ...typography.h1,
    color: colors.textInverse,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: spacing.sm,
  },
  toggleSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    justifyContent: 'center',
    flex: 1,
  },
  hint: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  bottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  continueBtn: {
    width: '100%',
  },
  skipBtn: {
    width: '100%',
  },
});
