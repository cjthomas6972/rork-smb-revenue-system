import {
  MemoryChunk,
  MemoryTag,
  EventLogEntry,
  MemoryWriteRequest,
  MemoryRetrievalResult,
} from '@/types/memory';
import { Project, Metrics, RevenueAsset, ContentItem } from '@/types/business';

const TAG_KEYWORDS: Record<MemoryTag, string[]> = {
  brand: ['brand', 'logo', 'identity', 'voice', 'tone', 'style', 'design'],
  offer: ['offer', 'package', 'service', 'product', 'bundle', 'deal'],
  pricing: ['price', 'pricing', 'cost', 'fee', 'rate', 'discount', 'payment'],
  audience: ['audience', 'customer', 'client', 'target', 'demographic', 'persona', 'avatar'],
  objection: ['objection', 'concern', 'hesitation', 'pushback', 'worry', 'doubt', 'complaint'],
  creative: ['creative', 'copy', 'script', 'video', 'post', 'content', 'caption', 'ad'],
  channel: ['channel', 'platform', 'instagram', 'facebook', 'tiktok', 'youtube', 'google', 'email'],
  ops: ['operations', 'process', 'workflow', 'system', 'automate', 'delegate', 'sop'],
  kpi: ['kpi', 'metric', 'views', 'clicks', 'sales', 'conversion', 'rate', 'revenue'],
  milestone: ['milestone', 'goal', 'achieve', 'reached', 'hit', 'target', 'complete'],
  decision: ['decide', 'decision', 'chose', 'pivot', 'switch', 'change', 'strategy'],
  approval: ['approve', 'approval', 'confirm', 'go-ahead', 'sign off', 'launch'],
  sales: ['sale', 'sales', 'close', 'deal', 'revenue', 'income', 'profit', 'lead'],
  web: ['website', 'landing page', 'funnel', 'page', 'seo', 'web'],
  seo: ['seo', 'search', 'rank', 'keyword', 'organic', 'google'],
  gmb: ['gmb', 'google business', 'google maps', 'local listing', 'reviews'],
};

export function inferTags(text: string): MemoryTag[] {
  const lower = text.toLowerCase();
  const matched: MemoryTag[] = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      matched.push(tag as MemoryTag);
    }
  }

  return matched.length > 0 ? matched.slice(0, 5) : ['ops'];
}

export function scoreRelevance(chunk: MemoryChunk, queryTags: MemoryTag[], queryText: string): number {
  let score = 0;
  const tagOverlap = chunk.tags.filter(t => queryTags.includes(t)).length;
  score += tagOverlap * 3;

  const queryWords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const chunkLower = chunk.content.toLowerCase();
  const wordMatches = queryWords.filter(w => chunkLower.includes(w)).length;
  score += wordMatches * 1;

  const ageHours = (Date.now() - new Date(chunk.timestamp).getTime()) / (1000 * 60 * 60);
  if (ageHours < 24) score += 2;
  else if (ageHours < 168) score += 1;

  return score;
}

export function retrieveRelevantMemory(
  chunks: MemoryChunk[],
  events: EventLogEntry[],
  projectId: string,
  queryText: string,
  topK: number = 10
): MemoryRetrievalResult {
  const projectChunks = chunks.filter(c => c.projectId === projectId);
  const projectEvents = events.filter(e => e.projectId === projectId);

  const queryTags = inferTags(queryText);

  const scored = projectChunks.map(chunk => ({
    chunk,
    score: scoreRelevance(chunk, queryTags, queryText),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, topK).map(s => s.chunk);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentEvents = projectEvents
    .filter(e => new Date(e.timestamp) >= thirtyDaysAgo)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 50);

  return { chunks: topChunks, recentEvents: recentEvents.slice(0, 8) };
}

export function shouldWriteMemory(
  text: string,
  sourceType: string
): boolean {
  if (sourceType === 'metric_log') return true;
  if (sourceType === 'asset_created') return true;
  if (sourceType === 'directive_completed') return true;
  if (sourceType === 'decision') return true;
  if (sourceType === 'approval') return true;
  if (sourceType === 'profile_update') return true;
  if (sourceType === 'manual') return true;

  const lower = text.toLowerCase();
  const decisionKeywords = ['decided', 'going with', 'approved', 'confirmed', 'launched', 'let\'s go with', 'we\'ll do', 'save this', 'remember'];
  if (decisionKeywords.some(kw => lower.includes(kw))) return true;

  const milestoneKeywords = ['first sale', 'milestone', 'reached', 'hit our', 'new record', 'breakthrough'];
  if (milestoneKeywords.some(kw => lower.includes(kw))) return true;

  const objectionKeywords = ['objection', 'keeps saying', 'common pushback', 'they always ask', 'concern about'];
  if (objectionKeywords.some(kw => lower.includes(kw))) return true;

  return false;
}

export function generateMetricMemory(metrics: Metrics, projectName: string): MemoryWriteRequest {
  const parts: string[] = [];
  parts.push(`Metrics logged for ${projectName} on ${metrics.date}:`);
  parts.push(`V:${metrics.views} C:${metrics.clicks} M:${metrics.messages} Ca:${metrics.calls} S:${metrics.sales}`);
  if (metrics.notes) parts.push(`Notes: ${metrics.notes}`);

  return {
    content: parts.join(' '),
    tags: ['kpi'],
    sourceType: 'metric_log',
    reason: 'New metrics recorded',
  };
}

export function generateAssetMemory(asset: RevenueAsset | ContentItem, projectName: string): MemoryWriteRequest {
  const typeLabel = 'type' in asset ? asset.type : 'content';
  return {
    content: `New ${typeLabel} asset created for ${projectName}: "${asset.title}". Status: ${asset.status}.`,
    tags: ['creative', ...inferTags(asset.title)].slice(0, 4) as MemoryTag[],
    sourceType: 'asset_created',
    reason: 'Revenue asset or content item created',
  };
}

export function generateDirectiveCompletionMemory(
  directiveTitle: string,
  modeTag: string,
  projectName: string,
  streak: number
): MemoryWriteRequest {
  return {
    content: `Directive completed for ${projectName}: "${directiveTitle}" (${modeTag}). Current streak: ${streak} days.`,
    tags: ['milestone', ...inferTags(directiveTitle)].slice(0, 4) as MemoryTag[],
    sourceType: 'directive_completed',
    reason: 'Daily directive completed',
  };
}

export function generateBottleneckChangeMemory(
  oldCategory: string | null,
  newCategory: string,
  confidence: number,
  projectName: string
): MemoryWriteRequest {
  const change = oldCategory
    ? `Bottleneck shifted from ${oldCategory} to ${newCategory}`
    : `Initial bottleneck identified as ${newCategory}`;

  return {
    content: `${change} for ${projectName} (${confidence}% confidence).`,
    tags: ['kpi', 'decision'],
    sourceType: 'kpi_change',
    reason: 'Bottleneck diagnosis changed',
  };
}

export function generateProjectUpdateMemory(
  project: Project,
  updatedFields: string[]
): MemoryWriteRequest {
  return {
    content: `Project "${project.name}" updated. Fields changed: ${updatedFields.join(', ')}.`,
    tags: ['decision', ...inferTags(updatedFields.join(' '))].slice(0, 4) as MemoryTag[],
    sourceType: 'profile_update',
    reason: 'Business profile updated',
  };
}

export function extractAdvisorMemories(
  responseText: string,
  userMessage: string,
  projectName: string
): MemoryWriteRequest[] {
  const writes: MemoryWriteRequest[] = [];

  if (!shouldWriteMemory(userMessage, 'user_message') && !shouldWriteMemory(responseText, 'advisor_response')) {
    return writes;
  }

  const sentences = responseText.split(/[.!?\n]+/).filter(s => s.trim().length > 15);
  const actionSentences = sentences.filter(s => {
    const lower = s.toLowerCase();
    return lower.includes('you should') ||
      lower.includes('do this') ||
      lower.includes('action:') ||
      lower.includes('recommendation') ||
      lower.includes('i suggest') ||
      lower.includes('next step') ||
      lower.includes('priority');
  });

  if (actionSentences.length > 0) {
    const content = actionSentences.slice(0, 3).map(s => s.trim()).join('. ');
    const trimmed = content.length > 400 ? content.substring(0, 397) + '...' : content;
    writes.push({
      content: `Advisor recommendation for ${projectName}: ${trimmed}`,
      tags: inferTags(trimmed),
      sourceType: 'advisor_response',
      reason: 'Key recommendation from advisor session',
    });
  }

  if (shouldWriteMemory(userMessage, 'user_message')) {
    const trimmedUser = userMessage.length > 300 ? userMessage.substring(0, 297) + '...' : userMessage;
    writes.push({
      content: `User reported for ${projectName}: ${trimmedUser}`,
      tags: inferTags(trimmedUser),
      sourceType: 'user_message',
      reason: 'User provided significant context or decision',
    });
  }

  return writes.slice(0, 5);
}

export function formatMemoryForPrompt(result: MemoryRetrievalResult): string {
  if (result.chunks.length === 0 && result.recentEvents.length === 0) {
    return '';
  }

  const parts: string[] = ['=== WORKSPACE MEMORY ==='];

  if (result.chunks.length > 0) {
    parts.push('\n--- Relevant Context ---');
    result.chunks.forEach((chunk, i) => {
      parts.push(`[${i + 1}] (${chunk.tags.join(', ')}) ${chunk.content}`);
    });
  }

  if (result.recentEvents.length > 0) {
    parts.push('\n--- Recent Events ---');
    result.recentEvents.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString();
      const meta = Object.entries(event.metadata)
        .filter(([_, v]) => v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      parts.push(`- [${date}] ${event.eventType}${meta ? `: ${meta}` : ''}`);
    });
  }

  parts.push('\nUse this context to inform your responses. Reference specific facts when relevant.');
  return parts.join('\n');
}
