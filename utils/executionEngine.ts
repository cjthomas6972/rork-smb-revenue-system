import {
  Metrics,
  MetricsSnapshot,
  BottleneckDiagnosis,
  BottleneckCategory,
  DirectiveCompletionLog,
  ExecutionStats,
} from '@/types/business';

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getDateString(d);
}

export function aggregateMetricsPeriod(
  metrics: Metrics[],
  startDaysAgo: number,
  endDaysAgo: number
): MetricsSnapshot {
  const startDate = getDaysAgo(endDaysAgo);
  const endDate = getDaysAgo(startDaysAgo);

  const filtered = metrics.filter((m) => {
    const d = m.date.split('T')[0];
    return d >= startDate && d <= endDate;
  });

  const snapshot: MetricsSnapshot = {
    periodLabel: `${startDaysAgo}-${endDaysAgo} days ago`,
    views: 0,
    clicks: 0,
    messages: 0,
    calls: 0,
    sales: 0,
  };

  for (const m of filtered) {
    snapshot.views += m.views;
    snapshot.clicks += m.clicks;
    snapshot.messages += m.messages;
    snapshot.calls += m.calls;
    snapshot.sales += m.sales;
  }

  return snapshot;
}

export function diagnoseBottleneck(metrics: Metrics[]): BottleneckDiagnosis | null {
  if (metrics.length < 2) {
    return null;
  }

  const recent = aggregateMetricsPeriod(metrics, 0, 7);
  const prior = aggregateMetricsPeriod(metrics, 7, 14);

  const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b);

  const recentTotal = recent.views + recent.clicks + recent.messages + recent.calls + recent.sales;
  const priorTotal = prior.views + prior.clicks + prior.messages + prior.calls + prior.sales;

  if (recentTotal === 0 && priorTotal === 0) {
    return {
      category: 'traffic',
      confidence: 90,
      reasoning: 'No metrics recorded in the last 14 days. Primary issue is generating visibility.',
      diagnosedAt: new Date().toISOString(),
    };
  }

  const recentCTR = safeDiv(recent.clicks, recent.views);
  const priorCTR = safeDiv(prior.clicks, prior.views);

  const recentConvRate = safeDiv(recent.sales, recent.clicks + recent.messages + recent.calls);
  const priorConvRate = safeDiv(prior.sales, prior.clicks + prior.messages + prior.calls);

  const recentFollowThrough = safeDiv(recent.calls + recent.messages, recent.clicks);
  const priorFollowThrough = safeDiv(prior.calls + prior.messages, prior.clicks);

  interface Signal {
    category: BottleneckCategory;
    score: number;
    reasoning: string;
  }

  const signals: Signal[] = [];

  if (recent.views < 20 || (prior.views > 0 && recent.views < prior.views)) {
    const conf = recent.views < 10 ? 85 : recent.views < 30 ? 70 : 55;
    signals.push({
      category: 'traffic',
      score: conf,
      reasoning: `Views are ${recent.views < 20 ? 'very low' : 'declining'} (${prior.views}→${recent.views}). Not enough eyeballs on your offer.`,
    });
  }

  if (recent.views > 20 && recentCTR < 0.05) {
    signals.push({
      category: 'conversion',
      score: 75,
      reasoning: `Views up (${recent.views}) but CTR is ${(recentCTR * 100).toFixed(1)}%. People see you but don't engage.`,
    });
  } else if (recentCTR < priorCTR * 0.7 && prior.views > 10) {
    signals.push({
      category: 'conversion',
      score: 65,
      reasoning: `CTR dropped from ${(priorCTR * 100).toFixed(1)}% to ${(recentCTR * 100).toFixed(1)}%. Engagement is slipping.`,
    });
  }

  if (recent.clicks > 10 && recent.sales === 0) {
    signals.push({
      category: 'pricing',
      score: 70,
      reasoning: `${recent.clicks} clicks but 0 sales. People are interested but not buying. Pricing or offer friction likely.`,
    });
  } else if (recentConvRate < priorConvRate * 0.6 && prior.sales > 0) {
    signals.push({
      category: 'pricing',
      score: 60,
      reasoning: `Conversion rate dropped from ${(priorConvRate * 100).toFixed(1)}% to ${(recentConvRate * 100).toFixed(1)}%. Check pricing or offer.`,
    });
  }

  if (recent.clicks > 5 && recentFollowThrough < 0.3 && (recent.messages + recent.calls) < 3) {
    signals.push({
      category: 'follow-up',
      score: 68,
      reasoning: `${recent.clicks} clicks but only ${recent.messages + recent.calls} follow-through (messages+calls). Leads are leaking.`,
    });
  } else if (recentFollowThrough < priorFollowThrough * 0.5 && prior.clicks > 5) {
    signals.push({
      category: 'follow-up',
      score: 58,
      reasoning: `Follow-through rate dropped. Fewer leads are converting to conversations.`,
    });
  }

  if (recent.sales > 0 && recent.sales < prior.sales && recent.views >= prior.views && recent.clicks >= prior.clicks) {
    signals.push({
      category: 'operations',
      score: 55,
      reasoning: `Traffic and clicks are stable/up but sales dropped (${prior.sales}→${recent.sales}). Possible fulfillment bottleneck.`,
    });
  }

  if (signals.length === 0) {
    if (recent.views <= recent.clicks && recent.views <= (recent.messages + recent.calls) && recent.views <= recent.sales) {
      return {
        category: 'traffic',
        confidence: 50,
        reasoning: 'No strong signals detected. Views are the weakest metric — focus on visibility.',
        diagnosedAt: new Date().toISOString(),
      };
    }
    return {
      category: 'conversion',
      confidence: 45,
      reasoning: 'No strong signals detected. General optimization recommended.',
      diagnosedAt: new Date().toISOString(),
    };
  }

  signals.sort((a, b) => b.score - a.score);
  const top = signals[0];

  return {
    category: top.category,
    confidence: Math.min(top.score, 95),
    reasoning: top.reasoning,
    diagnosedAt: new Date().toISOString(),
  };
}

export function computeStreak(logs: DirectiveCompletionLog[], projectId: string): number {
  const projectLogs = logs
    .filter((l) => l.projectId === projectId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  if (projectLogs.length === 0) return 0;

  const uniqueDays = [...new Set(projectLogs.map((l) => l.completedAt.split('T')[0]))].sort(
    (a, b) => b.localeCompare(a)
  );

  const today = getDateString(new Date());
  const yesterday = getDaysAgo(1);

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function computeWeeklyCompletionPct(logs: DirectiveCompletionLog[], projectId: string): number {
  const sevenDaysAgo = getDaysAgo(7);
  const completedThisWeek = logs.filter(
    (l) => l.projectId === projectId && l.completedAt.split('T')[0] >= sevenDaysAgo
  );
  return Math.min(Math.round((completedThisWeek.length / 7) * 100), 100);
}

export function computeConsistencyScore(logs: DirectiveCompletionLog[], projectId: string): number {
  const daysWithCompletion = new Set<string>();
  const fourteenDaysAgo = getDaysAgo(14);

  for (const log of logs) {
    if (log.projectId !== projectId) continue;
    const day = log.completedAt.split('T')[0];
    if (day >= fourteenDaysAgo) {
      daysWithCompletion.add(day);
    }
  }

  return Math.min(Math.round((daysWithCompletion.size / 14) * 100), 100);
}

export function computeRevenuePerDirective(
  metrics: Metrics[],
  completionLogs: DirectiveCompletionLog[],
  projectId: string
): number | null {
  const projectLogs = completionLogs.filter((l) => l.projectId === projectId);
  if (projectLogs.length === 0) return null;

  const totalSales = metrics
    .filter((m) => m.projectId === projectId)
    .reduce((sum, m) => sum + m.sales, 0);

  if (totalSales === 0) return null;

  return Math.round((totalSales / projectLogs.length) * 100) / 100;
}

export function computeExecutionStats(
  metrics: Metrics[],
  completionLogs: DirectiveCompletionLog[],
  projectId: string
): ExecutionStats {
  return {
    streak: computeStreak(completionLogs, projectId),
    weeklyCompletionPct: computeWeeklyCompletionPct(completionLogs, projectId),
    consistencyScore: computeConsistencyScore(completionLogs, projectId),
    revenuePerDirective: computeRevenuePerDirective(metrics, completionLogs, projectId),
    lastUpdated: new Date().toISOString(),
  };
}
