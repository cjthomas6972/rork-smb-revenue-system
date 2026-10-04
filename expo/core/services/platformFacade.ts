import { Metrics, Project } from '@/types/business';
import { getPageOverrides } from '@/core/services/PresenceService';

/**
 * PlatformFacade
 *
 * Lightweight bootstrap layer for the Autonomous OS. Derives a per-project
 * business snapshot — vertical, seeded website pages, prioritized
 * recommendations, and a summary headline — from the stored Project and its
 * logged Metrics. Purely local: no network, no native modules.
 */

/** A website page in the business presence, editable from CONTENT LAB. */
export interface CorePageSnapshot {
  id: string;
  title: string;
  content: { body: string };
}

/** A prioritized action recommended by the OS for the current bottleneck. */
export interface CoreRecommendation {
  id: string;
  title: string;
  detail: string;
  impact: 'high' | 'medium';
}

/** Placeholder review record; populated only when review data exists. */
export interface CoreReviewSnapshot {
  id: string;
  rating: number;
  source: string;
  quote: string;
  createdAt: string;
}

/** Placeholder lead record; populated only when lead data exists. */
export interface CoreLeadSnapshot {
  id: string;
  source: string;
  status: 'new' | 'contacted' | 'won' | 'lost';
  createdAt: string;
}

/** Headline-level insight shown on TODAY. */
export interface CoreSummary {
  headline: string;
}

/** Full snapshot returned by `bootstrapCoreForProject`. */
export interface CoreBusinessSnapshot {
  businessId: string;
  verticalId: string;
  recommendations: CoreRecommendation[];
  pages: CorePageSnapshot[];
  reviews: CoreReviewSnapshot[];
  leads: CoreLeadSnapshot[];
  summary: CoreSummary;
}

type VerticalId = 'fitness' | 'automotive' | 'home-services' | 'general';

const VERTICAL_KEYWORDS: Record<Exclude<VerticalId, 'general'>, string[]> = {
  fitness: ['gym', 'fitness', 'trainer', 'yoga', 'pilates', 'crossfit', 'coach', 'martial', 'dance'],
  automotive: ['auto', 'car', 'detail', 'mechanic', 'repair', 'tint', 'wash', 'tire', 'body shop', 'motorcycle'],
  'home-services': ['clean', 'plumb', 'lawn', 'landscap', 'hvac', 'roof', 'electric', 'contract', 'remodel', 'paint', 'pest', 'pool', 'handyman', 'moving'],
};

const inferVertical = (businessType: string): VerticalId => {
  const value = businessType.toLowerCase();
  const match = (Object.keys(VERTICAL_KEYWORDS) as Exclude<VerticalId, 'general'>[])
    .find((vertical) => VERTICAL_KEYWORDS[vertical].some((keyword) => value.includes(keyword)));
  return match ?? 'general';
};

const RECOMMENDATIONS: Record<Project['bottleneck'], CoreRecommendation[]> = {
  leads: [
    { id: 'leads-content', title: 'Ship 3 short-form videos this week', detail: 'One problem, one proof clip, one offer. Attention compounds faster than ads for early-stage budgets.', impact: 'high' },
    { id: 'leads-referrals', title: 'Ask 5 past customers for a referral', detail: 'A direct message with a specific ask converts far better than a generic "spread the word".', impact: 'medium' },
  ],
  sales: [
    { id: 'sales-proof', title: 'Add proof next to your price', detail: 'Place one testimonial or before/after directly beside the offer to remove buying hesitation.', impact: 'high' },
    { id: 'sales-oneclick', title: 'Make the next step one action', detail: 'Replace "contact us" with a single book/call button and repeat it on every page.', impact: 'medium' },
  ],
  pricing: [
    { id: 'pricing-anchor', title: 'Anchor with a premium option', detail: 'Introduce a higher tier so your core offer reads as the sensible middle choice.', impact: 'high' },
    { id: 'pricing-bundle', title: 'Bundle your top two services', detail: 'A combined package lifts average order value without new traffic.', impact: 'medium' },
  ],
  content: [
    { id: 'content-hook', title: 'Rewrite hooks, not topics', detail: 'The first 3 seconds decide reach. Lead with the customer problem in their words.', impact: 'high' },
    { id: 'content-repurpose', title: 'Repurpose one win into 3 posts', detail: 'Turn your best result into a video, a caption, and a follow-up message.', impact: 'medium' },
  ],
  systems: [
    { id: 'systems-timebox', title: 'Timebox recurring work daily', detail: 'Same slot, same checklist. Consistency beats intensity for solo operators.', impact: 'high' },
    { id: 'systems-template', title: 'Template your repeat process', detail: 'Document the last task you did twice — the third time should be a checklist.', impact: 'medium' },
  ],
};

const recommendationsFor = (project: Project): CoreRecommendation[] =>
  RECOMMENDATIONS[project.bottleneck] ?? RECOMMENDATIONS.leads;

const defaultPageBody = (pageKey: string, project: Project): string => {
  const offer = project.coreOfferSummary || 'our core offer';
  const customer = project.targetCustomer || 'your ideal customer';
  const place = project.isLocal && project.location ? ` in ${project.location}` : '';

  switch (pageKey) {
    case 'home':
      return `${project.name}${place} helps ${customer} get results with ${offer}. Clear promise, clear proof, one obvious next step.`;
    case 'about':
      return `Why ${project.name} exists: ${customer} deserve a straightforward way to get started — without the usual friction.`;
    case 'services':
      return `${offer}. Priced at ${project.pricing || 'market rate'} with a simple booking flow and no hidden steps.`;
    case 'offer':
      return `The offer: ${offer}. Built for ${customer}. Investment: ${project.pricing || 'ask for details'}.`;
    case 'reviews':
      return `Real results from real ${customer}. Collect one review per completed job and feature the newest three here.`;
    case 'contact':
      return `Reach ${project.name}${place} directly. Fast replies win the job — respond within minutes, not days.`;
    default:
      return `${project.name} — ${offer}.`;
  }
};

const LOCAL_PAGES = ['home', 'services', 'reviews', 'contact'] as const;
const ONLINE_PAGES = ['home', 'about', 'offer'] as const;

const PAGE_TITLES: Record<string, string> = {
  home: 'Home',
  about: 'About',
  services: 'Services',
  offer: 'Offer',
  reviews: 'Reviews',
  contact: 'Contact',
};

const buildPages = async (project: Project): Promise<CorePageSnapshot[]> => {
  const pageKeys = project.isLocal ? LOCAL_PAGES : ONLINE_PAGES;
  let overrides: Record<string, { body: string }> = {};
  try {
    const saved = await getPageOverrides(project.id);
    overrides = saved;
  } catch {
    overrides = {};
  }

  return pageKeys.map((pageKey) => {
    const id = `${project.id}-${pageKey}`;
    // Accept both the composite id and a bare pageKey for forward compatibility.
    const override = overrides[id] ?? overrides[pageKey];
    return {
      id,
      title: PAGE_TITLES[pageKey] ?? pageKey,
      content: { body: override?.body ?? defaultPageBody(pageKey, project) },
    };
  });
};

const buildHeadline = (project: Project, metrics: Metrics[]): string => {
  const totals = metrics.reduce(
    (acc, entry) => ({
      views: acc.views + entry.views,
      messages: acc.messages + entry.messages,
      calls: acc.calls + entry.calls,
      sales: acc.sales + entry.sales,
    }),
    { views: 0, messages: 0, calls: 0, sales: 0 },
  );

  if (totals.sales > 0) return `Momentum detected at ${project.name} — tighten what converts and repeat it.`;
  if (totals.messages + totals.calls > 0) return `${totals.messages + totals.calls} live conversations — ${project.name} is one strong follow-up away from revenue.`;
  if (totals.views > 0) return `Attention is arriving (${totals.views} views) — ${project.name} needs a stronger conversion path.`;
  return `${project.name}: create attention first, convert second. SKYFORGE will steer each move.`;
};

/**
 * Builds the Autonomous OS snapshot for a project. Applies any saved page
 * overrides from PresenceService and always resolves — a failure degrades to
 * generated defaults rather than throwing.
 */
export const bootstrapCoreForProject = async (
  project: Project,
  metrics: Metrics[],
): Promise<CoreBusinessSnapshot> => {
  const safeMetrics = Array.isArray(metrics) ? metrics.filter((entry) => entry.projectId === project.id) : [];

  try {
    const pages = await buildPages(project);
    return {
      businessId: project.id,
      verticalId: inferVertical(project.businessType),
      recommendations: recommendationsFor(project),
      pages,
      reviews: [],
      leads: [],
      summary: { headline: buildHeadline(project, safeMetrics) },
    };
  } catch {
    return {
      businessId: project.id,
      verticalId: 'general',
      recommendations: recommendationsFor(project),
      pages: [],
      reviews: [],
      leads: [],
      summary: { headline: buildHeadline(project, safeMetrics) },
    };
  }
};
