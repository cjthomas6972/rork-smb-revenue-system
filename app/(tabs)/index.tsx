import React, { useEffect, useState } from 'react';
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
  Sparkles,
  Clock,
  X,
  MoreHorizontal,
  Archive,
  Trash2,
  Flame,
} from 'lucide-react-native';
import { useBusiness } from '@/store/BusinessContext';
import Colors from '@/constants/colors';
import { DailyDirective } from '@/types/business';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BrandWatermark, BrandMicroIcon } from '@/components/brand';

export default function DashboardScreen() {
  const router = useRouter();
  const { 
    projects,
    activeProject,
    activeProjectId,
    isOnboardingComplete, 
    isLoading,
    metrics,
    switchProject,
    completeDailyDirective,
    updateDailyDirective,
    archiveProject,
    deleteProject,
  } = useBusiness();

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isProjectActionsOpen, setIsProjectActionsOpen] = useState(false);
  const [selectedProjectForActions, setSelectedProjectForActions] = useState<string | null>(null);
  const [showDirectiveComplete, setShowDirectiveComplete] = useState(false);
  const [showMissingCondition, setShowMissingCondition] = useState(false);
  const [missingConditionMessage, setMissingConditionMessage] = useState('');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;



  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  if (isLoading || isOnboardingComplete === null || !activeProject) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'active');

  const handleSwitchProject = (projectId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switchProject(projectId);
    setIsProjectMenuOpen(false);
  };

  const handleCompleteDirective = () => {
    if (!activeProject) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeDailyDirective(activeProject.id);
    setShowDirectiveComplete(true);
    setTimeout(() => setShowDirectiveComplete(false), 2000);
  };

  const handleProjectAction = (action: 'archive' | 'delete', projectId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action === 'archive') {
      archiveProject(projectId);
    } else {
      deleteProject(projectId);
    }
    setIsProjectActionsOpen(false);
    setSelectedProjectForActions(null);
  };

  const handleOpenForge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/advisor');
  };

  const handleGenerateDailyTask = () => {
    if (!activeProject) return;
    
    const hasMetrics = metrics.length > 0;
    const hasAdvisorDirective = !!activeProject.advisorDirective;
    
    if (!hasMetrics && !hasAdvisorDirective) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setMissingConditionMessage('Go to Forge, log your metrics, and get guidance from Skyforge first.');
      setShowMissingCondition(true);
      setTimeout(() => setShowMissingCondition(false), 4000);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let directive: DailyDirective;
    
    if (hasAdvisorDirective && activeProject.advisorDirective) {
      directive = {
        id: Date.now().toString(),
        title: activeProject.advisorDirective.title,
        description: activeProject.advisorDirective.description,
        reason: activeProject.advisorDirective.reason,
        estimatedTime: activeProject.advisorDirective.estimatedTime,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    } else {
      const focus = activeProject.focusMode === 'manual' 
        ? activeProject.manualFocusArea || 'leads'
        : activeProject.bottleneck || 'leads';
      
      directive = {
        id: Date.now().toString(),
        title: getDirectiveForFocus(focus).title,
        description: getDirectiveForFocus(focus).description,
        reason: getDirectiveForFocus(focus).reason,
        estimatedTime: getDirectiveForFocus(focus).estimatedTime,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }
    
    updateDailyDirective({ projectId: activeProject.id, directive });
  };

  const getDirectiveForFocus = (focus: string) => {
    const directives: Record<string, { title: string; description: string; reason: string; estimatedTime: string }> = {
      leads: {
        title: 'Record 1 short-form video addressing a pain point',
        description: 'Create a 30-60 second video that speaks directly to your ideal customer\'s biggest frustration.',
        reason: 'Your main bottleneck is lead generation. This task directly increases your visibility.',
        estimatedTime: '20-30 minutes',
      },
      content: {
        title: 'Write and schedule 3 social posts',
        description: 'Create 3 value-driven posts: 1 educational tip, 1 success story, and 1 behind-the-scenes look.',
        reason: 'Consistent content builds trust and keeps you top-of-mind with your audience.',
        estimatedTime: '30-45 minutes',
      },
      outreach: {
        title: 'Send 10 personalized DMs to potential clients',
        description: 'Identify 10 people who fit your ideal customer profile and send them a genuine message.',
        reason: 'Direct outreach is the fastest path to new conversations and opportunities.',
        estimatedTime: '30-40 minutes',
      },
      sales: {
        title: 'Follow up with 5 warm leads',
        description: 'Reach out to people who showed interest but haven\'t bought yet.',
        reason: 'Most sales happen after multiple touchpoints. Following up closes deals.',
        estimatedTime: '20-30 minutes',
      },
    };
    return directives[focus] || directives.leads;
  };

  return (
    <View style={styles.container}>
      <BrandWatermark opacity={0.025} size={280} position="center" />
      
      <View style={styles.projectBar}>
        <TouchableOpacity 
          style={styles.projectSelector}
          onPress={() => setIsProjectMenuOpen(true)}
        >
          <View style={styles.projectSelectorContent}>
            <Text style={styles.projectSelectorLabel}>Active Project</Text>
            <View style={styles.projectNameRow}>
              <Text style={styles.projectName} numberOfLines={1}>
                {activeProject?.name || 'Select Project'}
              </Text>
              <ChevronDown size={16} color={Colors.textSecondary} />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.newProjectButton}
          onPress={() => router.push('/onboarding')}
        >
          <Plus size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          <TouchableOpacity
            style={styles.forgeButton}
            onPress={handleOpenForge}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]}
              style={styles.forgeButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.forgeIconContainer}>
                <BrandMicroIcon size={28} color={Colors.text} />
              </View>
              <View style={styles.forgeTextContainer}>
                <Text style={styles.forgeButtonTitle}>Forge</Text>
                <Text style={styles.forgeButtonSubtitle}>Open Skyforge Advisor</Text>
              </View>
              <Sparkles size={24} color="rgba(255,255,255,0.6)" style={styles.forgeSparkle} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.directiveSection}>
            <View style={styles.directiveSectionHeader}>
              <BrandMicroIcon size={16} color={Colors.accent} />
              <Text style={styles.directiveSectionTitle}>Today's Task</Text>
            </View>

            {activeProject?.dailyDirective ? (
              <LinearGradient
                colors={[Colors.tertiary, Colors.secondary]}
                style={styles.directiveCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.directiveHeader}>
                  <View style={styles.directiveBadge}>
                    <Zap size={12} color={Colors.primary} />
                    <Text style={styles.directiveBadgeText}>Daily Directive</Text>
                  </View>
                  {activeProject.dailyDirective.status === 'complete' && (
                    <View style={styles.completedBadge}>
                      <CheckCircle2 size={14} color={Colors.success} />
                      <Text style={styles.completedBadgeText}>Done</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.directiveTitle}>{activeProject.dailyDirective.title}</Text>
                <Text style={styles.directiveDescription}>{activeProject.dailyDirective.description}</Text>
                
                <View style={styles.directiveMeta}>
                  <View style={styles.directiveReason}>
                    <Text style={styles.directiveReasonLabel}>Why:</Text>
                    <Text style={styles.directiveReasonText}>{activeProject.dailyDirective.reason}</Text>
                  </View>
                  <View style={styles.directiveTime}>
                    <Clock size={14} color={Colors.textMuted} />
                    <Text style={styles.directiveTimeText}>{activeProject.dailyDirective.estimatedTime}</Text>
                  </View>
                </View>

                {activeProject.dailyDirective.status !== 'complete' && (
                  <TouchableOpacity 
                    style={styles.completeButton}
                    onPress={handleCompleteDirective}
                  >
                    <CheckCircle2 size={18} color={Colors.primary} />
                    <Text style={styles.completeButtonText}>Mark as Done</Text>
                  </TouchableOpacity>
                )}

                {showDirectiveComplete && (
                  <View style={styles.celebrationOverlay}>
                    <Text style={styles.celebrationText}>Great work! Keep the momentum going.</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.emptyDirective}>
                <Sparkles size={32} color={Colors.textMuted} />
                <Text style={styles.emptyDirectiveTitle}>No directive yet</Text>
                <Text style={styles.emptyDirectiveText}>
                  Log metrics in Forge and get guidance first
                </Text>
                
                {showMissingCondition && (
                  <View style={styles.missingConditionBanner}>
                    <Text style={styles.missingConditionText}>{missingConditionMessage}</Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.generateTaskButton}
                  onPress={handleGenerateDailyTask}
                >
                  <Zap size={18} color={Colors.primary} />
                  <Text style={styles.generateTaskButtonText}>Generate Daily Task</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={isProjectMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProjectMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsProjectMenuOpen(false)}
        >
          <View style={styles.projectMenu}>
            <View style={styles.projectMenuHeader}>
              <Text style={styles.projectMenuTitle}>Your Projects</Text>
              <TouchableOpacity onPress={() => setIsProjectMenuOpen(false)}>
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.projectList}>
              {activeProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectItem,
                    project.id === activeProjectId && styles.projectItemActive
                  ]}
                  onPress={() => handleSwitchProject(project.id)}
                >
                  <View style={styles.projectItemContent}>
                    <Text style={[
                      styles.projectItemName,
                      project.id === activeProjectId && styles.projectItemNameActive
                    ]}>{project.name}</Text>
                    <Text style={styles.projectItemType}>{project.businessType}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.projectActionsButton}
                    onPress={(e) => {
                      e.stopPropagation();
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
              onPress={() => {
                setIsProjectMenuOpen(false);
                router.push('/onboarding');
              }}
            >
              <Plus size={18} color={Colors.accent} />
              <Text style={styles.newProjectMenuText}>New Project</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isProjectActionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProjectActionsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsProjectActionsOpen(false)}
        >
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  projectSelector: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectSelectorContent: {
    gap: 2,
  },
  projectSelectorLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  newProjectButton: {
    width: 44,
    height: 44,
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
  content: {
    flex: 1,
  },
  forgeButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.brandGradient.start,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  forgeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  forgeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  forgeTextContainer: {
    flex: 1,
  },
  forgeButtonTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 2,
  },
  forgeButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  forgeSparkle: {
    opacity: 0.6,
  },
  directiveSection: {
    marginBottom: 24,
  },
  directiveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  directiveSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  directiveCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  directiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  directiveBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 212, 170, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  directiveTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  directiveDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  directiveMeta: {
    gap: 12,
    marginBottom: 16,
  },
  directiveReason: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  directiveReasonLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  directiveReasonText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  directiveTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directiveTimeText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 212, 170, 0.95)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    textAlign: 'center',
  },
  emptyDirective: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyDirectiveTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDirectiveText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  missingConditionBanner: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.warning + '40',
  },
  missingConditionText: {
    fontSize: 13,
    color: Colors.warning,
    textAlign: 'center',
    lineHeight: 18,
  },
  generateTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
  },
  generateTaskButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
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
});
