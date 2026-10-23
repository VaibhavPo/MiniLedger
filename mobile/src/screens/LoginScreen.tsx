import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { authService } from '../services/authService';
import { colors } from '../styles/colors';
import { fonts } from '../styles/common';
import {
  Wallet,
  Mail,
  User as UserIcon,
  ArrowRight,
  Lock,
  X,
  Check,
  Server,
  UserPlus,
  LogIn,
} from 'lucide-react-native';
import { getBaseUrl } from '../utils/api';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
  onChangeServer?: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER';

export function LoginScreen({ onLoginSuccess, onChangeServer }: LoginScreenProps) {
  const scrollViewRef = useRef<any>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: yOffset,
        animated: true,
      });
    }, 120);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Required', 'Please enter your email.');
      return;
    }

    try {
      setLoading(true);
      await authService.login(trimmedEmail);
      onLoginSuccess(trimmedEmail);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('no account found')) {
        Alert.alert(
          'Account Not Found',
          'No account exists with this email. Would you like to create an account now?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Create Account',
              onPress: () => setAuthMode('REGISTER'),
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', err.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await authService.register(trimmedName, trimmedEmail);
      onLoginSuccess(trimmedEmail);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already exists')) {
        Alert.alert(
          'Account Exists',
          'An account already exists with this email. Please sign in instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              onPress: () => setAuthMode('LOGIN'),
            },
          ]
        );
      } else {
        Alert.alert('Registration Failed', err.message || 'Unable to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isRegister = authMode === 'REGISTER';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Delight Hero Graphic */}
        <View style={styles.heroGraphicContainer}>
          <View style={styles.ambientBlob} />
          <View style={styles.heroWalletCard}>
            <View style={styles.walletInner}>
              <Wallet size={26} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.floatingBadgeTop}>
              <Check size={13} color="#FFFFFF" strokeWidth={3} />
            </View>
            <View style={styles.floatingBadgeBottom}>
              <Text style={styles.badgeEmoji}>♥</Text>
            </View>
          </View>
        </View>

        {/* Welcoming Header */}
        <View style={styles.welcomeSection}>
          <View style={styles.peerPill}>
            <Text style={styles.handWave}>{isRegister ? '✨' : '👋'}</Text>
            <Text style={styles.peerPillText}>PEER-TO-PEER HUB</Text>
          </View>
          <Text style={styles.headline}>
            {isRegister ? 'Create Account' : 'Welcome back!'}
          </Text>
          <Text style={styles.subheadline}>
            {isRegister
              ? 'Enter your name and email to start your peer ledger.'
              : 'Enter your email to access your peer ledger.'}
          </Text>
        </View>

        {/* Mode Switcher Tabs */}
        <View style={styles.modeTabsContainer}>
          <TouchableOpacity
            style={[styles.modeTab, !isRegister && styles.modeTabActive]}
            onPress={() => setAuthMode('LOGIN')}
            activeOpacity={0.8}
          >
            <LogIn
              size={15}
              color={!isRegister ? colors.primary : colors.onSurfaceVariant}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.modeTabText,
                !isRegister && styles.modeTabTextActive,
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, isRegister && styles.modeTabActive]}
            onPress={() => setAuthMode('REGISTER')}
            activeOpacity={0.8}
          >
            <UserPlus
              size={15}
              color={isRegister ? colors.primary : colors.onSurfaceVariant}
              strokeWidth={2.2}
            />
            <Text
              style={[
                styles.modeTabText,
                isRegister && styles.modeTabTextActive,
              ]}
            >
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Card Container */}
        <View style={styles.card}>
          {/* Full Name input (Only for Register) */}
          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconBox}>
                  <UserIcon size={16} color={colors.primary} strokeWidth={2.2} />
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Vaibhav Sharma"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => scrollToInput(110)}
                  editable={!loading}
                />
                {name.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={() => setName('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={12} color={colors.textSecondary} strokeWidth={2.6} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Email input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconBox}>
                <Mail size={16} color={colors.primary} strokeWidth={2.2} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => scrollToInput(isRegister ? 180 : 120)}
                editable={!loading}
              />
              {email.length > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setEmail('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={12} color={colors.textSecondary} strokeWidth={2.6} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {isRegister ? 'Create Account & Send Code' : 'Send Login Code'}
                </Text>
                <View style={styles.arrowCircle}>
                  <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.8} />
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Toggle Helper Link */}
          <TouchableOpacity
            style={styles.switchModeLink}
            onPress={() => setAuthMode(isRegister ? 'LOGIN' : 'REGISTER')}
            activeOpacity={0.7}
          >
            <Text style={styles.switchModeText}>
              {isRegister ? 'Already have an account? ' : 'New to MiniLedger? '}
              <Text style={styles.switchModeTextHighlight}>
                {isRegister ? 'Sign In' : 'Create Account'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Micro-guarantee trust pill */}
        <View style={styles.trustPill}>
          <Lock size={13} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.trustText}>Instant, passwordless verification</Text>
        </View>

        {/* Server connection indicator & switcher */}
        {onChangeServer && (
          <TouchableOpacity
            style={styles.serverPill}
            onPress={onChangeServer}
            activeOpacity={0.7}
          >
            <Server size={12} color={colors.primary} />
            <Text style={styles.serverPillText} numberOfLines={1}>
              {getBaseUrl().replace(/^https?:\/\//, '')}
            </Text>
            <Text style={styles.changeServerText}>Change</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
  heroGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  ambientBlob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryLight,
    opacity: 0.6,
  },
  heroWalletCard: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
  },
  walletInner: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  floatingBadgeTop: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tertiaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00694F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingBadgeBottom: {
    position: 'absolute',
    bottom: -4,
    left: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A63648',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeEmoji: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  peerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  handWave: {
    fontSize: 13,
  },
  peerPillText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  headline: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  subheadline: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 270,
    lineHeight: 18,
  },
  modeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 11,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.onSurfaceVariant,
  },
  modeTabTextActive: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1.2,
    borderColor: colors.surfaceVariant,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 10,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeLink: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  switchModeText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  switchModeTextHighlight: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 6,
  },
  trustText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 6,
    maxWidth: '90%',
  },
  serverPillText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.onSurfaceVariant,
    flexShrink: 1,
  },
  changeServerText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
