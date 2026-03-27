import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  Plus,
  X,
  Edit3,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import { useBusiness } from '@/store/BusinessContext';
import { Metrics, FocusArea } from '@/types/business';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { BrandWatermark, BrandMicroIcon, BrandGradientBar } from '@/components/brand';

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    activeProject, 
    metrics, 
    updateProject, 
    addMetrics,
    userSettings,
    updateUserSettings,
    logout,
    activeProjectId,
    updateFocusMode,
  } = useBusiness();
  
  const [isMetricsModalVisible, setIsMetricsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isFocusModalVisible, setIsFocusModalVisible] = useState(false);

  const FOCUS_AREAS: { key: FocusArea; label: string }[] = [
    { key: 'leads', label: 'Leads' },
    { key: 'content', label: 'Content' },
    { key: 'outreach', label: 'Outreach' },
    { key: 'offer', label: 'Offer' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'conversion', label: 'Conversion' },
    { key: 'fulfillment', label: 'Fulfillment' },
    { key: 'audience building', label: 'Audience Building' },
    { key: 'brand expansion', label: 'Brand Expansion' },
  ];
  
  const [newMetrics, setNewMetrics] = useState({
    views: '',
    clicks: '',
    messages: '',
    calls: '',
    sales: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    businessType: '',
    location: '',
    coreOfferSummary: '',
    pricing: '',
    revenueGoal: '',
    availableDailyTime: '',
  });

  const [settingsForm, setSettingsForm] = useState({
    displayName: userSettings.displayName,
  });

  const openEditModal = () => {
    if (activeProject) {
      setEditForm({
        name: activeProject.name,
        businessType: activeProject.businessType,
        location: activeProject.location || '',
        coreOfferSummary: activeProject.coreOfferSummary,
        pricing: activeProject.pricing,
        revenueGoal: activeProject.revenueGoal,
        availableDailyTime: activeProject.availableDailyTime,
      });
    }
    setIsEditModalVisible(true);
  };

  const openSettingsModal = () => {
    setSettingsForm({
      displayName: userSettings.displayName,
    });
    setIsSettingsModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!editForm.name.trim() || !editForm.businessType.trim()) {
      Alert.alert('Error', 'Project name and business type are required');
      return;
    }
    if (!activeProjectId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateProject({ 
      id: activeProjectId, 
      updates: {
        name: editForm.name,
        businessType: editForm.businessType,
        location: editForm.location || undefined,
        coreOfferSummary: editForm.coreOfferSummary,
        pricing: editForm.pricing,
        revenueGoal: editForm.revenueGoal,
        availableDailyTime: editForm.availableDailyTime,
      }
    });
    setIsEditModalVisible(false);
  };

  const handleSaveSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateUserSettings({ displayName: settingsForm.displayName });
    setIsSettingsModalVisible(false);
  };

  const handleFocusChange = (area: FocusArea) => {
    if (!activeProject) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateFocusMode({ 
      projectId: activeProject.id, 
      focusMode: 'manual',
      manualFocusArea: area
    });
    setIsFocusModalVisible(false);
  };

  const getCurrentFocusLabel = () => {
    if (!activeProject) return 'Not set';
    if (activeProject.focusMode === 'manual' && activeProject.manualFocusArea) {
      return FOCUS_AREAS.find(f => f.key === activeProject.manualFocusArea)?.label || activeProject.manualFocusArea;
    }
    return activeProject.bottleneck ? activeProject.bottleneck.charAt(0).toUpperCase() + activeProject.bottleneck.slice(1) : 'Leads';
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? Your projects will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
            setIsSettingsModalVisible(false);
          }
        },
      ]
    );
  };

  const handleAddMetrics = () => {
    if (!activeProjectId) return;
    
    const metricsData: Metrics = {
      id: Date.now().toString(),
      projectId: activeProjectId,
      date: new Date().toISOString().split('T')[0],
      views: parseInt(newMetrics.views) || 0,
      clicks: parseInt(newMetrics.clicks) || 0,
      messages: parseInt(newMetrics.messages) || 0,
      calls: parseInt(newMetrics.calls) || 0,
      sales: parseInt(newMetrics.sales) || 0,
      notes: newMetrics.notes,
    };
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addMetrics(metricsData);
    setNewMetrics({ views: '', clicks: '', messages: '', calls: '', sales: '', notes: '' });
    setIsMetricsModalVisible(false);
  };

  const getMetricTrend = (current: number, previous: number) => {
    if (previous === 0) return { icon: Minus, color: Colors.textMuted };
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { icon: TrendingUp, color: Colors.success };
    if (change < 0) return { icon: TrendingDown, color: Colors.error };
    return { icon: Minus, color: Colors.textMuted };
  };

  const recentMetrics = metrics.slice(-7).reverse();
  const latestMetrics = recentMetrics[0];
  const previousMetrics = recentMetrics[1];

  return (
    <View style={styles.container}>
      <BrandWatermark opacity={0.03} size={240} position="top" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <BrandMicroIcon size={20} color={Colors.accent} withGlow />
          </View>
          <View>
            <Text style={styles.headerGreeting}>Welcome back</Text>
            <Text style={styles.headerName}>{userSettings.displayName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={openSettingsModal}>
          <Settings size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!activeProject ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No project selected</Text>
            <TouchableOpacity 
              style={styles.createProjectButton}
              onPress={() => router.push('/onboarding' as never)}
            >
              <Text style={styles.createProjectButtonText}>Create a Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.profileIcon}>
                  <Building2 size={24} color={Colors.accent} />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.businessName}>{activeProject.name}</Text>
                  <Text style={styles.industry}>{activeProject.businessType}</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
                  <Edit3 size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.profileDetails}>
                {activeProject.isLocal && activeProject.location && (
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={Colors.textMuted} />
                    <Text style={styles.detailText}>{activeProject.location}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <DollarSign size={16} color={Colors.textMuted} />
                  <Text style={styles.detailText}>{activeProject.pricing}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Target size={16} color={Colors.textMuted} />
                  <Text style={styles.detailText}>Goal: {activeProject.revenueGoal}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color={Colors.textMuted} />
                  <Text style={styles.detailText}>{activeProject.availableDailyTime}/day available</Text>
                </View>
              </View>

              <View style={styles.offerSection}>
                <Text style={styles.offerLabel}>Current Offer</Text>
                <Text style={styles.offerText}>{activeProject.coreOfferSummary}</Text>
              </View>

              <TouchableOpacity 
                style={styles.focusBadge}
                onPress={() => setIsFocusModalVisible(true)}
              >
                <View style={styles.focusBadgeLeft}>
                  <BrandMicroIcon size={14} color={Colors.accent} />
                  <Text style={styles.focusLabel}>Primary Focus</Text>
                </View>
                <View style={styles.focusBadgeRight}>
                  <Text style={styles.focusValue}>{getCurrentFocusLabel()}</Text>
                  <ChevronDown size={16} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>

            <BrandGradientBar height={1} opacity={0.3} />
            
            <View style={[styles.section, { marginTop: 20 }]}>
              <View style={styles.sectionHeader}>
                <BarChart3 size={18} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Metrics</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setIsMetricsModalVisible(true)}
                >
                  <Plus size={18} color={Colors.accent} />
                  <Text style={styles.addButtonText}>Log</Text>
                </TouchableOpacity>
              </View>

              {latestMetrics ? (
                <View style={styles.metricsGrid}>
                  {[
                    { key: 'views', label: 'Views' },
                    { key: 'clicks', label: 'Clicks' },
                    { key: 'messages', label: 'Messages' },
                    { key: 'calls', label: 'Calls' },
                    { key: 'sales', label: 'Sales' },
                  ].map((metric) => {
                    const currentValue = latestMetrics[metric.key as keyof Metrics] as number;
                    const previousValue = previousMetrics
                      ? (previousMetrics[metric.key as keyof Metrics] as number)
                      : 0;
                    const trend = getMetricTrend(currentValue, previousValue);
                    const TrendIcon = trend.icon;

                    return (
                      <View key={metric.key} style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <View style={styles.metricValueRow}>
                          <Text style={styles.metricValue}>{currentValue}</Text>
                          <TrendIcon size={14} color={trend.color} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyMetrics}>
                  <Text style={styles.emptyMetricsText}>No metrics logged yet</Text>
                  <Text style={styles.emptyMetricsSubtext}>
                    Track your views, clicks, and sales to get AI-powered insights
                  </Text>
                </View>
              )}
            </View>

            {recentMetrics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent History</Text>
                {recentMetrics.map((m) => (
                  <View key={m.id} style={styles.historyCard}>
                    <Text style={styles.historyDate}>{m.date}</Text>
                    <View style={styles.historyStats}>
                      <Text style={styles.historyStat}>V:{m.views}</Text>
                      <Text style={styles.historyStat}>C:{m.clicks}</Text>
                      <Text style={styles.historyStat}>M:{m.messages}</Text>
                      <Text style={styles.historyStat}>Ca:{m.calls}</Text>
                      <Text style={[styles.historyStat, { color: Colors.accent }]}>
                        S:{m.sales}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={isMetricsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsMetricsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Metrics</Text>
            <TouchableOpacity onPress={() => setIsMetricsModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {['views', 'clicks', 'messages', 'calls', 'sales'].map((field) => (
              <View key={field} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
                <TextInput
                  style={styles.input}
                  value={newMetrics[field as keyof typeof newMetrics]}
                  onChangeText={(text) => setNewMetrics({ ...newMetrics, [field]: text })}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            ))}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newMetrics.notes}
                onChangeText={(text) => setNewMetrics({ ...newMetrics, notes: text })}
                placeholder="What worked? What did you try?"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsMetricsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddMetrics}>
              <Text style={styles.saveButtonText}>Save Metrics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Project</Text>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {[
              { key: 'name', label: 'Project Name' },
              { key: 'businessType', label: 'Business Type' },
              { key: 'location', label: 'Location' },
              { key: 'pricing', label: 'Pricing' },
              { key: 'revenueGoal', label: 'Revenue Goal' },
              { key: 'availableDailyTime', label: 'Time Available' },
            ].map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={editForm[field.key as keyof typeof editForm]}
                  onChangeText={(text) => setEditForm({ ...editForm, [field.key]: text })}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Offer</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.coreOfferSummary}
                onChangeText={(text) => setEditForm({ ...editForm, coreOfferSummary: text })}
                placeholder="Describe your offer"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSettingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSettingsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setIsSettingsModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Account</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={settingsForm.displayName}
                  onChangeText={(text) => setSettingsForm({ ...settingsForm, displayName: text })}
                  placeholder="Your name"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Session</Text>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <LogOut size={20} color={Colors.error} />
                <Text style={styles.logoutButtonText}>Log out of Skyforge</Text>
              </TouchableOpacity>
              <Text style={styles.logoutHint}>
                Your projects and data will be preserved. You&apos;ll start fresh at the welcome screen.
              </Text>
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsSettingsModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isFocusModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsFocusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Primary Focus</Text>
            <TouchableOpacity onPress={() => setIsFocusModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.focusModalSubtitle}>
              Select the area you want Skyforge to prioritize for this project.
            </Text>
            {FOCUS_AREAS.map((area) => {
              const isSelected = activeProject?.focusMode === 'manual' 
                ? activeProject?.manualFocusArea === area.key
                : activeProject?.bottleneck === area.key;
              return (
                <TouchableOpacity
                  key={area.key}
                  style={[
                    styles.focusOption,
                    isSelected && styles.focusOptionActive
                  ]}
                  onPress={() => handleFocusChange(area.key)}
                >
                  <Text style={[
                    styles.focusOptionText,
                    isSelected && styles.focusOptionTextActive
                  ]}>{area.label}</Text>
                  {isSelected && (
                    <View style={styles.focusOptionCheck}>
                      <Target size={16} color={Colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.brandGradient.start,
  },
  headerGreeting: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
    marginBottom: 16,
  },
  createProjectButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  createProjectButtonText: {
    color: Colors.primary,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  profileCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  industry: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editButton: {
    padding: 8,
  },
  profileDetails: {
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  offerSection: {
    backgroundColor: Colors.tertiary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  offerLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  offerText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.tertiary,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  focusBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusBadgeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  focusValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
    textTransform: 'capitalize',
  },
  focusModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  focusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  focusOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.tertiary,
  },
  focusOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  focusOptionTextActive: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  focusOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.tertiary,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.accent,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 14,
    width: '31%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyMetrics: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyMetricsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  emptyMetricsSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  historyStats: {
    flexDirection: 'row',
    gap: 12,
  },
  historyStat: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  settingsSection: {
    marginBottom: 28,
  },
  settingsSectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowText: {
    fontSize: 15,
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.secondary,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutButtonText: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  logoutHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 8,
    lineHeight: 16,
  },
});
