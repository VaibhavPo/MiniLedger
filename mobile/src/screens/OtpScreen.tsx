import React, { useState } from 'react';
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
} from 'react-native';
import { authService, User } from '../services/authService';
import { colors } from '../styles/colors';
import { commonStyles, typography } from '../styles/common';

interface OtpScreenProps {
  email: string;
  onVerifySuccess: (user: User, token: string) => void;
  onBack: () => void;
}

export function OtpScreen({ email, onVerifySuccess, onBack }: OtpScreenProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      Alert.alert('Required', 'Please enter the verification OTP.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyOtp(email, trimmedOtp);
      onVerifySuccess(res.user, res.token);
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Enter OTP Code</Text>
        <Text style={styles.subtitle}>
          A 6-digit code was sent to{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        <View style={styles.field}>
          <Text style={commonStyles.inputLabel}>Verification Code</Text>
          <TextInput
            style={[commonStyles.input, styles.otpInput]}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[commonStyles.buttonPrimary, loading && commonStyles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={commonStyles.buttonPrimaryText}>Verify & Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading}>
          <Text style={styles.backText}>Change email address</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
  },
  field: {
    marginBottom: 20,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: typography.xxl,
    letterSpacing: 8,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.fontMedium,
  },
});
