import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, Building2, ChevronRight, Flame, Package, Pencil, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { useMemory } from '@/store/MemoryContext';
import { MemoryChunk } from '@/types/memory';

function getMemoryIcon(chunk: MemoryChunk) {
  if (chunk.sourceType === 'directive_completed') return '✅';
  if (chunk.sourceType === 'metric_log' || chunk.sourceType === 'kpi_change') return '📊';
  if (chunk.sourceType === 'decision' || chunk.sourceType === 'advisor_response') return '⚡';
  return '🧠';
}

export default function HQScreen() {
  const router = useRouter();
  const { activeProject, completionLogs, executionStats, assets } = useBusiness();
  const { getProjectChunks } = useMemory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const memoryChunks = useMemo(() => {
    if (!activeProject) return [];
    return getProjectChunks(activeProject.id);
  }, [activeProject, getProjectChunks]);

  if (!activeProject) {
    return (
      <View style={styles.emptyContainer}>
        <Brain size={40} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>No active HQ</Text>
        <Text style={styles.emptyText}>Create a project to start building a memory graph.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>HQ</Text>
            <Text style={styles.title}>{activeProject.name}</Text>
            <Text style={styles.subtitle}>Your operating profile, memory graph, and long-term context.</Text>
          </View>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/memory-log' as never)}>
            <Brain size={18} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileIconWrap}>
              <Building2 size={20} color={Colors.accent} />
            </View>
            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName}>{activeProject.name}</Text>
              <Text style={styles.profileMeta}>{activeProject.businessType} · {activeProject.targetCustomer}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => router.push('/onboarding' as never)}>
              <Pencil size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileRows}>
            <InfoRow label="Offer" value={activeProject.coreOfferSummary} />
            <InfoRow label="Pricing" value={activeProject.pricing} />
            <InfoRow label="Goal" value={activeProject.revenueGoal} />
            <InfoRow label="Time available" value={activeProject.availableDailyTime} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon={<Sparkles size={18} color={Colors.accent} />} label="Directives completed" value={`${completionLogs.filter((log) => log.projectId === activeProject.id).length}`} />
          <StatCard icon={<Flame size={18} color={Colors.brand.fireOrange} />} label="Best streak" value={`${executionStats.streak}`} />
          <StatCard icon={<Package size={18} color={Colors.accent} />} label="Assets in arsenal" value={`${assets.length}`} />
          <StatCard icon={<Brain size={18} color={Colors.brand.electricBlue} />} label="Memory chunks stored" value={`${memoryChunks.length}`} />
        </View>

        <View style={styles.memorySection}>
          <Text style={styles.memoryHeader}>WHAT SKYFORGE KNOWS ABOUT YOUR BUSINESS</Text>
          <Text style={styles.memorySubtext}>This memory makes your advisor smarter every session.</Text>
          <View style={styles.timeline}>
            {memoryChunks.length === 0 ? (
              <View style={styles.emptyTimeline}>
                <Text style={styles.emptyTimelineText}>No memory stored yet.</Text>
              </View>
            ) : (
              memoryChunks.map((chunk) => {
                const expanded = expandedId === chunk.id;
                return (
                  <TouchableOpacity key={chunk.id} style={styles.memoryCard} activeOpacity={0.85} onPress={() => setExpandedId(expanded ? null : chunk.id)}>
                    <View style={styles.memoryRow}>
                      <Text style={styles.memoryEmoji}>{getMemoryIcon(chunk)}</Text>
                      <View style={styles.memoryMain}>
                        <View style={styles.memoryTags}>
                          {chunk.tags.slice(0, 2).map((tag) => (
                            <View key={tag} style={styles.memoryTag}>
                              <Text style={styles.memoryTagText}>{tag.toUpperCase()}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.memoryPreview} numberOfLines={expanded ? undefined : 2}>{chunk.content}</Text>
                      </View>
                      <View style={styles.memoryMeta}>
                        <Text style={styles.memoryTime}>{new Date(chunk.timestamp).toLocaleDateString()}</Text>
                        <ChevronRight size={14} color={Colors.textMuted} style={expanded ? styles.expandedChevron : undefined} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  kicker: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  profileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  profileMeta: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.tertiary,
  },
  profileRows: {
    gap: 12,
  },
  infoRow: {
    gap: 6,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.1,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  memorySection: {
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  memoryHeader: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  memorySubtext: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  timeline: {
    gap: 10,
  },
  emptyTimeline: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTimelineText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  memoryCard: {
    backgroundColor: Colors.tertiary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memoryEmoji: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  memoryMain: {
    flex: 1,
  },
  memoryTags: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  memoryTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.primary,
  },
  memoryTagText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  memoryPreview: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  memoryMeta: {
    alignItems: 'flex-end',
    marginLeft: 10,
    gap: 8,
  },
  memoryTime: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  expandedChevron: {
    transform: [{ rotate: '90deg' }],
  },
});
