import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, Copy, Check, Send, Sparkles, Target, Zap, Archive } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { useMemory } from '@/store/MemoryContext';
import { DailyDirective, RevenueAsset } from '@/types/business';
import { getSystemPrompt } from '@/constants/systemPrompt';
import { extractAdvisorMemories } from '@/utils/memoryEngine';
import { buildRevenueAsset, parseAssetAutoSave } from '@/utils/assetAutoSave';

type AgentMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text?: string }>;
};

const QUICK_CHIPS: Record<string, string[]> = {
  traffic: [
    'Write me a hook for Instagram this week',
    'Give me 3 lead gen plays for this week',
    'Critique my current offer',
  ],
  conversion: [
    'Script for my sales call',
    'Fix my landing page copy',
    'Handle the price objection',
  ],
  'follow-up': [
    'Write my missed call SMS sequence',
    'Build a 7-day follow-up cadence',
    'DM outreach for cold leads',
  ],
  pricing: [
    'Should I raise my prices?',
    'Build me a premium package',
    'Position my offer vs competitors',
  ],
  operations: [
    'Simplify my delivery process',
    'What should I automate first?',
    'Create a weekly operating checklist',
  ],
};

function getMessageText(message: AgentMessage): string {
  return message.parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text ?? '')
    .join('\n')
    .trim();
}

function extractDirective(text: string, currentFocus: string): DailyDirective | null {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return null;
    }

    const parsed = JSON.parse(text.slice(start, end + 1)) as Omit<DailyDirective, 'id' | 'createdAt' | 'status'>;
    if (!parsed.title || !Array.isArray(parsed.steps)) {
      return null;
    }

    return {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      title: parsed.title,
      description: parsed.description,
      reason: parsed.reason,
      estimatedTime: parsed.estimatedTime,
      objective: parsed.objective,
      steps: parsed.steps,
      timeboxMinutes: parsed.timeboxMinutes,
      successMetric: parsed.successMetric,
      blockers: parsed.blockers ?? [],
      countermoves: parsed.countermoves ?? [],
      modeTag: parsed.modeTag ?? currentFocus,
      linkedAssets: parsed.linkedAssets ?? [],
    };
  } catch {
    return null;
  }
}

export default function AdvisorScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const [input, setInput] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const {
    activeProject,
    metrics,
    currentBottleneck,
    updateAdvisorDirective,
    updateDailyDirective,
    addAsset,
    assets,
  } = useBusiness();
  const {
    getFormattedContext,
    writeMemoryAndEvents,
    getProjectChunks,
  } = useMemory();

  const currentFocus = activeProject?.focusMode === 'manual'
    ? activeProject.manualFocusArea ?? 'traffic'
    : activeProject?.bottleneck ?? 'traffic';

  const bottleneckLabel = currentBottleneck?.category
    ? `${currentBottleneck.category.charAt(0).toUpperCase()}${currentBottleneck.category.slice(1)}`
    : currentFocus;

  const memoryCount = useMemo(() => {
    if (!activeProject) return 0;
    return getProjectChunks(activeProject.id).length;
  }, [activeProject, getProjectChunks]);

  const quickChips = useMemo(() => QUICK_CHIPS[currentBottleneck?.category ?? 'traffic'] ?? QUICK_CHIPS.traffic, [currentBottleneck?.category]);
  const memoryContext = activeProject ? getFormattedContext(activeProject.id, input || activeProject.businessType) : '';
  const systemPrompt = getSystemPrompt(activeProject, metrics, memoryContext);

  const { messages, sendMessage, setMessages } = useRorkAgent({ tools: {} }) as {
    messages: AgentMessage[];
    sendMessage: (payload: { text: string }) => void;
    setMessages: (next: AgentMessage[]) => void;
  };

  useEffect(() => {
    if (!activeProject) return;
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: `SKYFORGE OS active for ${activeProject.name}. Current bottleneck: ${bottleneckLabel}${currentBottleneck ? ` (${currentBottleneck.confidence}% confidence)` : ''}. Tell me what is happening and I will give you the next move.`,
          },
        ],
      },
    ]);
    processedMessageIds.current = new Set(['welcome']);
  }, [activeProject, bottleneckLabel, currentBottleneck, setMessages]);

  useEffect(() => {
    if (!activeProject) return;
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    if (!lastAssistant || processedMessageIds.current.has(lastAssistant.id)) {
      return;
    }

    const rawText = getMessageText(lastAssistant);
    if (!rawText) return;

    processedMessageIds.current.add(lastAssistant.id);
    setIsSending(false);

    const autoAsset = parseAssetAutoSave(rawText);
    const responseText = autoAsset.cleanText || rawText;

    if (autoAsset.shouldSave && autoAsset.assetType && autoAsset.title) {
      const duplicate = assets.some((asset) => asset.title === autoAsset.title && asset.type === autoAsset.assetType);
      if (!duplicate) {
        addAsset(buildRevenueAsset({
          projectId: activeProject.id,
          type: autoAsset.assetType,
          title: autoAsset.title,
          content: responseText,
        }));
      }
    }

    const directive = extractDirective(responseText, currentFocus);
    if (directive) {
      updateAdvisorDirective({
        projectId: activeProject.id,
        directive: {
          id: directive.id,
          title: directive.title,
          description: directive.description,
          reason: directive.reason,
          estimatedTime: directive.estimatedTime,
          createdAt: directive.createdAt,
        },
      });
    }

    const memoryWrites = extractAdvisorMemories(responseText, input, activeProject.name);
    if (memoryWrites.length > 0) {
      writeMemoryAndEvents(activeProject.id, memoryWrites, [
        {
          eventType: 'decision_made',
          metadata: { source: 'advisor', messageId: lastAssistant.id },
        },
      ]);
    }
  }, [activeProject, addAsset, assets, currentFocus, input, messages, updateAdvisorDirective, writeMemoryAndEvents]);

  const handleSend = useCallback((messageText?: string) => {
    if (!activeProject) return;
    const nextInput = (messageText ?? input).trim();
    if (!nextInput) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    setIsSending(true);

    sendMessage({
      text: `[System Context: ${systemPrompt}]\n\nUser: ${nextInput}`,
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [activeProject, input, sendMessage, systemPrompt]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }, []);

  const handleCreateDirective = useCallback((text: string) => {
    if (!activeProject) return;
    const directive = extractDirective(text, currentFocus);
    if (!directive) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateDailyDirective({ projectId: activeProject.id, directive });
  }, [activeProject, currentFocus, updateDailyDirective]);

  const handleSaveToArsenal = useCallback((text: string) => {
    if (!activeProject) return;
    const autoAsset = parseAssetAutoSave(text);
    if (!autoAsset.shouldSave || !autoAsset.assetType || !autoAsset.title) return;

    addAsset(buildRevenueAsset({
      projectId: activeProject.id,
      type: autoAsset.assetType,
      title: autoAsset.title,
      content: autoAsset.cleanText,
    }));
  }, [activeProject, addAsset]);

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <Sparkles size={42} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No active workspace</Text>
        <Text style={styles.emptyText}>Create or select a project to activate FORGE.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.contextBar}>
        <View style={styles.contextPill}>
          <Target size={12} color={Colors.accent} />
          <Text style={styles.contextPillText}>{bottleneckLabel} {currentBottleneck ? `${currentBottleneck.confidence}%` : ''}</Text>
        </View>
        <TouchableOpacity style={styles.memoryPill} onPress={() => router.push('/memory-log' as never)}>
          <Brain size={12} color={Colors.brand.electricBlue} />
          <Text style={styles.memoryPillText}>🧠 {memoryCount} memories active</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
        {quickChips.map((chip) => (
          <TouchableOpacity key={chip} style={styles.chip} onPress={() => handleSend(chip)}>
            <Text style={styles.chipText}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => {
          const messageText = getMessageText(message);
          const hasDirective = Boolean(extractDirective(messageText, currentFocus));
          const hasAssetTag = parseAssetAutoSave(messageText).shouldSave;

          return (
            <View key={message.id} style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              {message.role === 'assistant' ? (
                <View style={styles.assistantHeader}>
                  <Text style={styles.assistantLabel}>SKYFORGE OS</Text>
                </View>
              ) : null}
              <Text style={[styles.messageText, message.role === 'user' ? styles.userText : styles.assistantText]}>{parseAssetAutoSave(messageText).cleanText || messageText}</Text>
              {message.role === 'assistant' && messageText ? (
                <View style={styles.messageActions}>
                  <TouchableOpacity style={styles.messageActionButton} onPress={() => handleCopy(messageText, message.id)}>
                    {copiedId === message.id ? <Check size={14} color={Colors.accent} /> : <Copy size={14} color={Colors.textSecondary} />}
                    <Text style={styles.messageActionText}>{copiedId === message.id ? 'COPIED' : 'COPY'}</Text>
                  </TouchableOpacity>
                  {hasAssetTag ? (
                    <TouchableOpacity style={styles.messageActionButton} onPress={() => handleSaveToArsenal(messageText)}>
                      <Archive size={14} color={Colors.accent} />
                      <Text style={styles.messageActionText}>SAVE TO ARSENAL</Text>
                    </TouchableOpacity>
                  ) : null}
                  {hasDirective ? (
                    <TouchableOpacity style={styles.messageActionButton} onPress={() => handleCreateDirective(messageText)}>
                      <Zap size={14} color={Colors.accent} />
                      <Text style={styles.messageActionText}>CREATE DIRECTIVE</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
        {isSending ? (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.typingWrap}>
              <ActivityIndicator color={Colors.accent} size="small" />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask SKYFORGE OS anything..."
          placeholderTextColor={Colors.textMuted}
          multiline
          testID="forge-input"
        />
        <TouchableOpacity style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]} onPress={() => handleSend()} disabled={!input.trim()} testID="forge-send-button">
          <Send size={18} color={input.trim() ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  contextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contextPillText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  memoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.brand.electricBlue + '14',
    borderWidth: 1,
    borderColor: Colors.brand.electricBlue + '22',
  },
  memoryPillText: {
    color: Colors.brand.electricBlue,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  chipsScroll: {
    maxHeight: 56,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    maxWidth: '88%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1A1A25',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#12121A',
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
  },
  assistantHeader: {
    marginBottom: 8,
  },
  assistantLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: Colors.text,
  },
  assistantText: {
    color: Colors.text,
  },
  messageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  messageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.tertiary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  messageActionText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 14,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.tertiary,
  },
});
