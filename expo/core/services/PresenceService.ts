import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * PresenceService
 *
 * Persists manual page-copy overrides made in CONTENT LAB so user edits
 * survive restarts and layer on top of the platform facade's generated
 * page bodies during bootstrap.
 */

const STORAGE_KEY = 'skyforge_presence_overrides';

/** A single saved page-body override. */
export interface PageContentOverride {
  pageId: string;
  body: string;
  updatedAt: string;
}

/** Input accepted by `updatePageContent`. */
export interface UpdatePageContentInput {
  business_id: string;
  page_id: string;
  content: { body: string };
}

type OverrideStore = Record<string, Record<string, PageContentOverride>>;

const readStore = async (): Promise<OverrideStore> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as OverrideStore;
    }
    return {};
  } catch {
    return {};
  }
};

/**
 * Returns all saved overrides for one business, keyed by page id.
 * Resolves to an empty object when nothing was saved or storage fails.
 */
export const getPageOverrides = async (
  businessId: string,
): Promise<Record<string, PageContentOverride>> => {
  const store = await readStore();
  return store[businessId] ?? {};
};

/**
 * Saves a page-body override. Intentionally returns `void` so callers can
 * invoke it fire-and-forget; persistence errors are swallowed by design.
 */
export const updatePageContent = (input: UpdatePageContentInput): void => {
  const { business_id, page_id, content } = input;
  if (!business_id || !page_id || typeof content?.body !== 'string') return;

  void (async () => {
    try {
      const store = await readStore();
      const businessOverrides = store[business_id] ?? {};
      businessOverrides[page_id] = {
        pageId: page_id,
        body: content.body,
        updatedAt: new Date().toISOString(),
      };
      store[business_id] = businessOverrides;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Persistence is best-effort; the editor keeps its local draft.
    }
  })();
};

/** Clears every override for a business (used when a project is deleted). */
export const clearPageOverrides = async (businessId: string): Promise<void> => {
  try {
    const store = await readStore();
    if (!store[businessId]) return;
    delete store[businessId];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Best-effort cleanup only.
  }
};

export const PresenceService = {
  getPageOverrides,
  updatePageContent,
  clearPageOverrides,
};
