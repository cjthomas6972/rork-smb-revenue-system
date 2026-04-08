import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, DollarSign, TrendingUp, Wrench } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { Project } from '@/types/business';

const GOALS = [
  {
    id: 'customers',
    label: 'Get more paying customers',
    icon: DollarSign,
    bottleneck: 'leads',
  },
  {
    id: 'scale',
    label: 'Scale what\'s already working',
    icon: TrendingUp,
    bottleneck: 'content',
  },
  {
    id: 'fix',
    label: 'Fix what\'s broken in my business',
    icon: Wrench,
    bottleneck: 'systems',
  },
] as const;

type GoalId = (typeof GOALS)[number]['id'];

function inferBusinessType(offer: string): string {
  const lower = offer.toLowerCase();
  if (lower.includes('roof')) return 'Roofing';
  if (lower.includes('hvac')) return 'HVAC';
  if (lower.includes('gym') || lower.includes('fitness')) return 'Fitness';
  if (lower.includes('consult')) return 'Consulting';
  if (lower.includes('real estate')) return 'Real Estate';
  if (lower.includes('dent')) return 'Dental';
  if (lower.includes('legal') || lower.includes('law')) return 'Legal';
  if (lower.includes('marketing')) return 'Marketing';
  if (lower.includes('plumb')) return 'Plumbing';
  return 'Service Business';
}

function inferProjectName(offer: string, businessType: string): string {
  const cleaned = offer.split('.').shift()?.trim() ?? '';
  if (cleaned.length >= 4 && cleaned.length <= 36) return cleaned;
  return `My ${businessType} Business`;
}

function inferLocal(customer: string, offer: string): { isLocal: boolean; location?: string } {
  const text = `${customer} ${offer}`;
  const locationMatch = text.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/);
  const location = locationMatch?.[1]?.trim();
  return {
    isLocal: Boolean(location),
    location,
  };
}

function getGoalConfig(goal: GoalId | null) {
  return GOALS.find((item) => item.id === goal) ?? GOALS[0];
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { createProject, generateDailyDirective } = useBusiness();
  const [step, setStep] = useState<number>(0);
  const [offerInput, setOfferInput] = useState<string>('');
  const [customerInput, setCustomerInput] = useState<string>('');
  const [goal, setGoal] = useState<GoalId | null>(null);

  const canContinue = useMemo(() => {
    if (step === 0) return offerInput.trim().length > 4;
    if (step === 1) return customerInput.trim().length > 4;
    return goal !== null;
  }, [customerInput, goal, offerInput, step]);

  const handleNext = () => {
    if (!canContinue) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }

    const goalConfig = getGoalConfig(goal);
    const businessType = inferBusinessType(offerInput);
    const inferredProjectName = inferProjectName(offerInput, businessType);
    const locationInfo = inferLocal(customerInput, offerInput);
    const directive = generateDailyDirective(goalConfig.bottleneck);
    const now = new Date().toISOString();

    const project: Project = {
      id: `${Date.now()}`,
      name: inferredProjectName,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      businessType,
      targetCustomer: customerInput.trim(),
      isLocal: locationInfo.isLocal,
      location: locationInfo.location,
      revenueGoal: goalConfig.label,
      availableDailyTime: '45 minutes',
      coreOfferSummary: offerInput.trim(),
      pricing: 'Not set yet',
      bottleneck: goalConfig.bottleneck,
      focusMode: 'autopilot',
      dailyDirective: directive,
    };

    createProject(project);
    router.replace('/' as never);
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((current) => current - 1);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ChevronLeft size={18} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.progressWrap}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={[styles.progressDot, index <= step && styles.progressDotActive]} />
              ))}
            </View>
            <Text style={styles.stepText}>{step + 1}/3</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.kicker}>SKYFORGE</Text>
            {step === 0 ? (
              <>
                <Text style={styles.title}>What do you sell?</Text>
                <Text style={styles.subtitle}>Describe it the way you would explain it to a customer.</Text>
                <TextInput
                  style={styles.largeInput}
                  value={offerInput}
                  onChangeText={setOfferInput}
                  placeholder="e.g., I\'m a roofer. I replace roofs for homeowners."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  testID="onboarding-offer-input"
                />
              </>
            ) : null}

            {step === 1 ? (
              <>
                <Text style={styles.title}>Who\'s your customer?</Text>
                <Text style={styles.subtitle}>Keep it simple. Who do you want more of?</Text>
                <TextInput
                  style={styles.largeInput}
                  value={customerInput}
                  onChangeText={setCustomerInput}
                  placeholder="e.g., Homeowners in the Tampa area, usually 40-60yo."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  textAlignVertical="top"
                  testID="onboarding-customer-input"
                />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Text style={styles.title}>What\'s your goal right now?</Text>
                <Text style={styles.subtitle}>Pick the mode SKYFORGE should optimize for first.</Text>
                <View style={styles.goalList}>
                  {GOALS.map((item) => {
                    const Icon = item.icon;
                    const selected = goal === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.goalCard, selected && styles.goalCardActive]}
                        onPress={() => setGoal(item.id)}
                        activeOpacity={0.85}
                        testID={`goal-${item.id}`}
                      >
                        <View style={[styles.goalIconWrap, selected && styles.goalIconWrapActive]}>
                          <Icon size={20} color={selected ? Colors.primary : Colors.accent} />
                        </View>
                        <Text style={[styles.goalLabel, selected && styles.goalLabelActive]}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>

          <TouchableOpacity disabled={!canContinue} onPress={handleNext} style={styles.ctaWrap} testID="onboarding-next-button">
            <LinearGradient
              colors={canContinue ? [Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end] : [Colors.tertiary, Colors.tertiary]}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>{step === 2 ? 'ENTER SKYFORGE' : 'CONTINUE'}</Text>
              <ChevronRight size={18} color={Colors.text} />
            </LinearGradient>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.brandGradient.middle,
    opacity: 0.12,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.brandGradient.end,
    opacity: 0.08,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 34,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
  },
  stepText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  kicker: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  title: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '800' as const,
    marginBottom: 10,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  largeInput: {
    minHeight: 180,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    color: Colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  goalList: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.secondary,
    padding: 16,
  },
  goalCardActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.tertiary,
  },
  goalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconWrapActive: {
    backgroundColor: Colors.accent,
  },
  goalLabel: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  goalLabelActive: {
    color: Colors.text,
  },
  ctaWrap: {
    marginTop: 12,
  },
  cta: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  ctaText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
});
