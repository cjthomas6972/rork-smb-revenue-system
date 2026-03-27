import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MemoryChunk,
  EventLogEntry,
  MemoryWriteRequest,
  EventLogRequest,
  MemoryRetrievalResult,
  MemoryTag,
} from '@/types/memory';
import {
  retrieveRelevantMemory,
  formatMemoryForPrompt,
} from '@/utils/memoryEngine';

const STORAGE_KEYS = {
  MEMORY_CHUNKS: 'skyforge_memory_chunks',
  EVENT_LOG: 'skyforge_event_log',
};

export const [MemoryProvider, useMemory] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [lastWriteCount, setLastWriteCount] = useState(0);

  const chunksQuery = useQuery({
    queryKey: ['memoryChunks'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MEMORY_CHUNKS);
      return stored ? JSON.parse(stored) as MemoryChunk[] : [];
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['eventLog'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.EVENT_LOG);
      return stored ? JSON.parse(stored) as EventLogEntry[] : [];
    },
  });

  const chunks = chunksQuery.data ?? [];
  const events = eventsQuery.data ?? [];

  const writeMemoryMutation = useMutation({
    mutationFn: async ({ projectId, writes }: { projectId: string; writes: MemoryWriteRequest[] }) => {
      if (writes.length === 0) return chunks;

      const now = new Date().toISOString();
      const newChunks: MemoryChunk[] = writes.map((w, i) => ({
        id: `${Date.now()}-${i}`,
        projectId,
        content: w.content.substring(0, 500),
        tags: w.tags,
        sourceType: w.sourceType,
        reason: w.reason,
        timestamp: now,
      }));

      const current = chunksQuery.data || [];
      const updated = [...current, ...newChunks];

      const maxChunks = 500;
      const trimmed = updated.length > maxChunks
        ? updated.slice(updated.length - maxChunks)
        : updated;

      await AsyncStorage.setItem(STORAGE_KEYS.MEMORY_CHUNKS, JSON.stringify(trimmed));
      console.log(`[MemoryOS] Wrote ${newChunks.length} memory chunks for project ${projectId}`);
      return trimmed;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['memoryChunks'], data);
      setLastWriteCount(prev => prev + 1);
    },
  });

  const logEventMutation = useMutation({
    mutationFn: async ({ projectId, eventLogs }: { projectId: string; eventLogs: EventLogRequest[] }) => {
      if (eventLogs.length === 0) return events;

      const now = new Date().toISOString();
      const newEntries: EventLogEntry[] = eventLogs.map((e, i) => ({
        id: `${Date.now()}-evt-${i}`,
        projectId,
        eventType: e.eventType,
        metadata: e.metadata,
        timestamp: now,
      }));

      const current = eventsQuery.data || [];
      const updated = [...current, ...newEntries];

      const maxEvents = 1000;
      const trimmed = updated.length > maxEvents
        ? updated.slice(updated.length - maxEvents)
        : updated;

      await AsyncStorage.setItem(STORAGE_KEYS.EVENT_LOG, JSON.stringify(trimmed));
      console.log(`[MemoryOS] Logged ${newEntries.length} events for project ${projectId}`);
      return trimmed;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['eventLog'], data);
    },
  });

  const writeMemoryAndEvents = useCallback((
    projectId: string,
    writes: MemoryWriteRequest[],
    eventLogs: EventLogRequest[]
  ) => {
    if (writes.length > 0) {
      writeMemoryMutation.mutate({ projectId, writes });
    }
    if (eventLogs.length > 0) {
      logEventMutation.mutate({ projectId, eventLogs });
    }
  }, [writeMemoryMutation, logEventMutation]);

  const retrieve = useCallback((projectId: string, queryText: string): MemoryRetrievalResult => {
    return retrieveRelevantMemory(chunks, events, projectId, queryText);
  }, [chunks, events]);

  const getFormattedContext = useCallback((projectId: string, queryText: string): string => {
    const result = retrieve(projectId, queryText);
    return formatMemoryForPrompt(result);
  }, [retrieve]);

  const getProjectChunks = useCallback((projectId: string): MemoryChunk[] => {
    return chunks.filter(c => c.projectId === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [chunks]);

  const getProjectEvents = useCallback((projectId: string): EventLogEntry[] => {
    return events.filter(e => e.projectId === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [events]);

  const getProjectStats = useCallback((projectId: string) => {
    const projectChunks = chunks.filter(c => c.projectId === projectId);
    const projectEvents = events.filter(e => e.projectId === projectId);

    const tagCounts: Partial<Record<MemoryTag, number>> = {};
    for (const chunk of projectChunks) {
      for (const tag of chunk.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag: tag as MemoryTag, count }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentChunks = projectChunks.filter(c => new Date(c.timestamp) >= thirtyDaysAgo);

    return {
      totalChunks: projectChunks.length,
      totalEvents: projectEvents.length,
      recentChunks: recentChunks.length,
      topTags,
    };
  }, [chunks, events]);

  const clearProjectMemory = useMutation({
    mutationFn: async (projectId: string) => {
      const remainingChunks = chunks.filter(c => c.projectId !== projectId);
      const remainingEvents = events.filter(e => e.projectId !== projectId);
      await AsyncStorage.setItem(STORAGE_KEYS.MEMORY_CHUNKS, JSON.stringify(remainingChunks));
      await AsyncStorage.setItem(STORAGE_KEYS.EVENT_LOG, JSON.stringify(remainingEvents));
      return { chunks: remainingChunks, events: remainingEvents };
    },
    onSuccess: ({ chunks: c, events: e }) => {
      queryClient.setQueryData(['memoryChunks'], c);
      queryClient.setQueryData(['eventLog'], e);
    },
  });

  const isLoading = chunksQuery.isLoading || eventsQuery.isLoading;

  return {
    chunks,
    events,
    isLoading,
    lastWriteCount,
    writeMemoryAndEvents,
    retrieve,
    getFormattedContext,
    getProjectChunks,
    getProjectEvents,
    getProjectStats,
    clearProjectMemory: clearProjectMemory.mutate,
  };
});

export function useProjectMemoryStats(projectId: string | null) {
  const { getProjectStats } = useMemory();
  return useMemo(() => {
    if (!projectId) return { totalChunks: 0, totalEvents: 0, recentChunks: 0, topTags: [] };
    return getProjectStats(projectId);
  }, [projectId, getProjectStats]);
}
