import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft, Target, Zap, TrendingUp, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBusiness } from '@/store/BusinessContext';
import { Project, PrimaryProblem, Metrics, DailyDirective } from '@/types/business';
import { diagnoseBottleneck } from '@/utils/executionEngine';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { SkyforgeLogoFull, BrandWatermark } from '@/components/brand';

const BOTTLENECK_MAP: Record<string, { label: string; color: string; icon: string }> = {
  traffic: { label: 'Traffic', color: '#3B82F6', icon: 'eye' },
  conversion: { label: 'Conversion', color: '#F59E0B', icon: 'target' },
  pricing: { label: 'Pricing', color: '#EF4444', icon: 'dollar' },
  'follow-up': { label: 'Follow-up', color: '#8B5CF6', icon: 'message' },
  operations: { label: 'Operations', color: '#6B7280', icon: 'settings' },
};

const PROBLEMS: { key: PrimaryProblem; label: string; desc: string }[] = [
  { key: 'leads', label: 'Lead Generation', desc: 'Need more prospects and inquiries' },
  { key: 'sales', label: 'Sales Conversion', desc: 'Leads but not closing deals' },
  { key: 'pricing', label: 'Pricing Strategy', desc: 'Unsure about pricing or margins' },
  { key: 'content', label: 'Content & Marketing', desc: 'Need better visibility and reach' },
  { key: 'systems', label: 'Systems & Operations', desc: 'Overwhelmed, need to systematize' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { createProject, projects, isOnboardingComplete, generateDailyDirective, addMetrics, updateDailyDirective } = useBusiness();
  const [step, setStep] = useState(0);

  const isNewProject = isOnboardingComplete && projects.length > 0;

  const [projectName, setProjectName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [isLocal, setIsLocal] = useState<boolean | null>(null);
  const [location, setLocation] = useState('');
  const [coreOfferSummary, setCoreOfferSummary] = useState('');
  const [pricing, setPricing] = useState('');
  const [revenueGoal, setRevenueGoal] = useState('');
  const [availableDailyTime, setAvailableDailyTime] = useState('');
  const [primaryProblem, setPrimaryProblem] = useState<PrimaryProblem | null>(null);

  const [initialViews, setInitialViews] = useState('');
  const [initialClicks, setInitialClicks] = useState('');
  const [initialMessages, setInitialMessages] = useState('');
  const [initialCalls, setInitialCalls] = useState('');
  const [initialSales, setInitialSales] = useState('');

  const [diagnosedBottleneck, setDiagnosedBottleneck] = useState<string | null>(null);
  const [diagnosedConfidence, setDiagnosedConfidence] = useState(0);
  const [diagnosedReasoning, setDiagnosedReasoning] = useState('');
  const [generatedDirective, setGeneratedDirective] = useState<DailyDirective | null>(null);

  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const STEPS = isNewProject
    ? [
        { key: 'business', title: 'Project Details' },
        { key: 'location', title: 'Location' },
        { key: 'offer', title: 'Your Offer' },
        { key: 'goals', title: 'Goals & Metrics' },
        { key: 'problem', title: 'Primary Challenge' },
        { key: 'diagnosis', title: 'Bottleneck Diagnosis' },
        { key: 'directive', title: 'Your First Move' },
      ]
    : [
        { key: 'welcome', title: 'Welcome' },
        { key: 'business', title: 'Project Details' },
        { key: 'location', title: 'Location' },
        { key: 'offer', title: 'Your Offer' },
        { key: 'goals', title: 'Goals & Metrics' },
        { key: 'problem', title: 'Primary Challenge' },
        { key: 'diagnosis', title: 'Bottleneck Diagnosis' },
        { key: 'directive', title: 'Your First Move' },
      ];

  const currentStepKey = STEPS[step]?.key;

  const canContinue = () => {
    switch (currentStepKey) {
      case 'welcome': return true;
      case 'business': return projectName.trim() && businessType.trim();
      case 'location': return isLocal !== null && (isLocal ? location.trim() : true);
      case 'offer': return coreOfferSummary.trim() && pricing.trim();
      case 'goals': return revenueGoal.trim() && availableDailyTime.trim();
      case 'problem': return primaryProblem !== null;
      case 'diagnosis': return true;
      case 'directive': return true;
      default: return false;
    }
  };

  const runDiagnosis = () => {
    const views = parseInt(initialViews) || 0;
    const clicks = parseInt(initialClicks) || 0;
    const messages = parseInt(initialMessages) || 0;
    const calls = parseInt(initialCalls) || 0;
    const sales = parseInt(initialSales) || 0;

    const hasMetrics = views + clicks + messages + calls + sales > 0;

    if (hasMetrics) {
      const now = new Date();
      const mockMetrics: Metrics[] = [
        {
          id: 'onboard-recent',
          projectId: 'temp',
          date: now.toISOString().split('T')[0],
          views, clicks, messages, calls, sales,
        },
        {
          id: 'onboard-prior',
          projectId: 'temp',
          date: new Date(now.getTime() - 8 * 86400000).toISOString().split('T')[0],
          views: Math.round(views * 0.8),
          clicks: Math.round(clicks * 0.8),
          messages: Math.round(messages * 0.8),
          calls: Math.round(calls * 0.8),
          sales: Math.round(sales * 0.8),
        },
      ];

      const result = diagnoseBottleneck(mockMetrics);
      if (result) {
        setDiagnosedBottleneck(result.category);
        setDiagnosedConfidence(result.confidence);
        setDiagnosedReasoning(result.reasoning);
      } else {
        inferFromProblem();
      }
    } else {
      inferFromProblem();
    }

    const focus = diagnosedBottleneck || mapProblemToFocus(primaryProblem || 'leads');
    const directive = generateDailyDirective(focus);
    setGeneratedDirective(directive);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const inferFromProblem = () => {
    const problemToBottleneck: Record<string, string> = {
      leads: 'traffic',
      sales: 'conversion',
      pricing: 'pricing',
      content: 'traffic',
      systems: 'operations',
    };
    const bn = problemToBottleneck[primaryProblem || 'leads'] || 'traffic';
    setDiagnosedBottleneck(bn);
    setDiagnosedConfidence(60);
    setDiagnosedReasoning(`Based on your stated challenge: ${PROBLEMS.find(p => p.key === primaryProblem)?.label || 'Lead Generation'}.`);
  };

  const mapProblemToFocus = (problem: string): string => {
    const map: Record<string, string> = {
      leads: 'leads', sales: 'sales', pricing: 'pricing',
      content: 'content', systems: 'systems',
    };
    return map[problem] || 'leads';
  };

  const handleNext = () => {
    if (!canContinue()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStepKey === 'problem') {
      runDiagnosis();
      setStep(step + 1);
      return;
    }

    if (currentStepKey === 'directive') {
      handleFinish();
      return;
    }

    setStep(step + 1);
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const projectId = Date.now().toString();
    const project: Project = {
      id: projectId,
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      businessType,
      targetCustomer: targetCustomer || 'General audience',
      isLocal: isLocal!,
      location: isLocal ? location : undefined,
      revenueGoal,
      availableDailyTime,
      coreOfferSummary,
      pricing,
      bottleneck: primaryProblem!,
      focusMode: 'autopilot',
      manualFocusArea: undefined,
      dailyDirective: generatedDirective || undefined,
    };

    createProject(project);

    const views = parseInt(initialViews) || 0;
    const clicks = parseInt(initialClicks) || 0;
    const messages = parseInt(initialMessages) || 0;
    const calls = parseInt(initialCalls) || 0;
    const sales = parseInt(initialSales) || 0;

    if (views + clicks + messages + calls + sales > 0) {
      const metricsData: Metrics = {
        id: `${projectId}-initial`,
        projectId,
        date: new Date().toISOString().split('T')[0],
        views, clicks, messages, calls, sales,
        notes: 'Initial metrics from onboarding',
      };
      setTimeout(() => addMetrics(metricsData), 200);
    }

    router.replace('/' as never);
  };

  const handleBack = () => {
    if (step > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1);
    } else if (isNewProject) {
      router.back();
    }
  };

  const renderStep = () => {
    switch (currentStepKey) {
      case 'welcome':
        return (
          <View style={styles.welcomeContainer}>
            <SkyforgeLogoFull size="large" showText />
            <Text style={styles.welcomeSubtitle}>Revenue Execution Engine</Text>
            <Text style={styles.welcomeDescription}>
              Answer a few questions. We will diagnose your #1 bottleneck and give you today's exact move.
            </Text>
          </View>
        );

      case 'business':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g., My Consulting Business"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.label}>Business Type / Industry</Text>
            <TextInput
              style={styles.input}
              value={businessType}
              onChangeText={setBusinessType}
              placeholder="e.g., HVAC, Consulting, Fitness"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.label}>Target Customer (optional)</Text>
            <TextInput
              style={styles.input}
              value={targetCustomer}
              onChangeText={setTargetCustomer}
              placeholder="e.g., Small business owners"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        );

      case 'location':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Business Type</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionCard, isLocal === true && styles.optionCardActive]}
                onPress={() => setIsLocal(true)}
              >
                <Text style={[styles.optionTitle, isLocal === true && styles.optionTitleActive]}>Local</Text>
                <Text style={styles.optionDesc}>Serve customers in a specific area</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionCard, isLocal === false && styles.optionCardActive]}
                onPress={() => setIsLocal(false)}
              >
                <Text style={[styles.optionTitle, isLocal === false && styles.optionTitleActive]}>Online</Text>
                <Text style={styles.optionDesc}>Serve customers remotely</Text>
              </TouchableOpacity>
            </View>
            {isLocal && (
              <>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g., Austin, TX"
                  placeholderTextColor={Colors.textMuted}
                />
              </>
            )}
          </View>
        );

      case 'offer':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Core Offer</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={coreOfferSummary}
              onChangeText={setCoreOfferSummary}
              placeholder="What do you sell? Describe your main service or product..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.label}>Pricing</Text>
            <TextInput
              style={styles.input}
              value={pricing}
              onChangeText={setPricing}
              placeholder="e.g., $500/project, $150/hr"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        );

      case 'goals':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Monthly Revenue Goal</Text>
            <TextInput
              style={styles.input}
              value={revenueGoal}
              onChangeText={setRevenueGoal}
              placeholder="e.g., $10,000/month"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.label}>Time Available Per Day</Text>
            <TextInput
              style={styles.input}
              value={availableDailyTime}
              onChangeText={setAvailableDailyTime}
              placeholder="e.g., 2 hours, 30 minutes"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={styles.metricsDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Current Numbers (last 7 days)</Text>
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.metricsHint}>Enter your best estimates. Leave blank if unknown.</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricInput}>
                <Text style={styles.metricLabel}>Views</Text>
                <TextInput
                  style={styles.metricField}
                  value={initialViews}
                  onChangeText={setInitialViews}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.metricInput}>
                <Text style={styles.metricLabel}>Clicks</Text>
                <TextInput
                  style={styles.metricField}
                  value={initialClicks}
                  onChangeText={setInitialClicks}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metricInput}>
                <Text style={styles.metricLabel}>Messages</Text>
                <TextInput
                  style={styles.metricField}
                  value={initialMessages}
                  onChangeText={setInitialMessages}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.metricInput}>
                <Text style={styles.metricLabel}>Calls</Text>
                <TextInput
                  style={styles.metricField}
                  value={initialCalls}
                  onChangeText={setInitialCalls}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.metricInput}>
                <Text style={styles.metricLabel}>Sales</Text>
                <TextInput
                  style={styles.metricField}
                  value={initialSales}
                  onChangeText={setInitialSales}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        );

      case 'problem':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.problemPrompt}>
              What is your biggest challenge right now?
            </Text>
            {PROBLEMS.map((problem) => (
              <TouchableOpacity
                key={problem.key}
                style={[styles.problemCard, primaryProblem === problem.key && styles.problemCardActive]}
                onPress={() => setPrimaryProblem(problem.key)}
              >
                <Text style={[styles.problemTitle, primaryProblem === problem.key && styles.problemTitleActive]}>
                  {problem.label}
                </Text>
                <Text style={styles.problemDesc}>{problem.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'diagnosis':
        return (
          <View style={styles.diagnosisContainer}>
            <Animated.View style={[styles.diagnosisIcon, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={[
                  (BOTTLENECK_MAP[diagnosedBottleneck || 'traffic']?.color || '#3B82F6') + '30',
                  Colors.tertiary,
                ]}
                style={styles.diagnosisIconGradient}
              >
                <Target size={40} color={BOTTLENECK_MAP[diagnosedBottleneck || 'traffic']?.color || '#3B82F6'} />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.diagnosisLabel}>YOUR #1 BOTTLENECK</Text>
            <Text style={[
              styles.diagnosisCategory,
              { color: BOTTLENECK_MAP[diagnosedBottleneck || 'traffic']?.color || '#3B82F6' }
            ]}>
              {BOTTLENECK_MAP[diagnosedBottleneck || 'traffic']?.label || 'Traffic'}
            </Text>

            <View style={styles.confidenceBar}>
              <View style={styles.confidenceTrack}>
                <View style={[
                  styles.confidenceFill,
                  {
                    width: `${diagnosedConfidence}%`,
                    backgroundColor: BOTTLENECK_MAP[diagnosedBottleneck || 'traffic']?.color || '#3B82F6',
                  }
                ]} />
              </View>
              <Text style={styles.confidenceText}>{diagnosedConfidence}% confidence</Text>
            </View>

            <View style={styles.reasoningCard}>
              <AlertTriangle size={14} color={Colors.warning} />
              <Text style={styles.reasoningText}>{diagnosedReasoning}</Text>
            </View>
          </View>
        );

      case 'directive':
        return (
          <View style={styles.directiveContainer}>
            <View style={styles.directiveHeader}>
              <Zap size={20} color={Colors.accent} />
              <Text style={styles.directiveHeaderText}>YOUR FIRST MOVE</Text>
            </View>

            {generatedDirective && (
              <View style={styles.directiveCard}>
                <Text style={styles.directiveTitle}>{generatedDirective.title}</Text>
                <Text style={styles.directiveObjective}>{generatedDirective.objective}</Text>

                <View style={styles.directiveSteps}>
                  {generatedDirective.steps.map((s, i) => (
                    <View key={i} style={styles.directiveStep}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{s.order}</Text>
                      </View>
                      <Text style={styles.stepAction}>{s.action}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.directiveMeta}>
                  <View style={styles.directiveMetaItem}>
                    <TrendingUp size={14} color={Colors.accent} />
                    <Text style={styles.directiveMetaText}>{generatedDirective.successMetric}</Text>
                  </View>
                  <View style={styles.directiveMetaItem}>
                    <Target size={14} color={Colors.textMuted} />
                    <Text style={styles.directiveMetaText}>{generatedDirective.timeboxMinutes} min</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.directiveFooter}>
              This will be your Daily Task on the dashboard. Complete it to start your execution streak.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BrandWatermark opacity={0.02} size={300} position="center" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.progressContainer}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[styles.progressDot, index <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        {currentStepKey !== 'welcome' && (
          <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {(step > 0 || isNewProject) && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ChevronLeft size={20} color={Colors.textSecondary} />
              <Text style={styles.backButtonText}>
                {step === 0 && isNewProject ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, !canContinue() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canContinue()}
          >
            <LinearGradient
              colors={
                currentStepKey === 'directive'
                  ? [Colors.accent, Colors.accentDark]
                  : [Colors.accent, Colors.accent]
              }
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.nextButtonText}>
                {currentStepKey === 'directive' ? 'Start Executing' : 'Continue'}
              </Text>
              {currentStepKey === 'directive' ? (
                <Zap size={18} color={Colors.primary} />
              ) : (
                <ChevronRight size={18} color={Colors.primary} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
    width: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: Colors.accent,
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  welcomeDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.tertiary,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  optionTitleActive: {
    color: Colors.accent,
  },
  optionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  metricsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 8,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  metricsHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricInput: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  metricField: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  problemPrompt: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  problemCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  problemCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.tertiary,
  },
  problemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  problemTitleActive: {
    color: Colors.accent,
  },
  problemDesc: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  diagnosisContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  diagnosisIcon: {
    marginBottom: 24,
  },
  diagnosisIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosisLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  diagnosisCategory: {
    fontSize: 32,
    fontWeight: '800' as const,
    marginBottom: 20,
  },
  confidenceBar: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  confidenceTrack: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiary,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceFill: {
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  reasoningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  reasoningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  directiveContainer: {
    flex: 1,
  },
  directiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  directiveHeaderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 2,
  },
  directiveCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    marginBottom: 20,
  },
  directiveTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 26,
  },
  directiveObjective: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  directiveSteps: {
    gap: 12,
    marginBottom: 20,
  },
  directiveStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  stepAction: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  directiveMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  directiveMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directiveMetaText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  directiveFooter: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
