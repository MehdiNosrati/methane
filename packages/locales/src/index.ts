import { resolveSupportedLocale } from './format.js';
import type {
  LoadLocalePackOptions,
  MethaneLocaleCode,
  MethaneLocalePack,
} from './types.js';

export {
  flattenMessages,
  formatMessage,
  getLocaleDirection,
  isPluralForms,
  resolveSupportedLocale,
} from './format.js';
export {
  SUPPORTED_LOCALES,
  type FormatMessageOptions,
  type LoadLocalePackOptions,
  type MessageKey,
  type MessageNamespace,
  type MessageParams,
  type MethaneAnnouncerMessages,
  type MethaneCalendarMessages,
  type MethaneComboboxMessages,
  type MethaneCommonMessages,
  type MethaneLocaleCode,
  type MethaneLocalePack,
  type MethaneMessages,
  type MethaneMessageValue,
  type MethaneOverlayMessages,
  type MethanePaginationMessages,
  type MethaneTableMessages,
  type MethaneUploadMessages,
  type MethaneValidationMessages,
  type PluralCategory,
  type PluralForms,
  type TextDirection,
} from './types.js';

const LOCALE_LOADERS: Readonly<Record<MethaneLocaleCode, () => Promise<MethaneLocalePack>>> = {
  en: async () => (await import('./packs/en.js')).default,
  es: async () => (await import('./packs/es.js')).default,
  fr: async () => (await import('./packs/fr.js')).default,
  de: async () => (await import('./packs/de.js')).default,
  ja: async () => (await import('./packs/ja.js')).default,
  'zh-CN': async () => (await import('./packs/zh-CN.js')).default,
  ar: async () => (await import('./packs/ar.js')).default,
  he: async () => (await import('./packs/he.js')).default,
};

const loadedPackCache = new Map<MethaneLocaleCode, Promise<MethaneLocalePack>>();

/**
 * Lazy-load a `@methane/locales` pack via code-split dynamic import.
 * Resolves BCP-47 variants (e.g. `en-US`, `zh-Hans`, `iw`) and caches in-flight/loaded packs.
 */
export function loadLocalePack(
  locale: string,
  options?: LoadLocalePackOptions,
): Promise<MethaneLocalePack> {
  const resolved = resolveSupportedLocale(locale);
  const target: MethaneLocaleCode | null =
    resolved ?? (options?.fallback === false ? null : (options?.fallback ?? 'en'));

  if (!target) {
    return Promise.reject(new RangeError(`Unsupported Methane locale: "${locale}"`));
  }

  let pending = loadedPackCache.get(target);
  if (!pending) {
    pending = LOCALE_LOADERS[target]();
    loadedPackCache.set(target, pending);
  }
  return pending;
}

/**
 * Clear the internal lazy-loader cache (primarily for tests).
 */
export function clearLocalePackCache(): void {
  loadedPackCache.clear();
}
