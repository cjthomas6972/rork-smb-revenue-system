import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BarChart3,
  Eye,
  MessageSquare,
  MousePointer,
  Phone,
  ShoppingCart,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { Metrics } from '@/types/business';

const BOTTLENECK_LABELS: Record<string, string> = {
  traffic: 'Traffic',
  conversion: 'Conversion',
  pricing: 'Pricing',
  'follow-up': 'Follow-up',
  operations: 'Operations',
};

const BOTTLENECK_COLORS: Record<string, string> = {
  traffic: '#2563EB',
  conversion: '#F59E0B',
  pricing: '#EF4444',
  'follow-up': '#7C3AED',
  operations: '#6B7280',
};

const FIELD_CONFIG = [
  { key: 'views', label: 'Views', icon: Eye },
  { key: 'clicks', label: 'Clicks', icon: MousePointer },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'calls', label: 'Calls', icon: Phone },
  { key: 'sales', label: 'Sales', icon: ShoppingCart },
] as const;

type MetricFieldKey = (typeof FIELD_CONFIG)[number]['key'];

function DeltaIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <View style={[styles.deltaPill, styles.deltaPositive]}>
        <TrendingUp size={12} color="#10B981" />
        <Text style={[styles.deltaText, { color: '#10B981' }]}>+{value}%</Text>
      </View>
    );
  }
  if (value < 0) {
    return (
      <View style={[styles.deltaPill, styles.deltaNegative]}>
        <TrendingDown size={12} color="#EF4444" />
        <Text style={[styles.deltaText, { color: '#EF4444' }]}>{value}%</Text>
      </View>
    );
  }
  return (
    <View style={styles.deltaPill}>
      <Minus size={12} color={Colors.textMuted} />
      <Text style={styles.deltaText}>0%</Text>
    </View>
  );
}

export default function IntelScreen() {
  const {
    activeProject,
    activeProjectId,
    metrics,
    currentBottleneck,
    executionStats,
    weeklyReviews,
    generateWeeklyReview,
    isGeneratingReview,
    addMetrics,
  } = useBusiness();

  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState<boolean>(false);
  const [draft, setDraft] = useState<Record<MetricFieldKey | 'notes', string>>({
    views: '',
    clicks: '',
    messages: '',
    calls: '',
    sales: '',
    notes: '',
  });

  const latestReview = weeklyReviews.length > 0
    ? [...weeklyReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const insightSentence = useMemo(() => {
    if (!currentBottleneck) return 'SKYFORGE is waiting for enough signal to diagnose your business clearly.';
    if (currentBottleneck.category === 'traffic') return 'You need more qualified attention entering the top of the funnel.';
    if (currentBottleneck.category === 'conversion') return 'People are showing interest, but friction is stopping them from buying.';
    if (currentBottleneck.category === 'pricing') return 'Your offer value and price framing need better alignment.';
    if (currentBottleneck.category === 'follow-up') return 'Revenue is leaking after the first touch because follow-up is too slow or too weak.';
    return 'Execution is being constrained by process and delivery friction.';
  }, [currentBottleneck]);

  const saveMetrics = () => {
    if (!activeProjectId) return;
    const now = new Date();
    const payload: Metrics = {
      id: `${Date.now()}`,
      projectId: activeProjectId,
      date: now.toISOString().split('T')[0],
      views: Number(draft.views) || 0,
      clicks: Number(draft.clicks) || 0,
      messages: Number(draft.messages) || 0,
      calls: Number(draft.calls) || 0,
      sales: Number(draft.sales) || 0,
      notes: draft.notes || undefined,
    };

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMetrics(payload);
    setDraft({ views: '', clicks: '', messages: '', calls: '', sales: '', notes: '' });
    setIsMetricsModalOpen(false);
  };

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <BarChart3 size={42} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No active intel stream</Text>
        <Text style={styles.emptyText}>Select a project to analyze metrics and weekly review data.</Text>
      </View>
    );
  }

  const bottleneckColor = currentBottleneck ? BOTTLENECK_COLORS[currentBottleneck.category] ?? Colors.accent : Colors.textMuted;
  const bottleneckLabel = currentBottleneck ? BOTTLENECK_LABELS[currentBottleneck.category] ?? currentBottleneck.category : 'Calibrating';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>INTEL</Text>
            <Text style={styles.title}>Know the real bottleneck.</Text>
            <Text style={styles.subtitle}>Metrics, weekly review, and signal clarity in one place.</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => setIsMetricsModalOpen(true)}>
            <Text style={styles.headerButtonText}>+ LOG METRICS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottleneckCard}>
          <Text style={styles.sectionLabel}>BOTTLENECK DIAGNOSIS</Text>
          <View style={[styles.bottleneckPill, { backgroundColor: `${bottleneckColor}18`, borderColor: `${bottleneckColor}44` }]}>
            <Target size={16} color={bottleneckColor} />
            <Text style={[styles.bottleneckPillText, { color: bottleneckColor }]}>{bottleneckLabel}</Text>
          </View>
          <View style={styles.confidenceArcTrack}>
            <View style={[styles.confidenceArcFill, { width: `${currentBottleneck?.confidence ?? 0}%`, backgroundColor: bottleneckColor }]} />
          </View>
          <Text style={styles.confidenceLabel}>{currentBottleneck ? `${currentBottleneck.confidence}% confidence` : 'Waiting for more data'}</Text>
          <Text style={styles.reasoning}>{currentBottleneck?.reasoning ?? 'Log more activity to activate diagnosis.'}</Text>
          <Text style={styles.meaningHeader}>What this means for your business</Text>
          <Text style={styles.meaningText}>{insightSentence}</Text>
          <Text style={styles.changeText}>
            {latestReview?.bottleneckChanged
              ? `↑ Changed from ${latestReview.bottleneckPrior ? BOTTLENECK_LABELS[latestReview.bottleneckPrior] : 'previous pattern'}`
              : '→ Stable'}
          </Text>
        </View>

        <View style={styles.snapshotGrid}>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotValue}>{executionStats.streak}</Text>
            <Text style={styles.snapshotLabel}>Streak</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotValue}>{executionStats.consistencyScore}</Text>
            <Text style={styles.snapshotLabel}>Consistency</Text>
          </View>
          <View style={styles.snapshotCard}>
            <Text style={styles.snapshotValue}>{executionStats.weeklyCompletionPct}%</Text>
            <Text style={styles.snapshotLabel}>Weekly completion</Text>
          </View>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewTitle}>Weekly Review</Text>
            <TouchableOpacity style={styles.generateButton} onPress={() => activeProjectId && generateWeeklyReview(activeProjectId)} disabled={isGeneratingReview}>
              <Text style={styles.generateButtonText}>{isGeneratingReview ? 'Generating...' : 'Generate'}</Text>
            </TouchableOpacity>
          </View>

          {latestReview ? (
            <>
              <View style={styles.metricGrid}>
                {FIELD_CONFIG.map((field) => {
                  const Icon = field.icon;
                  const delta = latestReview.deltas[field.key];
                  const total = latestReview.metricsTotals[field.key];
                  return (
                    <View key={field.key} style={styles.metricCard}>
                      <View style={styles.metricCardHeader}>
                        <Icon size={14} color={Colors.accent} />
                        <Text style={styles.metricCardLabel}>{field.label}</Text>
                      </View>
                      <Text style={styles.metricCardValue}>{total}</Text>
                      <DeltaIndicator value={delta} />
                    </View>
                  );
                })}
              </View>

              <View style={styles.secondaryStatsRow}>
                <Text style={styles.secondaryStat}>Directives completed: {latestReview.directivesCompleted}</Text>
                <Text style={styles.secondaryStat}>Streak: {latestReview.streak}</Text>
              </View>

              <Text style={styles.focusHeader}>Next week focus</Text>
              {latestReview.nextWeekFocus.map((item, index) => (
                <View key={`${item.title}-${index}`} style={styles.focusItem}>
                  <Text style={styles.focusIndex}>{index + 1}</Text>
                  <View style={styles.focusContent}>
                    <Text style={styles.focusTitle}>{item.title}</Text>
                    <Text style={styles.focusReason}>{item.reason}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.planButton}>
                <LinearGradient colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]} style={styles.planButtonGradient}>
                  <Text style={styles.planButtonText}>GENERATE NEXT WEEK&apos;S DIRECTIVE PLAN</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.reviewEmpty}>Generate your first weekly review to unlock delta analysis and next-week focus priorities.</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={isMetricsModalOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setIsMetricsModalOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log metrics</Text>
            <TouchableOpacity onPress={() => setIsMetricsModalOpen(false)}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {FIELD_CONFIG.map((field) => {
              const Icon = field.icon;
              return (
                <View key={field.key} style={styles.inputCard}>
                  <View style={styles.inputHeader}>
                    <Icon size={18} color={Colors.accent} />
                    <Text style={styles.inputLabel}>{field.label}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={draft[field.key]}
                    onChangeText={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              );
            })}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={draft.notes}
                onChangeText={(value) => setDraft((current) => ({ ...current, notes: value }))}
                multiline
                placeholder="What happened today?"
                placeholderTextColor={Colors.textMuted}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.logButton} onPress={saveMetrics} testID="intel-log-metrics-button">
            <LinearGradient colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]} style={styles.logButtonGradient}>
              <Text style={styles.logButtonText}>LOG IT</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 14,
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  kicker: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 260,
  },
  headerButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  bottleneckCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  bottleneckPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  bottleneckPillText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  confidenceArcTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: Colors.tertiary,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceArcFill: {
    height: '100%',
    borderRadius: 999,
  },
  confidenceLabel: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  reasoning: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  meaningHeader: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  meaningText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  changeText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  snapshotValue: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  snapshotLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  reviewCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  reviewTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  generateButton: {
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800' as const,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  metricCardLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  metricCardValue: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  deltaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  deltaPositive: {
    backgroundColor: '#10B98114',
  },
  deltaNegative: {
    backgroundColor: '#EF444414',
  },
  deltaText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  secondaryStatsRow: {
    gap: 6,
    marginBottom: 14,
  },
  secondaryStat: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  focusHeader: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  focusIndex: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '800' as const,
    width: 20,
  },
  focusContent: {
    flex: 1,
  },
  focusTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  focusReason: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  reviewEmpty: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  planButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  planButtonGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  modalContent: {
    paddingBottom: 20,
  },
  inputCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.tertiary,
    padding: 14,
    color: Colors.text,
    fontSize: 14,
  },
  logButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  logButtonGradient: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
});
