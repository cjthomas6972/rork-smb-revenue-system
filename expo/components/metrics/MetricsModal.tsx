import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, MessageSquare, MousePointer, Phone, ShoppingCart, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { Metrics } from '@/types/business';

const FIELD_CONFIG = [
  { key: 'views', label: 'Views', icon: Eye },
  { key: 'clicks', label: 'Clicks', icon: MousePointer },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'calls', label: 'Calls', icon: Phone },
  { key: 'sales', label: 'Sales', icon: ShoppingCart },
] as const;

type MetricFieldKey = (typeof FIELD_CONFIG)[number]['key'];
type DraftState = Record<MetricFieldKey | 'notes', string>;

const EMPTY_DRAFT: DraftState = {
  views: '',
  clicks: '',
  messages: '',
  calls: '',
  sales: '',
  notes: '',
};

interface MetricsModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * The single metrics logger, shared by TODAY and INTEL.
 * Saves one daily entry for the active project through the business context.
 */
export default function MetricsModal({ visible, onClose }: MetricsModalProps) {
  const { activeProjectId, addMetrics } = useBusiness();
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);

  useEffect(() => {
    if (visible) setDraft(EMPTY_DRAFT);
  }, [visible]);

  const handleSave = () => {
    if (!activeProjectId) return;
    const payload: Metrics = {
      id: `${Date.now()}`,
      projectId: activeProjectId,
      date: new Date().toISOString().split('T')[0],
      views: Number(draft.views) || 0,
      clicks: Number(draft.clicks) || 0,
      messages: Number(draft.messages) || 0,
      calls: Number(draft.calls) || 0,
      sales: Number(draft.sales) || 0,
      notes: draft.notes || undefined,
    };

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMetrics(payload);
    setDraft(EMPTY_DRAFT);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Log metrics</Text>
            <Text style={styles.dateLabel}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close metrics logger">
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

        <TouchableOpacity style={styles.logButton} onPress={handleSave} testID="metrics-modal-log-button">
          <LinearGradient colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]} style={styles.logButtonGradient}>
            <Text style={styles.logButtonText}>LOG IT</Text>
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  dateLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  content: {
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
    minHeight: 110,
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
    marginTop: 4,
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
