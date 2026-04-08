import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Flame,
  MoreHorizontal,
  Plus,
  Target,
  X,
  Archive,
  Trash2,
  ChevronRight,
  ChartNoAxesColumn,
  Package,
  Sparkles,
  PencilLine,
  AlertTriangle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { DailyDirective } from '@/types/business';
import { useAutonomousOS } from '@/hooks/useAutonomousOS';

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

type ProjectAction = 'archive' | 'delete';

export default function TodayScreen() {
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

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState<boolean>(false);
  const [isProjectActionsOpen, setIsProjectActionsOpen] = useState<boolean>(false);
  const [selectedProjectForActions, setSelectedProjectForActions] = useState<string | null>(null);
  const [showBlockers, setShowBlockers] = useState<boolean>(false);

  const autonomousSnapshot = useAutonomousOS(activeProject, metrics);
  const activeProjects = useMemo(() => projects.filter((project) => project.status === 'active'), [projects]);

  const handleSwitchProject = useCallback((projectId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switchProject(projectId);
    setIsProjectMenuOpen(false);
  }, [switchProject]);

  const handleProjectAction = useCallback((action: ProjectAction, projectId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action === 'archive') {
      archiveProject(projectId);
    } else {
      deleteProject(projectId);
    }
    setIsProjectActionsOpen(false);
    setSelectedProjectForActions(null);
  }, [archiveProject, deleteProject]);

  const handleToggleStep = useCallback((stepOrder: number) => {
    if (!activeProject?.dailyDirective || activeProject.dailyDirective.status === 'complete') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedSteps = activeProject.dailyDirective.steps.map((step) => (
      step.order === stepOrder ? { ...step, done: !step.done } : step
    ));

    const updatedDirective: DailyDirective = {
      ...activeProject.dailyDirective,
      steps: updatedSteps,
    };

    updateDailyDirective({ projectId: activeProject.id, directive: updatedDirective });
  }, [activeProject, updateDailyDirective]);

  const handleGenerateMission = useCallback(() => {
    if (!activeProject) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const directive = generateDailyDirective(getCurrentFocus());
    updateDailyDirective({ projectId: activeProject.id, directive });
  }, [activeProject, generateDailyDirective, getCurrentFocus, updateDailyDirective]);

  const handleCompleteDirective = useCallback(() => {
    if (!activeProject?.dailyDirective) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeDailyDirective(activeProject.id);
    setTimeout(() => {
      const nextDirective = generateDailyDirective(getCurrentFocus());
      updateDailyDirective({ projectId: activeProject.id, directive: nextDirective });
    }, 400);
  }, [activeProject, completeDailyDirective, generateDailyDirective, getCurrentFocus, updateDailyDirective]);

  if (isLoading || isOnboardingComplete === null || !activeProject) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading SKYFORGE...</Text>
      </View>
    );
  }

  const directive = activeProject.dailyDirective;
  const bnCategory = currentBottleneck?.category ?? 'traffic';
  const bnColor = BOTTLENECK_COLORS[bnCategory] ?? BOTTLENECK_COLORS.traffic;
  const bnLabel = BOTTLENECK_LABELS[bnCategory] ?? 'Traffic';
  const totalSteps = directive?.steps.length ?? 0;
  const stepsCompleted = directive?.steps.filter((step) => step.done).length ?? 0;
  const progress = totalSteps > 0 ? stepsCompleted / totalSteps : 0;
  const remainingSteps = Math.max(totalSteps - stepsCompleted, 0);
  const estimatedRemaining = directive ? Math.max(Math.round((directive.timeboxMinutes / Math.max(totalSteps, 1)) * remainingSteps), 0) : 0;
  const snapshotCards = [
    {
      key: 'bottleneck',
      label: 'Current bottleneck',
      value: bnLabel,
      detail: currentBottleneck ? `${currentBottleneck.confidence}% confidence` : 'Calibrating',
    },
    {
      key: 'completion',
      label: 'Weekly completion',
      value: `${executionStats.weeklyCompletionPct}%`,
      detail: 'Execution rate',
    },
    {
      key: 'revenue',
      label: 'Revenue per directive',
      value: executionStats.revenuePerDirective !== null ? executionStats.revenuePerDirective.toFixed(1) : 'Calculating...',
      detail: 'Sales efficiency',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.wordmarkWrap}>
          <Text style={styles.wordmark}>SKYFORGE</Text>
        </View>
        <TouchableOpacity style={styles.projectSelector} onPress={() => setIsProjectMenuOpen(true)} testID="today-project-selector">
          <Text style={styles.projectSelectorText} numberOfLines={1}>{activeProject.name}</Text>
          <ChevronDown size={14} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.streakPill}>
          <Flame size={14} color={executionStats.streak > 0 ? Colors.brand.fireOrange : Colors.textMuted} />
          <Text style={[styles.streakText, executionStats.streak > 0 && styles.streakTextHot]}>{executionStats.streak}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionKicker}>TODAY</Text>
          <Text style={styles.headline}>Fix today&apos;s bottleneck.</Text>
          <Text style={styles.subheadline}>{autonomousSnapshot?.summary?.headline ?? 'One decisive move. Minimal noise. Maximum progress.'}</Text>
        </View>

        <View style={[styles.directiveCard, { borderLeftColor: bnColor }]}> 
          <LinearGradient
            colors={['#12121A', '#1A1A25']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.directiveGradient}
          >
            {directive ? (
              <>
                <View style={styles.directiveHeader}>
                  <View style={styles.directiveHeaderTextWrap}>
                    <Text style={styles.directiveTitle}>{directive.title}</Text>
                    <Text style={styles.directiveObjective}>{directive.objective || directive.description}</Text>
                  </View>
                  <View style={styles.timePill}>
                    <Clock3 size={12} color={Colors.accent} />
                    <Text style={styles.timePillText}>{estimatedRemaining > 0 ? `${estimatedRemaining} min left` : directive.estimatedTime}</Text>
                  </View>
                </View>

                <View style={styles.stepsWrap}>
                  {directive.steps.map((step) => (
                    <TouchableOpacity
                      key={step.order}
                      style={styles.stepRow}
                      activeOpacity={0.8}
                      onPress={() => handleToggleStep(step.order)}
                      testID={`directive-step-${step.order}`}
                    >
                      {step.done ? (
                        <CheckCircle2 size={20} color={Colors.accent} />
                      ) : (
                        <Circle size={20} color={Colors.borderLight} />
                      )}
                      <Text style={[styles.stepText, step.done && styles.stepTextDone]}>{step.action}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(progress * 100, directive ? 4 : 0)}%`, backgroundColor: bnColor }]} />
                  </View>
                  <Text style={styles.progressText}>{stepsCompleted}/{totalSteps} complete · {directive.timeboxMinutes} min timebox</Text>
                </View>

                <View style={styles.successMetricRow}>
                  <Text style={styles.successMetricText}>🎯 {directive.successMetric}</Text>
                </View>

                {directive.blockers.length > 0 ? (
                  <View style={styles.blockersWrap}>
                    <TouchableOpacity style={styles.blockersToggle} onPress={() => setShowBlockers((value) => !value)}>
                      <View style={styles.blockersToggleLeft}>
                        <AlertTriangle size={14} color={Colors.brand.fireOrange} />
                        <Text style={styles.blockersToggleText}>ANTICIPATED BLOCKERS</Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} style={showBlockers ? styles.chevronOpen : undefined} />
                    </TouchableOpacity>
                    {showBlockers ? directive.blockers.map((blocker, index) => (
                      <View key={`${blocker}-${index}`} style={styles.blockerItem}>
                        <Text style={styles.blockerText}>• {blocker}</Text>
                        <Text style={styles.countermoveText}>{directive.countermoves[index] ?? 'Countermove pending.'}</Text>
                      </View>
                    )) : null}
                  </View>
                ) : null}

                <TouchableOpacity style={styles.completeButton} onPress={handleCompleteDirective} testID="complete-directive-button">
                  <LinearGradient colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]} style={styles.completeButtonGradient}>
                    <Text style={styles.completeButtonText}>MARK COMPLETE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emptyDirectiveWrap}>
                <Text style={styles.directiveTitle}>No mission loaded</Text>
                <Text style={styles.directiveObjective}>Generate today&apos;s directive and get one precise action to execute.</Text>
                <TouchableOpacity style={styles.completeButton} onPress={handleGenerateMission} testID="generate-mission-button">
                  <LinearGradient colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]} style={styles.completeButtonGradient}>
                    <Text style={styles.completeButtonText}>GENERATE TODAY&apos;S MISSION</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={styles.snapshotSection}>
          <Text style={styles.sectionLabel}>AUTONOMOUS OS SNAPSHOT</Text>
          <View style={styles.snapshotRow}>
            {snapshotCards.map((card) => (
              <TouchableOpacity key={card.key} style={styles.snapshotCard} onPress={() => router.push('/review' as never)}>
                <Text style={styles.snapshotLabel}>{card.label}</Text>
                <Text style={styles.snapshotValue}>{card.value}</Text>
                <Text style={styles.snapshotDetail}>{card.detail}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsRow}>
            <QuickActionButton icon={<PencilLine size={18} color={Colors.accent} />} label="LOG METRICS" onPress={() => router.push('/review' as never)} />
            <QuickActionButton icon={<Sparkles size={18} color={Colors.accent} />} label="ASK FORGE" onPress={() => router.push('/advisor' as never)} />
            <QuickActionButton icon={<Package size={18} color={Colors.accent} />} label="VIEW ARSENAL" onPress={() => router.push('/assets' as never)} />
            <QuickActionButton icon={<ChartNoAxesColumn size={18} color={Colors.accent} />} label="WEEKLY REVIEW" onPress={() => router.push('/review' as never)} />
          </View>
        </View>
      </ScrollView>

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
                    <Text style={[styles.projectItemName, project.id === activeProjectId && styles.projectItemNameActive]}>{project.name}</Text>
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
            <TouchableOpacity style={styles.newProjectMenuItem} onPress={() => { setIsProjectMenuOpen(false); router.push('/onboarding' as never); }}>
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

function QuickActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionButton} onPress={onPress} testID={`quick-action-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <View style={styles.quickActionIcon}>{icon}</View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  wordmarkWrap: {
    width: 92,
  },
  wordmark: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '900' as const,
    letterSpacing: 1.4,
  },
  projectSelector: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  projectSelectorText: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  streakPill: {
    minWidth: 52,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  streakText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  streakTextHot: {
    color: Colors.brand.fireOrange,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  sectionHeaderWrap: {
    marginBottom: 18,
  },
  sectionKicker: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  headline: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  subheadline: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  directiveCard: {
    borderLeftWidth: 3,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  directiveGradient: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  directiveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  directiveHeaderTextWrap: {
    flex: 1,
  },
  directiveTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  directiveObjective: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  timePillText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  stepsWrap: {
    gap: 12,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  stepTextDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  progressSection: {
    marginBottom: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  successMetricRow: {
    marginBottom: 14,
  },
  successMetricText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  blockersWrap: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  blockersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockersToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockersToggleText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.1,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  blockerItem: {
    marginTop: 12,
    paddingLeft: 4,
  },
  blockerText: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  countermoveText: {
    color: Colors.accent,
    fontSize: 13,
    lineHeight: 18,
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  completeButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 0.6,
  },
  emptyDirectiveWrap: {
    gap: 12,
  },
  snapshotSection: {
    marginBottom: 18,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  snapshotRow: {
    gap: 10,
  },
  snapshotCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  snapshotLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  snapshotValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  snapshotDetail: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  quickActionsSection: {
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionButton: {
    width: '47.5%',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  projectMenu: {
    backgroundColor: Colors.secondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '70%',
    padding: 16,
  },
  projectMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  projectMenuTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  projectList: {
    maxHeight: 300,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.tertiary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectItemActive: {
    borderColor: Colors.accent,
  },
  projectItemContent: {
    flex: 1,
  },
  projectItemName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  projectItemNameActive: {
    color: Colors.accent,
  },
  projectItemType: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  projectActionsButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newProjectMenuItem: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  newProjectMenuText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  actionsMenu: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 10,
  },
  actionItemText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
