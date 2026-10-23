import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { fonts } from '../styles/common';
import {
  Server,
  Globe,
  Wifi,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  Radio,
} from 'lucide-react-native';
import { getBaseUrl, setBaseUrl, normalizeBaseUrl, testConnection } from '../utils/api';

interface ServerConfigScreenProps {
  onConnected: (url: string) => void;
  canCancel?: boolean;
  onCancel?: () => void;
}

const PRESET_OPTIONS = [
  {
    label: 'Remote Server',
    ip: 'Hosted Test Server ',
    fullUrl: 'https://miniledger-kyjz.onrender.com/',
    desc: 'Use 123987 as OTP',
  },
  {
    label: 'Android Emulator',
    ip: '10.0.2.2:5000',
    fullUrl: 'http://10.0.2.2:5000/api',
    desc: 'Official Android Studio AVD',
  },
  {
    label: 'Localhost',
    ip: 'localhost:5000',
    fullUrl: 'http://localhost:5000/api',
    desc: 'Local machine loopback',
  },
];

export function ServerConfigScreen({
  onConnected,
  canCancel = false,
  onCancel,
}: ServerConfigScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);
  const [serverUrl, setServerUrl] = useState<string>(getBaseUrl());
  const [testing, setTesting] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

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

  const handleSelectPreset = (url: string) => {
    setServerUrl(url);
    setTestResult({ status: 'idle' });
  };

  const handleTestConnection = async () => {
    const raw = serverUrl.trim();
    if (!raw) {
      setTestResult({ status: 'error', message: 'Please enter a server URL' });
      return;
    }

    setTesting(true);
    setTestResult({ status: 'idle' });

    const result = await testConnection(raw);
    setTesting(false);

    if (result.ok) {
      setTestResult({
        status: 'success',
        message: result.message || 'Connected to MiniLedger backend!',
      });
    } else {
      setTestResult({
        status: 'error',
        message: result.message || 'Could not connect. Verify backend is running.',
      });
    }
  };

  const handleConnect = () => {
    const raw = serverUrl.trim();
    if (!raw) {
      setTestResult({ status: 'error', message: 'Please enter a server URL' });
      return;
    }

    const finalUrl = setBaseUrl(raw);
    onConnected(finalUrl);
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
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom:
              keyboardHeight > 0
                ? keyboardHeight + 40
                : Math.max(insets.bottom, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Cancel / Dismiss button if opened from Login */}
        {canCancel && onCancel && (
          <TouchableOpacity
            style={styles.cancelHeaderButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.onSurfaceVariant} />
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Hero Illustration Card */}
        <View style={styles.heroContainer}>
          <View style={styles.heroCard}>
            <View style={styles.serverIconBox}>
              <Server size={32} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.radioPulse}>
              <Radio size={16} color={colors.tertiaryFixedDim} />
            </View>
          </View>
          <Text style={styles.title}>Backend Connection</Text>
          <Text style={styles.subtitle}>
            Connect MiniLedger to your backend API server to synchronize loans and ledger entries.
          </Text>
        </View>

        {/* Server URL Input Box */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>SERVER API URL</Text>

          <View style={styles.inputWrapper}>
            <Globe size={18} color={colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. http://192.168.29.158:5000/api"
              placeholderTextColor={colors.outline}
              value={serverUrl}
              onChangeText={(val) => {
                setServerUrl(val);
                if (testResult.status !== 'idle') {
                  setTestResult({ status: 'idle' });
                }
              }}
              onFocus={() => scrollToInput(110)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            {serverUrl.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setServerUrl('');
                  setTestResult({ status: 'idle' });
                }}
                style={styles.clearButton}
              >
                <X size={15} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>

          {/* Test Status Indicator */}
          {testResult.status === 'success' && (
            <View style={styles.successBanner}>
              <CheckCircle2 size={18} color="#008565" />
              <Text style={styles.successText}>{testResult.message}</Text>
            </View>
          )}

          {testResult.status === 'error' && (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={colors.error} />
              <Text style={styles.errorText}>{testResult.message}</Text>
            </View>
          )}

          {/* Test Connection Button */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestConnection}
            disabled={testing}
            activeOpacity={0.8}
          >
            {testing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <RefreshCw size={15} color={colors.primary} />
                <Text style={styles.testButtonText}>Test Connection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Presets List */}
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsHeader}>QUICK PRESETS</Text>
          {PRESET_OPTIONS.map((preset, index) => {
            const isSelected =
              normalizeBaseUrl(serverUrl) === normalizeBaseUrl(preset.fullUrl);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.presetItem,
                  isSelected && styles.presetItemSelected,
                ]}
                onPress={() => handleSelectPreset(preset.fullUrl)}
                activeOpacity={0.7}
              >
                <View style={styles.presetLeft}>
                  <View
                    style={[
                      styles.presetIconWrap,
                      isSelected && styles.presetIconWrapSelected,
                    ]}
                  >
                    <Wifi
                      size={16}
                      color={isSelected ? '#FFFFFF' : colors.primary}
                    />
                  </View>
                  <View style={styles.presetTextGroup}>
                    <Text
                      style={[
                        styles.presetTitle,
                        isSelected && styles.presetTitleSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text style={styles.presetSub}>{preset.ip}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.activeCheck}>
                    <CheckCircle2 size={18} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnect}
          activeOpacity={0.85}
        >
          <Text style={styles.connectButtonText}>Connect & Continue</Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
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
    flexGrow: 1,
  },
  cancelHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.onSurfaceVariant,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  heroCard: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  serverIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioPulse: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.onSurface,
    paddingVertical: 10,
  },
  clearButton: {
    padding: 6,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 12,
  },
  testButtonText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDFFF8',
    borderColor: '#7EF9CD',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  successText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#00694F',
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2F2',
    borderColor: '#FFDADB',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.error,
    flex: 1,
  },
  presetsContainer: {
    marginBottom: 24,
  },
  presetsHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  presetItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLow,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetIconWrapSelected: {
    backgroundColor: colors.primary,
  },
  presetTextGroup: {
    justifyContent: 'center',
  },
  presetTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.onSurface,
  },
  presetTitleSelected: {
    color: colors.primary,
  },
  presetSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  activeCheck: {
    marginLeft: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 'auto',
  },
  connectButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
});
