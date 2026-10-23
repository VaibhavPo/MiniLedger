import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { User } from '../services/authService';
import { loanService, Loan, LoanSummary } from '../services/loanService';
import { OverviewTab } from './tabs/OverviewTab';
import { LoanEntriesTab, isLoanOverdue } from './tabs/LoanEntriesTab';
import { AddEntryTab } from './tabs/AddEntryTab';
import { BottomNavBar, TabType } from '../components/BottomNavBar';
import { colors } from '../styles/colors';
import { fonts } from '../styles/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet, LogOut } from 'lucide-react-native';

interface HomeScreenProps {
  user: User;
  onLogout: () => void;
}

export function HomeScreen({ user, onLogout }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

  const overdueCount = useMemo(() => {
    return loans.filter(isLoanOverdue).length;
  }, [loans]);

  const recentFriendNames = useMemo(() => {
    const names = new Set<string>();
    loans.forEach((l) => {
      if (l.friend_name) names.add(l.friend_name);
    });
    return Array.from(names);
  }, [loans]);

  return (
    <View style={styles.container}>
      {/* Top Header Bar with insets & logout icon */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandLogoCircle}>
            <Wallet size={18} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={styles.brandTitle}>MiniLedger</Text>
            <Text style={styles.brandSubtitle}>FRIEND LOAN TRACKER</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.logoutIconButton}
            onPress={onLogout}
            activeOpacity={0.7}
            accessibilityLabel="Logout"
          >
            <LogOut size={17} color={colors.secondary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Tab Screen */}
      <View style={styles.tabContentContainer}>
        {activeTab === 'overview' && (
          <OverviewTab
            summary={summary}
            loans={loans}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onNavigateToEntries={() => setActiveTab('entries')}
            onNavigateToAdd={() => setActiveTab('add')}
          />
        )}

        {activeTab === 'entries' && (
          <LoanEntriesTab
            loans={loans}
            summary={summary}
            loading={loading}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onNavigateToAdd={() => setActiveTab('add')}
          />
        )}

        {activeTab === 'add' && (
          <AddEntryTab
            userName={user.name}
            recentFriendNames={recentFriendNames}
            onEntryAdded={() => {
              fetchData();
              setActiveTab('entries');
            }}
          />
        )}
      </View>

      {/* Persistent Bottom Navigation Bar */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        overdueCount={overdueCount}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(251, 248, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLogoEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  brandSubtitle: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.secondary,
  },
  tabContentContainer: {
    flex: 1,
  },
});

