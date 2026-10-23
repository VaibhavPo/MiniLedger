import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { loanService } from '../../services/loanService';
import { colors } from '../../styles/colors';
import { typography, fonts } from '../../styles/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ArrowRight, Calendar, User as UserIcon } from 'lucide-react-native';
import { CalendarPickerModal } from '../../components/CalendarPickerModal';

interface AddEntryTabProps {
  onEntryAdded: () => void;
  recentFriendNames?: string[];
  userName?: string;
}

export function AddEntryTab({
  onEntryAdded,
  recentFriendNames = [],
  userName,
}: AddEntryTabProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<any>(null);
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('500');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
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

  const parsedAmount = parseFloat(amount) || 0;

  // Shortcut date calculators
  const setShortcutDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const setEndOfMonth = () => {
    const d = new Date();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setDueDate(end.toISOString().split('T')[0]);
  };

  const handleClear = () => {
    setFriendName('');
    setAmount('500');
    setNotes('');
  };

  const handleSubmit = async () => {
    const trimmedName = friendName.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Please specify who you are lending to.');
      return;
    }

    if (parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid loan amount.');
      return;
    }

    if (!dueDate.trim()) {
      Alert.alert('Required', 'Please select or enter an expected payback date.');
      return;
    }

    try {
      setSubmitting(true);
      await loanService.addLoan({
        friend_name: trimmedName,
        amount: parsedAmount,
        due_date: dueDate.trim(),
        notes: notes.trim() || undefined,
      });

      setSuccessToast(`${trimmedName} logged for ₹${parsedAmount.toLocaleString('en-IN')}`);
      setTimeout(() => {
        setSuccessToast(null);
        handleClear();
        onEntryAdded();
      }, 1500);
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not record loan entry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              keyboardHeight > 0
                ? keyboardHeight + 80
                : 130 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
      >
      {/* Subheader */}
      <View style={styles.header}>
        <Text style={styles.title}>New Loan Entry</Text>
        <Text style={styles.subtitle}>
          Log money lent to friends to keep things clear and friendly
        </Text>
      </View>

      {/* Success Notification Banner */}
      {successToast && (
        <View style={styles.toastBanner}>
          <Check size={16} color="#FFFFFF" strokeWidth={2.8} />
          <Text style={styles.toastText}> {successToast}</Text>
        </View>
      )}

      {/* Tactile Virtual Debit Card Widget */}
      <View style={styles.virtualCard}>
        <View style={styles.cardGlowOverlay} />

        <View style={styles.cardTopRow}>
          <View style={styles.cardChipRow}>
            {/* Golden Chip */}
            <View style={styles.goldChip}>
              <View style={styles.chipLine1} />
              <View style={styles.chipLine2} />
            </View>
            {/* Contactless symbol */}
            <Text style={styles.contactlessIcon}>))</Text>
          </View>
          <View style={styles.cardBrandBadge}>
            <Text style={styles.brandText}>MiniLedger</Text>
            <View style={styles.brandCircles}>
              <View style={[styles.circleDot, { backgroundColor: colors.secondaryContainer }]} />
              <View
                style={[
                  styles.circleDot,
                  { backgroundColor: colors.secondaryFixedDim, marginLeft: -8 },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Masked Card Number */}
        <View style={styles.cardNumberRow}>
          <Text style={styles.cardNumber}>••••   ••••   ••••   1120</Text>
        </View>

        {/* Cardholder & Expiry Row */}
        <View style={styles.cardBottomRow}>
          <View>
            <Text style={styles.cardLabel}>CARDHOLDER NAME</Text>
            <Text style={styles.cardHolderName} numberOfLines={1}>
              {userName?.trim() ? userName.trim().toUpperCase() : 'USER NAME'}
            </Text>
          </View>
          <View style={styles.cardRightMeta}>
            <View style={styles.validThruCol}>
              <Text style={styles.cardLabel}>VALID THRU</Text>
              <Text style={styles.validThruText}>11/28</Text>
            </View>
            <View style={styles.debitPill}>
              <Text style={styles.debitPillText}>DEBIT</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Interactive Form Card */}
      <View style={styles.formCard}>
        {/* Friend Name Section */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Who are you lending to?</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter friend's name or username"
              placeholderTextColor={colors.textMuted}
              value={friendName}
              onChangeText={setFriendName}
              onFocus={() => scrollToInput(150)}
              editable={!submitting}
            />
          </View>

          {/* Quick Friend Suggestions */}
          {recentFriendNames.length > 0 && (
            <View style={styles.recentFriendsRow}>
              <Text style={styles.recentLabel}>Recent:</Text>
              {recentFriendNames.slice(0, 3).map((name) => (
                <TouchableOpacity
                  key={name}
                  style={styles.recentPill}
                  onPress={() => setFriendName(name)}
                >
                  <Text style={styles.recentPillText}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Loan Amount with Big Display Typography */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Loan Amount</Text>
          <View style={styles.bigAmountBox}>
            <Text style={styles.bigRupeeSymbol}>₹</Text>
            <TextInput
              style={styles.bigAmountInput}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              onFocus={() => scrollToInput(280)}
              editable={!submitting}
            />
          </View>

          {/* Quick Amount Preset Chips */}
          <View style={styles.presetChipsGrid}>
            {[100, 500, 1000, 2500].map((preset) => {
              const isActive = parsedAmount === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, isActive && styles.presetChipActive]}
                  onPress={() => setAmount(preset.toString())}
                >
                  <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
                    ₹{preset.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Expected Payback Date */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Expected Payback Date</Text>
          <TouchableOpacity
            style={styles.datePickerInputBox}
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.8}
          >
            <View style={styles.calendarIconBox}>
              <Calendar size={18} color={colors.primary} />
            </View>
            <View style={styles.dateTextGroup}>
              <Text style={styles.dateValueMain}>
                {dueDate ? dueDate : 'Select payback date'}
              </Text>
              {dueDate ? (
                <Text style={styles.dateValueReadable}>
                  {(() => {
                    const parts = dueDate.split('-').map(Number);
                    if (parts.length === 3) {
                      const d = new Date(parts[0], parts[1] - 1, parts[2]);
                      return d.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }
                    return dueDate;
                  })()}
                </Text>
              ) : null}
            </View>
            <View style={styles.openCalendarPill}>
              <Text style={styles.openCalendarPillText}>Calendar</Text>
            </View>
          </TouchableOpacity>


        </View>

        {/* Interactive Calendar Modal */}
        <CalendarPickerModal
          visible={showCalendar}
          selectedDate={dueDate}
          onSelectDate={(newDate) => setDueDate(newDate)}
          onClose={() => setShowCalendar(false)}
        />

        {/* Notes & Purpose */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Notes / What was this for?</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            placeholder="e.g., Concert tickets & sushi dinner on Saturday"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            onFocus={() => scrollToInput(480)}
            multiline
            numberOfLines={2}
            editable={!submitting}
          />
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={[styles.confirmButton, submitting && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                Record Loan · ₹{parsedAmount.toLocaleString('en-IN')}
              </Text>
              <View style={styles.confirmButtonCircle}>
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* Secondary Actions */}
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity onPress={handleClear} disabled={submitting}>
            <Text style={styles.clearText}>Clear Fields</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toastBanner: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  virtualCard: {
    backgroundColor: colors.cardGradientStart,
    borderRadius: 24,
    padding: 20,
    minHeight: 180,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardGlowOverlay: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goldChip: {
    width: 42,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.goldChipStart,
    borderWidth: 1,
    borderColor: 'rgba(214, 165, 77, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipLine1: {
    height: 1,
    backgroundColor: 'rgba(120, 76, 15, 0.4)',
    marginBottom: 6,
  },
  chipLine2: {
    height: 1,
    backgroundColor: 'rgba(120, 76, 15, 0.4)',
  },
  contactlessIcon: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '900',
    transform: [{ rotate: '90deg' }],
  },
  cardBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  brandCircles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  cardNumberRow: {
    marginVertical: 12,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 3,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardHolderName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    maxWidth: 160,
  },
  cardRightMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  validThruCol: {
    alignItems: 'flex-end',
  },
  validThruText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  debitPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  debitPillText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  datePickerInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
    borderWidth: 1.2,
    borderColor: colors.surfaceVariant,
  },
  calendarIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  dateValueMain: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.onSurface,
  },
  dateValueReadable: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  openCalendarPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  openCalendarPillText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  recentFriendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  recentLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  recentPill: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  recentPillText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  bigAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 18,
    paddingVertical: 12,
  },
  bigRupeeSymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginRight: 4,
  },
  bigAmountInput: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 100,
    textAlign: 'center',
    padding: 0,
  },
  presetChipsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  dateShortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dateShortcut: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateShortcutText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    height: 70,
    textAlignVertical: 'top',
  },
  confirmButton: {
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
    shadowRadius: 14,
    elevation: 4,
    marginTop: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCheckIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryActionsRow: {
    alignItems: 'center',
    marginTop: 14,
  },
  clearText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
  },
});
