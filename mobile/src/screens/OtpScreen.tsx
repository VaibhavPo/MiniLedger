import React, { useState, useEffect, useRef } from 'react';
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
import { authService, User } from '../services/authService';
import { colors } from '../styles/colors';
import { typography, fonts } from '../styles/common';
import { ArrowLeft, Mail, ShieldCheck, Check } from 'lucide-react-native';

interface OtpScreenProps {
  email: string;
  onVerifySuccess: (user: User, token: string) => void;
  onBack: () => void;
}

export function OtpScreen({ email, onVerifySuccess, onBack }: OtpScreenProps) {
  const scrollViewRef = useRef<any>(null);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(42);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const inputRefs = useRef<any[]>([]);

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

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleDigitChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newDigits = [...digits];

    if (cleaned.length > 1) {
      // Pasted full OTP
      const pasted = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      if (pasted.length === 6) {
        inputRefs.current[5]?.blur();
      } else {
        inputRefs.current[pasted.length]?.focus();
      }
      return;
    }

    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullOtp = digits.join('');

  const handleVerify = async () => {
    if (fullOtp.length < 6) {
      Alert.alert('Required', 'Please enter all 6 digits of your verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyOtp(email, fullOtp);
      onVerifySuccess(res.user, res.token);
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    try {
      setResending(true);
      await authService.login(email);
      setCountdown(42);
      Alert.alert('Code Sent', 'A fresh 6-digit code has been sent to your email.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 30 : 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Top Bar with Back Arrow */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={colors.textPrimary} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Verification Code</Text>
          <View style={styles.personBadge}>
            <ShieldCheck size={14} color={colors.primary} strokeWidth={2.4} />
          </View>
        </View>

        {/* Tactile Pastel Glow Icon Frame */}
        <View style={styles.heroFrame}>
          <View style={styles.heroOuterCircle}>
            <View style={styles.heroInnerCircle}>
              <Mail size={26} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.heroLockBadge}>
              <ShieldCheck size={13} color="#FFFFFF" strokeWidth={2.6} />
            </View>
          </View>
        </View>

        {/* Title & Humanized Subtitle */}
        <View style={styles.headingSection}>
          <Text style={styles.title}>Verify your email</Text>
          <View style={styles.emailRow}>
            <Text style={styles.sentPrompt}>We sent a 6-digit code to</Text>
            <Text style={styles.emailAddress}>{email}</Text>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ambient Card Container for OTP Input */}
        <View style={styles.card}>
          {/* 6 Discrete Input Boxes */}
          <View style={styles.boxesRow}>
            {digits.map((digit, idx) => {
              const isFilled = digit.length > 0;
              return (
                <TextInput
                  key={idx}
                  ref={(ref: any) => {
                    inputRefs.current[idx] = ref;
                  }}
                  style={[
                    styles.digitBox,
                    isFilled && styles.digitBoxFilled,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  onFocus={() => scrollToInput(100)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              );
            })}
          </View>

          {/* Security Micro-Trust Tag */}
          <View style={styles.securityTag}>
            <Text style={styles.shieldIcon}>🛡️</Text>
            <Text style={styles.securityText}>End-to-End Encrypted Session</Text>
          </View>
        </View>

        {/* Resend Timer State */}
        <View style={styles.timerRow}>
          {countdown > 0 ? (
            <View style={styles.timerPill}>
              <Text style={styles.clockIcon}>⏱️</Text>
              <Text style={styles.timerText}>
                Resend code in <Text style={styles.timerBold}>0:{countdown < 10 ? `0${countdown}` : countdown}</Text>
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={resending}
              style={styles.resendBtn}
            >
              <Text style={styles.resendBtnText}>
                {resending ? 'Sending...' : 'Send code again'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Primary CTA Action Pill */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>Verify & Get Started</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* Peer Support Micro-Help Notice */}
        <View style={styles.helpRow}>
          <Text style={styles.helpText}>Didn't receive an email? </Text>
          <TouchableOpacity onPress={() => Alert.alert('Tip', 'If you are using remote server than use 123987 as OTP.')}>
            <Text style={styles.spamTip}>Tip</Text>
          </TouchableOpacity>
        </View>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backArrow: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  personBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personIcon: {
    fontSize: 14,
  },
  heroFrame: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroOuterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  heroInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmailIcon: {
    fontSize: 22,
  },
  heroLockBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
  lockIcon: {
    fontSize: 12,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  emailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  sentPrompt: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emailAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
    alignItems: 'center',
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
    gap: 8,
  },
  digitBox: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLow,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  digitBoxFilled: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.primaryContainer,
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  securityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  shieldIcon: {
    fontSize: 13,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  clockIcon: {
    fontSize: 13,
  },
  timerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timerBold: {
    fontWeight: '700',
    color: colors.primary,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    paddingLeft: 4,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  helpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  spamTip: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
