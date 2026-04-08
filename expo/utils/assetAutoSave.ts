import { RevenueAsset } from '@/types/business';

export type AutoAssetType = RevenueAsset['type'];

export interface AssetAutoSaveResult {
  shouldSave: boolean;
  cleanText: string;
  assetType: AutoAssetType | null;
  title: string | null;
}

const TYPE_MAP: Record<string, AutoAssetType> = {
  offer: 'offer',
  offers: 'offer',
  script: 'script',
  scripts: 'script',
  funnel: 'funnel',
  funnels: 'funnel',
  dm: 'dm',
  dms: 'dm',
  followup: 'followup',
  'follow-up': 'followup',
  followups: 'followup',
  'follow-ups': 'followup',
};

export function parseAssetAutoSave(text: string): AssetAutoSaveResult {
  const match = text.match(/SAVE AS ASSET:\s*([^|\n]+)\|\s*([^\n]+)/i);
  if (!match) {
    return {
      shouldSave: false,
      cleanText: text,
      assetType: null,
      title: null,
    };
  }

  const rawType = match[1]?.trim().toLowerCase() ?? '';
  const title = match[2]?.trim() ?? null;
  const assetType = TYPE_MAP[rawType] ?? null;
  const cleanText = text.replace(match[0], '').trim();

  return {
    shouldSave: Boolean(assetType && title),
    cleanText,
    assetType,
    title,
  };
}

export function buildRevenueAsset(params: {
  projectId: string;
  type: AutoAssetType;
  title: string;
  content: string;
}): RevenueAsset {
  const now = new Date().toISOString();

  return {
    id: `${Date.now()}`,
    projectId: params.projectId,
    type: params.type,
    title: params.title,
    content: params.content,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
    resultCount: 0,
    rating: 0,
  };
}
