import { useEffect, useRef, useCallback } from 'react';
import { useBusiness } from '@/store/BusinessContext';
import { useMemory } from '@/store/MemoryContext';
import {
  generateMetricMemory,
  generateDirectiveCompletionMemory,
  generateBottleneckChangeMemory,
} from '@/utils/memoryEngine';

export function useMemoryBridge() {
  const {
    activeProject,
    metrics,
    completionLogs,
    currentBottleneck,
    executionStats,
  } = useBusiness();

  const { writeMemoryAndEvents } = useMemory();

  const prevMetricsCount = useRef(metrics.length);
  const prevLogsCount = useRef(completionLogs.length);
  const prevBottleneck = useRef(currentBottleneck?.category ?? null);

  const handleNewMetrics = useCallback(() => {
    if (!activeProject) return;
    if (metrics.length <= prevMetricsCount.current) return;

    const newMetrics = metrics[metrics.length - 1];
    if (newMetrics.projectId !== activeProject.id) return;

    const memWrite = generateMetricMemory(newMetrics, activeProject.name);
    writeMemoryAndEvents(
      activeProject.id,
      [memWrite],
      [{
        eventType: 'metric_logged',
        metadata: {
          views: newMetrics.views,
          clicks: newMetrics.clicks,
          messages: newMetrics.messages,
          calls: newMetrics.calls,
          sales: newMetrics.sales,
          date: newMetrics.date,
        },
      }]
    );
    console.log('[MemoryBridge] Stored metric memory');
    prevMetricsCount.current = metrics.length;
  }, [activeProject, metrics, writeMemoryAndEvents]);

  const handleNewCompletion = useCallback(() => {
    if (!activeProject) return;
    if (completionLogs.length <= prevLogsCount.current) return;

    const newLog = completionLogs[completionLogs.length - 1];
    if (newLog.projectId !== activeProject.id) return;

    const memWrite = generateDirectiveCompletionMemory(
      newLog.title,
      newLog.modeTag,
      activeProject.name,
      executionStats.streak
    );
    writeMemoryAndEvents(
      activeProject.id,
      [memWrite],
      [{
        eventType: 'directive_completed',
        metadata: {
          title: newLog.title,
          modeTag: newLog.modeTag,
          streak: executionStats.streak,
        },
      }]
    );
    console.log('[MemoryBridge] Stored directive completion memory');
    prevLogsCount.current = completionLogs.length;
  }, [activeProject, completionLogs, executionStats.streak, writeMemoryAndEvents]);

  const handleBottleneckChange = useCallback(() => {
    if (!activeProject || !currentBottleneck) return;
    const prev = prevBottleneck.current;
    const curr = currentBottleneck.category;

    if (prev !== curr) {
      const memWrite = generateBottleneckChangeMemory(
        prev,
        curr,
        currentBottleneck.confidence,
        activeProject.name
      );
      writeMemoryAndEvents(
        activeProject.id,
        [memWrite],
        [{
          eventType: 'bottleneck_changed',
          metadata: {
            from: prev ?? 'none',
            to: curr,
            confidence: currentBottleneck.confidence,
          },
        }]
      );
      console.log(`[MemoryBridge] Bottleneck changed: ${prev} -> ${curr}`);
      prevBottleneck.current = curr;
    }
  }, [activeProject, currentBottleneck, writeMemoryAndEvents]);

  useEffect(() => {
    handleNewMetrics();
  }, [handleNewMetrics]);

  useEffect(() => {
    handleNewCompletion();
  }, [handleNewCompletion]);

  useEffect(() => {
    handleBottleneckChange();
  }, [handleBottleneckChange]);
}
