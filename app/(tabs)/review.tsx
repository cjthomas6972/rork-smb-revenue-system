import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Target,
  CheckCircle2,
  RefreshCw,
  Calendar,
  ArrowRight,
  BarChart3,
  Zap,
  Eye,
  MousePointer,
  MessageSquare,
  Phone,
  ShoppingCart,
} from 'lucide-react-native';
import { useBusiness } from '@/store/BusinessContext';
import Colors from '@/constants/colors';
import { WeeklyReview } from '@/types/business';
import { BrandWatermark } from '@/components/brand';
import * as Haptics from 'expo-haptics';

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

const FOCUS_COLORS: Record<string, string> = {
  'leads': '#3B82F6',
  'content': '#8B5CF6',
  'outreach': '#EC4899',
  'conversion': '#F59E0B',
  'pricing': '#EF4444',
  'fulfillment': '#6B7280',
  'systems': '#14B8A6',
  'brand expansion': '#F97316',
};

function DeltaIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <View style={[styles.deltaPill, { backgroundColor: '#10B98118' }]}>
        <TrendingUp size={10} color="#10B981" />
        <Text style={[styles.deltaText, { color: '#10B981' }]}>+{value}%</Text>
      </View>
    );
  }
  if (value < 0) {
    return (
      <View style={[styles.deltaPill, { backgroundColor: '#EF444418' }]}>
        <TrendingDown size={10} color="#EF4444" />
        <Text style={[styles.deltaText, { color: '#EF4444' }]}>{value}%</Text>
      </View>
    );
  }
  return (
    <View style={[styles.deltaPill, { backgroundColor: '#6B728018' }]}>
      <Minus size={10} color="#6B7280" />
      <Text style={[styles.deltaText, { color: '#6B7280' }]}>0%</Text>
    </View>
  );
}

function MetricRow({ icon, label, current, prior, delta }: {
  icon: React.ReactNode;
  label: string;
  current: number;
  prior: number;
  delta: number;
}) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLeft}>
        {icon}
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricRight}>
        <Text style={styles.metricCurrent}>{current}</Text>
        <Text style={styles.metricPrior}>vs {prior}</Text>
        <DeltaIndicator value={delta} />
      </View>
    </View>
  );
}

function ReviewCard({ review, isLatest }: { review: WeeklyReview; isLatest: boolean }) {
  const periodStart = new Date(review.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const periodEnd = new Date(review.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const bnColor = review.bottleneckCurrent ? (BOTTLENECK_COLORS[review.bottleneckCurrent] || Colors.accent) : Colors.textMuted;

  return (
    <View style={[styles.reviewCard, isLatest && styles.reviewCardLatest]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewPeriod}>
          <Calendar size={14} color={Colors.textMuted} />
          <Text style={styles.reviewPeriodText}>{periodStart} – {periodEnd}</Text>
        </View>
        {isLatest && (
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>Latest</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Flame size={16} color={review.streak > 0 ? '#F97316' : Colors.textMuted} />
          <Text style={styles.statBlockValue}>{review.streak}d</Text>
          <Text style={styles.statBlockLabel}>Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <CheckCircle2 size={16} color={review.directivesCompleted > 0 ? Colors.accent : Colors.textMuted} />
          <Text style={styles.statBlockValue}>{review.directivesCompleted}</Text>
          <Text style={styles.statBlockLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Target size={16} color={review.consistencyScore > 50 ? Colors.accent : Colors.textMuted} />
          <Text style={styles.statBlockValue}>{review.consistencyScore}</Text>
          <Text style={styles.statBlockLabel}>Score</Text>
        </View>
      </View>

      <View style={styles.metricsSection}>
        <Text style={styles.sectionLabel}>METRICS</Text>
        <MetricRow
          icon={<Eye size={14} color="#3B82F6" />}
          label="Views"
          current={review.metricsTotals.views}
          prior={review.metricsPrior.views}
          delta={review.deltas.views}
        />
        <MetricRow
          icon={<MousePointer size={14} color="#8B5CF6" />}
          label="Clicks"
          current={review.metricsTotals.clicks}
          prior={review.metricsPrior.clicks}
          delta={review.deltas.clicks}
        />
        <MetricRow
          icon={<MessageSquare size={14} color="#EC4899" />}
          label="Messages"
          current={review.metricsTotals.messages}
          prior={review.metricsPrior.messages}
          delta={review.deltas.messages}
        />
        <MetricRow
          icon={<Phone size={14} color="#F59E0B" />}
          label="Calls"
          current={review.metricsTotals.calls}
          prior={review.metricsPrior.calls}
          delta={review.deltas.calls}
        />
        <MetricRow
          icon={<ShoppingCart size={14} color="#10B981" />}
          label="Sales"
          current={review.metricsTotals.sales}
          prior={review.metricsPrior.sales}
          delta={review.deltas.sales}
        />
      </View>

      <View style={styles.bottleneckSection}>
        <Text style={styles.sectionLabel}>BOTTLENECK</Text>
        <View style={styles.bottleneckRow}>
          {review.bottleneckCurrent ? (
            <View style={[styles.bottleneckBadge, { backgroundColor: bnColor + '18', borderColor: bnColor + '40' }]}>
              <Target size={12} color={bnColor} />
              <Text style={[styles.bottleneckBadgeText, { color: bnColor }]}>
                {BOTTLENECK_LABELS[review.bottleneckCurrent] || review.bottleneckCurrent}
              </Text>
            </View>
          ) : (
            <Text style={styles.noBottleneckText}>No diagnosis</Text>
          )}
          {review.bottleneckChanged && (
            <View style={styles.changedBadge}>
              <ArrowRight size={10} color="#F59E0B" />
              <Text style={styles.changedBadgeText}>Changed</Text>
            </View>
          )}
        </View>
        {review.bottleneckPrior && review.bottleneckChanged && (
          <Text style={styles.bottleneckShift}>
            Was: {BOTTLENECK_LABELS[review.bottleneckPrior] || review.bottleneckPrior}
          </Text>
        )}
      </View>

      <View style={styles.focusSection}>
        <Text style={styles.sectionLabel}>NEXT WEEK FOCUS</Text>
        {review.nextWeekFocus.map((priority, idx) => {
          const focusColor = FOCUS_COLORS[priority.focusArea] || Colors.accent;
          return (
            <View key={idx} style={styles.focusItem}>
              <View style={styles.focusItemHeader}>
                <View style={[styles.focusNumber, { backgroundColor: focusColor + '20' }]}>
                  <Text style={[styles.focusNumberText, { color: focusColor }]}>{idx + 1}</Text>
                </View>
                <Text style={styles.focusTitle}>{priority.title}</Text>
              </View>
              <Text style={styles.focusReason}>{priority.reason}</Text>
              <View style={[styles.focusAreaTag, { backgroundColor: focusColor + '15', borderColor: focusColor + '30' }]}>
                <Text style={[styles.focusAreaText, { color: focusColor }]}>{priority.focusArea}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function WeeklyReviewScreen() {
  const {
    activeProject,
    activeProjectId,
    weeklyReviews,
    generateWeeklyReview,
    isGeneratingReview,
  } = useBusiness();

  const [spinAnim] = useState(() => new Animated.Value(0));

  const handleGenerate = useCallback(() => {
    if (!activeProjectId || isGeneratingReview) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();

    generateWeeklyReview(activeProjectId);

    setTimeout(() => {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }, 1200);
  }, [activeProjectId, isGeneratingReview, generateWeeklyReview, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sortedReviews = [...weeklyReviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <BarChart3 size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Project Selected</Text>
        <Text style={styles.emptyText}>Select a project to view weekly reviews</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BrandWatermark opacity={0.02} size={240} position="center" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.headerTitle}>Weekly Review</Text>
            <Text style={styles.headerSubtitle}>{activeProject.name}</Text>
          </View>
          <TouchableOpacity
            style={[styles.generateButton, isGeneratingReview && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isGeneratingReview}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={16} color={isGeneratingReview ? Colors.textMuted : Colors.primary} />
            </Animated.View>
            <Text style={[styles.generateButtonText, isGeneratingReview && styles.generateButtonTextDisabled]}>
              {isGeneratingReview ? 'Generating...' : 'Generate'}
            </Text>
          </TouchableOpacity>
        </View>

        {sortedReviews.length === 0 ? (
          <View style={styles.emptyState}>
            <BarChart3 size={40} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No reviews yet</Text>
            <Text style={styles.emptyStateText}>
              Tap Generate to create your first weekly review based on your metrics and directive history.
            </Text>
          </View>
        ) : (
          sortedReviews.map((review, idx) => (
            <ReviewCard key={review.id} review={review} isLatest={idx === 0} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  generateButtonDisabled: {
    backgroundColor: Colors.tertiary,
  },
  generateButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  generateButtonTextDisabled: {
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  reviewCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  reviewCardLatest: {
    borderColor: Colors.accent + '40',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewPeriod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewPeriodText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  latestBadge: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  latestBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.accent,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tertiary,
    borderRadius: 12,
    padding: 14,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statBlockValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statBlockLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  metricsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricCurrent: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 28,
    textAlign: 'right' as const,
  },
  metricPrior: {
    fontSize: 11,
    color: Colors.textMuted,
    minWidth: 36,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 48,
    justifyContent: 'center',
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  bottleneckSection: {
    gap: 6,
  },
  bottleneckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottleneckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  bottleneckBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  noBottleneckText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  changedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B18',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  changedBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  bottleneckShift: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  focusSection: {
    gap: 10,
  },
  focusItem: {
    backgroundColor: Colors.tertiary,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  focusItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusNumber: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusNumberText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  focusTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  focusReason: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
    marginLeft: 30,
  },
  focusAreaTag: {
    alignSelf: 'flex-start',
    marginLeft: 30,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  focusAreaText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
});
