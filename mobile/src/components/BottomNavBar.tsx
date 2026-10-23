import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, ReceiptText, PlusCircle } from 'lucide-react-native';
import { colors } from '../styles/colors';
import { fonts } from '../styles/common';

export type TabType = 'overview' | 'entries' | 'add';

interface BottomNavBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  overdueCount?: number;
}

export function BottomNavBar({ activeTab, onTabChange, overdueCount = 0 }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
      {/* Tab 1: Overview */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabChange('overview')}
      >
        <View
          style={[
            styles.iconWrapper,
            activeTab === 'overview' && styles.iconWrapperActive,
          ]}
        >
          <LayoutDashboard
            size={20}
            color={activeTab === 'overview' ? colors.primary : colors.tabInactive}
            strokeWidth={activeTab === 'overview' ? 2.4 : 1.8}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'overview' && styles.tabLabelActive,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>

      {/* Tab 2: Loan Entries */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabChange('entries')}
      >
        <View
          style={[
            styles.iconWrapper,
            activeTab === 'entries' && styles.iconWrapperActive,
          ]}
        >
          <ReceiptText
            size={20}
            color={activeTab === 'entries' ? colors.primary : colors.tabInactive}
            strokeWidth={activeTab === 'entries' ? 2.4 : 1.8}
          />
          {overdueCount > 0 && (
            <View style={styles.badgeIndicator}>
              <Text style={styles.badgeText}>{overdueCount}</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'entries' && styles.tabLabelActive,
          ]}
        >
          Loan Entries
        </Text>
      </TouchableOpacity>

      {/* Tab 3: Add Entry */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabChange('add')}
      >
        <View
          style={[
            styles.iconWrapper,
            activeTab === 'add' && styles.iconWrapperActive,
          ]}
        >
          <PlusCircle
            size={21}
            color={activeTab === 'add' ? colors.primary : colors.tabInactive}
            strokeWidth={activeTab === 'add' ? 2.4 : 1.8}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'add' && styles.tabLabelActive,
          ]}
        >
          Add Entry
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    position: 'relative',
    width: 38,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  iconWrapperActive: {
    backgroundColor: colors.primaryFixed,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.tabInactive,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.tabActive,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  badgeIndicator: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
});
