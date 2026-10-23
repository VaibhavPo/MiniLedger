import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Loan, loanService } from '../services/loanService';
import { colors } from '../styles/colors';
import { commonStyles, typography } from '../styles/common';

interface EntryListProps {
  entries: Loan[];
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  ListHeaderComponent?: React.ReactElement;
}

export function isLoanOverdue(loan: Loan): boolean {
  if (loan.status === 'REPAID') return false;
  const dueDate = new Date(loan.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function EntryItem({ item, onRepaid }: { item: Loan; onRepaid: () => void }) {
  const [showRepay, setShowRepay] = useState(false);
  const [repayAmount, setRepayAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overdue = isLoanOverdue(item);
  const amountNum = Number(item.amount);
  const repaidNum = Number(item.repaid_amount);
  const remainingNum = Math.max(0, amountNum - repaidNum);
  const formattedDueDate = new Date(item.due_date).toISOString().split('T')[0];

  const handleRepay = async () => {
    const val = parseFloat(repayAmount);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive repayment amount.');
      return;
    }
    if (val > remainingNum) {
      Alert.alert(
        'Amount Exceeded',
        `Maximum remaining amount to repay is ₹${remainingNum.toFixed(2)}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      await loanService.repayLoan(item.id, val);
      setShowRepay(false);
      setRepayAmount('');
      onRepaid();
    } catch (err: any) {
      Alert.alert('Repayment Failed', err.message || 'Could not record repayment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        commonStyles.card,
        styles.itemCard,
        overdue && styles.overdueCard,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.friendName}>{item.friend_name}</Text>
        <View
          style={[
            styles.badge,
            overdue
              ? styles.overdueBadge
              : item.status === 'REPAID'
              ? styles.repaidBadge
              : styles.pendingBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              overdue
                ? styles.overdueBadgeText
                : item.status === 'REPAID'
                ? styles.repaidBadgeText
                : styles.pendingBadgeText,
            ]}
          >
            {overdue ? 'OVERDUE' : item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View>
          <Text style={styles.amountLabel}>Total Lent</Text>
          <Text style={styles.amountValue}>₹{amountNum.toFixed(2)}</Text>
        </View>

        <View style={styles.alignCenter}>
          <Text style={styles.amountLabel}>Repaid</Text>
          <Text style={[styles.amountValue, { color: colors.success }]}>
            ₹{repaidNum.toFixed(2)}
          </Text>
        </View>

        <View style={styles.alignRight}>
          <Text style={styles.amountLabel}>Remaining</Text>
          <Text style={[styles.amountValue, { color: colors.primary }]}>
            ₹{remainingNum.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.dueDateText, overdue && styles.overdueDateText]}>
          Due: {formattedDueDate}
        </Text>
        {item.notes ? (
          <Text style={styles.notesText} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
      </View>

      {/* Repay Action Option */}
      {item.status !== 'REPAID' && (
        <View style={styles.repayContainer}>
          {!showRepay ? (
            <TouchableOpacity
              style={styles.repayToggleBtn}
              onPress={() => {
                setRepayAmount(remainingNum.toString());
                setShowRepay(true);
              }}
            >
              <Text style={styles.repayToggleText}>+ Record Repayment</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.repayForm}>
              <View style={styles.repayInputRow}>
                <TextInput
                  style={[commonStyles.input, styles.repayInput]}
                  placeholder={`Max ₹${remainingNum.toFixed(2)}`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={repayAmount}
                  onChangeText={setRepayAmount}
                  editable={!submitting}
                />
                <TouchableOpacity
                  style={[styles.repaySubmitBtn, submitting && commonStyles.buttonDisabled]}
                  onPress={handleRepay}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.repaySubmitText}>Confirm</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.repayCancelBtn}
                  onPress={() => setShowRepay(false)}
                  disabled={submitting}
                >
                  <Text style={styles.repayCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

export function EntryList({
  entries,
  loading,
  onRefresh,
  refreshing,
  ListHeaderComponent,
}: EntryListProps) {
  if (loading && entries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        {ListHeaderComponent}
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <EntryItem item={item} onRepaid={onRefresh} />}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No loan entries found.</Text>
          <Text style={styles.emptySubText}>Add your first entry above to get started.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
  },
  overdueCard: {
    backgroundColor: colors.overdueBg,
    borderColor: colors.overdueBorder,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendName: {
    fontSize: typography.base,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overdueBadge: {
    backgroundColor: colors.overdue,
  },
  overdueBadgeText: {
    color: '#FFFFFF',
    fontSize: typography.xs,
    fontWeight: typography.fontBold,
  },
  repaidBadge: {
    backgroundColor: colors.successBg,
  },
  repaidBadgeText: {
    color: colors.success,
    fontSize: typography.xs,
    fontWeight: typography.fontSemiBold,
  },
  pendingBadge: {
    backgroundColor: colors.warningBg,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: typography.xs,
    fontWeight: typography.fontSemiBold,
  },
  badgeText: {
    fontSize: typography.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  amountLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: typography.base,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  bottomRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dueDateText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  overdueDateText: {
    color: colors.overdue,
    fontWeight: typography.fontSemiBold,
  },
  notesText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    maxWidth: '50%',
  },
  repayContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  repayToggleBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repayToggleText: {
    fontSize: typography.xs,
    fontWeight: typography.fontSemiBold,
    color: colors.primary,
  },
  repayForm: {
    marginTop: 4,
  },
  repayInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repayInput: {
    flex: 1,
    height: 40,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: typography.sm,
    marginRight: 8,
  },
  repaySubmitBtn: {
    backgroundColor: colors.success,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 40,
    justifyContent: 'center',
  },
  repaySubmitText: {
    color: '#FFFFFF',
    fontSize: typography.xs,
    fontWeight: typography.fontBold,
  },
  repayCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    height: 40,
    justifyContent: 'center',
  },
  repayCancelText: {
    color: colors.textSecondary,
    fontSize: typography.xs,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.textSecondary,
    fontWeight: typography.fontMedium,
  },
  emptySubText: {
    fontSize: typography.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
});
