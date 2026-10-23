import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LoanSummary } from '../services/loanService';
import { colors } from '../styles/colors';
import { commonStyles, typography } from '../styles/common';

interface SummaryCardProps {
  summary: LoanSummary | null;
  loading?: boolean;
}

export function SummaryCard({ summary, loading }: SummaryCardProps) {
  if (loading && !summary) {
    return (
      <View style={[commonStyles.card, styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const totalLent = summary ? Number(summary.totalLent).toFixed(2) : '0.00';
  const totalRepaid = summary ? Number(summary.totalRepaid).toFixed(2) : '0.00';
  const outstanding = summary ? Number(summary.outstandingAmount).toFixed(2) : '0.00';
  const overdue = summary ? Number(summary.overdueAmount).toFixed(2) : '0.00';
  const hasOverdue = summary ? Number(summary.overdueAmount) > 0 : false;

  return (
    <View style={[commonStyles.card, styles.container]}>
      <Text style={styles.title}>Ledger Summary</Text>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Lent</Text>
          <Text style={styles.metricValue}>₹{totalLent}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Repaid</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>₹{totalRepaid}</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Outstanding</Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>₹{outstanding}</Text>
        </View>

        <View style={[styles.metric, hasOverdue && styles.overdueMetric]}>
          <Text style={[styles.metricLabel, hasOverdue && { color: colors.overdue }]}>
            Overdue
          </Text>
          <Text
            style={[
              styles.metricValue,
              { color: hasOverdue ? colors.overdue : colors.textSecondary },
            ]}
          >
            ₹{overdue}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.base,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metric: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  overdueMetric: {
    backgroundColor: colors.overdueBg,
    borderWidth: 1,
    borderColor: colors.overdueBorder,
  },
  metricLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: typography.lg,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
  },
});
