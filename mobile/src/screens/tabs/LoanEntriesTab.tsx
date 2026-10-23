import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Loan, LoanSummary, loanService } from '../../services/loanService';
import { colors } from '../../styles/colors';
import { typography, fonts } from '../../styles/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Plus } from 'lucide-react-native';

interface LoanEntriesTabProps {
  loans: Loan[];
  summary: LoanSummary | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onNavigateToAdd: () => void;
}

type FilterType = 'all' | 'active' | 'overdue' | 'repaid';

export function isLoanOverdue(loan: Loan): boolean {
  if (loan.status === 'REPAID') return false;
  const dueDate = new Date(loan.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function getDaysRemaining(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function LoanItemCard({
  loan,
  onRepaid,
}: {
  loan: Loan;
  onRepaid: () => void;
}) {
  const [showRepayBox, setShowRepayBox] = useState(false);
  const [repayInput, setRepayInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overdue = isLoanOverdue(loan);
  const isRepaid = loan.status === 'REPAID';
  const amountNum = Number(loan.amount);
  const repaidNum = Number(loan.repaid_amount);
  const remainingNum = Math.max(0, amountNum - repaidNum);
  const percentPaid = amountNum > 0 ? Math.min(100, Math.round((repaidNum / amountNum) * 100)) : 0;
  const daysRem = getDaysRemaining(loan.due_date);

  const initials = loan.friend_name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'FL';

  const handleConfirmRepay = async () => {
    const val = parseFloat(repayInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (val > remainingNum) {
      Alert.alert(
        'Amount Exceeded',
        `Remaining balance is ₹${remainingNum.toLocaleString('en-IN')}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await loanService.repayLoan(loan.id, val);
      setShowRepayBox(false);
      setRepayInput('');
      onRepaid();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record repayment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        overdue && styles.cardOverdue,
        isRepaid && styles.cardRepaid,
      ]}
    >
      {/* Header Row */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.avatarCircle,
              overdue
                ? styles.avatarOverdue
                : isRepaid
                ? styles.avatarRepaid
                : styles.avatarActive,
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                overdue
                  ? styles.avatarTextOverdue
                  : isRepaid
                  ? styles.avatarTextRepaid
                  : styles.avatarTextActive,
              ]}
            >
              {initials}
            </Text>
          </View>
          <View style={styles.friendDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.friendName} numberOfLines={1}>
                {loan.friend_name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  overdue
                    ? styles.statusBadgeOverdue
                    : isRepaid
                    ? styles.statusBadgeRepaid
                    : styles.statusBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    overdue
                      ? styles.statusBadgeTextOverdue
                      : isRepaid
                      ? styles.statusBadgeTextRepaid
                      : styles.statusBadgeTextActive,
                  ]}
                >
                  {overdue
                    ? daysRem < 0
                      ? `Overdue (${Math.abs(daysRem)}d)`
                      : 'Overdue'
                    : isRepaid
                    ? 'Fully Repaid'
                    : daysRem === 0
                    ? 'Due Today'
                    : daysRem > 0
                    ? `Due in ${daysRem}d`
                    : 'Active'}
                </Text>
              </View>
            </View>
            <Text style={styles.dateSubtext}>
              Lent on {new Date(loan.created_at).toLocaleDateString()}
              {loan.notes ? ` • ${loan.notes}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* 3-Column Financial Metrics Pill Matrix */}
      <View style={styles.matrixContainer}>
        <View style={styles.matrixCol}>
          <Text style={styles.matrixLabel}>TOTAL</Text>
          <Text style={styles.matrixValue}>₹{amountNum.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.matrixCol, styles.matrixColRepaid]}>
          <Text style={[styles.matrixLabel, { color: colors.tertiaryContainer }]}>
            REPAID
          </Text>
          <Text style={[styles.matrixValue, { color: colors.tertiaryContainer }]}>
            ₹{repaidNum.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.matrixCol}>
          <Text
            style={[
              styles.matrixLabel,
              { color: overdue ? colors.secondary : colors.primary },
            ]}
          >
            LEFT
          </Text>
          <Text
            style={[
              styles.matrixValue,
              {
                color: overdue ? colors.secondary : colors.primary,
                fontWeight: '800',
              },
            ]}
          >
            ₹{remainingNum.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Progress Bar & Settlement Percentage */}
      <View style={styles.progressSection}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressPercentage}>
            {isRepaid ? '100% Repaid' : `${percentPaid}% Paid back`}
          </Text>
          <Text
            style={[
              styles.progressStatusText,
              overdue && { color: colors.secondary, fontWeight: '700' },
            ]}
          >
            {overdue
              ? `Overdue by ${Math.abs(daysRem)} days`
              : isRepaid
              ? 'Complete'
              : `₹${remainingNum.toLocaleString('en-IN')} pending`}
          </Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.max(4, percentPaid)}%`,
                backgroundColor: overdue
                  ? colors.secondaryContainer
                  : isRepaid
                  ? colors.repaidMint
                  : colors.primaryContainer,
              },
            ]}
          />
        </View>
      </View>

      {/* Repay Action / Settlement State */}
      {isRepaid ? (
        <View style={styles.celebrationBanner}>
          <Check size={14} color={colors.tertiary} strokeWidth={2.8} />
          <Text style={styles.celebrationText}>
            Closed smoothly with no debt
          </Text>
        </View>
      ) : (
        <View style={styles.actionModuleContainer}>
          {!showRepayBox ? (
            <View style={styles.repayBar}>
              <Text style={styles.repayPromptText}>
                Due on {new Date(loan.due_date).toLocaleDateString()}
              </Text>
              <TouchableOpacity
                style={styles.recordRepayButton}
                activeOpacity={0.8}
                onPress={() => {
                  setRepayInput(remainingNum.toString());
                  setShowRepayBox(true);
                }}
              >
                <Text style={styles.recordRepayButtonText}>
                  + Record ₹{remainingNum.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inlineRepayForm}>
              <View style={styles.repayInputWrapper}>
                <Text style={styles.rupeePrefix}>₹</Text>
                <TextInput
                  style={styles.repayInput}
                  keyboardType="numeric"
                  value={repayInput}
                  onChangeText={setRepayInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  editable={!submitting}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.confirmRepayBtn,
                  submitting && { opacity: 0.6 },
                ]}
                onPress={handleConfirmRepay}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmRepayBtnText}>Confirm</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelRepayBtn}
                onPress={() => setShowRepayBox(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelRepayBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export function LoanEntriesTab({
  loans,
  summary,
  loading,
  refreshing,
  onRefresh,
  onNavigateToAdd,
}: LoanEntriesTabProps) {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Filter logic
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const overdue = isLoanOverdue(loan);
      if (selectedFilter === 'active') {
        return loan.status !== 'REPAID' && !overdue;
      }
      if (selectedFilter === 'overdue') {
        return overdue;
      }
      if (selectedFilter === 'repaid') {
        return loan.status === 'REPAID';
      }
      return true;
    });
  }, [loans, selectedFilter]);

  const overdueCount = useMemo(() => {
    return loans.filter(isLoanOverdue).length;
  }, [loans]);

  const activeCount = useMemo(() => {
    return loans.filter((l) => l.status !== 'REPAID').length;
  }, [loans]);

  const outstandingTotal = summary ? Number(summary.outstandingAmount) : 0;

  const renderHeader = () => (
    <View style={styles.tabHeader}>
      {/* Title & Stats */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.mainTitle}>Loan Records</Text>
          <Text style={styles.subTitle}>
            {activeCount} active peer agreements • ₹
            {outstandingTotal.toLocaleString('en-IN')} outstanding
          </Text>
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedFilter === 'all' && styles.filterChipTextActive,
            ]}
          >
            All Loans
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'active' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedFilter === 'active' && styles.filterChipTextActive,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'overdue' && styles.filterChipActiveOverdue,
          ]}
          onPress={() => setSelectedFilter('overdue')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedFilter === 'overdue'
                ? styles.filterChipTextActiveOverdue
                : { color: colors.secondary },
            ]}
          >
            Overdue
          </Text>
          {overdueCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{overdueCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedFilter === 'repaid' && styles.filterChipActive,
          ]}
          onPress={() => setSelectedFilter('repaid')}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedFilter === 'repaid' && styles.filterChipTextActive,
            ]}
          >
            Repaid
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.quickStatusBanner}>
      <View style={styles.quickStatusInfo}>
        <Text style={styles.quickStatusEyebrow}>
          Quick Status • {activeCount} friend{activeCount === 1 ? '' : 's'}
        </Text>
        <Text style={styles.quickStatusAmount}>
          ₹{outstandingTotal.toLocaleString('en-IN')} Due Back
        </Text>
      </View>
      <TouchableOpacity
        style={styles.newLoanButton}
        activeOpacity={0.85}
        onPress={onNavigateToAdd}
      >
        <Plus size={16} color="#FFFFFF" strokeWidth={2.6} />
        <Text style={styles.newLoanButtonText}>New Loan</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredLoans}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <LoanItemCard loan={item} onRepaid={onRefresh} />
        )}
        ListHeaderComponent={renderHeader()}
        ListFooterComponent={filteredLoans.length > 0 ? renderFooter() : undefined}
        contentContainerStyle={[styles.listContent, { paddingBottom: 85 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No matching loans</Text>
              <Text style={styles.emptySub}>
                {selectedFilter === 'overdue'
                  ? 'Great news! You have no overdue loans.'
                  : 'No records found for this filter.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={onNavigateToAdd}
              >
                <Text style={styles.emptyAddBtnText}>+ Add New Loan</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  tabHeader: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLowest,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipActiveOverdue: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  filterChipTextActiveOverdue: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  countBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onSecondaryFixed,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardOverdue: {
    borderColor: colors.overdueBorder,
    backgroundColor: '#FFF8F9',
  },
  cardRepaid: {
    opacity: 0.9,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActive: {
    backgroundColor: colors.primaryFixed,
  },
  avatarOverdue: {
    backgroundColor: colors.secondaryFixed,
  },
  avatarRepaid: {
    backgroundColor: colors.tertiaryFixed,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  avatarTextActive: {
    color: colors.primary,
  },
  avatarTextOverdue: {
    color: colors.secondary,
  },
  avatarTextRepaid: {
    color: colors.tertiary,
  },
  friendDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: colors.primaryFixed,
  },
  statusBadgeOverdue: {
    backgroundColor: colors.secondaryFixed,
  },
  statusBadgeRepaid: {
    backgroundColor: colors.tertiaryFixed,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusBadgeTextActive: {
    color: colors.primary,
  },
  statusBadgeTextOverdue: {
    color: colors.secondary,
  },
  statusBadgeTextRepaid: {
    color: colors.tertiary,
  },
  dateSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  matrixContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 8,
    marginBottom: 12,
    gap: 4,
  },
  matrixCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  matrixColRepaid: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  matrixLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  matrixValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  progressStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  celebrationBanner: {
    backgroundColor: colors.surfaceContainer,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  celebrationText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.tertiary,
  },
  actionModuleContainer: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 8,
  },
  repayBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repayPromptText: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingLeft: 4,
  },
  recordRepayButton: {
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  recordRepayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineRepayForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repayInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    height: 38,
  },
  rupeePrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 4,
  },
  repayInput: {
    flex: 1,
    height: 38,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: 0,
  },
  confirmRepayBtn: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmRepayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelRepayBtn: {
    paddingHorizontal: 8,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelRepayBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  quickStatusBanner: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  quickStatusInfo: {
    flex: 1,
  },
  quickStatusEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  quickStatusAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  newLoanButton: {
    backgroundColor: colors.surfaceContainerLowest,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newLoanButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
