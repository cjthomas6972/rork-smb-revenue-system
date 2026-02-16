import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Target, TrendingUp, DollarSign } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BottleneckDiagnosis, ExecutionStats } from '@/types/business';

interface ExecutionKernelWidgetProps {
  bottleneck: BottleneckDiagnosis | null;
  stats: ExecutionStats;
}

const BOTTLENECK_LABELS: Record<string, string> = {
  'traffic': 'Traffic',
  'conversion': 'Conversion',
  'pricing': 'Pricing',
  'follow-up': 'Follow-up',
  'operations': 'Operations',
};

const BOTTLENECK_COLORS: Record<string, string> = {
  'traffic': '#3B82F6',
  'conversion': '#F59E0B',
  'pricing': '#EF4444',
  'follow-up': '#8B5CF6',
  'operations': '#6B7280',
};

function StatCell({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <View style={styles.statCell}>
      <View style={[styles.statIconWrap, { backgroundColor: (accent || Colors.accent) + '18' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ExecutionKernelWidget({ bottleneck, stats }: ExecutionKernelWidgetProps) {
  const bnColor = bottleneck ? (BOTTLENECK_COLORS[bottleneck.category] || Colors.accent) : Colors.textMuted;
  const bnLabel = bottleneck ? BOTTLENECK_LABELS[bottleneck.category] || bottleneck.category : '—';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.kernelDot, { backgroundColor: bnColor }]} />
          <Text style={styles.headerTitle}>Execution Kernel</Text>
        </View>
        {bottleneck && (
          <View style={[styles.confidencePill, { borderColor: bnColor + '50' }]}>
            <Text style={[styles.confidenceText, { color: bnColor }]}>{bottleneck.confidence}%</Text>
          </View>
        )}
      </View>

      {bottleneck && (
        <View style={styles.bottleneckRow}>
          <Text style={styles.bottleneckLabel}>Bottleneck</Text>
          <View style={[styles.bottleneckBadge, { backgroundColor: bnColor + '20', borderColor: bnColor + '40' }]}>
            <Target size={12} color={bnColor} />
            <Text style={[styles.bottleneckText, { color: bnColor }]}>{bnLabel}</Text>
          </View>
        </View>
      )}

      {bottleneck && (
        <Text style={styles.reasoningText} numberOfLines={2}>{bottleneck.reasoning}</Text>
      )}

      {!bottleneck && (
        <Text style={styles.noDataText}>Log metrics to activate auto-diagnosis</Text>
      )}

      <View style={styles.statsGrid}>
        <StatCell
          icon={<Flame size={14} color={stats.streak > 0 ? '#F97316' : Colors.textMuted} />}
          label="Streak"
          value={`${stats.streak}d`}
          accent="#F97316"
        />
        <StatCell
          icon={<TrendingUp size={14} color={stats.consistencyScore > 50 ? Colors.accent : Colors.textMuted} />}
          label="Consistency"
          value={`${stats.consistencyScore}`}
          accent={Colors.accent}
        />
        <StatCell
          icon={<DollarSign size={14} color={stats.revenuePerDirective !== null ? '#10B981' : Colors.textMuted} />}
          label="Rev/Task"
          value={stats.revenuePerDirective !== null ? `${stats.revenuePerDirective}` : '—'}
          accent="#10B981"
        />
      </View>

      <View style={styles.weeklyBar}>
        <View style={styles.weeklyBarHeader}>
          <Text style={styles.weeklyBarLabel}>Weekly</Text>
          <Text style={styles.weeklyBarPct}>{stats.weeklyCompletionPct}%</Text>
        </View>
        <View style={styles.weeklyBarTrack}>
          <View
            style={[
              styles.weeklyBarFill,
              {
                width: `${Math.max(stats.weeklyCompletionPct, 2)}%` as const,
                backgroundColor: stats.weeklyCompletionPct >= 70 ? Colors.accent : stats.weeklyCompletionPct >= 40 ? '#F59E0B' : '#EF4444',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default React.memo(ExecutionKernelWidget);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kernelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  confidencePill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  bottleneckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottleneckLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  bottleneckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  bottleneckText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  reasoningText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
  noDataText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  weeklyBar: {
    gap: 6,
  },
  weeklyBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyBarLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  weeklyBarPct: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  weeklyBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tertiary,
    overflow: 'hidden',
  },
  weeklyBarFill: {
    height: 4,
    borderRadius: 2,
  },
});
