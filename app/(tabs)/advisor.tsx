import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, Sparkles, Copy, Check, Zap, Target, ArrowRight } from 'lucide-react-native';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import { useBusiness } from '@/store/BusinessContext';
import { getSystemPrompt } from '@/constants/systemPrompt';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { BrandMicroIcon } from '@/components/brand';
import { DailyDirective } from '@/types/business';

export default function AdvisorScreen() {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedDirective, setSavedDirective] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const {
    activeProject,
    metrics,
    updateAdvisorDirective,
    updateDailyDirective,
    currentBottleneck,
  } = useBusiness();

  const systemPrompt = getSystemPrompt(activeProject, metrics);

  const { messages, sendMessage, setMessages } = useRorkAgent({
    tools: {},
  });

  const currentFocus = activeProject?.focusMode === 'manual'
    ? activeProject.manualFocusArea
    : activeProject?.bottleneck;

  const bnLabel = currentBottleneck?.category
    ? currentBottleneck.category.charAt(0).toUpperCase() + currentBottleneck.category.slice(1)
    : currentFocus || 'General';

  const initializeWelcome = useCallback(() => {
    if (messages.length === 0 && activeProject) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: `SKYFORGE ready. Analyzing "${activeProject.name}".\n\nCurrent bottleneck: ${bnLabel}${currentBottleneck ? ` (${currentBottleneck.confidence}% confidence)` : ''}.\n\nTell me what is happening — I will give you the exact next move.`,
            },
          ],
        },
      ]);
    }
  }, [messages.length, activeProject, bnLabel, currentBottleneck, setMessages]);

  useEffect(() => {
    initializeWelcome();
  }, [initializeWelcome]);

  useEffect(() => {
    if (activeProject) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: `SKYFORGE ready. Analyzing "${activeProject.name}".\n\nCurrent bottleneck: ${bnLabel}${currentBottleneck ? ` (${currentBottleneck.confidence}% confidence)` : ''}.\n\nTell me what is happening — I will give you the exact next move.`,
            },
          ],
        },
      ]);
      setSavedDirective(false);
    }
  }, [activeProject?.id]);

  const extractDirectiveFromResponse = (text: string) => {
    const lines = text.split('\n');
    let title = '';
    let description = '';
    let reason = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().includes('task:') || line.toLowerCase().includes('action:') || line.toLowerCase().includes('do this:')) {
        title = line.replace(/^(task:|action:|do this:)/i, '').trim();
      } else if (line.toLowerCase().includes('why:') || line.toLowerCase().includes('reason:')) {
        reason = line.replace(/^(why:|reason:)/i, '').trim();
      }
    }

    if (!title && lines.length > 0) {
      const firstSentence = text.split(/[.!?]/)[0];
      if (firstSentence.length < 100) {
        title = firstSentence.trim();
      }
    }

    if (title) {
      description = text.substring(0, 200).trim();
      if (text.length > 200) description += '...';

      return {
        id: Date.now().toString(),
        title: title.substring(0, 100),
        description,
        reason: reason || 'Based on Skyforge analysis of your current situation.',
        estimatedTime: '20-30 minutes',
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || !activeProject) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const message = input.trim();
    setInput('');
    setSavedDirective(false);

    await sendMessage({
      text: `[System Context: ${systemPrompt}]\n\nUser: ${message}`,
    });

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });

      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      if (lastAssistantMessage) {
        const textPart = lastAssistantMessage.parts.find(p => p.type === 'text');
        if (textPart && 'text' in textPart && textPart.text) {
          const directive = extractDirectiveFromResponse(textPart.text);
          if (directive) {
            updateAdvisorDirective({ projectId: activeProject.id, directive });
            console.log('[Advisor] Directive extracted:', directive.title);
          }
        }
      }
    }, 500);
  };

  const handleSetAsDirective = (text: string) => {
    if (!activeProject) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const extracted = extractDirectiveFromResponse(text);
    const title = extracted?.title || text.split(/[.!?\n]/)[0].substring(0, 80);
    const description = extracted?.description || text.substring(0, 200);

    const directive: DailyDirective = {
      id: Date.now().toString(),
      title,
      description,
      reason: extracted?.reason || 'From Skyforge Advisor analysis.',
      estimatedTime: '20-30 minutes',
      status: 'pending',
      createdAt: new Date().toISOString(),
      objective: title,
      steps: [
        { order: 1, action: description.substring(0, 120), done: false },
      ],
      timeboxMinutes: 30,
      successMetric: 'Task completed as described',
      blockers: [],
      countermoves: [],
      modeTag: currentFocus || 'general',
      linkedAssets: [],
    };

    updateDailyDirective({ projectId: activeProject.id, directive });
    if (extracted) {
      updateAdvisorDirective({ projectId: activeProject.id, directive: { ...extracted } });
    }
    setSavedDirective(true);
  };

  const handleCopy = async (text: string, id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isLoading = messages.some(
    (m) => m.role === 'assistant' && m.parts.some((p) => p.type === 'text' && 'text' in p && (p as { text: string }).text === '')
  );

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <Sparkles size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Project Selected</Text>
        <Text style={styles.emptyText}>
          Select or create a project to start getting guidance
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {currentBottleneck && (
        <View style={styles.bottleneckBar}>
          <Target size={12} color={Colors.accent} />
          <Text style={styles.bottleneckBarText}>
            Bottleneck: {bnLabel} ({currentBottleneck.confidence}%)
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.assistantHeader}>
                <BrandMicroIcon size={12} color={Colors.accent} />
                <Text style={styles.assistantLabel}>SKYFORGE</Text>
              </View>
            )}
            {message.parts.map((part, index) => {
              if (part.type === 'text' && 'text' in part) {
                const textContent = (part as { text: string }).text ?? '';
                return (
                  <View key={`${message.id}-${index}`}>
                    <Text
                      style={[
                        styles.messageText,
                        message.role === 'user' ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {textContent}
                    </Text>
                    {message.role === 'assistant' && textContent.length > 50 ? (
                      <View style={styles.messageActions}>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() => handleCopy(textContent, `${message.id}-${index}`)}
                        >
                          {copiedId === `${message.id}-${index}` ? (
                            <Check size={14} color={Colors.accent} />
                          ) : (
                            <Copy size={14} color={Colors.textMuted} />
                          )}
                          <Text style={styles.copyText}>
                            {copiedId === `${message.id}-${index}` ? 'Copied' : 'Copy'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.setDirectiveButton}
                          onPress={() => handleSetAsDirective(textContent)}
                        >
                          <Zap size={14} color={savedDirective ? Colors.textMuted : Colors.accent} />
                          <Text style={[styles.setDirectiveText, savedDirective && { color: Colors.textMuted }]}>
                            {savedDirective ? 'Set as Task' : 'Set as Daily Task'}
                          </Text>
                          {!savedDirective && <ArrowRight size={12} color={Colors.accent} />}
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              }
              return null;
            })}
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.typingText}>Analyzing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Describe your situation..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Send size={20} color={input.trim() ? Colors.primary : Colors.textMuted} />
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottleneckBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bottleneckBarText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: Colors.accent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.secondary,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  assistantLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: Colors.primary,
  },
  assistantText: {
    color: Colors.text,
  },
  messageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  setDirectiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '12',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  setDirectiveText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  inputContainer: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: Colors.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.tertiary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
});
