import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows } from '../theme/tokens';
import Button from '../components/Button';
import { cognitoAuth } from '../services/cognito';

export default function SignUpScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const isValid =
    fullName.length > 0 &&
    email.includes('@') &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSignUp = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setError('');
    try {
      const [givenName, ...rest] = fullName.trim().split(' ');
      const familyName = rest.join(' ');
      await cognitoAuth.signUp(email, password, givenName, familyName);
      router.push({ pathname: '/confirm', params: { email } });
    } catch (err: any) {
      if (err.code === 'UsernameExistsException') {
        setError('An account with this email already exists. Please sign in.');
      } else if (err.code === 'InvalidPasswordException') {
        setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      } else {
        setError(err.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={styles.header}
          >
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>Step 1 of 2</Text>
            </View>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join Zelo and start planning smarter trips
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(200).springify()}
            style={styles.form}
          >
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
                {fullName.length > 0 && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                {email.includes('@') && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {password.length > 0 && password.length < 8 && (
                <Text style={styles.hint}>
                  {8 - password.length} more characters needed
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                {confirmPassword.length > 0 && (
                  <Text
                    style={[
                      styles.checkMark,
                      { color: password === confirmPassword ? colors.success : colors.error },
                    ]}
                  >
                    {password === confirmPassword ? '✓' : '✗'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.termsRow}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            <Button
              title="Create Account"
              onPress={handleSignUp}
              size="lg"
              loading={isLoading}
              disabled={!isValid}
              style={styles.signUpBtn}
            />
          </Animated.View>
        </ScrollView>

        <Animated.View
          entering={FadeInDown.duration(400).delay(500).springify()}
          style={styles.footer}
        >
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign In</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
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
  title: {
    ...typography.display,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
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
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  eyeButton: {
    padding: spacing.sm,
  },
  eyeIcon: {
    fontSize: 18,
  },
  checkMark: {
    ...typography.bodyBold,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  hint: {
    ...typography.small,
    color: colors.warning,
    marginTop: -spacing.xs,
  },
  termsRow: {
    marginTop: spacing.sm,
  },
  termsText: {
    ...typography.small,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.accent,
    fontWeight: '600',
  },
  signUpBtn: {
    width: '100%',
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.bodyBold,
    color: colors.accent,
  },
});
