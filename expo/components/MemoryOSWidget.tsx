import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brain, Database, Activity, Tag } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface MemoryOSWidgetProps {
  totalChunks: number;
  totalEvents: number;
  recentChunks: number;
  topTags: { tag: string; count: number }[];
}

function MemoryOSWidget({ totalChunks, totalEvents, recentChunks, topTags }: MemoryOSWidgetProps) {
  const isActive = totalChunks > 0 || totalEvents > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.brainDot, { backgroundColor: isActive ? Colors.brand.electricBlue : Colors.textMuted }]} />
          <Brain size={14} color={isActive ? Colors.brand.electricBlue : Colors.textMuted} />
          <Text style={styles.headerTitle}>Memory OS</Text>
        </View>
        <View style={[styles.statusPill, isActive && styles.statusPillActive]}>
          <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
            {isActive ? 'Active' : 'Idle'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Database size={12} color={Colors.brand.electricBlue} />
          <Text style={styles.statValue}>{totalChunks}</Text>
          <Text style={styles.statLabel}>Memories</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Activity size={12} color={Colors.brand.fireOrange} />
          <Text style={styles.statValue}>{totalEvents}</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Brain size={12} color={Colors.accent} />
          <Text style={styles.statValue}>{recentChunks}</Text>
          <Text style={styles.statLabel}>30d Active</Text>
        </View>
      </View>

      {topTags.length > 0 && (
        <View style={styles.tagsSection}>
          <View style={styles.tagsHeader}>
            <Tag size={10} color={Colors.textMuted} />
            <Text style={styles.tagsLabel}>Top Tags</Text>
          </View>
          <View style={styles.tagsRow}>
            {topTags.slice(0, 4).map(({ tag, count }) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
                <Text style={styles.tagCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!isActive && (
        <Text style={styles.idleText}>
          Memory builds as you use the app — log metrics, complete directives, and chat with the Advisor.
        </Text>
      )}
    </View>
  );
}

export default React.memo(MemoryOSWidget);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brainDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.tertiary,
  },
  statusPillActive: {
    backgroundColor: Colors.brand.electricBlue + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  statusTextActive: {
    color: Colors.brand.electricBlue,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  tagsSection: {
    gap: 6,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagsLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  tagCount: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  idleText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 17,
  },
});
