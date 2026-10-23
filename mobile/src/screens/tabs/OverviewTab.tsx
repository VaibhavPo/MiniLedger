import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import {
  ArrowUpRight,
  Clock,
  RefreshCw,
  Check,
} from 'lucide-react-native';
import { Loan, LoanSummary } from '../../services/loanService';
import { colors } from '../../styles/colors';
import { fonts, typography } from '../../styles/common';

interface OverviewTabProps {
  summary: LoanSummary | null;
  loans: Loan[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onNavigateToEntries: () => void;
  onNavigateToAdd: () => void;
}

export function OverviewTab({
  summary,
  loans,
  loading,
  refreshing,
  onRefresh,
  onNavigateToEntries,
  onNavigateToAdd,
}: OverviewTabProps) {
  const insets = useSafeAreaInsets();

  if (loading && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalLent = summary ? Number(summary.totalLent) : 0;
  const totalRepaid = summary ? Number(summary.totalRepaid) : 0;
  const outstanding = summary ? Number(summary.outstandingAmount) : 0;
  const overdue = summary ? Number(summary.overdueAmount) : 0;

  // Real data calculations for Pie Chart
  const totalAccounted = (totalRepaid + outstanding) || 1;
  const repaidPct = Math.round((totalRepaid / totalAccounted) * 100);
  const overduePct = Math.round((overdue / totalAccounted) * 100);
  const outstandingPct = Math.max(0, 100 - repaidPct - overduePct);

  // SVG Donut Calculations
  const RADIUS = 50;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~314.16

  const repaidLength = (repaidPct / 100) * CIRCUMFERENCE;
  const outstandingLength = (outstandingPct / 100) * CIRCUMFERENCE;
  const overdueLength = (overduePct / 100) * CIRCUMFERENCE;

  // 1. REAL MONTHLY ACTIVITY DATA FROM ACTUAL LOANS
  const monthlyActivity = useMemo(() => {
    const now = new Date();
    const monthsList: { label: string; yearMonth: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthsList.push({ label, yearMonth, total: 0 });
    }

    loans.forEach((loan) => {
      if (!loan.created_at) return;
      const loanDate = new Date(loan.created_at);
      const ym = `${loanDate.getFullYear()}-${String(loanDate.getMonth() + 1).padStart(2, '0')}`;
      const found = monthsList.find((m) => m.yearMonth === ym);
      if (found) {
        found.total += Number(loan.amount) || 0;
      }
    });

    let max = 0;
    let peakIdx = monthsList.length - 1;
    monthsList.forEach((m, idx) => {
      if (m.total > max) {
        max = m.total;
        peakIdx = idx;
      }
    });

    const peakAmount = max > 0 ? max : (totalLent > 0 ? totalLent : 0);
    const peakMonthName = max > 0 ? monthsList[peakIdx].label : monthsList[monthsList.length - 1].label;

    return {
      months: monthsList,
      maxAmount: max > 0 ? max : (totalLent || 1),
      peakAmount,
      peakMonthName,
      peakMonthIndex: peakIdx,
      firstMonth: monthsList[0].label,
      lastMonth: monthsList[monthsList.length - 1].label,
    };
  }, [loans, totalLent]);

  // Construct SVG Bezier Smooth Curve Path from Real Data
  const { linePath, areaPath, peakCoord } = useMemo(() => {
    const graphWidth = 280;
    const graphHeight = 85;
    const paddingX = 12;
    const availableWidth = graphWidth - paddingX * 2;
    const numMonths = monthlyActivity.months.length;
    const stepX = availableWidth / (numMonths - 1);

    // Compute coordinate points (x, y)
    const points = monthlyActivity.months.map((m, idx) => {
      const x = paddingX + idx * stepX;
      // Invert Y for SVG (0 is top, height is bottom)
      const ratio = monthlyActivity.maxAmount > 0 ? (m.total / monthlyActivity.maxAmount) : 0;
      // normalized height between 15% and 88%
      const normY = Math.min(0.88, Math.max(0.15, ratio * 0.85 + 0.12));
      const y = graphHeight - normY * (graphHeight - 10);
      return { x, y, isPeak: idx === monthlyActivity.peakMonthIndex };
    });

    // Generate smooth bezier curve path
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }

    // Complete Area path closing to bottom
    const lastP = points[points.length - 1];
    const firstP = points[0];
    const area = `${line} L ${lastP.x} ${graphHeight} L ${firstP.x} ${graphHeight} Z`;

    const peakP = points[monthlyActivity.peakMonthIndex] || points[points.length - 1];

    return {
      linePath: line,
      areaPath: area,
      peakCoord: peakP,
    };
  }, [monthlyActivity]);

  // Recent settlements (repaid or partially repaid)
  const recentSettled = loans
    .filter((l) => Number(l.repaid_amount) > 0)
    .slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 85 + insets.bottom }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
    >
      {/* Financial Snapshot Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>FINANCIAL SNAPSHOT</Text>
          <Text style={styles.heading}>Overview</Text>
        </View>
        <View style={styles.liveSyncBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveSyncText}>Live Sync</Text>
        </View>
      </View>

      {/* 2x2 Vibrant Financial Cards with Lucide Icons */}
      <View style={styles.gridContainer}>
        {/* Card 1: Total Lent */}
        <View style={[styles.statCard, { backgroundColor: colors.lentPurple }]}>
          <View style={styles.circleDecoration1} />
          <View style={styles.circleDecoration2} />
          <View style={styles.cardHeaderRow}>
            <Text style={styles.statLabel}>Total Lent</Text>
            <View style={styles.cardIconBadge}>
              <ArrowUpRight size={13} color="#FFFFFF" strokeWidth={2.6} />
            </View>
          </View>
          <Text style={styles.statValue}>₹{totalLent.toLocaleString('en-IN')}</Text>
          <Text style={styles.statSub}>OVERALL</Text>
        </View>

        {/* Card 2: Overdue */}
        <View style={[styles.statCard, { backgroundColor: colors.overdueCoral }]}>
          <View style={styles.circleDecoration1} />
          <View style={styles.circleDecoration2} />
          <View style={styles.cardHeaderRow}>
            <Text style={styles.statLabel}>Total Overdue</Text>
            <View style={styles.cardIconBadge}>
              <Clock size={13} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </View>
          <Text style={styles.statValue}>₹{overdue.toLocaleString('en-IN')}</Text>
          <Text style={styles.statSub}>
            {overdue > 0 ? 'Requires Action' : 'All Clear'}
          </Text>
        </View>

        {/* Card 3: Outstanding */}
        <View style={[styles.statCard, { backgroundColor: colors.outstandingBlue }]}>
          <View style={styles.circleDecoration1} />
          <View style={styles.circleDecoration2} />
          <View style={styles.cardHeaderRow}>
            <Text style={styles.statLabel}>Outstanding</Text>
            <View style={styles.cardIconBadge}>
              <RefreshCw size={12} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </View>
          <Text style={styles.statValue}>₹{outstanding.toLocaleString('en-IN')}</Text>
          <Text style={styles.statSub}>ACTIVE</Text>
        </View>

        {/* Card 4: Repaid */}
        <View style={[styles.statCard, { backgroundColor: colors.repaidMint }]}>
          <View style={styles.circleDecoration1} />
          <View style={styles.circleDecoration2} />
          <View style={styles.cardHeaderRow}>
            <Text style={styles.statLabel}>Repaid</Text>
            <View style={styles.cardIconBadge}>
              <Check size={13} color="#FFFFFF" strokeWidth={2.8} />
            </View>
          </View>
          <Text style={styles.statValue}>₹{totalRepaid.toLocaleString('en-IN')}</Text>
          <Text style={styles.statSub}>{repaidPct}% collected</Text>
        </View>
      </View>

      {/* Repayment Ratio Panel with Genuine SVG Donut Chart */}
      <View style={styles.panelCard}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Repayment Ratio</Text>
            <Text style={styles.panelSubtitle}>Lending distribution by status</Text>
          </View>
          <View style={styles.panelIconCircle}>
            <ArrowUpRight size={15} color={colors.primary} strokeWidth={2.4} />
          </View>
        </View>

        {/* Original Continuous SVG Donut Pie Chart */}
        <View style={styles.donutContainer}>
          <View style={styles.donutWrapper}>
            <Svg width={140} height={140} viewBox="0 0 140 140">
              {/* Background ring track */}
              <Circle
                cx={70}
                cy={70}
                r={RADIUS}
                stroke={colors.surfaceContainer}
                strokeWidth={18}
                fill="none"
              />

              {/* Repaid Segment (Mint) */}
              {repaidPct > 0 && (
                <Circle
                  cx={70}
                  cy={70}
                  r={RADIUS}
                  stroke={colors.repaidMint}
                  strokeWidth={18}
                  fill="none"
                  strokeDasharray={`${repaidLength} ${CIRCUMFERENCE}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              )}

              {/* Outstanding Segment (Blue) */}
              {outstandingPct > 0 && (
                <Circle
                  cx={70}
                  cy={70}
                  r={RADIUS}
                  stroke={colors.outstandingBlue}
                  strokeWidth={18}
                  fill="none"
                  strokeDasharray={`${outstandingLength} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-repaidLength}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              )}

              {/* Overdue Segment (Coral) */}
              {overduePct > 0 && (
                <Circle
                  cx={70}
                  cy={70}
                  r={RADIUS}
                  stroke={colors.overdueCoral}
                  strokeWidth={18}
                  fill="none"
                  strokeDasharray={`${overdueLength} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-(repaidLength + outstandingLength)}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              )}
            </Svg>

            {/* Inner Center Circle with Dynamic Metrics */}
            <View style={styles.donutCenterCircle}>
              <Text style={styles.donutPercentage}>{repaidPct}%</Text>
              <Text style={styles.donutSettledLabel}>SETTLED</Text>
            </View>
          </View>
        </View>

        {/* Legend List */}
        <View style={styles.legendContainer}>
          <View style={styles.legendRowItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: colors.repaidMint }]} />
              <Text style={styles.legendName}>Repaid</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendAmount}>₹{totalRepaid.toLocaleString('en-IN')}</Text>
              <Text style={styles.legendPercent}>{repaidPct}%</Text>
            </View>
          </View>

          <View style={styles.legendRowItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: colors.outstandingBlue }]} />
              <Text style={styles.legendName}>Outstanding</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendAmount}>₹{outstanding.toLocaleString('en-IN')}</Text>
              <Text style={styles.legendPercent}>{outstandingPct}%</Text>
            </View>
          </View>

          <View style={[styles.legendRowItem, { borderBottomWidth: 0 }]}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: colors.overdueCoral }]} />
              <Text style={styles.legendName}>Overdue</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendAmount}>₹{overdue.toLocaleString('en-IN')}</Text>
              <Text style={styles.legendPercent}>{overduePct}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Lending Rhythm / Monthly Activity Card with Real Data SVG Graph */}
      <View style={styles.panelCard}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelEyebrow}>LENDING RHYTHM</Text>
            <Text style={styles.panelTitle}>Monthly Activity</Text>
          </View>
          <View style={styles.timeframePill}>
            <Text style={styles.timeframeTextInactive}>{monthlyActivity.firstMonth}</Text>
            <Text style={styles.timeframeDash}>-</Text>
            <Text style={styles.timeframeTextActive}>{monthlyActivity.lastMonth}</Text>
          </View>
        </View>

        {/* Real Data Area Curve Graph */}
        <View style={styles.graphContainer}>
          {/* Dynamic Peak Tooltip */}
          <View style={[styles.peakTooltip, { left: Math.max(10, Math.min(180, peakCoord.x - 55)) }]}>
            <Text style={styles.peakTooltipText}>
              {monthlyActivity.peakMonthName} Peak: ₹{monthlyActivity.peakAmount.toLocaleString('en-IN')}
            </Text>
            <View style={styles.peakTooltipPointer} />
          </View>

          {/* SVG Smooth Area Wave Curve */}
          <View style={styles.svgGraphWrapper}>
            <Svg width="100%" height={90} viewBox="0 0 280 90">
              <Defs>
                <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#4D53AA" stopOpacity="0.28" />
                  <Stop offset="100%" stopColor="#4D53AA" stopOpacity="0.02" />
                </LinearGradient>
              </Defs>

              {/* Shaded Area Under Curve */}
              <Path d={areaPath} fill="url(#waveGradient)" />

              {/* Vertical Guide Line to Peak */}
              <Line
                x1={peakCoord.x}
                y1={peakCoord.y}
                x2={peakCoord.x}
                y2={90}
                stroke="rgba(77, 83, 170, 0.35)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />

              {/* Continuous Wave Outline */}
              <Path
                d={linePath}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2.6}
                strokeLinecap="round"
              />

              {/* Glowing Peak Indicator Dot */}
              <Circle
                cx={peakCoord.x}
                cy={peakCoord.y}
                r={6.5}
                fill={colors.primary}
                stroke="#FFFFFF"
                strokeWidth={2.4}
              />
              <Circle
                cx={peakCoord.x}
                cy={peakCoord.y}
                r={2}
                fill="#FFFFFF"
              />
            </Svg>
          </View>

          {/* Real Month Labels along X-Axis */}
          <View style={styles.xAxisRow}>
            {monthlyActivity.months.map((m, idx) => (
              <Text
                key={m.yearMonth}
                style={[
                  styles.xAxisLabel,
                  idx === monthlyActivity.peakMonthIndex && styles.xAxisLabelActive,
                ]}
              >
                {m.label}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Recent Settlement */}
      <View style={styles.panelCard}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Recent Settlements</Text>
          <TouchableOpacity onPress={onNavigateToEntries} activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        {recentSettled.length > 0 ? (
          recentSettled.map((loan) => {
            const initials = loan.friend_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <View key={loan.id} style={styles.settlementRow}>
                <View style={styles.settlementLeft}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.settlementName} numberOfLines={1}>
                      {loan.friend_name}
                    </Text>
                    <Text style={styles.settlementNotes} numberOfLines={1}>
                      {loan.notes || 'Friend loan'} • {new Date(loan.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.settlementRight}>
                  <Text style={styles.settledAmount}>
                    +₹{Number(loan.repaid_amount).toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.settledBadge}>
                    <Text style={styles.settledBadgeText}>
                      {loan.status === 'REPAID' ? 'SETTLED' : 'PARTIAL'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptySettlement}>
            <Text style={styles.emptySettlementText}>No settlements logged yet.</Text>
            <TouchableOpacity style={styles.quickAddLink} onPress={onNavigateToAdd}>
              <Text style={styles.quickAddLinkText}>+ Record your first loan</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiaryContainer,
  },
  liveSyncText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    minHeight: 124,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleDecoration1: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  circleDecoration2: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  statValue: {
    fontSize: 20,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  panelCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelEyebrow: {
    fontSize: 10,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
  },
  panelTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  panelSubtitle: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  panelIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  donutWrapper: {
    width: 140,
    height: 140,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E2246',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  donutPercentage: {
    fontSize: 24,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  donutSettledLabel: {
    fontSize: 9,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  legendContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  legendRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendName: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendAmount: {
    fontSize: 13,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  legendPercent: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 34,
    textAlign: 'right',
  },
  timeframePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  timeframeTextInactive: {
    fontSize: 11,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  timeframeDash: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  timeframeTextActive: {
    fontSize: 11,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.primary,
  },
  graphContainer: {
    paddingTop: 12,
    position: 'relative',
  },
  peakTooltip: {
    position: 'absolute',
    top: -2,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#4D53AA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  peakTooltipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  peakTooltipPointer: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
  },
  svgGraphWrapper: {
    marginTop: 22,
    alignItems: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  xAxisLabel: {
    fontSize: 11,
    fontFamily: fonts.medium,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  xAxisLabelActive: {
    color: colors.primary,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  viewAllText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.primary,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  settlementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.primary,
  },
  friendInfo: {
    flex: 1,
  },
  settlementName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settlementNotes: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settlementRight: {
    alignItems: 'flex-end',
  },
  settledAmount: {
    fontSize: 15,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.tertiary,
  },
  settledBadge: {
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  settledBadgeText: {
    fontSize: 9,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    color: colors.onTertiaryFixed,
    letterSpacing: 0.5,
  },
  emptySettlement: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptySettlementText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  quickAddLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickAddLinkText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    fontWeight: '600',
    color: colors.primary,
  },
});
