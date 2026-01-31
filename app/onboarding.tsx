import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBusiness } from '@/store/BusinessContext';
import { Project, PrimaryProblem } from '@/types/business';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { SkyforgeLogoFull, BrandWatermark } from '@/components/brand';

const STEPS = [
  { key: 'welcome', title: 'New Project' },
  { key: 'business', title: 'Project Details' },
  { key: 'location', title: 'Location' },
  { key: 'offer', title: 'Your Offer' },
  { key: 'goals', title: 'Goals' },
  { key: 'problem', title: 'Primary Focus' },
];

const PROBLEMS: { key: PrimaryProblem; label: string; desc: string }[] = [
  { key: 'leads', label: 'Lead Generation', desc: 'Need more prospects and inquiries' },
  { key: 'sales', label: 'Sales Conversion', desc: 'Leads but not closing deals' },
  { key: 'pricing', label: 'Pricing Strategy', desc: 'Unsure about pricing or margins' },
  { key: 'content', label: 'Content & Marketing', desc: 'Need better visibility and reach' },
  { key: 'systems', label: 'Systems & Operations', desc: 'Overwhelmed, need to systematize' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { createProject, projects, isOnboardingComplete } = useBusiness();
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

  const canContinue = () => {
    switch (step) {
      case 0: return true;
      case 1: return projectName.trim() && businessType.trim();
      case 2: return isLocal !== null && (isLocal ? location.trim() : true);
      case 3: return coreOfferSummary.trim() && pricing.trim();
      case 4: return revenueGoal.trim() && availableDailyTime.trim();
      case 5: return primaryProblem !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canContinue()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (step === STEPS.length - 1) {
      const project: Project = {
        id: Date.now().toString(),
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
      };
      createProject(project);
      router.replace('/');
    } else {
      setStep(step + 1);
    }
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
    switch (step) {
      case 0:
        return (
          <View style={styles.welcomeContainer}>
            <SkyforgeLogoFull size={isNewProject ? 'medium' : 'large'} showText={!isNewProject} />
            {isNewProject && (
              <Text style={styles.welcomeTitle}>New Project</Text>
            )}
            <Text style={styles.welcomeSubtitle}>
              {isNewProject 
                ? 'Create another revenue system'
                : 'AI-Powered Revenue Engine'
              }
            </Text>
            <Text style={styles.welcomeDescription}>
              {isNewProject
                ? 'Set up a new project to track and grow another business or revenue stream.'
                : 'Answer a few questions to get personalized strategies, scripts, and daily actions tailored to your business.'
              }
            </Text>
          </View>
        );

      case 1:
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
              placeholder="e.g., Small business owners, Homeowners"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Business Type</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionCard, isLocal === true && styles.optionCardActive]}
                onPress={() => setIsLocal(true)}
              >
                <Text style={[styles.optionTitle, isLocal === true && styles.optionTitleActive]}>
                  Local
                </Text>
                <Text style={styles.optionDesc}>Serve customers in a specific area</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionCard, isLocal === false && styles.optionCardActive]}
                onPress={() => setIsLocal(false)}
              >
                <Text style={[styles.optionTitle, isLocal === false && styles.optionTitleActive]}>
                  Online
                </Text>
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

      case 3:
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
              placeholder="e.g., $500/project, $150/hr, $99/month"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        );

      case 4:
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
          </View>
        );

      case 5:
        return (
          <View style={styles.formContainer}>
            <Text style={styles.problemPrompt}>
              What is your biggest challenge right now?
            </Text>
            {PROBLEMS.map((problem) => (
              <TouchableOpacity
                key={problem.key}
                style={[
                  styles.problemCard,
                  primaryProblem === problem.key && styles.problemCardActive,
                ]}
                onPress={() => setPrimaryProblem(problem.key)}
              >
                <Text
                  style={[
                    styles.problemTitle,
                    primaryProblem === problem.key && styles.problemTitleActive,
                  ]}
                >
                  {problem.label}
                </Text>
                <Text style={styles.problemDesc}>{problem.desc}</Text>
              </TouchableOpacity>
            ))}
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
              style={[
                styles.progressDot,
                index <= step && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {step > 0 && (
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
            <Text style={styles.nextButtonText}>
              {step === STEPS.length - 1 ? 'Create Project' : 'Continue'}
            </Text>
            <ChevronRight size={20} color={Colors.primary} />
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
    gap: 8,
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiary,
  },
  progressDotActive: {
    backgroundColor: Colors.brandGradient.start,
    width: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
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
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.accent,
    marginBottom: 24,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 15,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.brandGradient.start,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
