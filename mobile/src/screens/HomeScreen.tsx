import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { User } from '../services/authService';
import { loanService, Loan, LoanSummary } from '../services/loanService';
import { SummaryCard } from '../components/SummaryCard';
import { AddEntryForm } from '../components/AddEntryForm';
import { EntryList } from '../components/EntryList';
import { colors } from '../styles/colors';
import { typography } from '../styles/common';

interface HomeScreenProps {
  user: User;
  onLogout: () => void;
}

export function HomeScreen({ user, onLogout }: HomeScreenProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [loansData, summaryData] = await Promise.all([
        loanService.getLoans(),
        loanService.getSummary(),
      ]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load ledger data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderHeader = () => (
    <View>
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Welcome, {user.name}</Text>
          <Text style={styles.userEmail}>{user.identifier}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Comp2. Summary card at top */}
      <SummaryCard summary={summary} loading={loading} />

      {/* Comp3. Form to add an entry */}
      <AddEntryForm onEntryAdded={fetchData} />

      <Text style={styles.sectionTitle}>Loan Entries</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Comp1. List of entries with overdue ones highlighted */}
      <EntryList
        entries={loans}
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={renderHeader()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  greeting: {
    fontSize: typography.lg,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  logoutText: {
    fontSize: typography.xs,
    fontWeight: typography.fontSemiBold,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.fontBold,
    color: colors.textPrimary,
    marginBottom: 10,
  },
});
