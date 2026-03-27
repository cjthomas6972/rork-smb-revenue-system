export type MemoryTag =
  | 'brand'
  | 'offer'
  | 'pricing'
  | 'audience'
  | 'objection'
  | 'creative'
  | 'channel'
  | 'ops'
  | 'kpi'
  | 'milestone'
  | 'decision'
  | 'approval'
  | 'sales'
  | 'web'
  | 'seo'
  | 'gmb';

export type MemorySourceType =
  | 'advisor_response'
  | 'user_message'
  | 'metric_log'
  | 'asset_created'
  | 'directive_completed'
  | 'decision'
  | 'approval'
  | 'kpi_change'
  | 'profile_update'
  | 'manual';

export type EventType =
  | 'decision_made'
  | 'approval_given'
  | 'asset_created'
  | 'asset_updated'
  | 'metric_logged'
  | 'kpi_changed'
  | 'directive_completed'
  | 'milestone_hit'
  | 'bottleneck_changed'
  | 'project_created'
  | 'project_updated'
  | 'review_generated'
  | 'focus_changed';

export interface MemoryChunk {
  id: string;
  projectId: string;
  content: string;
  tags: MemoryTag[];
  sourceType: MemorySourceType;
  reason: string;
  timestamp: string;
}

export interface EventLogEntry {
  id: string;
  projectId: string;
  eventType: EventType;
  metadata: Record<string, string | number | boolean | null>;
  timestamp: string;
}

export interface MemoryWriteRequest {
  content: string;
  tags: MemoryTag[];
  sourceType: MemorySourceType;
  reason: string;
}

export interface EventLogRequest {
  eventType: EventType;
  metadata: Record<string, string | number | boolean | null>;
}

export interface MemoryWritePayload {
  shouldWrite: boolean;
  writes: MemoryWriteRequest[];
  eventLogs: EventLogRequest[];
}

export interface MemoryRetrievalResult {
  chunks: MemoryChunk[];
  recentEvents: EventLogEntry[];
}
