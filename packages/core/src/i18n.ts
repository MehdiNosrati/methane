export interface PluralMessageForms {
  readonly zero?: string;
  readonly one?: string;
  readonly two?: string;
  readonly few?: string;
  readonly many?: string;
  readonly other: string;
}

export type MessageEntry = string | PluralMessageForms;
export type MessageCatalog = Readonly<Record<string, MessageEntry>>;

const BIDI_FSI = '\u2068';
const BIDI_PDI = '\u2069';

const RUNTIME_I18N_SYMBOL = Symbol.for('@methane/i18n');

interface I18nStore {
  readonly packs: Map<string, Map<string, MessageCatalog>>;
}

function getI18nStore(): I18nStore {
  const host = globalThis as Record<symbol, unknown>;
  let store = host[RUNTIME_I18N_SYMBOL] as I18nStore | undefined;
  if (!store) {
    store = { packs: new Map() };
    host[RUNTIME_I18N_SYMBOL] = store;
  }
  return store;
}

export function normalizeLocale(locale: string | undefined | null): string {
  if (!locale || locale.trim().length === 0) return 'en';
  try {
    return Intl.getCanonicalLocales(locale.trim())[0] ?? 'en';
  } catch {
    return 'en';
  }
}

export function inferDirectionFromLocale(locale: string): 'ltr' | 'rtl' {
  const primary = locale.split('-')[0]?.toLowerCase() ?? 'en';
  return primary === 'ar' || primary === 'he' || primary === 'fa' || primary === 'ur'
    ? 'rtl'
    : 'ltr';
}

/**
 * Registers co-located English defaults (or locale overrides) for a namespace/component.
 */
export function registerLocaleMessages(
  locale: string,
  namespace: string,
  messages: MessageCatalog,
): void {
  const store = getI18nStore();
  const normalized = normalizeLocale(locale);
  let localeMap = store.packs.get(normalized);
  if (!localeMap) {
    localeMap = new Map();
    store.packs.set(normalized, localeMap);
  }
  const existing = localeMap.get(namespace) ?? {};
  localeMap.set(namespace, { ...existing, ...messages });
}

export function registerLocalePack(
  locale: string,
  pack: Readonly<Record<string, MessageCatalog>>,
): void {
  for (const [namespace, messages] of Object.entries(pack)) {
    registerLocaleMessages(locale, namespace, messages);
  }
}

export async function loadLocalePack(
  locale: string,
  loader: (normalizedLocale: string) => Promise<Readonly<Record<string, MessageCatalog>>>,
): Promise<void> {
  const normalized = normalizeLocale(locale);
  const pack = await loader(normalized);
  registerLocalePack(normalized, pack);
}

/**
 * Wraps interpolated parameter values with Unicode First Strong Isolate (FSI/PDI)
 * markers `\u2068...\u2069` for RTL-safe bidirectional formatting (ADR-011).
 */
export function isolateBidiValue(value: string | number): string {
  return `${BIDI_FSI}${String(value)}${BIDI_PDI}`;
}

export function formatI18nMessage(
  entry: MessageEntry,
  params: Readonly<Record<string, string | number>> = {},
  locale = 'en',
): string {
  let template: string;
  if (typeof entry === 'string') {
    template = entry;
  } else {
    const countVal = Number(params['count'] ?? 0);
    if (countVal === 0 && entry.zero !== undefined) {
      template = entry.zero;
    } else {
      const rules = new Intl.PluralRules(normalizeLocale(locale));
      const category = rules.select(countVal);
      template = entry[category] ?? entry.other;
    }
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined) return `{${key}}`;
    return isolateBidiValue(value);
  });
}

export function resolveMessageEntry(
  namespace: string,
  key: string,
  locale = 'en',
  contextOverrides?: Readonly<Record<string, MessageCatalog>>,
  localDefaults?: MessageCatalog,
): MessageEntry | undefined {
  const store = getI18nStore();
  const normalized = normalizeLocale(locale);
  const langOnly = normalized.split('-')[0] ?? 'en';

  const contextHit = contextOverrides?.[namespace]?.[key];
  if (contextHit !== undefined) return contextHit;

  const exactPackHit = store.packs.get(normalized)?.get(namespace)?.[key];
  if (exactPackHit !== undefined) return exactPackHit;

  const basePackHit = store.packs.get(langOnly)?.get(namespace)?.[key];
  if (basePackHit !== undefined) return basePackHit;

  const enPackHit = store.packs.get('en')?.get(namespace)?.[key];
  if (enPackHit !== undefined) return enPackHit;

  return localDefaults?.[key];
}

export function translateMessage(
  namespace: string,
  key: string,
  options?: {
    locale?: string;
    params?: Readonly<Record<string, string | number>>;
    contextOverrides?: Readonly<Record<string, MessageCatalog>>;
    defaults?: MessageCatalog;
    fallback?: string;
  },
): string {
  const locale = options?.locale ?? 'en';
  const entry = resolveMessageEntry(
    namespace,
    key,
    locale,
    options?.contextOverrides,
    options?.defaults,
  );
  if (entry === undefined) {
    return options?.fallback ?? key;
  }
  return formatI18nMessage(entry, options?.params, locale);
}
