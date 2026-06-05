import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import StaggerContainer from '../components/StaggerContainer';

const integrations = [
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
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    calendar: false,
    instagram: false,
    finance: false,
  });

  const toggleSwitch = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Animated.View entering={FadeInUp.duration(500).springify()}>
          <Text style={styles.step}>Step 2 of 2</Text>
          <Text style={styles.title}>Optional Integrations</Text>
          <Text style={styles.subtitle}>
            Connect your accounts for a smarter experience
          </Text>
        </Animated.View>
      </View>

      <View style={styles.middleSection}>
        <StaggerContainer staggerDelay={100} duration={400}>
          {integrations.map((item) => (
            <View key={item.id} style={styles.integrationRow}>
              <View style={styles.integrationLeft}>
                <Text style={styles.integrationEmoji}>{item.emoji}</Text>
                <View style={styles.integrationText}>
                  <Text style={styles.integrationName}>{item.name}</Text>
                  <Text style={styles.integrationDesc}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={toggles[item.id]}
                onValueChange={() => toggleSwitch(item.id)}
                trackColor={{ false: colors.border, true: colors.accentLight }}
                thumbColor={toggles[item.id] ? colors.accent : colors.textTertiary}
                ios_backgroundColor={colors.border}
              />
            </View>
          ))}
        </StaggerContainer>

        <View style={styles.skipNote}>
          <Text style={styles.skipText}>
            You can always connect these later in Settings
          </Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Button
          title="Get Started"
          onPress={() => router.replace('/dream')}
          size="lg"
          style={styles.continueBtn}
        />
        <Button
          title="Skip"
          onPress={() => router.replace('/dream')}
          variant="ghost"
          size="md"
          style={styles.skipBtn}
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
  },
  step: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  middleSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  integrationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  integrationEmoji: {
    fontSize: 28,
    marginRight: spacing.lg,
  },
  integrationText: {
    flex: 1,
  },
  integrationName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  integrationDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  skipNote: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  skipText: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  bottomSection: {
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
