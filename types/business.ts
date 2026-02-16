export type PrimaryProblem = 'leads' | 'sales' | 'pricing' | 'content' | 'systems';

export type FocusArea = 
  | 'leads'
  | 'content'
  | 'outreach'
  | 'offer'
  | 'pricing'
  | 'conversion'
  | 'fulfillment'
  | 'audience building'
  | 'brand expansion';

export type FocusMode = 'manual' | 'autopilot';

export type ProjectStatus = 'active' | 'archived';

export type BottleneckCategory = 'traffic' | 'conversion' | 'pricing' | 'follow-up' | 'operations';

export interface BottleneckDiagnosis {
  category: BottleneckCategory;
  confidence: number;
  reasoning: string;
  diagnosedAt: string;
}

export interface DirectiveStep {
  order: number;
  action: string;
  done: boolean;
}

export interface DailyDirective {
  id: string;
  title: string;
  description: string;
  reason: string;
  estimatedTime: string;
  status: 'pending' | 'complete';
  createdAt: string;
  dueDate?: string;
  objective: string;
  steps: DirectiveStep[];
  timeboxMinutes: number;
  successMetric: string;
  blockers: string[];
  countermoves: string[];
  modeTag: string;
  linkedAssets: string[];
}

export interface DirectiveCompletionLog {
  directiveId: string;
  projectId: string;
  completedAt: string;
  title: string;
  modeTag: string;
}

export interface ExecutionStats {
  streak: number;
  weeklyCompletionPct: number;
  consistencyScore: number;
  revenuePerDirective: number | null;
  lastUpdated: string;
}

export interface MetricsSnapshot {
  periodLabel: string;
  views: number;
  clicks: number;
  messages: number;
  calls: number;
  sales: number;
}

export interface AdvisorDirective {
  id: string;
  title: string;
  description: string;
  reason: string;
  estimatedTime: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  businessType: string;
  targetCustomer: string;
  isLocal: boolean;
  location?: string;
  revenueGoal: string;
  availableDailyTime: string;
  preferredContactMethod?: string;
  coreOfferSummary: string;
  pricing: string;
  bottleneck: PrimaryProblem;
  focusMode: FocusMode;
  manualFocusArea?: FocusArea;
  lastAnalysisSummary?: string;
  metricsSummary?: string;
  dailyDirective?: DailyDirective;
  advisorDirective?: AdvisorDirective;
  marketingPreference?: 'video' | 'text' | 'both';
  platforms?: string[];
}

export interface UserSettings {
  displayName: string;
  theme: 'light' | 'dark';
}

export interface Metrics {
  id: string;
  projectId: string;
  date: string;
  views: number;
  clicks: number;
  messages: number;
  calls: number;
  sales: number;
  notes?: string;
}

export interface RevenueAsset {
  id: string;
  projectId: string;
  type: 'offer' | 'script' | 'funnel' | 'dm' | 'followup';
  title: string;
  content: string;
  status: 'draft' | 'active' | 'tested';
  createdAt: string;
  updatedAt: string;
  results?: string;
}

export interface ContentItem {
  id: string;
  projectId: string;
  type: 'video_script' | 'post_caption' | 'dm_outreach' | 'followup_sequence';
  title: string;
  content: string;
  platform?: string;
  status: 'generated' | 'used' | 'saved';
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  asset?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface WeeklyMission {
  id: string;
  projectId: string;
  title: string;
  description: string;
  progress: number;
  startDate: string;
  endDate: string;
}

export interface MonthlyMilestone {
  id: string;
  projectId: string;
  title: string;
  target: string;
  current: string;
  month: string;
}

export interface Bottleneck {
  area: 'traffic' | 'conversion' | 'offer' | 'sales' | 'retention';
  description: string;
  severity: 'critical' | 'moderate' | 'minor';
  suggestedActions: string[];
}

export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  industry: string;
  isLocal: boolean;
  location?: string;
  currentOffers: string;
  pricing: string;
  revenueGoal: string;
  timeAvailable: string;
  primaryProblem: PrimaryProblem;
  marketingPreference?: 'video' | 'text' | 'both';
  platforms?: string[];
  createdAt: string;
  updatedAt: string;
}
