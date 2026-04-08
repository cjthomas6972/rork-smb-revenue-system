import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Brain, CheckCircle2, Lightbulb, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useBusiness } from '@/store/BusinessContext';
import { useMemory } from '@/store/MemoryContext';
import { MemoryChunk } from '@/types/memory';

function getIcon(sourceType: MemoryChunk['sourceType']) {
  if (sourceType === 'metric_log' || sourceType === 'kpi_change') return TrendingUp;
  if (sourceType === 'directive_completed') return CheckCircle2;
  if (sourceType === 'decision' || sourceType === 'advisor_response') return Lightbulb;
  return Brain;
}

export default function MemoryLogScreen() {
  const { activeProjectId } = useBusiness();
  const { getProjectChunks } = useMemory();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo(() => {
    if (!activeProjectId) return [];
    return getProjectChunks(activeProjectId);
  }, [activeProjectId, getProjectChunks]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'MEMORY LOG', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.text }} />
      <View style={styles.header}>
        <Text style={styles.kicker}>WHAT SKYFORGE KNOWS ABOUT YOUR BUSINESS</Text>
        <Text style={styles.subtitle}>This memory makes your advisor smarter every session.</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const Icon = getIcon(item.sourceType);
          const expanded = expandedId === item.id;
          return (
            <Pressable style={styles.card} onPress={() => setExpandedId(expanded ? null : item.id)}>
              <View style={styles.row}>
                <View style={styles.iconWrap}>
                  <Icon size={16} color={Colors.accent} />
                </View>
                <View style={styles.textWrap}>
                  <View style={styles.tags}>
                    {item.tags.slice(0, 2).map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.contentText} numberOfLines={expanded ? undefined : 2}>{item.content}</Text>
                </View>
                <Text style={styles.time}>{new Date(item.timestamp).toLocaleDateString()}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No memory stored yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  kicker: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.3, marginBottom: 8 },
  subtitle: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: Colors.secondary, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.tertiary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  textWrap: { flex: 1 },
  tags: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tag: { backgroundColor: Colors.tertiary, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { color: Colors.accent, fontSize: 10, fontWeight: '700' },
  contentText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  time: { color: Colors.textMuted, fontSize: 11, marginLeft: 12 },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 48, fontSize: 14 },
});
