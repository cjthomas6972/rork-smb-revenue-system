import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  Zap,
  Plus,
  ChevronDown,
  Clock,
  X,
  MoreHorizontal,
  Archive,
  Trash2,
  Flame,
  Target,
  TrendingUp,
  Circle,
  ChevronRight,
} from 'lucide-react-native';
import { useBusiness } from '@/store/BusinessContext';
import { useProjectMemoryStats } from '@/store/MemoryContext';
import Colors from '@/constants/colors';
import { DailyDirective } from '@/types/business';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BrandMicroIcon } from '@/components/brand';
import MemoryOSWidget from '@/components/MemoryOSWidget';

const BOTTLENECK_LABELS: Record<string, string> = {
  traffic: 'Traffic',
  conversion: 'Conversion',
  pricing: 'Pricing',
  'follow-up': 'Follow-up',
  operations: 'Operations',
};

const BOTTLENECK_COLORS: Record<string, string> = {
  traffic: '#3B82F6',
  conversion: '#F59E0B',
  pricing: '#EF4444',
  'follow-up': '#8B5CF6',
  operations: '#6B7280',
};

const STREAK_MESSAGES = [
  'Operator streak: {n} day{s}. Keep building.',
  'Momentum is compounding. {n} day{s} strong.',
  '{n} day{s} of execution. This is how empires are built.',
  'Relentless. {n} consecutive day{s}.',
];

export default function DashboardScreen() {
  const router = useRouter();
  const {
    projects,
    activeProject,
    activeProjectId,
    isOnboardingComplete,
    isLoading,
    metrics,
    currentBottleneck,
    executionStats,
    switchProject,
    completeDailyDirective,
    updateDailyDirective,
    generateDailyDirective,
    getCurrentFocus,
    archiveProject,
    deleteProject,
  } = useBusiness();

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isProjectActionsOpen, setIsProjectActionsOpen] = useState(false);
  const [selectedProjectForActions, setSelectedProjectForActions] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionStreak, setCompletionStreak] = useState(0);

  const memoryStats = useProjectMemoryStats(activeProjectId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const celebrateScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleCompleteDirective = useCallback(() => {
    if (!activeProject?.dailyDirective) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeDailyDirective(activeProject.id);
    setCompletionStreak(executionStats.streak + 1);
    setShowCompletion(true);

    Animated.parallel([
      Animated.timing(celebrateAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(celebrateScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(celebrateAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShowCompletion(false);
        celebrateScale.setValue(0.5);
      });
    }, 3000);
  }, [activeProject, executionStats.streak, completeDailyDirective, celebrateAnim, celebrateScale]);

  const handleToggleStep = useCallback((stepOrder: number) => {
    if (!activeProject?.dailyDirective || activeProject.dailyDirective.status === 'complete') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedSteps = activeProject.dailyDirective.steps.map(s =>
      s.order === stepOrder ? { ...s, done: !s.done } : s
    );
    const updatedDirective: DailyDirective = {
      ...activeProject.dailyDirective,
      steps: updatedSteps,
    };
    updateDailyDirective({ projectId: activeProject.id, directive: updatedDirective });
  }, [activeProject, updateDailyDirective]);

  const handleGenerateNew = useCallback(() => {
    if (!activeProject) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const focus = getCurrentFocus();
    const directive = generateDailyDirective(focus);
    updateDailyDirective({ projectId: activeProject.id, directive });
  }, [activeProject, getCurrentFocus, generateDailyDirective, updateDailyDirective]);

  const handleSwitchProject = useCallback((projectId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switchProject(projectId);
    setIsProjectMenuOpen(false);
  }, [switchProject]);

  const handleProjectAction = useCallback((action: 'archive' | 'delete', projectId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action === 'archive') archiveProject(projectId);
    else deleteProject(projectId);
    setIsProjectActionsOpen(false);
    setSelectedProjectForActions(null);
  }, [archiveProject, deleteProject]);

  if (isLoading || isOnboardingComplete === null || !activeProject) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const directive = activeProject.dailyDirective;
  const isComplete = directive?.status === 'complete';
  const allStepsDone = directive?.steps.every(s => s.done) ?? false;
  const stepsCompleted = directive?.steps.filter(s => s.done).length ?? 0;
  const totalSteps = directive?.steps.length ?? 0;
  const stepProgress = totalSteps > 0 ? stepsCompleted / totalSteps : 0;

  const bnCategory = currentBottleneck?.category || 'traffic';
  const bnColor = BOTTLENECK_COLORS[bnCategory] || '#3B82F6';
  const bnLabel = BOTTLENECK_LABELS[bnCategory] || 'Traffic';
  const activeProjects = projects.filter(p => p.status === 'active');

  const getStreakMessage = () => {
    const n = completionStreak;
    const s = n === 1 ? '' : 's';
    const msg = STREAK_MESSAGES[Math.min(n - 1, STREAK_MESSAGES.length - 1)] || STREAK_MESSAGES[0];
    return msg.replace('{n}', String(n)).replace('{s}', s);
  };

  return (
    <View style={styles.container}>
      <View style={styles.projectBar}>
        <TouchableOpacity
          style={styles.projectSelector}
          onPress={() => setIsProjectMenuOpen(true)}
        >
          <Text style={styles.projectName} numberOfLines={1}>{activeProject.name}</Text>
          <ChevronDown size={14} color={Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.newProjectButton}
          onPress={() => router.push('/onboarding' as never)}
        >
          <Plus size={18} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.bottleneckHero}>
            <View style={styles.bottleneckHeroTop}>
              <Text style={styles.heroLabel}>FIX TODAY</Text>
              <View style={styles.streakPill}>
                <Flame size={12} color={executionStats.streak > 0 ? '#F97316' : Colors.textMuted} />
                <Text style={[styles.streakText, executionStats.streak > 0 && { color: '#F97316' }]}>
                  {executionStats.streak}d
                </Text>
              </View>
            </View>

            <View style={styles.bottleneckRow}>
              <View style={[styles.bottleneckDot, { backgroundColor: bnColor }]} />
              <Text style={[styles.bottleneckName, { color: bnColor }]}>{bnLabel}</Text>
              {currentBottleneck && (
                <View style={[styles.confidencePill, { borderColor: bnColor + '40' }]}>
                  <Text style={[styles.confidenceText, { color: bnColor }]}>{currentBottleneck.confidence}%</Text>
                </View>
              )}
            </View>

            {currentBottleneck && (
              <Text style={styles.bottleneckReasoning} numberOfLines={2}>
                {currentBottleneck.reasoning}
              </Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{executionStats.consistencyScore}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{executionStats.weeklyCompletionPct}%</Text>
                <Text style={styles.statLabel}>Weekly</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {executionStats.revenuePerDirective !== null ? executionStats.revenuePerDirective.toFixed(1) : '—'}
                </Text>
                <Text style={styles.statLabel}>Rev/Task</Text>
              </View>
            </View>
          </View>

          {directive && !isComplete ? (
            <View style={styles.directiveCard}>
              <View style={styles.directiveTop}>
                <View style={styles.directiveBadge}>
                  <Zap size={12} color={Colors.primary} />
                  <Text style={styles.directiveBadgeText}>Daily Directive</Text>
                </View>
                <View style={styles.timeboxPill}>
                  <Clock size={12} color={Colors.textMuted} />
                  <Text style={styles.timeboxText}>{directive.timeboxMinutes}m</Text>
                </View>
              </View>

              <Text style={styles.directiveTitle}>{directive.title}</Text>

              <View style={styles.objectiveRow}>
                <Target size={13} color={Colors.accent} />
                <Text style={styles.objectiveText}>{directive.successMetric}</Text>
              </View>

              <View style={styles.stepsContainer}>
                {directive.steps.map((s) => (
                  <TouchableOpacity
                    key={s.order}
                    style={styles.stepRow}
                    onPress={() => handleToggleStep(s.order)}
                    activeOpacity={0.7}
                  >
                    {s.done ? (
                      <CheckCircle2 size={20} color={Colors.accent} />
                    ) : (
                      <Circle size={20} color={Colors.border} />
                    )}
                    <Text style={[styles.stepText, s.done && styles.stepTextDone]}>{s.action}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(stepProgress * 100, 2)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{stepsCompleted}/{totalSteps} steps</Text>
              </View>

              <TouchableOpacity
                style={[styles.completeButton, !allStepsDone && styles.completeButtonMuted]}
                onPress={handleCompleteDirective}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={allStepsDone ? [Colors.accent, Colors.accentDark] : [Colors.tertiary, Colors.tertiary]}
                  style={styles.completeButtonGradient}
                >
                  <CheckCircle2 size={18} color={allStepsDone ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.completeButtonText, !allStepsDone && { color: Colors.textMuted }]}>
                    Complete Directive
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : isComplete ? (
            <View style={styles.completedCard}>
              <CheckCircle2 size={32} color={Colors.accent} />
              <Text style={styles.completedTitle}>Directive Complete</Text>
              <Text style={styles.completedSubtitle}>{directive?.title}</Text>

              <TouchableOpacity style={styles.forgeNextButton} onPress={() => router.push('/advisor' as never)}>
                <Zap size={16} color={Colors.primary} />
                <Text style={styles.forgeNextText}>Get Next Directive from Forge</Text>
                <ChevronRight size={16} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.generateButton} onPress={handleGenerateNew}>
                <TrendingUp size={14} color={Colors.accent} />
                <Text style={styles.generateText}>Auto-generate new task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyDirective}>
              <Zap size={28} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No directive yet</Text>
              <Text style={styles.emptySubtitle}>
                Generate a task based on your bottleneck, or visit Forge for personalized guidance.
              </Text>

              <TouchableOpacity style={styles.primaryActionButton} onPress={handleGenerateNew}>
                <LinearGradient
                  colors={[Colors.accent, Colors.accentDark]}
                  style={styles.primaryActionGradient}
                >
                  <Zap size={18} color={Colors.primary} />
                  <Text style={styles.primaryActionText}>Generate Daily Task</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => router.push('/advisor' as never)}
              >
                <BrandMicroIcon size={14} color={Colors.accent} />
                <Text style={styles.secondaryActionText}>Open Forge Advisor</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.memoryWidgetWrap}>
            <MemoryOSWidget
              totalChunks={memoryStats.totalChunks}
              totalEvents={memoryStats.totalEvents}
              recentChunks={memoryStats.recentChunks}
              topTags={memoryStats.topTags}
            />
          </View>
        </Animated.View>
      </ScrollView>

      {showCompletion && (
        <Animated.View style={[styles.celebrationOverlay, { opacity: celebrateAnim }]}>
          <Animated.View style={[styles.celebrationContent, { transform: [{ scale: celebrateScale }] }]}>
            <Flame size={40} color="#F97316" />
            <Text style={styles.celebrationTitle}>
              {getStreakMessage()}
            </Text>
            <Text style={styles.celebrationScore}>
              Consistency: {executionStats.consistencyScore}/100
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      <Modal visible={isProjectMenuOpen} transparent animationType="fade" onRequestClose={() => setIsProjectMenuOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsProjectMenuOpen(false)}>
          <View style={styles.projectMenu}>
            <View style={styles.projectMenuHeader}>
              <Text style={styles.projectMenuTitle}>Projects</Text>
              <TouchableOpacity onPress={() => setIsProjectMenuOpen(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.projectList}>
              {activeProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[styles.projectItem, project.id === activeProjectId && styles.projectItemActive]}
                  onPress={() => handleSwitchProject(project.id)}
                >
                  <View style={styles.projectItemContent}>
                    <Text style={[styles.projectItemName, project.id === activeProjectId && styles.projectItemNameActive]}>
                      {project.name}
                    </Text>
                    <Text style={styles.projectItemType}>{project.businessType}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.projectActionsButton}
                    onPress={() => {
                      setSelectedProjectForActions(project.id);
                      setIsProjectActionsOpen(true);
                    }}
                  >
                    <MoreHorizontal size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.newProjectMenuItem}
              onPress={() => { setIsProjectMenuOpen(false); router.push('/onboarding' as never); }}
            >
              <Plus size={18} color={Colors.accent} />
              <Text style={styles.newProjectMenuText}>New Project</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isProjectActionsOpen} transparent animationType="fade" onRequestClose={() => setIsProjectActionsOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsProjectActionsOpen(false)}>
          <View style={styles.actionsMenu}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => selectedProjectForActions && handleProjectAction('archive', selectedProjectForActions)}
            >
              <Archive size={18} color={Colors.warning} />
              <Text style={styles.actionItemText}>Archive Project</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => selectedProjectForActions && handleProjectAction('delete', selectedProjectForActions)}
            >
              <Trash2 size={18} color={Colors.error} />
              <Text style={[styles.actionItemText, { color: Colors.error }]}>Delete Project</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  projectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  projectSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  newProjectButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bottleneckHero: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bottleneckHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  bottleneckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bottleneckDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottleneckName: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  confidencePill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  bottleneckReasoning: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  directiveCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directiveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  directiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  directiveBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  timeboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeboxText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  directiveTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 26,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
    backgroundColor: Colors.accent + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  objectiveText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  stepsContainer: {
    gap: 10,
    marginBottom: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  stepTextDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonMuted: {
    opacity: 0.6,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  completedCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginTop: 12,
  },
  completedSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
  },
  forgeNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  forgeNextText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  generateText: {
    fontSize: 14,
    color: Colors.accent,
  },
  emptyDirective: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryActionButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  secondaryActionText: {
    fontSize: 14,
    color: Colors.accent,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  celebrationContent: {
    alignItems: 'center',
    padding: 40,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#F97316',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 28,
  },
  celebrationScore: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  projectMenu: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  projectMenuTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  projectList: {
    maxHeight: 300,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  projectItemActive: {
    backgroundColor: Colors.tertiary,
  },
  projectItemContent: {
    flex: 1,
  },
  projectItemName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  projectItemNameActive: {
    color: Colors.accent,
  },
  projectItemType: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  projectActionsButton: {
    padding: 8,
  },
  newProjectMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  newProjectMenuText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  actionsMenu: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    width: '100%',
    maxWidth: 280,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 8,
  },
  actionItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  memoryWidgetWrap: {
    marginTop: 16,
  },
});
