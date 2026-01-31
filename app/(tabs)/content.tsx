import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import {
  Video,
  FileText,
  MessageSquare,
  Mail,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Plus,
} from 'lucide-react-native';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useBusiness } from '@/store/BusinessContext';
import { ContentItem } from '@/types/business';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const CONTENT_TYPES = [
  { key: 'video_script', label: 'Video Script', icon: Video },
  { key: 'post_caption', label: 'Post Caption', icon: FileText },
  { key: 'dm_outreach', label: 'DM Outreach', icon: MessageSquare },
  { key: 'followup_sequence', label: 'Follow-up', icon: Mail },
] as const;

export default function ContentScreen() {
  const { activeProject, activeProjectId, content, addContent } = useBusiness();
  const [selectedType, setSelectedType] = useState<string>('video_script');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredContent = content.filter((c) => c.type === selectedType);

  const getTypeIcon = (type: string) => {
    const typeConfig = CONTENT_TYPES.find((t) => t.key === type);
    const IconComponent = typeConfig?.icon || FileText;
    return <IconComponent size={18} color={Colors.accent} />;
  };

  const generateContent = async () => {
    if (!activeProject) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);
    setGeneratedContent('');

    const typeLabel = CONTENT_TYPES.find((t) => t.key === selectedType)?.label || 'content';
    
    const prompts: Record<string, string> = {
      video_script: `Create a short-form video script (30-60 seconds) for ${activeProject.name}, a ${activeProject.businessType} business${activeProject.isLocal ? ` in ${activeProject.location}` : ''}. 
Current offer: ${activeProject.coreOfferSummary}
Target customer: ${activeProject.targetCustomer}
Focus on: ${activeProject.bottleneck}
${customPrompt ? `Additional context: ${customPrompt}` : ''}

Format:
HOOK (first 3 seconds):
BODY (main content):
CTA (call to action):`,

      post_caption: `Write an engaging social media caption for ${activeProject.name}, a ${activeProject.businessType} business.
Current offer: ${activeProject.coreOfferSummary}
Target customer: ${activeProject.targetCustomer}
Focus on: ${activeProject.bottleneck}
${customPrompt ? `Topic/context: ${customPrompt}` : ''}

Keep it punchy, authentic, and include a clear call to action. Add relevant hashtags.`,

      dm_outreach: `Write a cold DM outreach script for ${activeProject.name}, a ${activeProject.businessType} business${activeProject.isLocal ? ` in ${activeProject.location}` : ''}.
Current offer: ${activeProject.coreOfferSummary}
Pricing: ${activeProject.pricing}
Target customer: ${activeProject.targetCustomer}
${customPrompt ? `Target audience/context: ${customPrompt}` : ''}

Format:
INITIAL MESSAGE:
FOLLOW-UP IF NO RESPONSE (after 2 days):
CLOSING MESSAGE:`,

      followup_sequence: `Create a follow-up sequence for ${activeProject.name}, a ${activeProject.businessType} business.
Current offer: ${activeProject.coreOfferSummary}
Target customer: ${activeProject.targetCustomer}
${customPrompt ? `Context: ${customPrompt}` : ''}

Create 3 follow-up messages:
DAY 1 - Soft reminder:
DAY 3 - Value add:
DAY 7 - Final offer:`,
    };

    try {
      const result = await generateText({
        messages: [
          {
            role: 'user',
            content: prompts[selectedType] || `Generate ${typeLabel} for ${activeProject.name}`,
          },
        ],
      });
      
      setGeneratedContent(result);
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveContent = () => {
    if (!generatedContent || !activeProjectId) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const newContent: ContentItem = {
      id: Date.now().toString(),
      projectId: activeProjectId,
      type: selectedType as ContentItem['type'],
      title: `${CONTENT_TYPES.find((t) => t.key === selectedType)?.label} - ${new Date().toLocaleDateString()}`,
      content: generatedContent,
      status: 'generated',
      createdAt: new Date().toISOString(),
    };
    
    addContent(newContent);
    setGeneratedContent('');
    setCustomPrompt('');
  };

  const handleCopy = async (text: string, id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <FileText size={48} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No Project Selected</Text>
        <Text style={styles.emptyText}>
          Select or create a project to generate content
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeSelector}
        contentContainerStyle={styles.typeSelectorContent}
      >
        {CONTENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.typeButton,
              selectedType === type.key && styles.typeButtonActive,
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            <type.icon
              size={18}
              color={selectedType === type.key ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.typeButtonText,
                selectedType === type.key && styles.typeButtonTextActive,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.generateSection}>
          <Text style={styles.sectionTitle}>Generate New</Text>
          <TextInput
            style={styles.promptInput}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            placeholder="Add context (optional)..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={generateContent}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Sparkles size={18} color={Colors.primary} />
            )}
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </Text>
          </TouchableOpacity>

          {generatedContent && (
            <View style={styles.generatedCard}>
              <View style={styles.generatedHeader}>
                <Text style={styles.generatedTitle}>Generated Content</Text>
                <View style={styles.generatedActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleCopy(generatedContent, 'generated')}
                  >
                    {copiedId === 'generated' ? (
                      <Check size={18} color={Colors.accent} />
                    ) : (
                      <Copy size={18} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={generateContent}>
                    <RefreshCw size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.generatedContent}>{generatedContent}</Text>
              <TouchableOpacity style={styles.saveButton} onPress={saveContent}>
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.saveButtonText}>Save to Library</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.librarySection}>
          <Text style={styles.sectionTitle}>
            Saved ({filteredContent.length})
          </Text>
          {filteredContent.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No saved content yet</Text>
            </View>
          ) : (
            filteredContent.map((item) => (
              <View key={item.id} style={styles.savedCard}>
                <View style={styles.savedHeader}>
                  {getTypeIcon(item.type)}
                  <Text style={styles.savedTitle}>{item.title}</Text>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleCopy(item.content, item.id)}
                  >
                    {copiedId === item.id ? (
                      <Check size={16} color={Colors.accent} />
                    ) : (
                      <Copy size={16} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.savedContent} numberOfLines={4}>
                  {item.content}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  typeSelector: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: Colors.accent,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  typeButtonTextActive: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  generateSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  promptInput: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    minHeight: 60,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  generatedCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  generatedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  generatedTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  generatedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  generatedContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  librarySection: {
    flex: 1,
  },
  emptyState: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  savedCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  savedTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  savedContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
