import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import { cognitoAuth } from '../services/cognito';

export default function ConfirmScreen() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();
  const attemptEmail = paramEmail || '';
  const [email, setEmail] = useState(attemptEmail);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const fullCode = code.join('');

  const handleCodeChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    if (fullCode.length !== 6 || !email) return;
    setIsLoading(true);
    setError('');
    try {
      await cognitoAuth.confirmSignUp(email, fullCode);
      router.replace('/login');
    } catch (err: any) {
      if (err.code === 'CodeMismatchException') {
        setError('Invalid code. Please try again.');
      } else if (err.code === 'ExpiredCodeException') {
        setError('Code expired. Request a new one.');
      } else {
        setError(err.message || 'Verification failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError('');
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          entering={FadeInUp.duration(600).springify()}
          style={styles.header}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>✉️</Text>
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{' '}
            <Text style={styles.emailHighlight}>
              {email || 'your email'}
            </Text>
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(200).springify()}
          style={styles.codeSection}
        >
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!attemptEmail ? (
            <View style={styles.emailInputContainer}>
              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ) : null}

          <View style={styles.codeRow}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <Button
            title="Verify Email"
            onPress={handleConfirm}
            size="lg"
            loading={isLoading}
            disabled={fullCode.length !== 6 || !email}
            style={styles.verifyBtn}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(500).springify()}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconEmoji: {
    fontSize: 32,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emailHighlight: {
    color: colors.accent,
    fontWeight: '600',
  },
  codeSection: {
    gap: spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: spacing.sm,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  emailInputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  emailInput: {
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    ...shadows.sm,
  },
  codeInputFilled: {
    borderColor: colors.accent,
    backgroundColor: '#F0FDFA',
  },
  verifyBtn: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  resendLink: {
    ...typography.bodyBold,
    color: colors.accent,
  },
});
